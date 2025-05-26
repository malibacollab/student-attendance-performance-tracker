document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api'; 
    const enrollmentsTableBody = document.getElementById('enrollmentsTableBody');
    const createEnrollmentForm = document.getElementById('createEnrollmentForm');
    const studentSelect = document.getElementById('studentSelect');
    const subjectSelect = document.getElementById('subjectSelect');
    const teacherSelect = document.getElementById('teacherSelect');
    const alertPlaceholder = document.getElementById('alertPlaceholder');

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

    // Populate dropdowns
    async function populateDropdowns() {
        try {
            // Fetch Students
            const studentsRes = await fetch(`${API_URL}/students`);
            if (!studentsRes.ok) throw new Error('Failed to load students');
            const students = await studentsRes.json();
            studentSelect.innerHTML = '<option value="">Select Student</option>'; // Placeholder
            students.forEach(s => {
                const option = document.createElement('option');
                option.value = s.student_id;
                option.textContent = s.name;
                studentSelect.appendChild(option);
            });
            if (students.length === 0) studentSelect.innerHTML = '<option value="">No students available</option>';


            // Fetch Subjects
            const subjectsRes = await fetch(`${API_URL}/subjects`);
            if (!subjectsRes.ok) throw new Error('Failed to load subjects');
            const subjects = await subjectsRes.json();
            subjectSelect.innerHTML = '<option value="">Select Subject</option>'; // Placeholder
            subjects.forEach(s => {
                const option = document.createElement('option');
                option.value = s.subject_id;
                option.textContent = s.name;
                subjectSelect.appendChild(option);
            });
            if (subjects.length === 0) subjectSelect.innerHTML = '<option value="">No subjects available</option>';

            // Fetch Teachers
            const teachersRes = await fetch(`${API_URL}/teachers`);
            if (!teachersRes.ok) throw new Error('Failed to load teachers');
            const teachers = await teachersRes.json();
            teacherSelect.innerHTML = '<option value="">Select Teacher</option>'; // Placeholder
            teachers.forEach(t => {
                const option = document.createElement('option');
                option.value = t.teacher_id;
                option.textContent = t.name;
                teacherSelect.appendChild(option);
            });
            if (teachers.length === 0) teacherSelect.innerHTML = '<option value="">No teachers available</option>';

        } catch (error) {
            console.error('Error populating dropdowns:', error);
            showAlert(`Error populating dropdowns: ${error.message}`, 'danger');
        }
    }

    // Fetch and display enrollments
    async function fetchEnrollments() {
        try {
            const response = await fetch(`${API_URL}/enrollments`); // Assuming this endpoint exists
            if (!response.ok) { // If backend doesn't have /enrollments, this will fail gracefully
                // Let's try to get enrollments by iterating through students then their enrollments
                // This is less efficient but a fallback if /enrollments is not directly available.
                // For now, we'll rely on the subtask description that /enrollments should exist.
                const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
                throw new Error(errorData.message || `Failed to load enrollments.`);
            }
            const enrollments = await response.json();
            
            enrollmentsTableBody.innerHTML = ''; // Clear existing rows
            if (enrollments.length === 0) {
                const row = enrollmentsTableBody.insertRow();
                const cell = row.insertCell();
                cell.colSpan = 5;
                cell.textContent = 'No enrollments found.';
                cell.classList.add('text-center');
                return;
            }

            enrollments.forEach(enrollment => {
                const row = enrollmentsTableBody.insertRow();
                row.insertCell().textContent = enrollment.enrollment_id;
                row.insertCell().textContent = enrollment.student_name;
                row.insertCell().textContent = enrollment.subject_name;
                row.insertCell().textContent = enrollment.teacher_name;
                
                const actionsCell = row.insertCell();
                const deleteButton = document.createElement('button');
                deleteButton.classList.add('btn', 'btn-sm', 'btn-danger');
                deleteButton.textContent = 'Delete';
                deleteButton.addEventListener('click', () => deleteEnrollment(enrollment.enrollment_id));
                
                actionsCell.appendChild(deleteButton);
            });
        } catch (error) {
            console.error('Failed to fetch enrollments:', error);
            showAlert(`Failed to fetch enrollments: ${error.message || error}`, 'danger');
            enrollmentsTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading enrollments.</td></tr>';
        }
    }

    // Handle Create Enrollment form submission
    createEnrollmentForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitButton = createEnrollmentForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Enrolling...';

        const student_id = studentSelect.value;
        const subject_id = subjectSelect.value;
        const teacher_id = teacherSelect.value;

        if (!student_id || !subject_id || !teacher_id) {
            showAlert('Please select a student, subject, and teacher.', 'warning');
            submitButton.disabled = false; // Re-enable button
            submitButton.textContent = originalButtonText;
            return;
        }

        try {
            const response = await fetch(`${API_URL}/enrollments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_id: parseInt(student_id), subject_id: parseInt(subject_id), teacher_id: parseInt(teacher_id) })
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || `HTTP error! status: ${response.status}`);
            }
            fetchEnrollments(); // Refresh the table
            showAlert('Enrollment created successfully!');
            createEnrollmentForm.reset(); // Clear form
            // Resetting dropdowns to placeholder - might be desired
            studentSelect.selectedIndex = 0;
            subjectSelect.selectedIndex = 0;
            teacherSelect.selectedIndex = 0;
        } catch (error) {
            console.error('Failed to create enrollment:', error);
            showAlert(`Failed to create enrollment: ${error.message || error}`, 'danger');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });

    // Delete Enrollment
    window.deleteEnrollment = async (enrollmentId) => { // Make it global
        if (confirm('Are you sure you want to delete this enrollment?')) {
            try {
                const response = await fetch(`${API_URL}/enrollments/${enrollmentId}`, {
                    method: 'DELETE'
                });
                const resultText = await response.text();
                if (!response.ok) {
                    let errorMessage = `HTTP error! status: ${response.status}`;
                     try {
                        const resultJson = JSON.parse(resultText);
                        errorMessage = resultJson.message || errorMessage;
                    } catch (e) {
                         if(resultText) errorMessage = resultText;
                    }
                    throw new Error(errorMessage);
                }
                fetchEnrollments(); // Refresh the table
                let successMessage = 'Enrollment deleted successfully!';
                try {
                    const resultJson = JSON.parse(resultText);
                    if (resultJson && resultJson.message) {
                        successMessage = resultJson.message;
                    }
                } catch(e) { /* Do nothing if not JSON */ }
                showAlert(successMessage);
            } catch (error) {
                console.error('Failed to delete enrollment:', error);
                showAlert(`Failed to delete enrollment: ${error.message || error}`, 'danger');
            }
        }
    };

    // Initial data load
    async function init() {
        await populateDropdowns();
        await fetchEnrollments();
    }

    init();
});
