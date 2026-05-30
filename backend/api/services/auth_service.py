# api/services/auth_service.py
import jwt
from datetime import datetime, timedelta
from django.conf import settings

def generate_jwt_token(user_id, role):
    payload = {
        'user_id': str(user_id),
        'role': role,
        'exp': datetime.utcnow() + timedelta(hours=2) # หมดอายุใน 2 ชั่วโมง
    }
    
    # ดึง SECRET_KEY จาก settings.py มาใช้เข้ารหัส
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    return token