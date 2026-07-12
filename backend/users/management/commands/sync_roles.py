from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import Role

User = get_user_model()

VALID_ROLES = {choice[0] for choice in User.RoleNames.choices}


class Command(BaseCommand):
    help = 'Sync legacy role field to M2M roles and fix corrupted data'

    def handle(self, *args, **options):
        updated = 0
        for user in User.objects.all():
            m2m_roles = list(user.roles.values_list('name', flat=True))
            legacy_role = user.role

            needs_fix = False

            # Check for corrupted M2M (individual characters instead of role names)
            invalid_m2m = [r for r in m2m_roles if r not in VALID_ROLES]
            if invalid_m2m:
                user.roles.clear()
                m2m_roles = []
                needs_fix = True
                self.stdout.write(
                    self.style.WARNING(f'Cleared corrupted M2M roles for {user.email}')
                )

            # Sync: if legacy role not in M2M, add it
            if legacy_role and legacy_role in VALID_ROLES and legacy_role not in m2m_roles:
                role_obj, _ = Role.objects.get_or_create(name=legacy_role)
                user.roles.add(role_obj)
                needs_fix = True
                self.stdout.write(
                    self.style.SUCCESS(f'Added {legacy_role} to M2M for {user.email}')
                )
            # Sync: if M2M has data but legacy role is wrong/missing
            elif not legacy_role or legacy_role not in VALID_ROLES:
                valid_m2m = [r for r in m2m_roles if r in VALID_ROLES]
                if valid_m2m:
                    user.role = valid_m2m[0]
                    user.save()
                    needs_fix = True
                    self.stdout.write(
                        self.style.SUCCESS(f'Set legacy role to {valid_m2m[0]} for {user.email}')
                    )

            if not needs_fix:
                self.stdout.write(f'{user.email}: OK (role={user.role}, m2m={list(user.roles.values_list("name", flat=True))})')

        self.stdout.write(self.style.SUCCESS(f'Done. Fixed {updated} users.'))
