from django.urls import path
from api.views.auth import login_views, signup_views
from api.views.student import student_views, join_exam_views
from api.views.teacher import teacher_views, subject_views, course_views, question_views
from api.views.common import profile_views, upload_views

urlpatterns = [
        path('login/', login_views.login_view, name='login'),
        path('signup/', signup_views.signup_view, name='signup'),
        
        path('student/dashboard/', student_views.get_student_dashboard, name='student_dashboard'),
        path('join_exam/', join_exam_views.join_exam, name='join_exam'),
        path('student/join-exam/', join_exam_views.join_exam, name='join_exam_student_alias'),
        path('student/profile/', profile_views.student_profile_api), 
        
        path('teacher/dashboard/', teacher_views.get_teacher_dashboard, name='teacher_dashboard'),
        path('teacher/subjects/', subject_views.teacher_subjects, name='teacher_subjects'),
        path('teacher/subjects/<str:sj_id>/', subject_views.teacher_subject_detail, name='teacher_subject_detail'),
        path('teacher/courses/', course_views.teacher_courses, name='teacher_courses'),
        path('teacher/courses/<str:chap_id>/', course_views.teacher_course_detail, name='teacher_course_detail'),
        path('teacher/questions/', question_views.teacher_questions, name='teacher_questions'),
        path('teacher/questions/<str:qt_id>/', question_views.teacher_question_detail, name='teacher_question_detail'),
        path('teacher/questions/bulk/', question_views.teacher_questions_bulk, name='teacher_questions_bulk'),
        path('teacher/math-ocr/', question_views.ocr_image_to_latex, name='ocr_image_to_latex'),
        path('teacher/profile/', profile_views.teacher_profile_api),
        
        path('upload-image/', upload_views.upload_image, name='upload_image'),
        # Password (ใช้ร่วมกัน)
        path('profile/change-password/', profile_views.common_change_password),
]