import os # Added
from flask import Flask, request, jsonify
from .models import db, Student, Subject, Teacher, Enrollment, Attendance, Assignment, Grade # Assuming models.py is in the same directory
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, case # Added for reporting
from datetime import datetime
from decimal import Decimal

app = Flask(__name__)

# Database Configuration using Environment Variables
DB_HOST = os.environ.get('MYSQL_HOST', 'localhost')
DB_USER = os.environ.get('MYSQL_USER', 'root') 
DB_PASSWORD = os.environ.get('MYSQL_PASSWORD', '') # Default to empty password for local root
DB_NAME = os.environ.get('MYSQL_DATABASE', 'student_tracker')

app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False # silence the deprecation warning

db.init_app(app)

@app.route('/')
def hello():
    return "Hello from Student Tracker Backend!"

# Student API Endpoints
@app.route('/students', methods=['POST'])
def create_student():
    data = request.get_json()
    if not data or not data.get('name') or not data.get('email'):
        return jsonify({'message': 'Missing name or email'}), 400
    
    try:
        new_student = Student(name=data['name'], email=data['email'], other_details=data.get('other_details'))
        db.session.add(new_student)
        db.session.commit()
        return jsonify(new_student.to_dict()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'message': 'Email already exists'}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@app.route('/students', methods=['GET'])
def get_students():
    students = Student.query.all()
    return jsonify([student.to_dict() for student in students]), 200

@app.route('/students/<int:student_id>', methods=['GET'])
def get_student(student_id):
    student = Student.query.get_or_404(student_id)
    return jsonify(student.to_dict()), 200

@app.route('/students/<int:student_id>', methods=['PUT'])
def update_student(student_id):
    student = Student.query.get_or_404(student_id)
    data = request.get_json()
    
    if not data:
        return jsonify({'message': 'No input data provided'}), 400

    try:
        if 'name' in data:
            student.name = data['name']
        if 'email' in data:
            student.email = data['email']
        if 'other_details' in data:
            student.other_details = data['other_details']
            
        db.session.commit()
        return jsonify(student.to_dict()), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({'message': 'Email already exists'}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@app.route('/students/<int:student_id>', methods=['DELETE'])
def delete_student(student_id):
    student = Student.query.get_or_404(student_id)
    try:
        db.session.delete(student)
        db.session.commit()
        return jsonify({'message': 'Student deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

# Subject API Endpoints
@app.route('/subjects', methods=['POST'])
def create_subject():
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'message': 'Missing name'}), 400
    
    try:
        new_subject = Subject(name=data['name'], description=data.get('description'))
        db.session.add(new_subject)
        db.session.commit()
        return jsonify(new_subject.to_dict()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'message': 'Subject name already exists'}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@app.route('/subjects', methods=['GET'])
def get_subjects():
    subjects = Subject.query.all()
    return jsonify([subject.to_dict() for subject in subjects]), 200

@app.route('/subjects/<int:subject_id>', methods=['GET'])
def get_subject(subject_id):
    subject = Subject.query.get_or_404(subject_id)
    return jsonify(subject.to_dict()), 200

@app.route('/subjects/<int:subject_id>', methods=['PUT'])
def update_subject(subject_id):
    subject = Subject.query.get_or_404(subject_id)
    data = request.get_json()

    if not data:
        return jsonify({'message': 'No input data provided'}), 400

    try:
        if 'name' in data:
            subject.name = data['name']
        if 'description' in data:
            subject.description = data['description']
            
        db.session.commit()
        return jsonify(subject.to_dict()), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({'message': 'Subject name already exists'}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@app.route('/subjects/<int:subject_id>', methods=['DELETE'])
def delete_subject(subject_id):
    subject = Subject.query.get_or_404(subject_id)
    try:
        db.session.delete(subject)
        db.session.commit()
        return jsonify({'message': 'Subject deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

# Teacher API Endpoints
@app.route('/teachers', methods=['POST'])
def create_teacher():
    data = request.get_json()
    if not data or not data.get('name') or not data.get('email'):
        return jsonify({'message': 'Missing name or email'}), 400
    
    try:
        new_teacher = Teacher(name=data['name'], email=data['email'])
        db.session.add(new_teacher)
        db.session.commit()
        return jsonify(new_teacher.to_dict()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'message': 'Email already exists'}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@app.route('/teachers', methods=['GET'])
def get_teachers():
    teachers = Teacher.query.all()
    return jsonify([teacher.to_dict() for teacher in teachers]), 200

@app.route('/teachers/<int:teacher_id>', methods=['GET'])
def get_teacher(teacher_id):
    teacher = Teacher.query.get_or_404(teacher_id)
    return jsonify(teacher.to_dict()), 200

@app.route('/teachers/<int:teacher_id>', methods=['PUT'])
def update_teacher(teacher_id):
    teacher = Teacher.query.get_or_404(teacher_id)
    data = request.get_json()

    if not data:
        return jsonify({'message': 'No input data provided'}), 400

    try:
        if 'name' in data:
            teacher.name = data['name']
        if 'email' in data:
            teacher.email = data['email']
            
        db.session.commit()
        return jsonify(teacher.to_dict()), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({'message': 'Email already exists'}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@app.route('/teachers/<int:teacher_id>', methods=['DELETE'])
def delete_teacher(teacher_id):
    teacher = Teacher.query.get_or_404(teacher_id)
    try:
        db.session.delete(teacher)
        db.session.commit()
        return jsonify({'message': 'Teacher deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

# Enrollment API Endpoints
@app.route('/enrollments', methods=['POST'])
def create_enrollment():
    data = request.get_json()
    if not data or not data.get('student_id') or not data.get('subject_id') or not data.get('teacher_id'):
        return jsonify({'message': 'Missing student_id, subject_id, or teacher_id'}), 400

    student = Student.query.get(data['student_id'])
    if not student:
        return jsonify({'message': 'Student not found'}), 404
    
    subject = Subject.query.get(data['subject_id'])
    if not subject:
        return jsonify({'message': 'Subject not found'}), 404
        
    teacher = Teacher.query.get(data['teacher_id'])
    if not teacher:
        return jsonify({'message': 'Teacher not found'}), 404

    try:
        new_enrollment = Enrollment(
            student_id=data['student_id'],
            subject_id=data['subject_id'],
            teacher_id=data['teacher_id']
        )
        db.session.add(new_enrollment)
        db.session.commit()
        return jsonify(new_enrollment.to_dict()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'message': 'Student already enrolled in this subject or integrity constraint violated'}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@app.route('/students/<int:student_id>/enrollments', methods=['GET'])
def get_student_enrollments(student_id):
    student = Student.query.get_or_404(student_id)
    enrollments = Enrollment.query.filter_by(student_id=student.student_id).all()
    return jsonify([enrollment.to_dict() for enrollment in enrollments]), 200

@app.route('/subjects/<int:subject_id>/enrollments', methods=['GET'])
def get_subject_enrollments(subject_id):
    subject = Subject.query.get_or_404(subject_id)
    enrollments = Enrollment.query.filter_by(subject_id=subject.subject_id).all()
    return jsonify([enrollment.to_dict() for enrollment in enrollments]), 200

@app.route('/enrollments/<int:enrollment_id>', methods=['DELETE'])
def delete_enrollment(enrollment_id):
    enrollment = Enrollment.query.get_or_404(enrollment_id)
    try:
        db.session.delete(enrollment)
        db.session.commit()
        return jsonify({'message': 'Enrollment deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

# Attendance API Endpoints
@app.route('/attendance', methods=['POST'])
def record_attendance():
    data = request.get_json()
    if not data or not data.get('enrollment_id') or not data.get('date') or not data.get('status'):
        return jsonify({'message': 'Missing enrollment_id, date, or status'}), 400

    enrollment_id = data.get('enrollment_id')
    date_str = data.get('date')
    status = data.get('status')

    enrollment = Enrollment.query.get(enrollment_id)
    if not enrollment:
        return jsonify({'message': 'Enrollment not found'}), 404

    if status not in ['present', 'absent', 'late']:
        return jsonify({'message': "Invalid status. Must be 'present', 'absent', or 'late'"}), 400

    try:
        attendance_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'message': 'Invalid date format. Use YYYY-MM-DD'}), 400

    try:
        new_attendance = Attendance(
            enrollment_id=enrollment_id,
            date=attendance_date,
            status=status
        )
        db.session.add(new_attendance)
        db.session.commit()
        return jsonify(new_attendance.to_dict()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'message': 'Attendance record for this enrollment and date already exists'}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@app.route('/enrollments/<int:enrollment_id>/attendance', methods=['GET'])
def get_enrollment_attendance(enrollment_id):
    enrollment = Enrollment.query.get_or_404(enrollment_id)
    
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    
    query = Attendance.query.filter_by(enrollment_id=enrollment.enrollment_id)
    
    try:
        if start_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            query = query.filter(Attendance.date >= start_date)
        if end_date_str:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            query = query.filter(Attendance.date <= end_date)
    except ValueError:
        return jsonify({'message': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
    attendances = query.order_by(Attendance.date.desc()).all()
    return jsonify([attendance.to_dict() for attendance in attendances]), 200

@app.route('/attendance/<int:attendance_id>', methods=['PUT'])
def update_attendance(attendance_id):
    attendance = Attendance.query.get_or_404(attendance_id)
    data = request.get_json()

    if not data:
        return jsonify({'message': 'No input data provided'}), 400

    try:
        if 'date' in data:
            try:
                attendance.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'message': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        if 'status' in data:
            if data['status'] not in ['present', 'absent', 'late']:
                return jsonify({'message': "Invalid status. Must be 'present', 'absent', or 'late'"}), 400
            attendance.status = data['status']
            
        db.session.commit()
        return jsonify(attendance.to_dict()), 200
    except IntegrityError:
        db.session.rollback()
        # This assumes the unique constraint is on (enrollment_id, date)
        return jsonify({'message': 'Attendance record for this enrollment and date already exists'}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@app.route('/attendance/<int:attendance_id>', methods=['DELETE'])
def delete_attendance(attendance_id):
    attendance = Attendance.query.get_or_404(attendance_id)
    try:
        db.session.delete(attendance)
        db.session.commit()
        return jsonify({'message': 'Attendance record deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

# Assignment API Endpoints
@app.route('/subjects/<int:subject_id>/assignments', methods=['POST'])
def create_assignment_for_subject(subject_id):
    subject = Subject.query.get_or_404(subject_id)
    data = request.get_json()

    if not data or not data.get('title'):
        return jsonify({'message': 'Missing title'}), 400

    title = data.get('title')
    max_marks_str = data.get('max_marks', '100.00') # Default to 100.00
    due_date_str = data.get('due_date')

    try:
        max_marks = Decimal(max_marks_str)
        if max_marks < 0:
             return jsonify({'message': 'max_marks cannot be negative'}), 400
    except Exception: # Catches invalid decimal format
        return jsonify({'message': 'Invalid max_marks format'}), 400

    due_date = None
    if due_date_str:
        try:
            due_date = datetime.strptime(due_date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'message': 'Invalid due_date format. Use YYYY-MM-DD'}), 400

    try:
        new_assignment = Assignment(
            subject_id=subject.subject_id,
            title=title,
            max_marks=max_marks,
            due_date=due_date
        )
        db.session.add(new_assignment)
        db.session.commit()
        return jsonify(new_assignment.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@app.route('/subjects/<int:subject_id>/assignments', methods=['GET'])
def get_subject_assignments(subject_id):
    subject = Subject.query.get_or_404(subject_id)
    assignments = Assignment.query.filter_by(subject_id=subject.subject_id).all()
    return jsonify([assignment.to_dict() for assignment in assignments]), 200

@app.route('/assignments/<int:assignment_id>', methods=['GET'])
def get_assignment(assignment_id):
    assignment = Assignment.query.get_or_404(assignment_id)
    return jsonify(assignment.to_dict()), 200

@app.route('/assignments/<int:assignment_id>', methods=['PUT'])
def update_assignment(assignment_id):
    assignment = Assignment.query.get_or_404(assignment_id)
    data = request.get_json()

    if not data:
        return jsonify({'message': 'No input data provided'}), 400

    try:
        if 'title' in data:
            assignment.title = data['title']
        
        if 'max_marks' in data:
            try:
                max_marks = Decimal(data['max_marks'])
                if max_marks < 0:
                    return jsonify({'message': 'max_marks cannot be negative'}), 400
                assignment.max_marks = max_marks
            except Exception:
                 return jsonify({'message': 'Invalid max_marks format'}), 400

        if 'due_date' in data and data['due_date'] is not None:
            try:
                assignment.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'message': 'Invalid due_date format. Use YYYY-MM-DD'}), 400
        elif 'due_date' in data and data['due_date'] is None:
            assignment.due_date = None
            
        db.session.commit()
        return jsonify(assignment.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@app.route('/assignments/<int:assignment_id>', methods=['DELETE'])
def delete_assignment(assignment_id):
    assignment = Assignment.query.get_or_404(assignment_id)
    try:
        # Consider implications: For now, simple delete.
        # Check if there are any grades associated with this assignment
        if Grade.query.filter_by(assignment_id=assignment_id).first():
            return jsonify({'message': 'Cannot delete assignment with existing grades. Please delete grades first.'}), 400
        
        db.session.delete(assignment)
        db.session.commit()
        return jsonify({'message': 'Assignment deleted successfully'}), 200 # Or 204 No Content
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

# Grade API Endpoints
@app.route('/grades', methods=['POST'])
def create_grade():
    data = request.get_json()
    if not data or not data.get('enrollment_id') or not data.get('assignment_id') or data.get('marks_obtained') is None:
        return jsonify({'message': 'Missing enrollment_id, assignment_id, or marks_obtained'}), 400

    enrollment_id = data.get('enrollment_id')
    assignment_id = data.get('assignment_id')
    marks_obtained_str = str(data.get('marks_obtained')) # Ensure it's a string for Decimal conversion

    enrollment = Enrollment.query.get(enrollment_id)
    if not enrollment:
        return jsonify({'message': 'Enrollment not found'}), 404
    
    assignment = Assignment.query.get(assignment_id)
    if not assignment:
        return jsonify({'message': 'Assignment not found'}), 404

    try:
        marks_obtained = Decimal(marks_obtained_str)
    except Exception:
        return jsonify({'message': 'Invalid marks_obtained format'}), 400

    if marks_obtained < 0:
        return jsonify({'message': 'marks_obtained cannot be negative'}), 400
    
    if assignment.max_marks is not None and marks_obtained > assignment.max_marks:
        return jsonify({'message': f'marks_obtained cannot exceed assignment max_marks ({assignment.max_marks})'}), 400

    try:
        new_grade = Grade(
            enrollment_id=enrollment_id,
            assignment_id=assignment_id,
            marks_obtained=marks_obtained
        )
        db.session.add(new_grade)
        db.session.commit()
        return jsonify(new_grade.to_dict()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'message': 'Grade for this student and assignment already exists'}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@app.route('/enrollments/<int:enrollment_id>/grades', methods=['GET'])
def get_enrollment_grades(enrollment_id):
    enrollment = Enrollment.query.get_or_404(enrollment_id)
    
    assignment_id_filter = request.args.get('assignment_id')
    
    query = Grade.query.filter_by(enrollment_id=enrollment.enrollment_id)
    
    if assignment_id_filter:
        try:
            assignment_id_filter = int(assignment_id_filter)
            # Optional: Check if assignment_id_filter corresponds to a valid assignment
            # assignment = Assignment.query.get_or_404(assignment_id_filter)
            query = query.filter_by(assignment_id=assignment_id_filter)
        except ValueError:
            return jsonify({'message': 'Invalid assignment_id format in query parameter.'}), 400
            
    grades = query.all()
    return jsonify([grade.to_dict() for grade in grades]), 200

@app.route('/assignments/<int:assignment_id>/grades', methods=['GET'])
def get_assignment_grades(assignment_id):
    assignment = Assignment.query.get_or_404(assignment_id)
    grades = Grade.query.filter_by(assignment_id=assignment.assignment_id).all()
    return jsonify([grade.to_dict() for grade in grades]), 200

@app.route('/grades/<int:grade_id>', methods=['GET'])
def get_grade(grade_id):
    grade = Grade.query.get_or_404(grade_id)
    return jsonify(grade.to_dict()), 200

@app.route('/grades/<int:grade_id>', methods=['PUT'])
def update_grade(grade_id):
    grade = Grade.query.get_or_404(grade_id)
    data = request.get_json()

    if not data or data.get('marks_obtained') is None:
        return jsonify({'message': 'Missing marks_obtained'}), 400

    marks_obtained_str = str(data.get('marks_obtained'))

    try:
        marks_obtained = Decimal(marks_obtained_str)
    except Exception:
        return jsonify({'message': 'Invalid marks_obtained format'}), 400

    if marks_obtained < 0:
        return jsonify({'message': 'marks_obtained cannot be negative'}), 400
    
    # Accessing assignment through grade.enrollment.subject can be indirect. 
    # It's better to access assignment directly from the grade.
    if grade.assignment and grade.assignment.max_marks is not None and marks_obtained > grade.assignment.max_marks:
        return jsonify({'message': f'marks_obtained cannot exceed assignment max_marks ({grade.assignment.max_marks})'}), 400
    
    try:
        grade.marks_obtained = marks_obtained
        db.session.commit()
        return jsonify(grade.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@app.route('/grades/<int:grade_id>', methods=['DELETE'])
def delete_grade(grade_id):
    grade = Grade.query.get_or_404(grade_id)
    try:
        db.session.delete(grade)
        db.session.commit()
        return jsonify({'message': 'Grade deleted successfully'}), 200 # Or 204 No Content
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

# Reporting API Endpoints
@app.route('/reports/subjects/<int:subject_id>/average_grade', methods=['GET'])
def get_subject_average_grade(subject_id):
    subject = Subject.query.get_or_404(subject_id)

    average_grade_query = db.session.query(func.avg(Grade.marks_obtained)).join(Enrollment).filter(Enrollment.subject_id == subject_id)
    average_grade = average_grade_query.scalar()

    if average_grade is None:
        return jsonify({"message": f"No grades found for subject: {subject.name}"}), 200 # Or 404 if preferred

    return jsonify({
        "subject_id": subject_id,
        "subject_name": subject.name,
        "average_grade": float(average_grade) if average_grade is not None else None
    }), 200

@app.route('/reports/students/<int:student_id>/average_grade', methods=['GET'])
def get_student_average_grade(student_id):
    student = Student.query.get_or_404(student_id)

    # Query all enrollments for the student, then gather all grades for these enrollments.
    # Calculate the overall average grade.
    average_grade_query = db.session.query(func.avg(Grade.marks_obtained))\
                                    .join(Enrollment)\
                                    .filter(Enrollment.student_id == student_id)
    
    overall_average_grade = average_grade_query.scalar()

    if overall_average_grade is None:
        return jsonify({"message": f"No grades found for student: {student.name}"}), 200 # Or 404

    return jsonify({
        "student_id": student_id,
        "student_name": student.name,
        "overall_average_grade": float(overall_average_grade) if overall_average_grade is not None else None
    }), 200

@app.route('/reports/subjects/<int:subject_id>/low_attendance', methods=['GET'])
def get_subject_low_attendance(subject_id):
    subject = Subject.query.get_or_404(subject_id)
    
    threshold_str = request.args.get('threshold')
    if not threshold_str:
        return jsonify({"message": "Missing threshold query parameter"}), 400
    
    try:
        threshold = float(threshold_str)
        if not (0 <= threshold <= 1):
            raise ValueError("Threshold must be between 0 and 1.")
    except ValueError as e:
        return jsonify({"message": str(e)}), 400

    enrollments = Enrollment.query.filter_by(subject_id=subject.subject_id).all()
    
    low_attendance_students = []

    for enr in enrollments:
        # More efficient way to count total and present days for a specific enrollment
        total_days_query = db.session.query(func.count(Attendance.attendance_id))\
                                   .filter(Attendance.enrollment_id == enr.enrollment_id)
        total_days = total_days_query.scalar()

        if total_days == 0: # Avoid division by zero and skip if no attendance recorded
            continue

        present_days_query = db.session.query(func.count(Attendance.attendance_id))\
                                     .filter(Attendance.enrollment_id == enr.enrollment_id, Attendance.status == 'present')
        present_days = present_days_query.scalar()
        
        attendance_rate = present_days / total_days
        
        if attendance_rate < threshold:
            student = Student.query.get(enr.student_id) # Assuming student relationship is set up
            if student:
                low_attendance_students.append({
                    "student_id": student.student_id,
                    "student_name": student.name,
                    "attendance_rate": round(attendance_rate, 4), # Round for cleaner output
                    "present_days": present_days,
                    "total_days": total_days
                })

    return jsonify({
        "subject_id": subject.subject_id,
        "subject_name": subject.name,
        "threshold": threshold,
        "low_attendance_students": low_attendance_students
    }), 200

if __name__ == '__main__':
    app.run(debug=True)
