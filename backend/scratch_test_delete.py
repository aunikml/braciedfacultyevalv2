import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from academic.models import Program

def test_delete():
    # Try to delete the first program
    prog = Program.objects.first()
    if prog:
        print(f"Attempting to delete: {prog}")
        try:
            prog.delete()
            print("Successfully deleted program from database.")
        except Exception as e:
            print(f"Failed to delete program: {e}")
    else:
        print("No programs found in database.")

if __name__ == "__main__":
    test_delete()
