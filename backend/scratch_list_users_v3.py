import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

print(f"{'Email':<30} | {'Name':<25} | {'Role':<15} | {'Prog Name':<20}")
print("-" * 100)
for user in User.objects.all():
    name = f"{user.first_name} {user.last_name}"
    prog_name = user.assigned_program.short_name if user.assigned_program else "None"
    print(f"{user.email:<30} | {name:<25} | {user.role:<15} | {prog_name:<20}")
