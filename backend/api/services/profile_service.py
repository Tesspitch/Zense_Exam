from django.contrib.auth.hashers import check_password, make_password
from ..models import Student, Teacher # นำเข้า Model ทั้งสองฝั่ง


class ProfileService:
    @staticmethod
    def get_profile_data(user, role):
        # safe attribute access in case user is not a normal User instance
        first_name = getattr(user, 'first_name', '') or ''
        last_name = getattr(user, 'last_name', '') or ''
        email = getattr(user, 'email', '') or ''
        full_name = (f"{first_name} {last_name}").strip()

        data = {
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "role": role,
            "full_name": full_name or None
        }

        # ดูข้อมูลจากตารางขยาย (ใช้ฟิลด์ email เป็นตัวเชื่อม)
        if role == "Student":
            student_ext = Student.objects.filter(std_email=email).first()
            if student_ext:
                data["student_id"] = student_ext.std_id
                data["full_name"] = student_ext.std_name or data["full_name"]
                data["email"] = student_ext.std_email or data["email"]
            else:
                data["student_id"] = None
        elif role == "Teacher":
            teacher_ext = Teacher.objects.filter(t_email=email).first()
            if teacher_ext:
                data["teacher_id"] = teacher_ext.teacher_id
                data["full_name"] = teacher_ext.t_name or data["full_name"]
                data["email"] = teacher_ext.t_email or data["email"]
            else:
                data["teacher_id"] = None

        return data

    @staticmethod
    def get_profile_by_identity(user_id, role):
        """Return profile dict using Student/Teacher id from JWT payload."""
        try:
            # try to coerce numeric ids to int to match IntegerField PKs
            try:
                uid = int(user_id) if user_id is not None else user_id
            except Exception:
                uid = user_id

            if role == 'Student':
                student = Student.objects.filter(std_id=uid).first()
                if not student:
                    return None
                # split name to first/last
                parts = (student.std_name or '').split()
                first = parts[0] if parts else ''
                last = ' '.join(parts[1:]) if len(parts) > 1 else ''
                return {
                    'first_name': first,
                    'last_name': last,
                    'email': student.std_email,
                    'role': 'Student',
                    'full_name': student.std_name,
                    'student_id': student.std_id
                }
            elif role == 'Teacher':
                teacher = Teacher.objects.filter(teacher_id=uid).first()
                if not teacher:
                    return None
                parts = (teacher.t_name or '').split()
                first = parts[0] if parts else ''
                last = ' '.join(parts[1:]) if len(parts) > 1 else ''
                return {
                    'first_name': first,
                    'last_name': last,
                    'email': teacher.t_email,
                    'role': 'Teacher',
                    'full_name': teacher.t_name,
                    'teacher_id': teacher.teacher_id
                }
        except Exception:
            return None

    @staticmethod
    def update_profile_by_identity(user_id, role, data):
        """Update Student/Teacher record using id from JWT payload."""
        try:
            try:
                uid = int(user_id) if user_id is not None else user_id
            except Exception:
                uid = user_id

            if role == 'Student':
                student = Student.objects.filter(std_id=uid).first()
                if not student:
                    return False, 'Student not found'
                # combine first/last into std_name
                first = data.get('first_name', '')
                last = data.get('last_name', '')
                full = (first + ' ' + last).strip() if (first or last) else student.std_name
                student.std_name = full
                student.std_email = data.get('email', student.std_email)
                
                new_id = data.get('user_id')
                id_changed = False
                if new_id and str(new_id) != str(student.std_id):
                    if Student.objects.filter(std_id=new_id).exists():
                        return False, 'รหัสประจำตัวนี้มีอยู่ในระบบแล้ว'
                    # Use update() to change primary key without creating a new record
                    Student.objects.filter(std_id=student.std_id).update(
                        std_id=new_id,
                        std_name=student.std_name,
                        std_email=student.std_email
                    )
                    id_changed = True
                else:
                    student.save()
                    
                return True, {'message': 'อัปเดตข้อมูลสำเร็จ', 'new_id': new_id if id_changed else None}

            elif role == 'Teacher':
                teacher = Teacher.objects.filter(teacher_id=uid).first()
                if not teacher:
                    return False, 'Teacher not found'
                first = data.get('first_name', '')
                last = data.get('last_name', '')
                full = (first + ' ' + last).strip() if (first or last) else teacher.t_name
                teacher.t_name = full
                teacher.t_email = data.get('email', teacher.t_email)
                
                new_id = data.get('user_id')
                id_changed = False
                if new_id and str(new_id) != str(teacher.teacher_id):
                    if Teacher.objects.filter(teacher_id=new_id).exists():
                        return False, 'รหัสประจำตัวนี้มีอยู่ในระบบแล้ว'
                    Teacher.objects.filter(teacher_id=teacher.teacher_id).update(
                        teacher_id=new_id,
                        t_name=teacher.t_name,
                        t_email=teacher.t_email
                    )
                    id_changed = True
                else:
                    teacher.save()
                    
                return True, {'message': 'อัปเดตข้อมูลสำเร็จ', 'new_id': new_id if id_changed else None}

            return False, 'Invalid role'
        except Exception as e:
            return False, str(e)

    @staticmethod
    def update_core_profile(user, data):
        try:
            old_email = getattr(user, 'email', None)

            user.first_name = data.get('first_name', getattr(user, 'first_name', ''))
            user.last_name = data.get('last_name', getattr(user, 'last_name', ''))
            user.email = data.get('email', old_email)
            user.save()

            # หากมี record ขยายที่เชื่อมด้วย email ให้อัปเดตด้วย
            new_email = user.email
            if old_email:
                student_ext = Student.objects.filter(std_email=old_email).first()
                if student_ext:
                    student_ext.std_name = f"{user.first_name} {user.last_name}"
                    student_ext.std_email = new_email
                    student_ext.save()

                teacher_ext = Teacher.objects.filter(t_email=old_email).first()
                if teacher_ext:
                    teacher_ext.t_name = f"{user.first_name} {user.last_name}"
                    teacher_ext.t_email = new_email
                    teacher_ext.save()

            return True, "อัปเดตข้อมูลสำเร็จ"
        except Exception as e:
            return False, str(e)

    @staticmethod
    def change_password(user, old_pw, new_pw):
        """ระบบเปลี่ยนรหัสผ่านแบบรักษาความปลอดภัย"""
        if not check_password(old_pw, user.password):
            return False, "รหัสผ่านเดิมไม่ถูกต้อง"

        user.password = make_password(new_pw)
        user.save()
        return True, "เปลี่ยนรหัสผ่านสำเร็จ"

    @staticmethod
    def change_password_by_identity(user_id, role, old_pw, new_pw):
        try:
            try:
                uid = int(user_id) if user_id is not None else user_id
            except Exception:
                uid = user_id

            if role == 'Student':
                student = Student.objects.filter(std_id=uid).first()
                if not student:
                    return False, 'Student not found'
                if not check_password(old_pw, student.std_pass):
                    return False, 'รหัสผ่านเดิมไม่ถูกต้อง'
                student.std_pass = make_password(new_pw)
                student.save()
                return True, 'เปลี่ยนรหัสผ่านสำเร็จ'

            if role == 'Teacher':
                teacher = Teacher.objects.filter(teacher_id=uid).first()
                if not teacher:
                    return False, 'Teacher not found'
                if not check_password(old_pw, teacher.t_pass):
                    return False, 'รหัสผ่านเดิมไม่ถูกต้อง'
                teacher.t_pass = make_password(new_pw)
                teacher.save()
                return True, 'เปลี่ยนรหัสผ่านสำเร็จ'

            return False, 'Invalid role'
        except Exception as e:
            return False, str(e)