from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email field must be set'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')
        extra_fields.setdefault('must_change_password', False)
        # ... roles must be added after save because it's M2M ...
        return self.create_user(email, password, **extra_fields)

class Role(models.Model):
    name = models.CharField(max_length=50, unique=True)
    
    def __str__(self):
        return self.name

class CustomUser(AbstractUser):
    class RoleNames(models.TextChoices):
        ADMIN = 'ADMIN', _('Admin')
        MANAGER = 'MANAGER', _('Manager')
        FACULTY = 'FACULTY', _('Faculty Member')
        PROGRAM_SUPERVISOR = 'PROGRAM_SUPERVISOR', _('Program Supervisor')
        SUPERVISOR = 'SUPERVISOR', _('Supervisor')

    username = None
    email = models.EmailField(_('email address'), unique=True)
    first_name = models.CharField(_('first name'), max_length=150)
    last_name = models.CharField(_('last name'), max_length=150)
    
    # New M2M roles
    roles = models.ManyToManyField(Role, blank=True)
    
    # Keeping role field temporarily for migration/legacy support
    role = models.CharField(
        max_length=20,
        choices=RoleNames.choices,
        default=RoleNames.FACULTY
    )
    
    must_change_password = models.BooleanField(default=True)
    assigned_program = models.ForeignKey('academic.Program', on_delete=models.SET_NULL, null=True, blank=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def get_role_list(self):
        return list(self.roles.values_list('name', flat=True))
    
    def has_role(self, role_name):
        return self.roles.filter(name=role_name).exists()

    def __str__(self):
        return self.email
