from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import EvaluationInstance, FacultyAssignment
from academic.serializers import ProgramSerializer, CourseSerializer, BatchCategorySerializer

User = get_user_model()

class FacultySmallSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name')

class EvaluationInstanceSmallSerializer(serializers.ModelSerializer):
    program_details = ProgramSerializer(source='program', read_only=True)
    course_details = CourseSerializer(source='course', read_only=True)
    batch_category_details = BatchCategorySerializer(source='batch_category', read_only=True)

    class Meta:
        model = EvaluationInstance
        fields = (
            'id', 'program', 'course', 'batch_category', 'batch_name', 
            'semester', 'year', 'program_details', 
            'course_details', 'batch_category_details', 'course_processed_data'
        )

class FacultyAssignmentSerializer(serializers.ModelSerializer):
    faculty_details = FacultySmallSerializer(source='faculty', read_only=True)
    evaluation_instance_details = EvaluationInstanceSmallSerializer(source='evaluation_instance', read_only=True)
    
    class Meta:
        model = FacultyAssignment
        fields = ('id', 'evaluation_instance', 'faculty', 'faculty_details', 'evaluation_instance_details', 'csv_file', 'processed_data', 'total_respondents')
        read_only_fields = ('processed_data', 'total_respondents')

class EvaluationInstanceSerializer(serializers.ModelSerializer):
    assignments = FacultyAssignmentSerializer(many=True, read_only=True)
    program_details = ProgramSerializer(source='program', read_only=True)
    course_details = CourseSerializer(source='course', read_only=True)
    batch_category_details = BatchCategorySerializer(source='batch_category', read_only=True)

    class Meta:
        model = EvaluationInstance
        fields = (
            'id', 'program', 'course', 'batch_category', 'batch_name', 
            'semester', 'year', 'assignments', 'program_details', 
            'course_details', 'batch_category_details', 'created_at',
            'course_csv_file', 'course_processed_data', 'course_total_respondents'
        )
        read_only_fields = ('course_processed_data', 'course_total_respondents')
