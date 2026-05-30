from django.db import models

class Teacher(models.Model):
    teacher_id = models.CharField(max_length=11, primary_key=True) 
    t_name = models.CharField(max_length=100) 
    t_email = models.CharField(max_length=100) 
    t_pass = models.CharField(max_length=100) 
    role = models.CharField(max_length=20) 

    class Meta:
        db_table = 'teachers' 

class Student(models.Model):
    std_id = models.CharField(max_length=11, primary_key=True) 
    online_exam_id = models.CharField(max_length=50, null=True, blank=True) 
    std_name = models.CharField(max_length=100) 
    std_email = models.CharField(max_length=100) 
    std_pass = models.CharField(max_length=100) 
    role = models.CharField(max_length=20) 

    class Meta:
        db_table = 'student' 
        
class Subject(models.Model):
    sj_id = models.CharField(max_length=50, primary_key=True)
    teacher_id = models.ForeignKey(Teacher, on_delete=models.CASCADE, db_column='teacher_id')
    sj_name = models.CharField(max_length=100)
    sj_datetime = models.DateTimeField()
    sj_desc = models.CharField(max_length=200)
    
    class Meta:
        db_table = 'subject'
        

class Chapter(models.Model):
    chap_id = models.CharField(max_length=50, primary_key=True)
    sj_id = models.ForeignKey(Subject, on_delete=models.CASCADE, db_column='sj_id')
    chap_name = models.CharField(max_length=50)
    chap_datetime = models.DateTimeField()
    chap_desc = models.CharField(max_length=200)
    
    class Meta:
        db_table = 'chapter'
        
class Question(models.Model):
    qt_id = models.CharField(max_length=50, primary_key=True)
    chap_id = models.ForeignKey(Chapter, on_delete=models.CASCADE, db_column='chap_id')
    qt_detail = models.TextField()
    qt_diff_lv = models.CharField(max_length=10)
    
    class Meta:
        db_table = 'question'

class Choice(models.Model):
    choice_id = models.IntegerField(primary_key=True)
    qt_id = models.ForeignKey(Question, on_delete=models.CASCADE, db_column='qt_id')
    choice_detail = models.CharField(max_length=200)
    choice_correct = models.BooleanField()
    
    class Meta:
        db_table = 'choice'
        
class Exam_set(models.Model):
    exam_set_id = models.CharField(max_length=50, primary_key=True)
    teacher_id = models.ForeignKey(Teacher, on_delete=models.CASCADE, db_column='teacher_id')
    exam_set_header = models.TextField()
    exam_set_detail = models.TextField()
        
    class Meta:
        db_table = 'exam_set'
    
class detail_exam_set(models.Model):
    detail_exam_set_id = models.IntegerField(primary_key=True)
    exam_set_id = models.ForeignKey(Exam_set, on_delete=models.CASCADE, db_column='exam_set_id')
    qt_id = models.ForeignKey(Question, on_delete=models.CASCADE, db_column='qt_id')  
    qt_order = models.IntegerField(max_length=3)  # ลำดับของคำถามในชุดข้อสอบ
    
    class Meta:
        db_table = 'detail_exam_set'
        
class Online_exam(models.Model):
    online_exam_id = models.CharField(max_length=50, primary_key=True)
    exam_set_id = models.ForeignKey(Exam_set, on_delete=models.CASCADE, db_column='exam_set_id')
    teacher_id = models.ForeignKey(Teacher, on_delete=models.CASCADE, db_column='teacher_id')
    online_exam_name = models.CharField(max_length=150)
    online_exam_pass = models.CharField(max_length=20)
    online_exam_is_active = models.BooleanField(default=False)
    online_exam_create = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'online_exam'
        
class detail_online_exam(models.Model):
    detail_online_exam_id = models.IntegerField(primary_key=True)
    online_exam_id = models.ForeignKey(Online_exam, on_delete=models.CASCADE, db_column='online_exam_id')
    date_exam = models.DateField()
    time_start = models.DateTimeField()
    time_end = models.DateTimeField()
    online_exam_status = models.CharField(max_length=20)
    num_of_std = models.IntegerField()
    
    class Meta:
        db_table = 'detail_online_exam'
        
class result_exam(models.Model):
    result_exam_id = models.IntegerField(primary_key=True)
    online_exam_id = models.ForeignKey(Online_exam, on_delete=models.CASCADE, db_column='online_exam_id')  # ชื่อฟิลด์ในฐานข้อมูลจะเป็น online_exam_id
    std_id = models.ForeignKey(Student, on_delete=models.CASCADE, db_column='std_id')
    detail_exam_set_id = models.ForeignKey(detail_exam_set, on_delete=models.CASCADE, db_column='detail_exam_set_id')
    result_score = models.DecimalField(max_digits=5, decimal_places=2)
    time_exam = models.DateTimeField()
    status_exam = models.CharField(max_length=20)
    
    class Meta:
        db_table = 'result_exam'
        
class diff_index (models.Model):
    diff_index_id = models.IntegerField(primary_key=True)
    detail_exam_set_id = models.ForeignKey(detail_exam_set, on_delete=models.CASCADE, db_column='detail_exam_set_id')
    qt_id = models.ForeignKey(Question, on_delete=models.CASCADE, db_column='qt_id')
    diff_level = models.DecimalField(max_digits=3, decimal_places=2)
    
    class Meta:
        db_table = 'diff_index'
        
class std_answer(models.Model):
    ans_id = models.IntegerField(primary_key=True)
    result_exam_id = models.ForeignKey(result_exam, on_delete=models.CASCADE, db_column='result_exam_id')
    choice_id = models.ForeignKey(Choice, on_delete=models.CASCADE, db_column='choice_id')
    qt_id = models.ForeignKey(Question, on_delete=models.CASCADE)
    ans = models.IntegerField()
    
    class Meta:
        db_table = 'std_answer'