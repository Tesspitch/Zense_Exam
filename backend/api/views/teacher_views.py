import jwt
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Avg, Sum
from ..models import Teacher, Subject, Exam_set, Question, Online_exam, detail_online_exam, result_exam


@csrf_exempt
def get_teacher_dashboard(request):
	if request.method != 'GET':
		return JsonResponse({'error': 'Method not allowed'}, status=405)

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

		totalsubject = Subject.objects.filter(teacher_id=teacher).count()
		totalcourse = Exam_set.objects.filter(teacher_id=teacher).count()
		total_questions = Question.objects.filter(chap_id__sj_id__teacher_id=teacher).count()
		active_exams = Online_exam.objects.filter(teacher_id=teacher, online_exam_is_active=True).count()

		# จำนวนผู้เรียนทั้งหมด (รวมจากตาราง detail_online_exam.num_of_std สำหรับข้อสอบของอาจารย์)
		students_sum = detail_online_exam.objects.filter(online_exam_id__teacher_id=teacher).aggregate(total=Sum('num_of_std'))
		students_enrolled = students_sum['total'] or 0

		# ค่าเฉลี่ยคะแนนรวมของข้อสอบทั้งหมดของอาจารย์
		avg_score_data = result_exam.objects.filter(online_exam_id__teacher_id=teacher).aggregate(Avg('result_score'))
		average_score = round(float(avg_score_data['result_score__avg']), 1) if avg_score_data['result_score__avg'] is not None else 0

		recent_exams_qs = Online_exam.objects.filter(teacher_id=teacher).order_by('-online_exam_create')[:5]
		recent_exams = []
		for ex in recent_exams_qs:
				detail = detail_online_exam.objects.filter(online_exam_id=ex).order_by('-date_exam').first()
				# จำนวนผู้เข้าสอบสำหรับชุดเวลาล่าสุด (ถ้ามี)
				students_count = detail.num_of_std if detail and detail.num_of_std is not None else result_exam.objects.filter(online_exam_id=ex).count()
				# ค่าเฉลี่ยคะแนนสำหรับข้อสอบนี้
				avg_exam_data = result_exam.objects.filter(online_exam_id=ex).aggregate(Avg('result_score'))
				avg_exam_score = round(float(avg_exam_data['result_score__avg']), 1) if avg_exam_data['result_score__avg'] is not None else 0
				recent_exams.append({
					'online_exam_id': ex.online_exam_id,
					'online_exam_name': ex.online_exam_name,
					'is_active': ex.online_exam_is_active,
					'created_at': ex.online_exam_create.strftime('%Y-%m-%d %H:%M:%S') if ex.online_exam_create else None,
					'next_date': detail.date_exam.strftime('%Y-%m-%d') if detail else None,
					'status': detail.online_exam_status if detail else None,
					'students': students_count,
					'avg_score': avg_exam_score,
				})

		return JsonResponse({
			'totalsubject': totalsubject,
			'totalcourse': totalcourse,
			'total_questions': total_questions,
			'active_exams': active_exams,
			'students_enrolled': students_enrolled,
			'avg_score': average_score,
			'recent_exams': recent_exams
		}, status=200)

	except Exception as e:
		return JsonResponse({'error': f'Server Error: {str(e)}'}, status=500)

