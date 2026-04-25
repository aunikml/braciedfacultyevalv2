from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProgramViewSet, CourseViewSet, BatchCategoryViewSet

router = DefaultRouter()
router.register(r'programs', ProgramViewSet)
router.register(r'courses', CourseViewSet)
router.register(r'batch-categories', BatchCategoryViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
