import json
import jwt
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from ..models import Teacher, Subject, Chapter

@csrf_exempt
def teacher_subjects(request):
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
            subjects = Subject.objects.filter(teacher_id=teacher).order_by('-sj_datetime')
            data = []
            for sj in subjects:
                # Count courses (chapters) for this subject
                course_count = Chapter.objects.filter(sj_id=sj).count()
                data.append({
                    'sj_id': sj.sj_id,
                    'sj_name': sj.sj_name,
                    'sj_desc': sj.sj_desc,
                    'sj_datetime': sj.sj_datetime.strftime('%Y-%m-%d %H:%M:%S') if sj.sj_datetime else None,
                    'teacher_name': teacher.t_name,
                    'courses': course_count
                })
            return JsonResponse({'subjects': data}, status=200)

        elif request.method == 'POST':
            try:
                body = json.loads(request.body)
                sj_id = body.get('sj_id')
                sj_name = body.get('sj_name')
                sj_desc = body.get('sj_desc', '')

                if not sj_id or not sj_name:
                    return JsonResponse({'error': 'sj_id and sj_name are required'}, status=400)

                # Check if subject code already exists
                if Subject.objects.filter(sj_id=sj_id).exists():
                    return JsonResponse({'error': 'Subject code already exists'}, status=400)

                new_subject = Subject(
                    sj_id=sj_id,
                    teacher_id=teacher,
                    sj_name=sj_name,
                    sj_desc=sj_desc,
                    sj_datetime=timezone.now()
                )
                new_subject.save()
                
                return JsonResponse({'message': 'Subject created successfully', 'sj_id': new_subject.sj_id}, status=201)

            except json.JSONDecodeError:
                return JsonResponse({'error': 'Invalid JSON'}, status=400)
            
        else:
            return JsonResponse({'error': 'Method not allowed'}, status=405)

    except Exception as e:
        return JsonResponse({'error': f'Server Error: {str(e)}'}, status=500)

@csrf_exempt
def teacher_subject_detail(request, sj_id):
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

    subject = Subject.objects.filter(sj_id=sj_id, teacher_id=teacher).first()
    if not subject:
        return JsonResponse({'error': 'Subject not found'}, status=404)

    if request.method == 'PUT':
        try:
            body = json.loads(request.body)
            subject.sj_name = body.get('sj_name', subject.sj_name)
            subject.sj_desc = body.get('sj_desc', subject.sj_desc)
            subject.save()
            return JsonResponse({'message': 'Subject updated successfully'})
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
            
    elif request.method == 'DELETE':
        subject.delete()
        return JsonResponse({'message': 'Subject deleted successfully'})
        
    return JsonResponse({'error': 'Method not allowed'}, status=405)
