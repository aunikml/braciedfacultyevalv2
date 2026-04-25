import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

new_pwd = "Password123!"
for user in User.objects.exclude(role='ADMIN'):
    user.set_password(new_pwd)
    user.must_change_password = True
    user.save()
    print(f"Reset password for {user.email}")
