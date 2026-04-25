from django.db import models

class SystemSetting(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.key}: {self.value}"

    @classmethod
    def is_ai_enabled(cls):
        setting, created = cls.objects.get_or_create(
            key='ai_analytics_enabled',
            defaults={'description': 'Toggle for AI-generated analytics site-wide'}
        )
        return setting.value
