from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import check_password  # สำคัญมากสำหรับการเช็ครหัสผ่านที่ถูก Hash
import json
from ..models import Student, Teacher  # นำเข้า Model ที่คุณสร้างไว้
from django.contrib.auth.hashers import make_password 
from ..services.auth_service import generate_jwt_token

@csrf_exempt
def signup_view(request):
    if request.method == 'POST':    
        try:
            data = json.loads(request.body)
            user_id = data.get('userId')
            full_name = data.get('fullName')
            email = data.get('email')
            password = data.get('password')
            
            role = data.get('role')
            
            if not user_id or not full_name or not email or not password or not role:
                return JsonResponse({'error': 'กรุณากรอกข้อมูลให้ครบถ้วน'}, status=400)
            
            
            
            user = None
            
            if(role == 'Student'):
                # ตรวจสอบว่ามีอีเมลนี้ในตาราง student หรือไม่
                user = Student.objects.filter(std_email=email).exists()
                if user:
                    return JsonResponse({'error': 'อีเมลนี้ถูกใช้งานแล้ว'}, status=400)
                
                user = Student.objects.create(
                    std_id = user_id,
                    std_name=full_name,
                    std_email=email,
                    std_pass=make_password(password),  # Hash รหัสผ่านก่อนบันทึกจริง
                    role='Student'
                )  
                
            elif(role == 'Teacher'):
                # ตรวจสอบว่ามีอีเมลนี้ในตาราง teacher หรือไม่
                user = Teacher.objects.filter(t_email=email).exists()
                if user:
                    return JsonResponse({'error': 'อีเมลนี้ถูกใช้งานแล้ว'}, status=400)
                
                user = Teacher.objects.create(
                    teacher_id = user_id,  # ใช้ user_id เป็น teacher_id เพื่อความง่าย
                    t_name=full_name,
                    t_email=email,
                    t_pass=make_password(password),  # ควร Hash รหัสผ่านก่อนบันทึกจริง
                    role='Teacher'
                )
            else:
                return JsonResponse({'error': 'Role ไม่ถูกต้อง'}, status=400)
            
            token = generate_jwt_token(user_id, role)
            
            return JsonResponse({
                'message': 'สมัครสมาชิกสำเร็จ',
                'token': token,
                'role': role
                }, status=201)
        
        except Exception as e:
            return JsonResponse({'error': f'เกิดข้อผิดพลาด: {str(e)}'}, status=500)
  
    # API สำหรับการ Signup ของระบบ ZenseExam
    # รองรับทั้ง Student และ Teacher
   
    # โค้ดสำหรับการ Signup จะถูกพัฒนาในอนาคต
    return JsonResponse({'error': 'Method not allowed'}, status=405)