from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import EvaluationInstance, FacultyAssignment
from .serializers import EvaluationInstanceSerializer, FacultyAssignmentSerializer
from .utils.csv_parser import parse_faculty_evaluation_csv, parse_course_evaluation_csv
from users.permissions import IsAdminManagerOrReadOnly
from django.db import models
from django.db.models import Case, When, Value, IntegerField
import os

class EvaluationInstanceViewSet(viewsets.ModelViewSet):
    queryset = EvaluationInstance.objects.all().order_by('-created_at')
    serializer_class = EvaluationInstanceSerializer
    permission_classes = [IsAdminManagerOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        program_id = self.request.query_params.get('program_id')
        if program_id:
            queryset = queryset.filter(program_id=program_id)
        return queryset

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            print(f"--- ATTEMPTING DELETE ---")
            print(f"Object: {instance}")
            print(f"Method: {request.method}")
            print(f"User: {request.user}")
            self.perform_destroy(instance)
            print(f"--- DELETE SUCCESSFUL ---")
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            print(f"--- DELETE FAILED: {str(e)} ---")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='upload-course-csv')
    def upload_course_csv(self, request, pk=None):
        instance = self.get_object()
        csv_file = request.FILES.get('csv_file')
        
        if not csv_file:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)
        
        instance.course_csv_file = csv_file
        instance.save()
        
        try:
            results = parse_course_evaluation_csv(instance.course_csv_file.path)
            instance.course_processed_data = results
            instance.course_total_respondents = results['total_respondents']
            instance.save()
            return Response(EvaluationInstanceSerializer(instance).data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FacultyAssignmentViewSet(viewsets.ModelViewSet):
    queryset = FacultyAssignment.objects.all()
    serializer_class = FacultyAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        roles = user.get_role_list()
        queryset = FacultyAssignment.objects.all()
        
        # Determine visibility based on ALL roles
        if any(r in ['ADMIN', 'MANAGER', 'SUPERVISOR'] for r in roles):
            # Admin/Supervisors see everything
            pass
        elif 'PROGRAM_SUPERVISOR' in roles and user.assigned_program:
            # Program Supervisor sees their program, AND their own courses (if any in other programs)
            if 'FACULTY' in roles:
                queryset = queryset.filter(
                    models.Q(evaluation_instance__program=user.assigned_program) | 
                    models.Q(faculty=user)
                )
            else:
                queryset = queryset.filter(evaluation_instance__program=user.assigned_program)
        elif 'FACULTY' in roles:
            # Pure faculty only see their own
            queryset = queryset.filter(faculty=user)
        else:
            queryset = queryset.filter(id=-1)
        
        # Custom sorting: Year (desc), then Semester (Fall > Summer > Spring)
        queryset = queryset.annotate(
            semester_order=Case(
                When(evaluation_instance__semester='Fall', then=Value(1)),
                When(evaluation_instance__semester='Summer', then=Value(2)),
                When(evaluation_instance__semester='Spring', then=Value(3)),
                default=Value(4),
                output_field=IntegerField(),
            )
        ).order_by('-evaluation_instance__year', 'semester_order')
        
        return queryset

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'], url_path='upload-csv')
    def upload_csv(self, request, pk=None):
        assignment = self.get_object()
        csv_file = request.FILES.get('csv_file')
        
        if not csv_file:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)
        
        assignment.csv_file = csv_file
        assignment.save()
        
        # Process CSV
        try:
            results = parse_faculty_evaluation_csv(assignment.csv_file.path)
            assignment.processed_data = results
            assignment.total_respondents = results['total_respondents']
            assignment.save()
            return Response(FacultyAssignmentSerializer(assignment).data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
