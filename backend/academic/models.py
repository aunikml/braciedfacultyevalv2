from django.db import models
from django.utils.translation import gettext_lazy as _

class Program(models.Model):
    short_name = models.CharField(_('short form'), max_length=20, unique=True)
    full_name = models.CharField(_('full name'), max_length=200)

    def __str__(self):
        return f"{self.short_name} - {self.full_name}"

class Course(models.Model):
    program = models.ForeignKey(Program, related_name='courses', on_delete=models.CASCADE)
    code = models.CharField(_('course code'), max_length=20)
    name = models.CharField(_('course name'), max_length=200)

    class Meta:
        unique_together = ('program', 'code')

    def __str__(self):
        return f"{self.code}: {self.name} ({self.program.short_name})"

class BatchCategory(models.Model):
    program = models.ForeignKey(Program, related_name='batch_categories', on_delete=models.CASCADE)
    code = models.CharField(_('batch code'), max_length=20)
    name = models.CharField(_('category name'), max_length=100)

    class Meta:
        unique_together = ('program', 'code')
        verbose_name_plural = "batch categories"

    def __str__(self):
        return f"{self.code} - {self.name} ({self.program.short_name})"
