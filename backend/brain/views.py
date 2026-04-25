from rest_framework import viewsets, views, status, permissions
from rest_framework.response import Response
from .models import SystemSetting
from .services import GeminiService
from evaluations.models import FacultyAssignment
from users.permissions import IsAdminManagerOrReadOnly

class SystemSettingViewSet(viewsets.ModelViewSet):
    queryset = SystemSetting.objects.all()
    permission_classes = [IsAdminManagerOrReadOnly]
    
    def list(self, request):
        # Ensure the setting exists
        enabled = SystemSetting.is_ai_enabled()
        queryset = SystemSetting.objects.all()
        return Response([
            {"id": s.id, "key": s.key, "value": s.value, "description": s.description} 
            for s in queryset
        ])

    def partial_update(self, request, pk=None):
        instance = self.get_object()
        instance.value = request.data.get('value', instance.value)
        instance.save()
        return Response({"status": "updated", "value": instance.value})

class FacultyAIInsightsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, assignment_id):
        # Check if AI is enabled
        if not SystemSetting.is_ai_enabled():
            return Response({"error": "AI analytics are currently disabled by the administrator."}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            assignment = FacultyAssignment.objects.get(id=assignment_id)
            
            # Security check: Only faculty themselves or admin/supervisors
            user = request.user
            roles = user.get_role_list()
            if 'FACULTY' in roles and assignment.faculty != user and not any(r in ['ADMIN', 'MANAGER', 'SUPERVISOR', 'PROGRAM_SUPERVISOR'] for r in roles):
                return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
            if not assignment.processed_data:
                return Response({"error": "Assignment data not processed yet."}, status=status.HTTP_400_BAD_REQUEST)
            
            service = GeminiService()
            insights = service.generate_faculty_insights(
                f"{assignment.faculty.first_name} {assignment.faculty.last_name}",
                assignment.evaluation_instance.course.name,
                assignment.processed_data
            )
            
            return Response({"insights": insights})
            
        except FacultyAssignment.DoesNotExist:
            return Response({"error": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FacultyGlobalAIInsightsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not SystemSetting.is_ai_enabled():
            return Response({"error": "AI analytics are disabled."}, status=status.HTTP_403_FORBIDDEN)
            
        user = request.user
        if 'FACULTY' not in user.get_role_list():
            return Response({"error": "Only faculty can access global insights."}, status=status.HTTP_403_FORBIDDEN)
            
        assignments = FacultyAssignment.objects.filter(faculty=user).order_by('-evaluation_instance__year')
        
        if not assignments.exists():
            return Response({"error": "No reports found."}, status=status.HTTP_404_NOT_FOUND)
            
        service = GeminiService()
        insights = service.generate_global_faculty_insights(
            f"{user.first_name} {user.last_name}",
            list(assignments)
        )
        return Response({"insights": insights})

class ProgramAIInsightsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, program_id):
        if not SystemSetting.is_ai_enabled():
            return Response({"error": "AI analytics are disabled."}, status=status.HTTP_403_FORBIDDEN)
            
        user = request.user
        roles = user.get_role_list()
        
        # Permission check
        if not any(r in ['ADMIN', 'MANAGER', 'SUPERVISOR'] for r in roles):
            if 'PROGRAM_SUPERVISOR' in roles and user.assigned_program_id != int(program_id):
                return Response({"error": "Unauthorized for this program."}, status=status.HTTP_403_FORBIDDEN)
            elif 'PROGRAM_SUPERVISOR' not in roles:
                return Response({"error": "Insufficient permissions."}, status=status.HTTP_403_FORBIDDEN)

        from academic.models import Program
        try:
            program = Program.objects.get(id=program_id)
        except Program.DoesNotExist:
            return Response({"error": "Program not found."}, status=status.HTTP_404_NOT_FOUND)
            
        # Get all faculty in this program and their average scores
        faculty_users = User.objects.filter(assigned_program=program)
        
        faculty_data = []
        for faculty in faculty_users:
            if 'FACULTY' in faculty.get_role_list():
                latest_asgn = FacultyAssignment.objects.filter(faculty=faculty).order_by('-evaluation_instance__year').first()
                if latest_asgn and latest_asgn.processed_data:
                    avg = latest_asgn.processed_data.get('totals', {}).get('avg_of_avgs', 0)
                    faculty_data.append({
                        "name": f"{faculty.first_name} {faculty.last_name}",
                        "avg_score": avg
                    })
        
        if not faculty_data:
            return Response({"error": "No performance data available for this program yet."}, status=status.HTTP_404_NOT_FOUND)
            
        service = GeminiService()
        insights = service.generate_program_insights(program.full_name, faculty_data)
        
        return Response({"insights": insights})
