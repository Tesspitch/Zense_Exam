from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from api.models import Student, Teacher
from api.services.auth_service import generate_jwt_token

# The client ID provided by the user
GOOGLE_CLIENT_ID = "431269906470-cr9ti9r4umgsbcsgp7l083vkr8rs91ab.apps.googleusercontent.com"

@csrf_exempt
def google_login_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            credential = data.get('credential')
            role = data.get('role')

            if not credential or not role:
                return JsonResponse({'error': 'กรุณาส่ง Credential และ Role ให้ครบถ้วน'}, status=400)

            # 1. Verify the Google credential
            try:
                idinfo = id_token.verify_oauth2_token(
                    credential, 
                    google_requests.Request(), 
                    GOOGLE_CLIENT_ID,
                    clock_skew_in_seconds=10
                )
                # idinfo contains email, name, sub (google_id), etc.
            except ValueError as e:
                # Invalid token
                return JsonResponse({'error': f'Token ของ Google ไม่ถูกต้อง: {str(e)}'}, status=401)

            email = idinfo.get('email')
            full_name = idinfo.get('name')
            google_id = idinfo.get('sub') # we use sub as the ID for auto-register if needed

            if not email:
                return JsonResponse({'error': 'ไม่พบ Email จากบัญชี Google'}, status=400)

            user = None

            # 2. Check and auto-register based on role
            if role == 'Student':
                user = Student.objects.filter(std_email=email).first()
                if not user:
                    # Auto-register
                    # generate a custom numeric user_id that fits max_length=11
                    import random
                    user_id = str(random.randint(10000000000, 99999999999))
                    user = Student.objects.create(
                        std_id=user_id,
                        std_name=full_name,
                        std_email=email,
                        std_pass=None,  # No password for Google login
                        role='Student'
                    )
                
                # Generate JWT
                token = generate_jwt_token(user.std_id, 'Student')
                
                return JsonResponse({
                    'message': 'เข้าสู่ระบบสำเร็จ',
                    'name': user.std_name,
                    'role': 'Student',
                    'token': token
                }, status=200)

            elif role == 'Teacher':
                user = Teacher.objects.filter(t_email=email).first()
                if not user:
                    # Auto-register
                    import random
                    user_id = str(random.randint(10000000000, 99999999999))
                    user = Teacher.objects.create(
                        teacher_id=user_id,
                        t_name=full_name,
                        t_email=email,
                        t_pass=None, # No password for Google login
                        role='Teacher'
                    )

                # Generate JWT
                token = generate_jwt_token(user.teacher_id, 'Teacher')
                
                return JsonResponse({
                    'message': 'เข้าสู่ระบบสำเร็จ',
                    'name': user.t_name,
                    'role': 'Teacher',
                    'token': token
                }, status=200)

            else:
                return JsonResponse({'error': 'Role ไม่ถูกต้อง'}, status=400)

        except Exception as e:
            return JsonResponse({'error': f'เกิดข้อผิดพลาด: {str(e)}'}, status=500)

    return JsonResponse({'error': 'Method not allowed'}, status=405)
