from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Integer, String, Text, Date, Numeric, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

db = SQLAlchemy()

class Teacher(db.Model):
    __tablename__ = 'teachers'
    teacher_id = db.Column(Integer, primary_key=True, autoincrement=True)
    name = db.Column(String(255), nullable=False)
    email = db.Column(String(255), unique=True, nullable=False)
    
    enrollments = relationship('Enrollment', backref='teacher')

    def to_dict(self):
        return {
            'teacher_id': self.teacher_id,
            'name': self.name,
            'email': self.email
        }

class Student(db.Model):
    __tablename__ = 'students'
    student_id = db.Column(Integer, primary_key=True, autoincrement=True)
    name = db.Column(String(255), nullable=False)
    email = db.Column(String(255), unique=True, nullable=False)
    other_details = db.Column(Text, nullable=True)
    
    enrollments = relationship('Enrollment', backref='student')

    def to_dict(self):
        return {
            'student_id': self.student_id,
            'name': self.name,
            'email': self.email,
            'other_details': self.other_details
        }

class Subject(db.Model):
    __tablename__ = 'subjects'
    subject_id = db.Column(Integer, primary_key=True, autoincrement=True)
    name = db.Column(String(255), nullable=False, unique=True)
    description = db.Column(Text, nullable=True)
    
    enrollments = relationship('Enrollment', backref='subject')
    assignments = relationship('Assignment', backref='subject')

    def to_dict(self):
        return {
            'subject_id': self.subject_id,
            'name': self.name,
            'description': self.description
        }

class Enrollment(db.Model):
    __tablename__ = 'enrollments'
    enrollment_id = db.Column(Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(Integer, ForeignKey('students.student_id'), nullable=False)
    subject_id = db.Column(Integer, ForeignKey('subjects.subject_id'), nullable=False)
    teacher_id = db.Column(Integer, ForeignKey('teachers.teacher_id'), nullable=False)
    
    attendances = relationship('Attendance', backref='enrollment')
    grades = relationship('Grade', backref='enrollment')
    
    __table_args__ = (UniqueConstraint('student_id', 'subject_id', name='uq_student_subject_enrollment'),)

    def to_dict(self):
        return {
            'enrollment_id': self.enrollment_id,
            'student_id': self.student_id,
            'student_name': self.student.name if self.student else None,
            'subject_id': self.subject_id,
            'subject_name': self.subject.name if self.subject else None,
            'teacher_id': self.teacher_id,
            'teacher_name': self.teacher.name if self.teacher else None
        }

class Attendance(db.Model):
    __tablename__ = 'attendance'
    attendance_id = db.Column(Integer, primary_key=True, autoincrement=True)
    enrollment_id = db.Column(Integer, ForeignKey('enrollments.enrollment_id'), nullable=False)
    date = db.Column(Date, nullable=False)
    status = db.Column(String(10), nullable=False)  # ENUM('present', 'absent', 'late')
    
    __table_args__ = (UniqueConstraint('enrollment_id', 'date', name='uq_enrollment_date_attendance'),)

    def to_dict(self):
        return {
            'attendance_id': self.attendance_id,
            'enrollment_id': self.enrollment_id,
            'date': self.date.isoformat() if self.date else None,
            'status': self.status,
            'student_name': self.enrollment.student.name if self.enrollment and self.enrollment.student else None,
            'subject_name': self.enrollment.subject.name if self.enrollment and self.enrollment.subject else None
        }

class Assignment(db.Model):
    __tablename__ = 'assignments'
    assignment_id = db.Column(Integer, primary_key=True, autoincrement=True)
    subject_id = db.Column(Integer, ForeignKey('subjects.subject_id'), nullable=False)
    title = db.Column(String(255), nullable=False)
    max_marks = db.Column(Numeric(5,2), nullable=False, default=100.00)
    due_date = db.Column(Date, nullable=True)
    
    grades = relationship('Grade', backref='assignment')

    def to_dict(self):
        return {
            'assignment_id': self.assignment_id,
            'subject_id': self.subject_id,
            'subject_name': self.subject.name if self.subject else None,
            'title': self.title,
            'max_marks': float(self.max_marks) if self.max_marks is not None else None,
            'due_date': self.due_date.isoformat() if self.due_date else None
        }

class Grade(db.Model):
    __tablename__ = 'grades'
    grade_id = db.Column(Integer, primary_key=True, autoincrement=True)
    enrollment_id = db.Column(Integer, ForeignKey('enrollments.enrollment_id'), nullable=False)
    assignment_id = db.Column(Integer, ForeignKey('assignments.assignment_id'), nullable=False)
    marks_obtained = db.Column(Numeric(5,2), nullable=False)
    
    __table_args__ = (UniqueConstraint('enrollment_id', 'assignment_id', name='uq_enrollment_assignment_grade'),)

    def to_dict(self):
        return {
            'grade_id': self.grade_id,
            'enrollment_id': self.enrollment_id,
            'assignment_id': self.assignment_id,
            'assignment_title': self.assignment.title if self.assignment else None,
            'student_name': self.enrollment.student.name if self.enrollment and self.enrollment.student else None,
            'subject_name': self.enrollment.subject.name if self.enrollment and self.enrollment.subject else None,
            'marks_obtained': float(self.marks_obtained) if self.marks_obtained is not None else None
        }
