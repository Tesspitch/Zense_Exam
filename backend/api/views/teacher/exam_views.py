import jwt
import json
import uuid
import random
from datetime import datetime
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Avg
from api.models import Teacher, Online_exam, detail_online_exam, detail_exam_set, result_exam, Exam_set, Question, Chapter, Choice

@csrf_exempt
def teacher_exams(request):
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
            # Fetch all exams for this teacher
            exams_qs = Online_exam.objects.filter(teacher_id=teacher).order_by('-online_exam_create')
            
            data = []
            for ex in exams_qs:
                detail = detail_online_exam.objects.filter(online_exam_id=ex).order_by('-date_exam').first()
                
                duration_mins = 0
                schedule_str = None
                status = 'Active' if ex.online_exam_is_active else 'Scheduled'
                students_count = 0
                
                if detail:
                    if detail.time_start and detail.time_end:
                        diff = detail.time_end - detail.time_start
                        duration_mins = int(diff.total_seconds() / 60)
                    
                    date_str = detail.date_exam.strftime('%Y-%m-%d') if detail.date_exam else ''
                    start_str = detail.time_start.strftime('%H:%M') if detail.time_start else ''
                    end_str = detail.time_end.strftime('%H:%M') if detail.time_end else ''
                    if date_str and start_str and end_str:
                        schedule_str = f"{date_str} ({start_str} to {end_str})"
                    
                    status = detail.online_exam_status if detail.online_exam_status else status
                    students_count = detail.num_of_std if detail.num_of_std is not None else 0

                exam_set = ex.exam_set_id
                easy = 0
                medium = 0
                hard = 0
                sources = set()
                total_questions = 0
                raw_desc = exam_set.exam_set_detail if exam_set else ''
                desc_text = raw_desc
                try:
                    parsed_desc = json.loads(raw_desc)
                    desc_text = parsed_desc.get('description', raw_desc)
                except:
                    pass
                description = desc_text if desc_text else 'No description'
                
                if exam_set:
                    details_set = detail_exam_set.objects.filter(exam_set_id=exam_set).select_related('qt_id', 'qt_id__chap_id', 'qt_id__chap_id__sj_id')
                    total_questions = details_set.count()
                    for d_set in details_set:
                        q = d_set.qt_id
                        if q:
                            diff = q.qt_diff_lv.lower()
                            if diff == 'easy': easy += 1
                            elif diff == 'medium': medium += 1
                            elif diff == 'hard': hard += 1
                            
                            if q.chap_id and q.chap_id.sj_id:
                                sources.add(q.chap_id.sj_id.sj_name)
                                
                avg_score_data = result_exam.objects.filter(online_exam_id=ex).aggregate(Avg('result_score'))
                if avg_score_data['result_score__avg'] is not None and total_questions > 0:
                    avg_score = round((float(avg_score_data['result_score__avg']) / total_questions) * 100, 2)
                else:
                    avg_score = None
                
                if students_count == 0:
                    students_count = result_exam.objects.filter(online_exam_id=ex).values('std_id').distinct().count()

                data.append({
                    'online_exam_id': ex.online_exam_id,
                    'online_exam_pass': ex.online_exam_pass,
                    'online_exam_name': ex.online_exam_name,
                    'is_active': ex.online_exam_is_active,
                    'exam_type': 'online' if ex.online_exam_is_active else 'paper',
                    'status': status,
                    'sources': ', '.join(list(sources)) if sources else 'No sources',
                    'description': description,
                    'schedule': schedule_str,
                    'difficulty': {
                        'easy': easy,
                        'medium': medium,
                        'hard': hard
                    },
                    'total_questions': total_questions,
                    'duration': duration_mins,
                    'students': students_count,
                    'avg_score': avg_score
                })

            return JsonResponse({'exams': data}, status=200)

        elif request.method == 'POST':
            data = json.loads(request.body)
            name = data.get('name', '').strip()
            description = data.get('description', '')
            exam_type = data.get('exam_type', 'online')  # online or paper
            courses = data.get('courses', [])  # list of chap_id
            easy_count = int(data.get('easy_count', 0))
            medium_count = int(data.get('medium_count', 0))
            hard_count = int(data.get('hard_count', 0))
            duration = int(data.get('duration', 60))
            date_exam_str = data.get('date_exam', '')
            time_start_str = data.get('time_start', '')
            time_end_str = data.get('time_end', '')

            total_requested = easy_count + medium_count + hard_count

            if not name:
                return JsonResponse({'error': 'กรุณากรอกชื่อการสอบ'}, status=400)
            if not courses:
                return JsonResponse({'error': 'กรุณาเลือกอย่างน้อย 1 คอร์ส'}, status=400)
            if total_requested == 0:
                return JsonResponse({'error': 'กรุณากำหนดจำนวนข้อสอบอย่างน้อย 1 ข้อ'}, status=400)

            # Gather questions from selected courses, filtered by difficulty
            all_course_qs = list(Question.objects.filter(chap_id__in=courses).select_related('group_id'))
            easy_pool = [q for q in all_course_qs if q.qt_diff_lv.lower() == 'easy']
            medium_pool = [q for q in all_course_qs if q.qt_diff_lv.lower() == 'medium']
            hard_pool = [q for q in all_course_qs if q.qt_diff_lv.lower() == 'hard']

            # Validate availability
            if len(easy_pool) < easy_count:
                return JsonResponse({'error': f'ข้อสอบระดับง่ายไม่พอ (มี {len(easy_pool)} ข้อ, ต้องการ {easy_count} ข้อ)'}, status=400)
            if len(medium_pool) < medium_count:
                return JsonResponse({'error': f'ข้อสอบระดับปานกลางไม่พอ (มี {len(medium_pool)} ข้อ, ต้องการ {medium_count} ข้อ)'}, status=400)
            if len(hard_pool) < hard_count:
                return JsonResponse({'error': f'ข้อสอบระดับยากไม่พอ (มี {len(hard_pool)} ข้อ, ต้องการ {hard_count} ข้อ)'}, status=400)

            # Group questions by group_id to keep scenarios intact
            groups = {}
            for q in all_course_qs:
                g_id = f"g_{q.group_id_id}" if q.group_id_id else f"q_{q.qt_id}"
                if g_id not in groups:
                    groups[g_id] = []
                groups[g_id].append(q)

            group_list = list(groups.values())
            random.shuffle(group_list)

            needed = {
                'easy': easy_count,
                'medium': medium_count,
                'hard': hard_count
            }

            selected_questions = []

            for g in group_list:
                # Check if this group helps fulfill any POSITIVE needed count
                helps = False
                for q in g:
                    diff = q.qt_diff_lv.lower()
                    if needed.get(diff, 0) > 0:
                        helps = True
                        break
                
                if helps:
                    selected_questions.extend(g)
                    for q in g:
                        diff = q.qt_diff_lv.lower()
                        if diff in needed:
                            needed[diff] -= 1
                
                # Check if we are done
                if all(v <= 0 for v in needed.values()):
                    break

            exam_set_detail_content = json.dumps({
                "description": description,
                "num_sets": int(data.get("num_sets", 1))
            })

            # 1. Create Exam_set
            exam_set_id = str(uuid.uuid4())[:15]
            new_exam_set = Exam_set.objects.create(
                exam_set_id=exam_set_id,
                teacher_id=teacher,
                exam_set_header=name,
                exam_set_detail=exam_set_detail_content
            )

            # 2. Create detail_exam_set (Link selected questions)
            for i, q in enumerate(selected_questions):
                detail_exam_set.objects.create(
                    exam_set_id=new_exam_set,
                    qt_id=q,
                    qt_order=i + 1
                )

            # 3. Create Online_exam
            online_exam_id = f"EXAM-{str(uuid.uuid4())[:6].upper()}"
            password = str(random.randint(100000, 999999))  # 6-digit code
            new_online_exam = Online_exam.objects.create(
                online_exam_id=online_exam_id,
                exam_set_id=new_exam_set,
                teacher_id=teacher,
                online_exam_name=name,
                online_exam_pass=password,
                online_exam_is_active=(exam_type == 'online')
            )

            # 4. Create detail_online_exam if schedule is provided
            if date_exam_str and time_start_str and time_end_str:
                date_obj = datetime.strptime(date_exam_str, '%Y-%m-%d').date()
                start_dt = datetime.strptime(f"{date_exam_str} {time_start_str}", '%Y-%m-%d %H:%M')
                end_dt = datetime.strptime(f"{date_exam_str} {time_end_str}", '%Y-%m-%d %H:%M')

                detail_online_exam.objects.create(
                    online_exam_id=new_online_exam,
                    date_exam=date_obj,
                    time_start=start_dt,
                    time_end=end_dt,
                    online_exam_status='Active' if exam_type == 'online' else 'Scheduled',
                    num_of_std=0
                )

            return JsonResponse({
                'message': 'Exam created successfully',
                'exam_id': online_exam_id,
                'total_questions': len(selected_questions),
                'easy': len([q for q in selected_questions if q.qt_diff_lv.lower() == 'easy']),
                'medium': len([q for q in selected_questions if q.qt_diff_lv.lower() == 'medium']),
                'hard': len([q for q in selected_questions if q.qt_diff_lv.lower() == 'hard'])
            }, status=201)

        else:
            return JsonResponse({'error': 'Method not allowed'}, status=405)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': f'Server Error: {str(e)}'}, status=500)


@csrf_exempt
def question_counts(request):
    """Return available question counts by difficulty for given course IDs."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Unauthorized'}, status=401)

    token = auth_header.split(' ')[1]
    try:
        decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
    except Exception:
        return JsonResponse({'error': 'Invalid token'}, status=401)

    try:
        data = json.loads(request.body)
        courses = data.get('courses', [])

        if not courses:
            return JsonResponse({'easy': 0, 'medium': 0, 'hard': 0}, status=200)

        easy = Question.objects.filter(chap_id__in=courses, qt_diff_lv__iexact='easy').count()
        medium = Question.objects.filter(chap_id__in=courses, qt_diff_lv__iexact='medium').count()
        hard = Question.objects.filter(chap_id__in=courses, qt_diff_lv__iexact='hard').count()

        return JsonResponse({'easy': easy, 'medium': medium, 'hard': hard}, status=200)

    except Exception as e:
        return JsonResponse({'error': f'Server Error: {str(e)}'}, status=500)

@csrf_exempt
def teacher_exam_detail(request, exam_id):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    token = auth_header.split(' ')[1]
    try:
        decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        teacher_id = decoded.get('user_id')
    except Exception:
        return JsonResponse({'error': 'Invalid token'}, status=401)

    try:
        exam = Online_exam.objects.filter(online_exam_id=exam_id, teacher_id=teacher_id).first()
        if not exam:
            return JsonResponse({'error': 'Exam not found'}, status=404)

        if request.method == 'GET':
            detail_online = detail_online_exam.objects.filter(online_exam_id=exam).first()
            date_str = detail_online.date_exam.strftime('%Y-%m-%d') if detail_online and detail_online.date_exam else ''
            start_str = detail_online.time_start.strftime('%H:%M') if detail_online and detail_online.time_start else ''
            end_str = detail_online.time_end.strftime('%H:%M') if detail_online and detail_online.time_end else ''
            duration = 0
            if detail_online and detail_online.time_start and detail_online.time_end:
                duration = int((detail_online.time_end - detail_online.time_start).total_seconds() / 60)

            # Get questions
            questions = []
            subjects = []
            if exam.exam_set_id:
                details_set = detail_exam_set.objects.filter(exam_set_id=exam.exam_set_id).order_by('qt_order').select_related('qt_id', 'qt_id__chap_id', 'qt_id__chap_id__sj_id')
                for d_set in details_set:
                    q = d_set.qt_id
                    if q:
                        if q.chap_id and q.chap_id.sj_id:
                            subj = q.chap_id.sj_id
                            if not any(s['id'] == subj.sj_id for s in subjects):
                                subjects.append({
                                    'id': subj.sj_id,
                                    'name': subj.sj_name
                                })
                        
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
                            'isCorrect': c.choice_correct
                        } for c in choices_query]
                        questions.append({
                            'id': q.qt_id,
                            'text': q.qt_detail,
                            'image_url': q.qt_image_url,
                            'difficulty': q.qt_diff_lv,
                            'group': group_info,
                            'choices': choices
                        })

            raw_desc = exam.exam_set_id.exam_set_detail if exam.exam_set_id else ''
            desc_text = raw_desc
            num_sets = 1
            try:
                parsed_desc = json.loads(raw_desc)
                desc_text = parsed_desc.get('description', raw_desc)
                num_sets = parsed_desc.get('num_sets', 1)
            except:
                pass

            return JsonResponse({
                'id': exam.online_exam_id,
                'name': exam.online_exam_name,
                'password': exam.online_exam_pass,
                'description': desc_text,
                'num_sets': num_sets,
                'exam_type': 'online' if exam.online_exam_is_active else 'paper',
                'date_exam': date_str,
                'time_start': start_str,
                'time_end': end_str,
                'duration': duration,
                'subjects': subjects,
                'questions': questions
            }, status=200)

        elif request.method == 'PUT':
            data = json.loads(request.body)
            exam.online_exam_name = data.get('name', exam.online_exam_name)
            exam.online_exam_is_active = (data.get('exam_type') == 'online')
            exam.save()

            if exam.exam_set_id:
                raw_desc = exam.exam_set_id.exam_set_detail
                num_sets = 1
                try:
                    parsed_desc = json.loads(raw_desc)
                    num_sets = parsed_desc.get('num_sets', 1)
                except:
                    pass
                
                updated_desc = {
                    "description": data.get('description', ''),
                    "num_sets": num_sets
                }
                exam.exam_set_id.exam_set_detail = json.dumps(updated_desc)
                exam.exam_set_id.save()

            date_str = data.get('date_exam')
            time_start_str = data.get('time_start')
            time_end_str = data.get('time_end')

            if time_start_str and len(time_start_str) > 5:
                time_start_str = time_start_str[:5]
            if time_end_str and len(time_end_str) > 5:
                time_end_str = time_end_str[:5]

            if date_str and time_start_str and time_end_str:
                date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
                start_dt = datetime.strptime(f"{date_str} {time_start_str}", '%Y-%m-%d %H:%M')
                end_dt = datetime.strptime(f"{date_str} {time_end_str}", '%Y-%m-%d %H:%M')
                
                detail_online, created = detail_online_exam.objects.get_or_create(
                    online_exam_id=exam,
                    defaults={
                        'date_exam': date_obj,
                        'time_start': start_dt,
                        'time_end': end_dt,
                        'online_exam_status': 'Active' if exam.online_exam_is_active else 'Scheduled',
                        'num_of_std': 0
                    }
                )
                if not created:
                    detail_online.date_exam = date_obj
                    detail_online.time_start = start_dt
                    detail_online.time_end = end_dt
                    detail_online.online_exam_status = 'Active' if exam.online_exam_is_active else 'Scheduled'
                    detail_online.save()

            return JsonResponse({'message': 'Exam updated successfully'}, status=200)

        elif request.method == 'DELETE':
            # cascade should delete related data, but we can do it explicitly if needed
            # exam_set deletion will cascade to detail_exam_set
            exam_set = exam.exam_set_id
            exam.delete() 
            if exam_set:
                exam_set.delete()
            return JsonResponse({'message': 'Exam deleted successfully'}, status=200)

        return JsonResponse({'error': 'Method not allowed'}, status=405)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': f'Server Error: {str(e)}'}, status=500)


@csrf_exempt
def teacher_exam_results(request, exam_id):
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    
    try:
        exam = Online_exam.objects.filter(online_exam_id=exam_id).first()
        if not exam:
            return JsonResponse({'error': 'Exam not found'}, status=404)

        # Get unique students who have a result_exam for this online_exam
        # Because the schema connects result_exam to specific questions (detail_exam_set), 
        # we aggregate the score for each student.
        from django.db.models import Sum
        results = result_exam.objects.filter(online_exam_id=exam).values('std_id', 'std_id__std_name').annotate(
            total_score=Sum('result_score')
        )

        total_questions = 0
        if exam.exam_set_id:
            total_questions = detail_exam_set.objects.filter(exam_set_id=exam.exam_set_id).count()
            
        formatted_results = []
        for r in results:
            # We can get the first record to find time_exam and status
            first_record = result_exam.objects.filter(online_exam_id=exam, std_id=r['std_id']).first()
            raw_score = float(r['total_score']) if r['total_score'] else 0
            percentage = round((raw_score / total_questions) * 100, 2) if total_questions > 0 else 0
            
            formatted_results.append({
                'std_id': r['std_id'],
                'std_name': r['std_id__std_name'],
                'score': raw_score,
                'percentage': percentage,
                'total_questions': total_questions,
                'status': first_record.status_exam if first_record else 'Unknown',
                'time_submitted': first_record.time_exam.strftime('%Y-%m-%dT%H:%M:%S') if first_record and first_record.time_exam else None
            })

        return JsonResponse({'results': formatted_results}, status=200)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': f'Server Error: {str(e)}'}, status=500)

