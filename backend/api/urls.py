from django.urls import path
from . import views
from .views import profile_views

urlpatterns = [
        path('login/', views.login_view, name='login'),
        path('signup/', views.signup_view, name='signup'),
        path('student/dashboard/', views.get_student_dashboard, name='student_dashboard'),
        path('teacher/dashboard/', views.get_teacher_dashboard, name='teacher_dashboard'),
        path('teacher/subjects/', views.teacher_subjects, name='teacher_subjects'),
        path('teacher/subjects/<str:sj_id>/', views.teacher_subject_detail, name='teacher_subject_detail'),
        path('teacher/courses/', views.teacher_courses, name='teacher_courses'),
        path('teacher/courses/<str:chap_id>/', views.teacher_course_detail, name='teacher_course_detail'),
        path('teacher/questions/', views.teacher_questions, name='teacher_questions'),
        path('teacher/questions/<str:qt_id>/', views.teacher_question_detail, name='teacher_question_detail'),
        path('teacher/questions/bulk/', views.teacher_questions_bulk, name='teacher_questions_bulk'),
        path('teacher/math-ocr/', views.ocr_image_to_latex, name='ocr_image_to_latex'),
        path('upload-image/', views.upload_image, name='upload_image'),
        path('join_exam/', views.join_exam, name='join_exam'),
        # Backwards-compatible alias: some frontends may call this path
        path('student/join-exam/', views.join_exam, name='join_exam_student_alias'),
        
        path('student/profile/', profile_views.student_profile_api), 
        path('teacher/profile/', profile_views.teacher_profile_api),
    
    # Password (ใช้ร่วมกัน)
        path('profile/change-password/', profile_views.common_change_password),
    ]