from django.contrib import admin
from .models import Program, Course, BatchCategory

@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ('short_name', 'full_name')

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'program')
    list_filter = ('program',)

@admin.register(BatchCategory)
class BatchCategoryAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'program')
    list_filter = ('program',)
