from ..models import Online_exam, result_exam

class JoinExamService:
    @staticmethod
    def can_student_join(student_id, exam_pass):
        # Normalize incoming passcode and match only by online_exam_pass (case-insensitive)
        code = str(exam_pass).strip()

        # ค้นหาจาก online_exam_pass เท่านั้น (ไม่สนตัวพิมพ์เล็ก/ใหญ่)
        exam = Online_exam.objects.filter(online_exam_pass__iexact=code).first()

        if not exam:
            return None, "ไม่พบรหัสผ่านการเข้าห้องสอบนี้ในระบบ"

        # 2. ตรวจสอบว่าข้อสอบเปิดให้ทำอยู่หรือไม่
        if not exam.online_exam_is_active:
            return None, "ข้อสอบวิชานี้ปิดการเข้าถึงแล้ว"

        # 3. ตรวจสอบว่านักเรียนเคยสอบวิชานี้ไปแล้วหรือยัง
        # ถ้ามี instance ของ exam แล้ว ใช้ instance เปรียบเทียบ เพื่อให้การค้นหาแม่นยำ
        already_taken = result_exam.objects.filter(
            std_id=student_id,
            online_exam_id=exam
        ).exists()
        
        if already_taken:
            return None, "คุณได้ส่งข้อสอบวิชานี้ไปแล้ว ไม่สามารถเข้าสอบซ้ำได้"

        # ถ้าผ่านทุกเงื่อนไข ส่งข้อมูลข้อสอบกลับไป
        return exam, None