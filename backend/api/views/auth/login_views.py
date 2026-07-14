from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import check_password  # Hash password
import json
from api.models import Student, Teacher  # นำเข้า Model 
from api.services.auth_service import generate_jwt_token

@csrf_exempt
def login_view(request):
        
    # API สำหรับการ Signup ของระบบ ZenseExam
    # รองรับทั้ง Student และ Teacher
    
    if request.method == 'POST':
        try:
            # 1. รับข้อมูลจากหน้าบ้าน (React)
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')
            role = data.get('role')

            if not email or not password or not role:
                return JsonResponse({'error': 'กรุณากรอกข้อมูลให้ครบถ้วน'}, status=400)

            user = None
            
            # 2. ค้นหา User ตาม Role และ Email
            if role == 'Student':
                # ค้นหาในตาราง student
                user = Student.objects.filter(std_email=email).first()
                if user:
                    # ตรวจสอบรหัสผ่านที่ Hash ไว้ในคอลัมน์ std_pass
                    if check_password(password, user.std_pass):
                        
                        token = generate_jwt_token(user.std_id, 'Student')
                        
                        return JsonResponse({
                            'message': 'เข้าสู่ระบบสำเร็จ',
                            'name': user.std_name,
                            'role': 'Student',
                            'token': token
                        }, status=200)
                        
                        

            elif role == 'Teacher':
                # ค้นหาในตาราง teacher
                user = Teacher.objects.filter(t_email=email).first()
                if user:
                    # ตรวจสอบรหัสผ่านที่ Hash ไว้ในคอลัมน์ t_pass
                    if check_password(password, user.t_pass):
                        token = generate_jwt_token(user.teacher_id, 'Teacher')
                        return JsonResponse({
                            'message': 'เข้าสู่ระบบสำเร็จ',
                            'name': user.t_name,
                            'role': 'Teacher',
                            'token': token
                        }, status=200)

            # 3. กรณีรหัสผ่านผิด หรือไม่พบ Email
            return JsonResponse({'error': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'}, status=401)

        except Exception as e:
            return JsonResponse({'error': f'เกิดข้อผิดพลาด: {str(e)}'}, status=500)

    return JsonResponse({'error': 'Method not allowed'}, status=405)
