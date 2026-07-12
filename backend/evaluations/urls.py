from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EvaluationInstanceViewSet, FacultyAssignmentViewSet, ProgramFacultyView, SupervisorDashboardView

router = DefaultRouter()
router.register(r'instances', EvaluationInstanceViewSet)
router.register(r'assignments', FacultyAssignmentViewSet)

urlpatterns = [
    path('program-faculty/', ProgramFacultyView.as_view(), name='program-faculty'),
    path('supervisor-faculty/', SupervisorDashboardView.as_view(), name='supervisor-faculty'),
    path('', include(router.urls)),
]
