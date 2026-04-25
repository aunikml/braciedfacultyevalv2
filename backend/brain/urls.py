from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SystemSettingViewSet, FacultyAIInsightsView, FacultyGlobalAIInsightsView, ProgramAIInsightsView

router = DefaultRouter()
router.register(r'settings', SystemSettingViewSet, basename='system-settings')

urlpatterns = [
    path('', include(router.urls)),
    path('insights/faculty/global/', FacultyGlobalAIInsightsView.as_view(), name='faculty-global-ai-insights'),
    path('insights/faculty/<int:assignment_id>/', FacultyAIInsightsView.as_view(), name='faculty-ai-insights'),
    path('insights/program/<int:program_id>/', ProgramAIInsightsView.as_view(), name='program-ai-insights'),
]
