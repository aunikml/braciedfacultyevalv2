from rest_framework import viewsets, permissions
from .models import Program, Course, BatchCategory
from .serializers import ProgramSerializer, CourseSerializer, BatchCategorySerializer
from users.permissions import IsAdminManagerOrReadOnly

class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.all()
    serializer_class = ProgramSerializer
    permission_classes = [IsAdminManagerOrReadOnly]

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAdminManagerOrReadOnly]

class BatchCategoryViewSet(viewsets.ModelViewSet):
    queryset = BatchCategory.objects.all()
    serializer_class = BatchCategorySerializer
    permission_classes = [IsAdminManagerOrReadOnly]
