import os
import sys
import django

# Ajusta caminho e settings
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Inserir a subpasta que contém o pacote Django (valorize-backend-main/valorize-backend-main)
PROJECT_SUBDIR = os.path.join(BASE_DIR, 'valorize-backend-main')
sys.path.insert(0, PROJECT_SUBDIR)
sys.path.insert(0, BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

django.setup()
from django.contrib.auth.models import User

email = 'manda.regina10@gmail.com'
password = '12345678'

user = User.objects.filter(email=email).first()
if not user:
    print('USER_NOT_FOUND')
else:
    print('username:', user.username)
    print('is_active:', user.is_active)
    print('password_match:', user.check_password(password))
    print('id:', user.id)
