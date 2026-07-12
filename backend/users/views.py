from rest_framework import status, generics, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, CustomTokenObtainPairSerializer, ChangePasswordSerializer
import csv
import io

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class UserProfileView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    model = User
    permission_classes = [IsAuthenticated]

    def get_object(self, queryset=None):
        return self.request.user

    def update(self, request, *args, **kwargs):
        self.object = self.get_object()
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            if not self.object.check_password(serializer.data.get("old_password")):
                return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
            
            self.object.set_password(serializer.data.get("new_password"))
            self.object.must_change_password = False
            self.object.save()
            return Response({"message": "Password updated successfully"}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        roles = user.get_role_list()
        
        # Admin, Manager and Supervisor can see all users
        if any(r in ['ADMIN', 'MANAGER', 'SUPERVISOR'] for r in roles):
            return User.objects.all()
        # Program Supervisor can see users in their assigned program
        if 'PROGRAM_SUPERVISOR' in roles and user.assigned_program:
            return User.objects.filter(assigned_program=user.assigned_program).exclude(id=user.id)
        return User.objects.filter(id=user.id)

    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, pk=None):
        user = self.get_object()
        # Reset to a default password or a generated one
        default_password = "Password123!" 
        user.set_password(default_password)
        user.must_change_password = True
        user.save()
        return Response({"message": f"Password reset to '{default_password}' successfully."}, status=status.HTTP_200_OK)

    def _update_roles(self, user, roles_data):
        if roles_data is not None:
            from .models import Role
            user.roles.clear()
            for role_name in roles_data:
                role_obj, _ = Role.objects.get_or_create(name=role_name)
                user.roles.add(role_obj)
            # Sync legacy role field with the first role for safety
            if roles_data:
                user.role = roles_data[0]
                user.save()

    def perform_create(self, serializer):
        password = self.request.data.get('password', 'Password123!')
        roles_data = self.request.data.get('roles', [])
        if not roles_data:
            legacy_role = self.request.data.get('role')
            if legacy_role:
                roles_data = [legacy_role]
        user = serializer.save()
        user.set_password(password)
        user.save()
        self._update_roles(user, roles_data)

    def perform_update(self, serializer):
        roles_data = self.request.data.get('roles')
        if not roles_data:
            legacy_role = self.request.data.get('role')
            if legacy_role:
                roles_data = [legacy_role]
        user = serializer.save()
        self._update_roles(user, roles_data)

    @action(detail=False, methods=['post'], url_path='bulk-upload')
    def bulk_upload(self, request):
        csv_file = request.FILES.get('csv_file')
        role = request.data.get('role', 'FACULTY')
        assigned_program = request.data.get('assigned_program')

        if not csv_file:
            return Response({"error": "No CSV file uploaded."}, status=status.HTTP_400_BAD_REQUEST)

        if not csv_file.name.endswith('.csv'):
            return Response({"error": "File must be a CSV."}, status=status.HTTP_400_BAD_REQUEST)

        valid_roles = [choice[0] for choice in User.RoleNames.choices]
        if role not in valid_roles:
            return Response({"error": f"Invalid role. Must be one of: {', '.join(valid_roles)}"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            decoded = csv_file.read().decode('utf-8-sig')
            reader = csv.reader(io.StringIO(decoded))
            rows = list(reader)
        except Exception:
            return Response({"error": "Could not parse CSV file."}, status=status.HTTP_400_BAD_REQUEST)

        if not rows:
            return Response({"error": "CSV file is empty."}, status=status.HTTP_400_BAD_REQUEST)

        header = [h.strip().lower() for h in rows[0]]
        expected = {'email', 'first_name', 'last_name'}
        if not expected.issubset(set(header)):
            return Response({"error": f"CSV must have columns: email, first_name, last_name. Found: {header}"}, status=status.HTTP_400_BAD_REQUEST)

        created = []
        skipped = []
        errors = []

        for i, row in enumerate(rows[1:], start=2):
            if not row or all(cell.strip() == '' for cell in row):
                continue
            try:
                record = dict(zip(header, [cell.strip() for cell in row]))
                email = record.get('email', '').strip()
                first_name = record.get('first_name', '').strip()
                last_name = record.get('last_name', '').strip()

                if not email:
                    errors.append(f"Row {i}: Missing email")
                    continue
                if not first_name:
                    errors.append(f"Row {i}: Missing first_name")
                    continue

                if User.objects.filter(email=email).exists():
                    skipped.append(email)
                    continue

                user = User.objects.create_user(
                    email=email,
                    password='Password123!',
                    first_name=first_name,
                    last_name=last_name,
                    must_change_password=True,
                )
                user.role = role
                if role == 'PROGRAM_SUPERVISOR' and assigned_program:
                    user.assigned_program_id = int(assigned_program)
                user.save()
                self._update_roles(user, [role])
                created.append(email)
            except Exception as e:
                errors.append(f"Row {i}: {str(e)}")

        return Response({
            "created": len(created),
            "skipped": len(skipped),
            "errors": len(errors),
            "created_emails": created,
            "skipped_emails": skipped,
            "error_details": errors,
        }, status=status.HTTP_200_OK)
