from .login_views import login_view
from .signup_views import signup_view
from .student_views import get_student_dashboard
from .join_exam_views import join_exam
from .profile_views import student_profile_api, teacher_profile_api
from .teacher_views import get_teacher_dashboard
from .subject_views import teacher_subjects, teacher_subject_detail
from .course_views import teacher_courses, teacher_course_detail
from .question_views import teacher_questions, teacher_questions_bulk, ocr_image_to_latex, teacher_question_detail
from .upload_views import upload_image
