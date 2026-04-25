import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

print(f"{'Email':<30} | {'Role':<15} | {'Active':<10}")
print("-" * 60)
for user in User.objects.all():
    print(f"{user.email:<30} | {user.role:<15} | {user.is_active:<10}")
