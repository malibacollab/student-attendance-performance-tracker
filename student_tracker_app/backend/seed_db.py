import random
from datetime import date, timedelta

# Assuming this script is in the same directory as app.py and models.py
from app import app, db
from models import Teacher, Student, Subject, Enrollment, Assignment, Grade, Attendance

# --- Constants for Data Generation ---
NUM_STUDENTS = 20
# NUM_SUBJECTS is determined by the length of subject_data
MIN_ENROLLMENTS_PER_STUDENT = 3
MAX_ENROLLMENTS_PER_STUDENT = 5
ASSIGNMENTS_PER_SUBJECT = 3 # e.g., Assignment 1, Midterm, Final Project
NUM_ATTENDANCE_DAYS = 20 # Number of distinct school days to generate attendance for
GRADE_SUBMISSION_PERCENTAGE = 0.85 # 85% of assignments will have grades
# For attendance status
PRESENT_CHANCE = 0.85
ABSENT_CHANCE = 0.10
# LATE_CHANCE is 1 - (PRESENT_CHANCE + ABSENT_CHANCE)

# Optional: For reproducible random data
# random.seed(42) 

# --- Raw Data ---
# Senegalese Name Data
first_names_male = ["Babacar", "Cheikh", "Moussa", "Omar", "Alioune", "Ibrahima", "Mamadou", "Modou", "Abdoulaye", "Papa", "Djibril", "Malick"]
first_names_female = ["Fatou", "Aissatou", "Mariama", "Aminata", "Khady", "Ndeye", "Coumba", "Rama", "Adja", "Sophie", "Oumou", "Rokhaya"]
last_names = ["Diop", "Fall", "Gueye", "Ndiaye", "Cisse", "Samb", "Thiam", "Sow", "Faye", "Diallo", "Ba", "Kane", "Seck", "Touré"]

# Specified Teachers
teachers_data = [
    {"name": "Sokhar Samb", "email": "sokhar.samb@example.com", "specialization": "Database"},
    {"name": "Mor Gueye", "email": "mor.gueye@example.com", "specialization": "Web Dev"},
    {"name": "Lamine Guindo", "email": "lamine.guindo@example.com", "specialization": "General"},
]

# Subject Data with Specializations
# Ensure ~7 subjects
subject_data = [
    {"name": "Database Design", "description": "Fundamentals of database design and normalization.", "specialization": "Database"},
    {"name": "Advanced SQL", "description": "Advanced SQL queries and database programming.", "specialization": "Database"},
    {"name": "Web Development I", "description": "Introduction to HTML, CSS, and JavaScript.", "specialization": "Web Dev"},
    {"name": "Frontend Frameworks", "description": "Working with modern frontend frameworks like React or Vue.", "specialization": "Web Dev"},
    {"name": "Software Engineering Principles", "description": "Core principles of software development lifecycle.", "specialization": "General"},
    {"name": "Professional Communication", "description": "Effective communication skills for professionals.", "specialization": "General"},
    {"name": "Calculus I", "description": "Introductory calculus concepts.", "specialization": "General"},
]
NUM_SUBJECTS = len(subject_data)

assignment_titles_marks = [
    ("Assignment 1", 50),
    ("Midterm Exam", 100),
    ("Final Project", 150)
]
# Ensure ASSIGNMENTS_PER_SUBJECT matches the length of this list if using it directly
if ASSIGNMENTS_PER_SUBJECT != len(assignment_titles_marks):
    print(f"Warning: ASSIGNMENTS_PER_SUBJECT ({ASSIGNMENTS_PER_SUBJECT}) does not match predefined assignment titles ({len(assignment_titles_marks)}). Adjusting.")
    # Could simply use the length of assignment_titles_marks or truncate/extend based on preference.
    # For this revision, we'll use the predefined list length.
    _ASSIGNMENTS_PER_SUBJECT = len(assignment_titles_marks)
else:
    _ASSIGNMENTS_PER_SUBJECT = ASSIGNMENTS_PER_SUBJECT


def get_random_name():
    if random.choice([True, False]):
        return f"{random.choice(first_names_male)} {random.choice(last_names)}"
    else:
        return f"{random.choice(first_names_female)} {random.choice(last_names)}"

def seed_data():
    with app.app_context():
        try:
            # Clear existing data
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
            teacher_objects = []
            for teacher_info in teachers_data:
                teacher = Teacher(name=teacher_info["name"], email=teacher_info["email"])
                db.session.add(teacher)
                teacher_objects.append(teacher)
            db.session.commit() # Commit to get teacher IDs
            for i, teacher_obj in enumerate(teacher_objects):
                 created_teachers[teachers_data[i]["specialization"]] = teacher_obj # Store by specialization for easier lookup
            # Ensure all teachers are in a list for general assignment if needed
            all_teacher_list = list(created_teachers.values())
            print(f"{len(created_teachers)} teachers created.")


            # Create Subjects
            print("Creating subjects...")
            created_subjects_map = {} # name -> object
            for sub_info in subject_data:
                subject = Subject(name=sub_info["name"], description=sub_info["description"])
                db.session.add(subject)
                created_subjects_map[sub_info["name"]] = subject
            db.session.commit() # Commit to get subject IDs
            print(f"{len(created_subjects_map)} subjects created.")


            # Create Students
            print(f"Creating {NUM_STUDENTS} students...")
            created_student_objects = []
            for i in range(NUM_STUDENTS):
                name = get_random_name()
                email_name_part = name.lower().replace(' ', '.').replace('-', '.')
                email = f"{email_name_part}.{random.randint(1,1000)}@example.com"
                student = Student(name=name, email=email, other_details="N/A")
                db.session.add(student)
                created_student_objects.append(student)
            db.session.commit() # Commit to get student IDs
            print(f"{NUM_STUDENTS} students created.")


            # Create Enrollments
            print("Creating enrollments...")
            created_enrollment_objects = []
            all_subject_objects = list(created_subjects_map.values())

            for student in created_student_objects:
                num_enrollments = random.randint(MIN_ENROLLMENTS_PER_STUDENT, MAX_ENROLLMENTS_PER_STUDENT)
                # Ensure student gets a diverse set of subjects, including specialized ones if possible
                
                subjects_for_student = random.sample(all_subject_objects, k=min(num_enrollments, len(all_subject_objects)))
                
                for subject in subjects_for_student:
                    teacher = None
                    # Assign teacher based on specialization
                    subject_info = next((s for s in subject_data if s["name"] == subject.name), None)
                    if subject_info:
                        specialization = subject_info["specialization"]
                        if specialization in created_teachers:
                            teacher = created_teachers[specialization]
                        else: # Fallback to general or random if specialization mapping is complex
                            teacher = created_teachers.get("General", random.choice(all_teacher_list))
                    else: # Fallback if subject not in subject_data (should not happen)
                        teacher = random.choice(all_teacher_list)

                    enrollment = Enrollment(student_id=student.student_id, subject_id=subject.subject_id, teacher_id=teacher.teacher_id)
                    db.session.add(enrollment)
                    created_enrollment_objects.append(enrollment)
            db.session.commit()
            print(f"{len(created_enrollment_objects)} enrollments created.")


            # Create Assignments
            print("Creating assignments...")
            created_assignment_objects = []
            for subject in all_subject_objects:
                for i in range(_ASSIGNMENTS_PER_SUBJECT):
                    title, max_m = assignment_titles_marks[i]
                    assignment = Assignment(
                        subject_id=subject.subject_id,
                        title=f"{subject.name} - {title}",
                        max_marks=max_m,
                        due_date=date.today() + timedelta(days=random.randint(15, 60) * (i + 1)) # Spread out due dates
                    )
                    db.session.add(assignment)
                    created_assignment_objects.append(assignment)
            db.session.commit()
            print(f"{len(created_assignment_objects)} assignments created.")


            # Create Grades
            print("Creating grades...")
            num_grades_created = 0
            for enrollment in created_enrollment_objects:
                # Get assignments for the subject of this enrollment
                assignments_for_subject = [a for a in created_assignment_objects if a.subject_id == enrollment.subject_id]
                for assignment in assignments_for_subject:
                    if random.random() < GRADE_SUBMISSION_PERCENTAGE: # 85% chance to submit grade
                        # Generate plausible marks
                        if random.random() < 0.1: # 10% chance of a lower score
                            marks = round(random.uniform(0.3 * assignment.max_marks, 0.6 * assignment.max_marks), 2)
                        else: # 90% chance of a good score
                            marks = round(random.uniform(0.65 * assignment.max_marks, 0.98 * assignment.max_marks), 2)
                        
                        # Ensure marks do not exceed max_marks (shouldn't happen with logic above, but good check)
                        marks = min(marks, assignment.max_marks)

                        grade = Grade(
                            enrollment_id=enrollment.enrollment_id,
                            assignment_id=assignment.assignment_id,
                            marks_obtained=marks
                        )
                        db.session.add(grade)
                        num_grades_created += 1
            db.session.commit()
            print(f"{num_grades_created} grades created.")


            # Create Attendance
            print("Creating attendance records...")
            num_attendance_records = 0
            # Generate a list of distinct school days (e.g., weekdays in the past)
            school_days = []
            current_day = date.today()
            while len(school_days) < NUM_ATTENDANCE_DAYS * 2: # Generate more to pick from, ensuring variety
                current_day -= timedelta(days=1)
                if current_day.weekday() < 5: # Monday to Friday
                    school_days.append(current_day)
            
            # Ensure we have enough distinct days, if not, take what we have
            school_days_sample = random.sample(school_days, min(len(school_days), NUM_ATTENDANCE_DAYS))


            for enrollment in created_enrollment_objects:
                for day in school_days_sample: # Use the sampled distinct days
                    # Determine status based on chances
                    rand_val = random.random()
                    if rand_val < PRESENT_CHANCE:
                        status = 'present'
                    elif rand_val < PRESENT_CHANCE + ABSENT_CHANCE:
                        status = 'absent'
                    else:
                        status = 'late'
                    
                    attendance_record = Attendance(
                        enrollment_id=enrollment.enrollment_id,
                        date=day,
                        status=status
                    )
                    db.session.add(attendance_record)
                    num_attendance_records +=1
            db.session.commit()
            print(f"{num_attendance_records} attendance records created.")

            print("Database seeding completed successfully.")

        except Exception as e:
            db.session.rollback()
            print(f"An error occurred during seeding: {e}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    seed_data()
    print("Database seeding script finished.")
