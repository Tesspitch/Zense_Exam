from django.urls import path
from . import views
from .views import profile_views

urlpatterns = [
        path('login/', views.login_view, name='login'),
        path('signup/', views.signup_view, name='signup'),
        path('student/dashboard/', views.get_student_dashboard, name='student_dashboard'),
        path('teacher/dashboard/', views.get_teacher_dashboard, name='teacher_dashboard'),
        path('join_exam/', views.join_exam, name='join_exam'),
        # Backwards-compatible alias: some frontends may call this path
        path('student/join-exam/', views.join_exam, name='join_exam_student_alias'),
        
        path('student/profile/', profile_views.student_profile_api), 
        path('teacher/profile/', profile_views.teacher_profile_api),
    
    # Password (ใช้ร่วมกัน)
        path('profile/change-password/', profile_views.common_change_password),
    ]