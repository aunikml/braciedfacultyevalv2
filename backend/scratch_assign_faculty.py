import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()
from academic.models import Program

# Find Program ID 3 (or the one named TEST)
try:
    prog = Program.objects.get(short_name='TEST')
except Program.DoesNotExist:
    prog = Program.objects.get(id=3)

print(f"Assigning faculty to Program: {prog.full_name} ({prog.short_name})")

# Assign all faculty members to this program for testing
faculty_users = User.objects.filter(role='FACULTY')
for u in faculty_users:
    u.assigned_program = prog
    u.save()
    print(f"Assigned {u.email} to {prog.short_name}")
