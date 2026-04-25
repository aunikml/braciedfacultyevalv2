from django.db import models
from django.conf import settings
from academic.models import Program, Course, BatchCategory

class EvaluationInstance(models.Model):
    class Semester(models.TextChoices):
        FALL = 'Fall', 'Fall'
        SUMMER = 'Summer', 'Summer'
        SPRING = 'Spring', 'Spring'

    program = models.ForeignKey(Program, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    batch_category = models.ForeignKey(BatchCategory, on_delete=models.CASCADE)
    batch_name = models.CharField(max_length=100)
    semester = models.CharField(max_length=10, choices=Semester.choices)
    year = models.IntegerField()
    course_csv_file = models.FileField(upload_to='evaluations/course_csv/', null=True, blank=True)
    course_processed_data = models.JSONField(null=True, blank=True)
    course_total_respondents = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.course.code} - {self.semester} {self.year} ({self.batch_name})"

class FacultyAssignment(models.Model):
    evaluation_instance = models.ForeignKey(EvaluationInstance, related_name='assignments', on_delete=models.CASCADE)
    faculty = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    csv_file = models.FileField(upload_to='evaluations/csv/', null=True, blank=True)
    processed_data = models.JSONField(null=True, blank=True)
    total_respondents = models.IntegerField(default=0)

    class Meta:
        unique_together = ('evaluation_instance', 'faculty')

    def __str__(self):
        return f"{self.faculty.get_full_name()} - {self.evaluation_instance}"
