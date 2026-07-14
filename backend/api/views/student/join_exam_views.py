import json
import jwt
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from api.services.join_exam_service import JoinExamService

@csrf_exempt
def join_exam(request):
    if request.method == 'POST':
        try:
            # 1. Decode JWT token from Authorization header
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return JsonResponse({'error': 'Unauthorized - Missing token'}, status=401)
            
            token = auth_header.split(' ')[1]
            try:
                decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            except jwt.ExpiredSignatureError:
                return JsonResponse({'error': 'Session expired'}, status=401)
            except jwt.InvalidTokenError:
                return JsonResponse({'error': 'Invalid token'}, status=401)
            
            # Verify student role
            if decoded.get('role') != 'Student':
                return JsonResponse({'error': 'Access denied. Student role required'}, status=403)
            
            student_id = int(decoded.get('user_id'))

            # 2. รับข้อมูลจาก Frontend (expecting exam_pass)
            body = json.loads(request.body)
            exam_pass = body.get('exam_pass')
            
            if not exam_pass:
                return JsonResponse({'error': 'Exam passcode is required'}, status=400)

            # Trim whitespace (and let service handle case-insensitive matching)
            exam_pass = exam_pass.strip()

            # 3. เรียกใช้ Service ให้ช่วยเช็กให้หน่อย
            exam, error_message = JoinExamService.can_student_join(student_id, exam_pass)

            # 4. ถ้า Service บอกว่ามีปัญหา (มี error_message)
            if error_message:
                return JsonResponse({'error': error_message}, status=400)

            # 5. ถ้าผ่านหมด ส่งชื่อวิชาไปโชว์ใน React เพื่อยืนยัน
            return JsonResponse({
                'success': True,
                'exam_name': exam.online_exam_name,
                'exam_id': exam.online_exam_id
            }, status=200)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid request body'}, status=400)
        except Exception as e:
            return JsonResponse({'error': f'Internal server error: {str(e)}'}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)
