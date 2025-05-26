document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api'; 

    const enrollmentSelect = document.getElementById('enrollmentSelectGrades');
    const assignmentSelectorContainer = document.getElementById('assignmentSelectorContainer');
    const assignmentSelect = document.getElementById('assignmentSelectGrades');
    const gradeInputFormContainer = document.getElementById('gradeInputFormContainer');
    const gradeInputForm = document.getElementById('gradeInputForm');
    const currentEnrollmentIdGradesInput = document.getElementById('currentEnrollmentIdGrades');
    const currentAssignmentIdGradesInput = document.getElementById('currentAssignmentIdGrades');
    const marksObtainedInput = document.getElementById('marksObtained');
    const maxMarksDisplay = document.getElementById('maxMarksDisplay');
    const currentGradeDisplay = document.getElementById('currentGradeDisplay');
    const alertPlaceholder = document.getElementById('alertPlaceholder');
    const selectedStudentDisplay = document.getElementById('selectedStudentDisplay');
    const selectedSubjectDisplay = document.getElementById('selectedSubjectDisplay');
    const selectedAssignmentDisplay = document.getElementById('selectedAssignmentDisplay');


    let selectedEnrollment = null;
    let selectedAssignment = null;
    let allEnrollmentsData = []; // To store full enrollment objects
    let allAssignmentsForSubject = [];

    // Function to display alerts
    function showAlert(message, type = 'success') {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = [
            `<div class="alert alert-${type} alert-dismissible" role="alert">`,
            `   <div>${message}</div>`,
            '   <button type="button" class="close" data-dismiss="alert" aria-label="Close">',
            '       <span aria-hidden="true">&times;</span>',
            '   </button>',
            '</div>'
        ].join('');
        alertPlaceholder.innerHTML = ''; // Clear previous alerts
        alertPlaceholder.append(wrapper);

        setTimeout(() => {
            if (wrapper.firstChild) {
                $(wrapper.firstChild).alert('close');
            }
        }, 5000);
    }

    // Populate Enrollment Dropdown
    async function populateEnrollmentDropdownGrades() {
        try {
            const response = await fetch(`${API_URL}/enrollments`);
            if (!response.ok) throw new Error('Failed to load enrollments');
            allEnrollmentsData = await response.json();
            
            enrollmentSelect.innerHTML = '<option value="">Select Enrollment...</option>';
            if (allEnrollmentsData.length === 0) {
                enrollmentSelect.innerHTML = '<option value="">No enrollments available</option>';
                return;
            }
            allEnrollmentsData.forEach(enr => {
                const option = document.createElement('option');
                option.value = enr.enrollment_id;
                // Store subject_id and names directly on the option element's dataset for easy access
                option.dataset.subjectId = enr.subject_id;
                option.dataset.studentName = enr.student_name;
                option.dataset.subjectName = enr.subject_name;
                option.textContent = `${enr.student_name} - ${enr.subject_name}`;
                enrollmentSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error populating enrollment dropdown:', error);
            showAlert(`Error populating enrollments: ${error.message}`, 'danger');
            enrollmentSelect.innerHTML = '<option value="">Error loading enrollments</option>';
        }
    }

    // Handle Enrollment Selection
    enrollmentSelect.addEventListener('change', async () => {
        const selectedOption = enrollmentSelect.options[enrollmentSelect.selectedIndex];
        const enrollmentId = selectedOption.value;

        gradeInputFormContainer.style.display = 'none'; // Hide form whenever enrollment changes
        assignmentSelect.innerHTML = '<option value="">Select an Assignment...</option>'; // Reset assignment dropdown
        assignmentSelect.disabled = true;
        assignmentSelectorContainer.style.display = 'none';
        currentGradeDisplay.innerHTML = '';
        marksObtainedInput.value = '';


        if (enrollmentId) {
            selectedEnrollment = allEnrollmentsData.find(e => e.enrollment_id == enrollmentId); // Use '==' for type coercion if needed, or ensure types match
            if (!selectedEnrollment) { // Fallback if not found in cached data (should not happen if populated correctly)
                 selectedEnrollment = {
                    enrollment_id: enrollmentId,
                    subject_id: selectedOption.dataset.subjectId,
                    student_name: selectedOption.dataset.studentName,
                    subject_name: selectedOption.dataset.subjectName
                 };
            }
            currentEnrollmentIdGradesInput.value = enrollmentId;
            selectedStudentDisplay.textContent = selectedEnrollment.student_name || 'N/A';
            selectedSubjectDisplay.textContent = selectedEnrollment.subject_name || 'N/A';


            try {
                const response = await fetch(`${API_URL}/subjects/${selectedEnrollment.subject_id}/assignments`);
                if (!response.ok) throw new Error('Failed to load assignments for the subject');
                allAssignmentsForSubject = await response.json();

                if (allAssignmentsForSubject.length === 0) {
                    assignmentSelect.innerHTML = '<option value="">No assignments for this subject</option>';
                } else {
                    allAssignmentsForSubject.forEach(asg => {
                        const option = document.createElement('option');
                        option.value = asg.assignment_id;
                        option.textContent = asg.title;
                        option.dataset.maxMarks = asg.max_marks; // Store max_marks
                        assignmentSelect.appendChild(option);
                    });
                }
                assignmentSelect.disabled = false;
                assignmentSelectorContainer.style.display = 'block';
            } catch (error) {
                console.error('Error fetching assignments:', error);
                showAlert(`Error fetching assignments: ${error.message}`, 'danger');
                assignmentSelect.innerHTML = '<option value="">Error loading assignments</option>';
                assignmentSelect.disabled = true;
            }
        } else {
            selectedEnrollment = null;
            currentEnrollmentIdGradesInput.value = '';
            selectedStudentDisplay.textContent = 'N/A';
            selectedSubjectDisplay.textContent = 'N/A';
        }
        // Reset assignment specific displays
        selectedAssignmentDisplay.textContent = 'N/A';
        maxMarksDisplay.textContent = 'N/A';
    });

    // Handle Assignment Selection
    assignmentSelect.addEventListener('change', async () => {
        const assignmentId = assignmentSelect.value;
        currentGradeDisplay.innerHTML = ''; // Clear previous grade info
        marksObtainedInput.value = '';


        if (assignmentId) {
            selectedAssignment = allAssignmentsForSubject.find(asg => asg.assignment_id == assignmentId);
            currentAssignmentIdGradesInput.value = assignmentId;
            maxMarksDisplay.textContent = selectedAssignment ? (selectedAssignment.max_marks !== null ? selectedAssignment.max_marks : 'Not Set') : 'N/A';
            selectedAssignmentDisplay.textContent = selectedAssignment ? selectedAssignment.title : 'N/A';
            gradeInputFormContainer.style.display = 'block';
            marksObtainedInput.focus(); // Auto-focus marks input

            // Fetch and display existing grade
            if (selectedEnrollment && selectedAssignment) {
                try {
                    const response = await fetch(`${API_URL}/enrollments/${selectedEnrollment.enrollment_id}/grades?assignment_id=${selectedAssignment.assignment_id}`);
                    if (!response.ok) {
                        // If 404 or other error, it might just mean no grade submitted yet.
                        // Only throw for actual server errors, not "not found" type issues for this.
                        if (response.status !== 404) {
                             const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
                             throw new Error(errorData.message || "Failed to fetch existing grade");
                        }
                        // If 404, grades will be an empty array or error, handle below.
                    }
                    const grades = await response.json(); // Expecting an array
                    if (grades.length > 0) {
                        const grade = grades[0]; // Assuming one grade per student-assignment
                        currentGradeDisplay.innerHTML = `Current Grade: <strong>${grade.marks_obtained} / ${selectedAssignment.max_marks || 'N/A'}</strong>`;
                        marksObtainedInput.value = grade.marks_obtained; // Pre-fill for potential update (though current flow is POST only)
                        showAlert('Existing grade loaded. You can submit a new value to update it (Note: current backend might create a new one or error).', 'info');
                    } else {
                        currentGradeDisplay.innerHTML = 'No grade submitted yet for this assignment.';
                    }
                } catch (error) {
                    console.error('Error fetching existing grade:', error);
                    // showAlert(`Error fetching existing grade: ${error.message}`, 'warning'); // May be too noisy
                    currentGradeDisplay.innerHTML = 'Could not fetch existing grade information.';
                }
            }

        } else {
            selectedAssignment = null;
            currentAssignmentIdGradesInput.value = '';
            maxMarksDisplay.textContent = 'N/A';
            selectedAssignmentDisplay.textContent = 'N/A';
            gradeInputFormContainer.style.display = 'none';
        }
    });

    // Handle Grade Form Submission
    gradeInputForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitButton = gradeInputForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        const enrollment_id = currentEnrollmentIdGradesInput.value;
        const assignment_id = currentAssignmentIdGradesInput.value;
        const marks_obtained_str = marksObtainedInput.value;

        if (!marks_obtained_str) {
            showAlert('Marks Obtained cannot be empty.', 'warning');
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
            return;
        }
        const marks_obtained = parseFloat(marks_obtained_str);

        if (isNaN(marks_obtained)) {
            showAlert('Marks Obtained must be a number.', 'warning');
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
            return;
        }
        if (marks_obtained < 0) {
            showAlert('Marks Obtained cannot be negative.', 'warning');
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
            return;
        }

        if (selectedAssignment && selectedAssignment.max_marks !== null && marks_obtained > parseFloat(selectedAssignment.max_marks)) {
            showAlert(`Marks Obtained (${marks_obtained}) cannot exceed Max Marks (${selectedAssignment.max_marks}).`, 'warning');
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
            return;
        }

        try {
            const response = await fetch(`${API_URL}/grades`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    enrollment_id: parseInt(enrollment_id),
                    assignment_id: parseInt(assignment_id),
                    marks_obtained: marks_obtained
                })
            });
            const result = await response.json();
            if (!response.ok) {
                let errorMessage = result.message || `HTTP error! status: ${response.status}`;
                if (response.status === 409) { // Grade already exists, potentially
                    // The backend POST /grades handles unique constraint violation.
                    // Let's assume the user might want to *update* the grade here.
                    // For now, we treat 409 as an error as per current backend setup.
                    // A more advanced UI might offer an "Update Grade" button if a grade exists.
                    errorMessage = `Grade already exists or conflict: ${result.message}. Use PUT to update.`;
                }
                throw new Error(errorMessage);
            }
            showAlert('Grade submitted successfully!', 'success');
            currentGradeDisplay.innerHTML = `Current Grade: <strong>${result.marks_obtained} / ${selectedAssignment.max_marks || 'N/A'}</strong>`;
            // marksObtainedInput.value = ''; // Clear for next entry, or leave as is
            marksObtainedInput.focus(); // Re-focus for potential quick re-submission or correction
        } catch (error) {
            console.error('Failed to submit grade:', error);
            showAlert(`Failed to submit grade: ${error.message || error}`, 'danger');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });
    
    // Initial Setup
    function init() {
        assignmentSelectorContainer.style.display = 'none';
        assignmentSelect.disabled = true;
        gradeInputFormContainer.style.display = 'none';
        populateEnrollmentDropdownGrades();
    }

    init();
});
