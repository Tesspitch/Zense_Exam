import json
import jwt
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from api.models import (
    Online_exam, detail_online_exam, detail_exam_set, 
    Choice, Question, Student, result_exam, std_answer, diff_index
)
from django.utils import timezone
from datetime import datetime
from django.db import transaction

def verify_student_token(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None, JsonResponse({'error': 'Unauthorized - Missing token'}, status=401)
    token = auth_header.split(' ')[1]
    try:
        decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        if decoded.get('role') != 'Student':
            return None, JsonResponse({'error': 'Access denied. Student role required'}, status=403)
        return decoded.get('user_id'), None
    except Exception:
        return None, JsonResponse({'error': 'Invalid or expired token'}, status=401)

@csrf_exempt
def take_exam(request, exam_id):
    if request.method == 'GET':
        student_id, error_response = verify_student_token(request)
        if error_response: return error_response

        try:
            exam = Online_exam.objects.get(online_exam_id=exam_id, online_exam_is_active=True)
            detail_online = detail_online_exam.objects.filter(online_exam_id=exam).first()
            if not detail_online:
                return JsonResponse({'error': 'Exam details not found'}, status=404)
                
            current_time = datetime.now()
            if detail_online.time_start and detail_online.time_start.replace(tzinfo=None) > current_time:
                return JsonResponse({'error': 'ยังไม่ถึงเวลาสอบ'}, status=403)
            if detail_online.time_end and detail_online.time_end.replace(tzinfo=None) < current_time:
                return JsonResponse({'error': 'หมดเวลาสอบแล้ว'}, status=403)

            student = Student.objects.get(std_id=student_id)
            if result_exam.objects.filter(online_exam_id=exam, std_id=student).exists():
                return JsonResponse({'error': 'You have already submitted this exam.'}, status=403)

            duration = 0
            if detail_online.time_start and detail_online.time_end:
                duration = int((detail_online.time_end - detail_online.time_start).total_seconds() / 60)

            subject_name = ''
            questions = []
            if exam.exam_set_id:
                details_set = detail_exam_set.objects.filter(exam_set_id=exam.exam_set_id).order_by('qt_order').select_related('qt_id', 'qt_id__chap_id', 'qt_id__chap_id__sj_id')
                for d_set in details_set:
                    q = d_set.qt_id
                    if q:
                        if not subject_name and q.chap_id and q.chap_id.sj_id:
                            subject_name = q.chap_id.sj_id.sj_name
                            
                        group_info = None
                        if q.group_id:
                            group_info = {
                                'id': q.group_id.group_id,
                                'text': q.group_id.shared_text,
                                'image_url': q.group_id.shared_image_url
                            }
                        
                        choices_query = Choice.objects.filter(qt_id=q).order_by('choice_id')
                        choices = [{
                            'id': c.choice_id,
                            'text': c.choice_detail,
                        } for c in choices_query]

                        questions.append({
                            'id': q.qt_id,
                            'text': q.qt_detail,
                            'image_url': q.qt_image_url,
                            'group': group_info,
                            'choices': choices
                        })

            return JsonResponse({
                'id': exam.online_exam_id,
                'name': exam.online_exam_name,
                'subject_name': subject_name,
                'duration': duration,
                'questions': questions
            }, status=200)

        except Online_exam.DoesNotExist:
            return JsonResponse({'error': 'Exam not found or inactive'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def submit_exam(request, exam_id):
    if request.method == 'POST':
        student_id, error_response = verify_student_token(request)
        if error_response: return error_response

        try:
            body = json.loads(request.body)
            answers = body.get('answers', {}) # format: { str(qt_id): choice_id }

            exam = Online_exam.objects.get(online_exam_id=exam_id)
            student = Student.objects.get(std_id=student_id)

            if result_exam.objects.filter(online_exam_id=exam, std_id=student).exists():
                return JsonResponse({'error': 'Exam already submitted.'}, status=403)

            # Determine score
            details_set = detail_exam_set.objects.filter(exam_set_id=exam.exam_set_id).select_related('qt_id')
            
            score = 0
            correct_choices = {}
            for d in details_set:
                q_id = str(d.qt_id.qt_id)
                correct_c = Choice.objects.filter(qt_id=d.qt_id, choice_correct=True).first()
                if correct_c:
                    correct_choices[q_id] = correct_c.choice_id

            for q_id, c_id in answers.items():
                if q_id in correct_choices and correct_choices[q_id] == c_id:
                    score += 1
            
            # Save results transactionally
            with transaction.atomic():
                first_detail = details_set.first()
                
                max_res = result_exam.objects.order_by('-result_exam_id').first()
                next_res_id = (max_res.result_exam_id + 1) if max_res else 1

                new_result = result_exam.objects.create(
                    result_exam_id=next_res_id,
                    online_exam_id=exam,
                    std_id=student,
                    detail_exam_set_id=first_detail,
                    result_score=score,
                    time_exam=datetime.now(),
                    status_exam='Completed'
                )

                # Get max ans_id
                max_ans = std_answer.objects.order_by('-ans_id').first()
                next_ans_id = (max_ans.ans_id + 1) if max_ans else 1

                for q_id, c_id in answers.items():
                    q_obj = Question.objects.get(qt_id=int(q_id))
                    c_obj = Choice.objects.get(choice_id=c_id) if c_id else None
                    if c_obj:
                        std_answer.objects.create(
                            ans_id=next_ans_id,
                            result_exam_id=new_result,
                            choice_id=c_obj,
                            qt_id=q_obj,
                            ans=c_id
                        )
                        next_ans_id += 1

                # Calculate and update question difficulty automatically
                for d in details_set:
                    q_obj = d.qt_id
                    n = std_answer.objects.filter(qt_id=q_obj).count()
                    if n > 0:
                        r = std_answer.objects.filter(qt_id=q_obj, choice_id__choice_correct=True).count()
                        p = r / n
                        
                        # Update Question difficulty level
                        if p >= 0.61:
                            q_obj.qt_diff_lv = 'easy'
                        elif p >= 0.41:
                            q_obj.qt_diff_lv = 'medium'
                        else:
                            q_obj.qt_diff_lv = 'hard'
                        q_obj.save()
                        
                        # Update diff_index table
                        diff_obj = diff_index.objects.filter(detail_exam_set_id=d, qt_id=q_obj).first()
                        if diff_obj:
                            diff_obj.diff_level = round(p, 2)
                            diff_obj.save()
                        else:
                            max_diff = diff_index.objects.order_by('-diff_index_id').first()
                            next_diff_id = (max_diff.diff_index_id + 1) if max_diff else 1
                            diff_index.objects.create(
                                diff_index_id=next_diff_id,
                                detail_exam_set_id=d,
                                qt_id=q_obj,
                                diff_level=round(p, 2)
                            )

            return JsonResponse({
                'success': True,
                'score': score,
                'total': len(details_set)
            }, status=200)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Method not allowed'}, status=405)
