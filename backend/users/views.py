from rest_framework import status, generics, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, CustomTokenObtainPairSerializer, ChangePasswordSerializer

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
        # Hash password during user creation
        password = self.request.data.get('password', 'Password123!')
        roles_data = self.request.data.get('roles', [])
        user = serializer.save()
        user.set_password(password)
        user.save()
        self._update_roles(user, roles_data)

    def perform_update(self, serializer):
        roles_data = self.request.data.get('roles')
        user = serializer.save()
        self._update_roles(user, roles_data)
