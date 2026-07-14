import json
import jwt
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from api.models import Teacher, Chapter, Question, Choice, QuestionGroup

@csrf_exempt
def teacher_questions(request):
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
            # Support filtering by course
            chap_id = request.GET.get('chap_id')
            if chap_id:
                questions = Question.objects.filter(chap_id__teacher_id=teacher, chap_id=chap_id)
            else:
                questions = Question.objects.filter(chap_id__sj_id__teacher_id=teacher)
            
            data = []
            for qt in questions:
                choices = Choice.objects.filter(qt_id=qt)
                choices_data = [{
                    'choice_id': c.choice_id,
                    'choice_detail': c.choice_detail,
                    'choice_image_url': c.choice_image_url,
                    'choice_correct': c.choice_correct
                } for c in choices]

                data.append({
                    'qt_id': qt.qt_id,
                    'chap_id': qt.chap_id.chap_id,
                    'chap_name': qt.chap_id.chap_name,
                    'qt_detail': qt.qt_detail,
                    'qt_image_url': qt.qt_image_url,
                    'qt_diff_lv': qt.qt_diff_lv,
                    'group_id': qt.group_id.group_id if qt.group_id else None,
                    'shared_text': qt.group_id.shared_text if qt.group_id else None,
                    'shared_image_url': qt.group_id.shared_image_url if qt.group_id else None,
                    'choices': choices_data
                })
            return JsonResponse({'questions': data}, status=200)

        elif request.method == 'POST':
            try:
                body = json.loads(request.body)
                chap_id = body.get('chap_id')
                qt_detail = body.get('qt_detail')
                qt_image_url = body.get('qt_image_url')
                qt_diff_lv = body.get('qt_diff_lv')
                choices = body.get('choices', [])

                if not chap_id or not qt_detail or not qt_diff_lv:
                    return JsonResponse({'error': 'chap_id, qt_detail, and qt_diff_lv are required'}, status=400)

                chapter = Chapter.objects.filter(chap_id=chap_id, sj_id__teacher_id=teacher).first()
                if not chapter:
                    return JsonResponse({'error': 'Course not found or does not belong to you'}, status=404)
                
                # Check if this question is part of a scenario/group
                shared_text = body.get('shared_text')
                shared_image_url = body.get('shared_image_url')
                group_id = body.get('group_id')
                
                group = None
                if group_id:
                    group = QuestionGroup.objects.filter(group_id=group_id, teacher_id=teacher).first()
                elif shared_text or shared_image_url:
                    group = QuestionGroup(teacher_id=teacher, shared_text=shared_text, shared_image_url=shared_image_url)
                    group.save()

                # Generate a unique ID if not provided (the UI doesn't have an input for qt_id, so we should generate it)
                import uuid
                qt_id = body.get('qt_id') or str(uuid.uuid4())[:50]

                new_question = Question(
                    qt_id=qt_id,
                    chap_id=chapter,
                    qt_detail=qt_detail,
                    qt_image_url=qt_image_url,
                    qt_diff_lv=qt_diff_lv,
                    group_id=group
                )
                new_question.save()

                for choice in choices:
                    Choice.objects.create(
                        qt_id=new_question,
                        choice_detail=choice.get('choice_detail', ''),
                        choice_image_url=choice.get('choice_image_url', ''),
                        choice_correct=choice.get('choice_correct', False)
                    )

                return JsonResponse({'message': 'Question created successfully', 'qt_id': new_question.qt_id}, status=201)

            except json.JSONDecodeError:
                return JsonResponse({'error': 'Invalid JSON'}, status=400)

        else:
            return JsonResponse({'error': 'Method not allowed'}, status=405)

    except Exception as e:
        return JsonResponse({'error': f'Server Error: {str(e)}'}, status=500)


@csrf_exempt
def teacher_questions_bulk(request):
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

        if request.method == 'POST':
            try:
                body = json.loads(request.body)
                questions = body.get('questions', [])
                shared_group_data = body.get('shared_group', None)
                
                if not isinstance(questions, list):
                    return JsonResponse({'error': 'Questions must be an array'}, status=400)

                import uuid
                created_count = 0
                
                global_group = None
                if shared_group_data:
                    stext = shared_group_data.get('shared_text')
                    simg = shared_group_data.get('shared_image_url')
                    if stext or simg:
                        global_group = QuestionGroup(teacher_id=teacher, shared_text=stext, shared_image_url=simg)
                        global_group.save()
                
                for q_data in questions:
                    chap_id = q_data.get('chap_id')
                    qt_detail = q_data.get('qt_detail')
                    qt_diff_lv = q_data.get('qt_diff_lv')
                    choices = q_data.get('choices', [])

                    if not chap_id or not qt_detail or not qt_diff_lv:
                        continue

                    chapter = Chapter.objects.filter(chap_id=chap_id, sj_id__teacher_id=teacher).first()
                    if not chapter:
                        continue

                    # Group handling
                    group = global_group
                    if not group:
                        shared_text = q_data.get('shared_text')
                        shared_image_url = q_data.get('shared_image_url')
                        group_id = q_data.get('group_id')
                        
                        if group_id:
                            group = QuestionGroup.objects.filter(group_id=group_id, teacher_id=teacher).first()
                        elif shared_text or shared_image_url:
                            group = QuestionGroup(teacher_id=teacher, shared_text=shared_text, shared_image_url=shared_image_url)
                            group.save()

                    qt_id = str(uuid.uuid4())[:50]
                    new_question = Question(
                        qt_id=qt_id,
                        chap_id=chapter,
                        qt_detail=qt_detail,
                        qt_image_url=q_data.get('qt_image_url'),
                        qt_diff_lv=qt_diff_lv,
                        group_id=group
                    )
                    new_question.save()

                    for choice in choices:
                        Choice.objects.create(
                            qt_id=new_question,
                            choice_detail=choice.get('choice_detail', ''),
                            choice_image_url=choice.get('choice_image_url', ''),
                            choice_correct=choice.get('choice_correct', False)
                        )
                    created_count += 1

                return JsonResponse({'message': f'{created_count} questions created successfully'}, status=201)

            except json.JSONDecodeError:
                return JsonResponse({'error': 'Invalid JSON'}, status=400)
                
        else:
            return JsonResponse({'error': 'Method not allowed'}, status=405)

    except Exception as e:
        return JsonResponse({'error': f'Server Error: {str(e)}'}, status=500)

import os
from PIL import Image
try:
    import google.generativeai as genai
except ImportError:
    genai = None

@csrf_exempt
def ocr_image_to_latex(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Unauthorized'}, status=401)

    token = auth_header.split(' ')[1]
    try:
        decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        role = decoded.get('role')
        if role != 'Teacher':
            return JsonResponse({'error': 'Forbidden'}, status=403)
    except Exception:
        return JsonResponse({'error': 'Unauthorized'}, status=401)

    if 'image' not in request.FILES:
        return JsonResponse({'error': 'No image file provided'}, status=400)

    if not genai:
        return JsonResponse({'error': 'google-generativeai package is not installed on the server'}, status=500)

    image_file = request.FILES['image']
    mode = request.POST.get('mode', 'math')
    
    try:
        api_key = os.environ.get('GEMINI_API_KEY')
        if not api_key:
            return JsonResponse({'error': 'Gemini API key is not configured on the server. Please add GEMINI_API_KEY to your .env file.'}, status=500)
            
        genai.configure(api_key=api_key)
        
        model = genai.GenerativeModel('gemini-3.5-flash')
        img = Image.open(image_file)
        
        if mode == 'text':
            prompt = "Extract all text from this image exactly as it appears. Do not use LaTeX formatting. Only return the extracted text, with no markdown code blocks around the output."
        else:
            prompt = "Extract all mathematical equations and text from this image and return it formatted with LaTeX. Wrap block equations in $$ $$ and inline equations in $ $. Only return the extracted text and LaTeX, with no markdown code blocks around the entire output."
        
        response = model.generate_content([prompt, img])
        result_text = response.text.strip()
        
        if result_text.startswith('```') and result_text.endswith('```'):
            lines = result_text.split('\n')
            if len(lines) > 2:
                result_text = '\n'.join(lines[1:-1])
        
        return JsonResponse({'latex': result_text}, status=200)
    except Exception as e:
        return JsonResponse({'error': f'AI Processing Error: {str(e)}'}, status=500)


@csrf_exempt
def teacher_question_detail(request, qt_id):
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

        question = Question.objects.filter(qt_id=qt_id, chap_id__sj_id__teacher_id=teacher).first()
        if not question:
            return JsonResponse({'error': 'Question not found or does not belong to you'}, status=404)

        if request.method == 'DELETE':
            question.delete()
            return JsonResponse({'message': 'Question deleted successfully'}, status=200)

        elif request.method == 'PUT':
            try:
                body = json.loads(request.body)
                chap_id = body.get('chap_id')
                qt_detail = body.get('qt_detail')
                qt_image_url = body.get('qt_image_url')
                qt_diff_lv = body.get('qt_diff_lv')
                choices = body.get('choices', [])

                if not chap_id or not qt_detail or not qt_diff_lv:
                    return JsonResponse({'error': 'chap_id, qt_detail, and qt_diff_lv are required'}, status=400)

                chapter = Chapter.objects.filter(chap_id=chap_id, sj_id__teacher_id=teacher).first()
                if not chapter:
                    return JsonResponse({'error': 'Course not found or does not belong to you'}, status=404)

                question.chap_id = chapter
                question.qt_detail = qt_detail
                question.qt_image_url = qt_image_url
                question.qt_diff_lv = qt_diff_lv
                
                # Check if this question is part of a scenario/group
                shared_text = body.get('shared_text')
                shared_image_url = body.get('shared_image_url')
                group_id = body.get('group_id')
                
                group = None
                if group_id:
                    group = QuestionGroup.objects.filter(group_id=group_id, teacher_id=teacher).first()
                elif shared_text or shared_image_url:
                    # check if the current question's group matches
                    if question.group_id and question.group_id.shared_text == shared_text and question.group_id.shared_image_url == shared_image_url:
                        group = question.group_id
                    else:
                        group = QuestionGroup(teacher_id=teacher, shared_text=shared_text, shared_image_url=shared_image_url)
                        group.save()
                
                question.group_id = group
                question.save()

                Choice.objects.filter(qt_id=question).delete()
                for choice in choices:
                    Choice.objects.create(
                        qt_id=question,
                        choice_detail=choice.get('choice_detail', ''),
                        choice_image_url=choice.get('choice_image_url', ''),
                        choice_correct=choice.get('choice_correct', False)
                    )

                return JsonResponse({'message': 'Question updated successfully'}, status=200)

            except json.JSONDecodeError:
                return JsonResponse({'error': 'Invalid JSON'}, status=400)
        else:
            return JsonResponse({'error': 'Method not allowed'}, status=405)

    except Exception as e:
        return JsonResponse({'error': f'Server Error: {str(e)}'}, status=500)
