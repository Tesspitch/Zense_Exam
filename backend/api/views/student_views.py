import jwt
from django.conf import settings
from django.http import JsonResponse
from django.db.models import Avg, Count
from django.views.decorators.csrf import csrf_exempt
from ..models import Student, result_exam, Online_exam
# Enrollment model may exist; import safely
try:
    from ..models import Enrollment
except Exception:
    Enrollment = None


@csrf_exempt
def get_student_dashboard(request):
    if request.method == 'GET':
        try:
            # 1. รับและถอดรหัส Token
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return JsonResponse({'error': 'Unauthorized'}, status=401)
            
            token = auth_header.split(' ')[1]
            decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            std_id = int(decoded['user_id'])
            
            # 2. ค้นหาข้อมูลนักเรียน (เพื่อเอาชื่อ)
            student = Student.objects.filter(std_id=std_id).first()
            if not student:
                return JsonResponse({'error': 'ไม่พบข้อมูลนักเรียน'}, status=404)

            # 3. ดึงประวัติการสอบ
            # ⚠️ เปลี่ยนจาก 'online_exam' เป็น 'online_exam_id' เพราะคุณตั้งชื่อ ForeignKey ไว้แบบนี้
            results = result_exam.objects.select_related('online_exam_id').filter(std_id=std_id).order_by('-time_exam')

            # 4. คำนวณสถิติต่างๆ
            completed_exams_count = results.count()
            
            # หาค่าเฉลี่ยคะแนนสอบทั้งหมด
            avg_score_data = results.aggregate(Avg('result_score'))
            average_score = round(avg_score_data['result_score__avg'], 1) if avg_score_data['result_score__avg'] else 0

            # Determine enrolled courses based on Enrollment model (if present)
            if Enrollment:
                # Get list of subject primary keys the student enrolled in
                enrolled_subject_ids = list(Enrollment.objects.filter(student_id=std_id).values_list('subject_id__sj_id', flat=True).distinct())
                enrolled_courses_count = len(enrolled_subject_ids)

                if enrolled_courses_count == 0:
                    pending_exams_count = 0
                else:
                    # count active online exams within enrolled subjects
                    active_exams_qs = Online_exam.objects.filter(
                        online_exam_is_active=True,
                        exam_set_id__detail_exam_set__qt_id__chap_id__sj_id__sj_id__in=enrolled_subject_ids
                    ).distinct()
                    active_exams_count = active_exams_qs.count()

                    # count completed exams by student within these subjects
                    completed_in_enrolled_count = results.filter(
                        online_exam_id__exam_set_id__detail_exam_set__qt_id__chap_id__sj_id__sj_id__in=enrolled_subject_ids
                    ).distinct().count()

                    pending_exams_count = active_exams_count - completed_in_enrolled_count
                    if pending_exams_count < 0:
                        pending_exams_count = 0
            else:
                # fallback to counting all active exams
                total_active_exams = Online_exam.objects.filter(online_exam_is_active=True).count()
                enrolled_courses_count = total_active_exams
                pending_exams_count = total_active_exams - completed_exams_count
                if pending_exams_count < 0:
                    pending_exams_count = 0

            # 5. จัดเตรียมข้อมูลคะแนนรายวิชา (Recent Scores) เอาแค่ 3-5 รายการล่าสุด
            recent_scores = []
            for res in results[:5]: 
                recent_scores.append({
                    #เข้าถึงตารางแม่ด้วยชื่อ online_exam_id ตามด้วยฟิลด์เป้าหมาย
                    'exam_name': res.online_exam_id.online_exam_name,
                    'score': float(res.result_score), 
                    'date': res.time_exam.strftime("%Y-%m-%d"),
                })

            # ส่งข้อมูลทั้งหมดกลับไปให้ React
            return JsonResponse({
                'student_name': student.std_name,
                'stats': {
                    'enrolled_courses': enrolled_courses_count,
                    'completed_exams': completed_exams_count,
                    'pending_exams': pending_exams_count,
                    'average_score': average_score
                },
                'recent_scores': recent_scores
            }, status=200)

        except jwt.ExpiredSignatureError:
            return JsonResponse({'error': 'Session หมดอายุ'}, status=401)
        except Exception as e:
            return JsonResponse({'error': f'Server Error: {str(e)}'}, status=500)
            
    return JsonResponse({'error': 'Method not allowed'}, status=405)