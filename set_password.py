import os
import sys
import django

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_SUBDIR = os.path.join(BASE_DIR, 'valorize-backend-main')
sys.path.insert(0, PROJECT_SUBDIR)
sys.path.insert(0, BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

django.setup()
from django.contrib.auth.models import User

email = 'manda.regina10@gmail.com'
new_password = '123456789'

user = User.objects.filter(email=email).first()
if not user:
    print('USER_NOT_FOUND')
    sys.exit(1)

user.set_password(new_password)
user.save()
print(f'Senha atualizada para {email} (id={user.id})')
