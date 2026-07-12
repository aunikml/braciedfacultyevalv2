from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EvaluationInstanceViewSet, FacultyAssignmentViewSet, ProgramFacultyView

router = DefaultRouter()
router.register(r'instances', EvaluationInstanceViewSet)
router.register(r'assignments', FacultyAssignmentViewSet)

urlpatterns = [
    path('program-faculty/', ProgramFacultyView.as_view(), name='program-faculty'),
    path('', include(router.urls)),
]
