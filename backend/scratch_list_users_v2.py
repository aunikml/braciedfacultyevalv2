import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

print(f"{'Email':<30} | {'Role':<15} | {'Prog ID':<10} | {'Prog Name':<20}")
print("-" * 85)
for user in User.objects.all():
    prog_id = user.assigned_program.id if user.assigned_program else "None"
    prog_name = user.assigned_program.short_name if user.assigned_program else "None"
    print(f"{user.email:<30} | {user.role:<15} | {prog_id:<10} | {prog_name:<20}")
