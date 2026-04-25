from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EvaluationInstanceViewSet, FacultyAssignmentViewSet

router = DefaultRouter()
router.register(r'instances', EvaluationInstanceViewSet)
router.register(r'assignments', FacultyAssignmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
