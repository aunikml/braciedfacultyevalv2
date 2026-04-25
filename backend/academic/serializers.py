from rest_framework import serializers
from .models import Program, Course, BatchCategory

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ('id', 'program', 'code', 'name')

class BatchCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BatchCategory
        fields = ('id', 'program', 'code', 'name')

class ProgramSerializer(serializers.ModelSerializer):
    courses = CourseSerializer(many=True, read_only=True)
    batch_categories = BatchCategorySerializer(many=True, read_only=True)

    class Meta:
        model = Program
        fields = ('id', 'short_name', 'full_name', 'courses', 'batch_categories')
