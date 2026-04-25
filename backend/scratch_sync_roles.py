import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import Role, CustomUser

def sync_roles():
    role_names = ['ADMIN', 'MANAGER', 'FACULTY', 'PROGRAM_SUPERVISOR', 'SUPERVISOR']
    for name in role_names:
        Role.objects.get_or_create(name=name)
    
    print("Roles initialized.")

    users = CustomUser.objects.all()
    for user in users:
        role_obj = Role.objects.get(name=user.role)
        user.roles.add(role_obj)
        print(f"Synced {user.email} with role {user.role}")

if __name__ == "__main__":
    sync_roles()
