import random
from datetime import date, timedelta

# Assuming this script is in the same directory as app.py and models.py
from app import app, db
from models import Teacher, Student, Subject, Enrollment, Assignment, Grade, Attendance

# Senegalese Name Data
first_names_male = ["Babacar", "Cheikh", "Moussa", "Omar", "Alioune", "Ibrahima", "Mamadou", "Modou", "Abdoulaye", "Papa", "Djibril", "Malick"]
first_names_female = ["Fatou", "Aissatou", "Mariama", "Aminata", "Khady", "Ndeye", "Coumba", "Rama", "Adja", "Sophie", "Oumou", "Rokhaya"]
last_names = ["Diop", "Fall", "Gueye", "Ndiaye", "Cisse", "Samb", "Thiam", "Sow", "Faye", "Diallo", "Ba", "Kane", "Seck", "Touré"]

# Specified Teachers
teachers_data = [
    {"name": "Sokhar Samb", "email": "sokhar.samb@example.com"},
    {"name": "Mor Gueye", "email": "mor.gueye@example.com"},
    {"name": "Lamine Guindo", "email": "lamine.guindo@example.com"},
]

# Subject Names
subject_names_data = [
    "Database Design", "SQL Programming", "Web Development Fundamentals", 
    "JavaScript Frameworks", "Communication Skills", "Project Management", "Python Programming"
]

def get_random_name():
    if random.choice([True, False]):
        return f"{random.choice(first_names_male)} {random.choice(last_names)}"
    else:
        return f"{random.choice(first_names_female)} {random.choice(last_names)}"

def seed_data():
    with app.app_context():
        try:
            # Clear existing data in reverse order of dependency
            print("Clearing existing data...")
            Grade.query.delete()
            Attendance.query.delete()
            Assignment.query.delete()
            Enrollment.query.delete()
            Student.query.delete()
            Subject.query.delete()
            Teacher.query.delete()
            db.session.commit()
            print("Data cleared.")

            # Create Teachers
            print("Creating teachers...")
            created_teachers = {}
            for teacher_info in teachers_data:
                teacher = Teacher(name=teacher_info["name"], email=teacher_info["email"])
                db.session.add(teacher)
                created_teachers[teacher_info["name"]] = teacher
            db.session.commit()
            print(f"{len(created_teachers)} teachers created.")

            # Create Subjects
            print("Creating subjects...")
            created_subjects = {}
            for subject_name in subject_names_data:
                subject = Subject(name=subject_name, description=f"An introductory course on {subject_name}.")
                db.session.add(subject)
                created_subjects[subject_name] = subject
            db.session.commit()
            print(f"{len(created_subjects)} subjects created.")

            # Create Students
            print("Creating students...")
            created_students = []
            for i in range(15):
                name = get_random_name()
                email = f"{name.lower().replace(' ', '.')}.{random.randint(1,100)}@example.com"
                student = Student(name=name, email=email, other_details="N/A")
                db.session.add(student)
                created_students.append(student)
            db.session.commit()
            print(f"{len(created_students)} students created.")

            # Create Enrollments
            print("Creating enrollments...")
            created_enrollments = []
            sokhar = created_teachers["Sokhar Samb"]
            mor = created_teachers["Mor Gueye"]
            lamine = created_teachers["Lamine Guindo"]

            db_design = created_subjects["Database Design"]
            sql_prog = created_subjects["SQL Programming"]
            web_dev = created_subjects["Web Development Fundamentals"]
            js_frameworks = created_subjects["JavaScript Frameworks"]
            
            other_subjects_for_lamine = [
                created_subjects["Communication Skills"], 
                created_subjects["Project Management"],
                created_subjects["Python Programming"]
            ]


            for student in created_students:
                num_subjects_to_enroll = random.randint(2, 3)
                enrolled_subjects_for_student = []

                # Try to assign specific subjects to Sokhar and Mor for this student
                if random.random() < 0.6: # 60% chance to try Sokhar's subjects
                    if db_design not in enrolled_subjects_for_student:
                        enroll = Enrollment(student_id=student.student_id, subject_id=db_design.subject_id, teacher_id=sokhar.teacher_id)
                        db.session.add(enroll)
                        created_enrollments.append(enroll)
                        enrolled_subjects_for_student.append(db_design)
                    if len(enrolled_subjects_for_student) < num_subjects_to_enroll and sql_prog not in enrolled_subjects_for_student and random.random() < 0.5 :
                        enroll = Enrollment(student_id=student.student_id, subject_id=sql_prog.subject_id, teacher_id=sokhar.teacher_id)
                        db.session.add(enroll)
                        created_enrollments.append(enroll)
                        enrolled_subjects_for_student.append(sql_prog)
                
                if len(enrolled_subjects_for_student) < num_subjects_to_enroll and random.random() < 0.6: # 60% chance to try Mor's subjects
                     if web_dev not in enrolled_subjects_for_student:
                        enroll = Enrollment(student_id=student.student_id, subject_id=web_dev.subject_id, teacher_id=mor.teacher_id)
                        db.session.add(enroll)
                        created_enrollments.append(enroll)
                        enrolled_subjects_for_student.append(web_dev)
                     if len(enrolled_subjects_for_student) < num_subjects_to_enroll and js_frameworks not in enrolled_subjects_for_student and random.random() < 0.5:
                        enroll = Enrollment(student_id=student.student_id, subject_id=js_frameworks.subject_id, teacher_id=mor.teacher_id)
                        db.session.add(enroll)
                        created_enrollments.append(enroll)
                        enrolled_subjects_for_student.append(js_frameworks)

                # Fill remaining slots with Lamine's subjects
                available_for_lamine = [s for s in other_subjects_for_lamine if s not in enrolled_subjects_for_student]
                random.shuffle(available_for_lamine)
                
                while len(enrolled_subjects_for_student) < num_subjects_to_enroll and available_for_lamine:
                    subject_to_enroll = available_for_lamine.pop(0)
                    enroll = Enrollment(student_id=student.student_id, subject_id=subject_to_enroll.subject_id, teacher_id=lamine.teacher_id)
                    db.session.add(enroll)
                    created_enrollments.append(enroll)
                    enrolled_subjects_for_student.append(subject_to_enroll)
            db.session.commit()
            print(f"{len(created_enrollments)} enrollments created.")

            # Create Assignments
            print("Creating assignments...")
            created_assignments = []
            for subject in created_subjects.values():
                for i in range(random.randint(1, 2)):
                    assignment = Assignment(
                        subject_id=subject.subject_id,
                        title=f"{subject.name} - Assignment {i+1}",
                        max_marks=100.00,
                        due_date=date.today() + timedelta(days=random.randint(7, 30))
                    )
                    db.session.add(assignment)
                    created_assignments.append(assignment)
            db.session.commit()
            print(f"{len(created_assignments)} assignments created.")

            # Create Grades
            print("Creating grades...")
            if created_enrollments and created_assignments:
                for i in range(min(len(created_enrollments), len(created_assignments) * 2, 30)): # Create up to 30 grades
                    enrollment = random.choice(created_enrollments)
                    # Find assignments for the subject of this enrollment
                    assignments_for_subject = [a for a in created_assignments if a.subject_id == enrollment.subject_id]
                    if not assignments_for_subject:
                        continue
                    
                    assignment = random.choice(assignments_for_subject)
                    
                    # Check if grade already exists for this enrollment-assignment pair
                    existing_grade = Grade.query.filter_by(enrollment_id=enrollment.enrollment_id, assignment_id=assignment.assignment_id).first()
                    if not existing_grade:
                        grade = Grade(
                            enrollment_id=enrollment.enrollment_id,
                            assignment_id=assignment.assignment_id,
                            marks_obtained=random.uniform(60, 100)
                        )
                        db.session.add(grade)
            db.session.commit()
            print("Grades creation attempted.")


            # Create Attendance
            print("Creating attendance records...")
            if created_enrollments:
                for enrollment in random.sample(created_enrollments, min(len(created_enrollments), 10)): # For 10 random enrollments
                    for i in range(random.randint(5, 10)): # 5-10 random dates
                        attendance_date = date.today() - timedelta(days=random.randint(1, 30))
                        status_choices = ['present'] * 8 + ['absent', 'late'] # Higher chance of 'present'
                        status = random.choice(status_choices)
                        
                        # Check if attendance record already exists for this enrollment-date pair
                        existing_attendance = Attendance.query.filter_by(enrollment_id=enrollment.enrollment_id, date=attendance_date).first()
                        if not existing_attendance:
                            attendance_record = Attendance(
                                enrollment_id=enrollment.enrollment_id,
                                date=attendance_date,
                                status=status
                            )
                            db.session.add(attendance_record)
            db.session.commit()
            print("Attendance records creation attempted.")

            print("Database seeding completed successfully.")

        except Exception as e:
            db.session.rollback()
            print(f"An error occurred during seeding: {e}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    seed_data()
    print("Database seeding script finished.")
