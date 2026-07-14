import json
import jwt
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from ..models import Teacher, Subject, Chapter, Question, Exam_set, detail_exam_set

@csrf_exempt
def teacher_courses(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Unauthorized'}, status=401)

    token = auth_header.split(' ')[1]
    try:
        decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return JsonResponse({'error': 'Session expired'}, status=401)
    except Exception:
        return JsonResponse({'error': 'Invalid token'}, status=401)

    role = decoded.get('role')
    if role != 'Teacher':
        return JsonResponse({'error': 'Forbidden'}, status=403)

    user_id = decoded.get('user_id')
    try:
        teacher = Teacher.objects.filter(teacher_id=user_id).first()
        if not teacher:
            return JsonResponse({'error': 'Teacher not found'}, status=404)

        if request.method == 'GET':
            # Fetch all chapters (courses) belonging to the teacher's subjects
            courses = Chapter.objects.filter(sj_id__teacher_id=teacher).order_by('-chap_datetime')
            data = []
            for chap in courses:
                # Count questions for this course
                questions_count = Question.objects.filter(chap_id=chap).count()
                
                # Count total exams that include questions from this course
                # We join detail_exam_set with exam_set and question to check
                total_exams = Exam_set.objects.filter(
                    detail_exam_set__qt_id__chap_id=chap
                ).distinct().count()

                data.append({
                    'chap_id': chap.chap_id,
                    'chap_name': chap.chap_name,
                    'chap_desc': chap.chap_desc,
                    'chap_datetime': chap.chap_datetime.strftime('%Y-%m-%d %H:%M:%S') if chap.chap_datetime else None,
                    'sj_id': chap.sj_id.sj_id,
                    'sj_name': chap.sj_id.sj_name,
                    'teacher_name': teacher.t_name,
                    'questions_count': questions_count,
                    'total_exams': total_exams
                })
            return JsonResponse({'courses': data}, status=200)

        elif request.method == 'POST':
            try:
                body = json.loads(request.body)
                chap_id = body.get('chap_id')
                sj_id_val = body.get('sj_id')
                chap_name = body.get('chap_name')
                chap_desc = body.get('chap_desc', '')

                if not chap_id or not sj_id_val or not chap_name:
                    return JsonResponse({'error': 'chap_id, sj_id, and chap_name are required'}, status=400)

                # Check if subject exists and belongs to this teacher
                subject = Subject.objects.filter(sj_id=sj_id_val, teacher_id=teacher).first()
                if not subject:
                    return JsonResponse({'error': 'Subject not found or does not belong to you'}, status=404)

                # Check if course code already exists
                if Chapter.objects.filter(chap_id=chap_id).exists():
                    return JsonResponse({'error': 'Course code already exists'}, status=400)

                new_course = Chapter(
                    chap_id=chap_id,
                    sj_id=subject,
                    chap_name=chap_name,
                    chap_desc=chap_desc,
                    chap_datetime=timezone.now()
                )
                new_course.save()
                
                return JsonResponse({'message': 'Course created successfully', 'chap_id': new_course.chap_id}, status=201)

            except json.JSONDecodeError:
                return JsonResponse({'error': 'Invalid JSON'}, status=400)
            
        else:
            return JsonResponse({'error': 'Method not allowed'}, status=405)

    except Exception as e:
        return JsonResponse({'error': f'Server Error: {str(e)}'}, status=500)

@csrf_exempt
def teacher_course_detail(request, chap_id):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Unauthorized'}, status=401)

    token = auth_header.split(' ')[1]
    try:
        decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
    except Exception:
        return JsonResponse({'error': 'Invalid token'}, status=401)

    if decoded.get('role') != 'Teacher':
        return JsonResponse({'error': 'Forbidden'}, status=403)

    teacher = Teacher.objects.filter(teacher_id=decoded.get('user_id')).first()
    if not teacher:
        return JsonResponse({'error': 'Teacher not found'}, status=404)

    course = Chapter.objects.filter(chap_id=chap_id, sj_id__teacher_id=teacher).first()
    if not course:
        return JsonResponse({'error': 'Course not found'}, status=404)

    if request.method == 'PUT':
        try:
            body = json.loads(request.body)
            course.chap_name = body.get('chap_name', course.chap_name)
            course.chap_desc = body.get('chap_desc', course.chap_desc)
            # Cannot easily change sj_id or chap_id safely this way without extra checks
            course.save()
            return JsonResponse({'message': 'Course updated successfully'})
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
            
    elif request.method == 'DELETE':
        course.delete()
        return JsonResponse({'message': 'Course deleted successfully'})
        
    return JsonResponse({'error': 'Method not allowed'}, status=405)
