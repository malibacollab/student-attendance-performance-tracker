document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api'; 
    const enrollmentSelect = document.getElementById('enrollmentSelectAttendance');
    const recordAttendanceFormContainer = document.getElementById('recordAttendanceFormContainer');
    const recordAttendanceForm = document.getElementById('recordAttendanceForm');
    const currentEnrollmentIdInput = document.getElementById('currentEnrollmentId');
    const attendanceDateInput = document.getElementById('attendanceDate');
    const attendanceStatusInput = document.getElementById('attendanceStatus');
    const attendanceTableContainer = document.getElementById('attendanceTableContainer');
    const attendanceTableBody = document.getElementById('attendanceTableBody');
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

    // Populate Enrollment Dropdown
    async function populateEnrollmentDropdown() {
        try {
            const response = await fetch(`${API_URL}/enrollments`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
                throw new Error(errorData.message || 'Failed to load enrollments for dropdown');
            }
            const enrollments = await response.json();
            enrollmentSelect.innerHTML = '<option value="">Select an Enrollment...</option>'; // Reset
            if (enrollments.length === 0) {
                 enrollmentSelect.innerHTML = '<option value="">No enrollments available</option>';
                 return;
            }
            enrollments.forEach(enr => {
                const option = document.createElement('option');
                option.value = enr.enrollment_id;
                option.textContent = `${enr.student_name} - ${enr.subject_name} (Teacher: ${enr.teacher_name})`;
                enrollmentSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error populating enrollment dropdown:', error);
            showAlert(`Error populating enrollments: ${error.message || error}`, 'danger');
            enrollmentSelect.innerHTML = '<option value="">Error loading enrollments</option>';
        }
    }

    // Fetch and display attendance for a given enrollment
    async function fetchAttendanceForEnrollment(enrollmentId) {
        if (!enrollmentId) {
            attendanceTableBody.innerHTML = ''; // Clear table
            attendanceTableContainer.style.display = 'none';
            return;
        }
        try {
            const response = await fetch(`${API_URL}/enrollments/${enrollmentId}/attendance`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
                throw new Error(errorData.message || 'Failed to load attendance records');
            }
            const attendanceRecords = await response.json();
            attendanceTableBody.innerHTML = ''; // Clear existing rows

            if (attendanceRecords.length === 0) {
                const row = attendanceTableBody.insertRow();
                const cell = row.insertCell();
                cell.colSpan = 2; // Date, Status
                cell.textContent = 'No attendance records found for this enrollment.';
                cell.classList.add('text-center');
            } else {
                attendanceRecords.forEach(record => {
                    const row = attendanceTableBody.insertRow();
                    row.insertCell().textContent = record.date; // Assuming date is already formatted as YYYY-MM-DD
                    row.insertCell().textContent = record.status;
                    // Add actions cell later if needed for edit/delete of attendance
                });
            }
            attendanceTableContainer.style.display = 'block';
        } catch (error) {
            console.error('Failed to fetch attendance:', error);
            showAlert(`Failed to fetch attendance: ${error.message || error}`, 'danger');
            attendanceTableBody.innerHTML = '<tr><td colspan="2" class="text-center text-danger">Error loading attendance.</td></tr>';
            attendanceTableContainer.style.display = 'block'; // Show table to display error
        }
    }

    // Event Listener for Enrollment Selection
    enrollmentSelect.addEventListener('change', (event) => {
        const selectedEnrollmentId = event.target.value;
        if (selectedEnrollmentId) {
            currentEnrollmentIdInput.value = selectedEnrollmentId;
            recordAttendanceFormContainer.style.display = 'block';
            fetchAttendanceForEnrollment(selectedEnrollmentId);
            attendanceDateInput.focus(); // Auto-focus date input
        } else {
            currentEnrollmentIdInput.value = '';
            recordAttendanceFormContainer.style.display = 'none';
            attendanceTableContainer.style.display = 'none';
            attendanceTableBody.innerHTML = '';
        }
    });

    // Handle Record Attendance Form Submission
    recordAttendanceForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitButton = recordAttendanceForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Recording...';

        const enrollment_id = currentEnrollmentIdInput.value;
        const date = attendanceDateInput.value;
        const status = attendanceStatusInput.value;

        if (!enrollment_id || !date || !status) {
            showAlert('Enrollment ID, Date, and Status are required.', 'warning');
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
            return;
        }

        try {
            const response = await fetch(`${API_URL}/attendance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    enrollment_id: parseInt(enrollment_id),
                    date: date, // HTML date input format YYYY-MM-DD matches API
                    status: status
                })
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || `HTTP error! status: ${response.status}`);
            }
            fetchAttendanceForEnrollment(enrollment_id); // Refresh the table
            showAlert('Attendance recorded successfully!');
            // Clear form for next entry - user might want to record for same date, different student, or different date, same student
            // So, only clearing status might be an option, or resetting date if preferred.
            // For now, let's reset date and status.
            attendanceDateInput.value = ''; 
            attendanceStatusInput.value = 'present'; // Reset status to default
            attendanceDateInput.focus(); // Re-focus for next entry
        } catch (error) {
            console.error('Failed to record attendance:', error);
            showAlert(`Failed to record attendance: ${error.message || error}`, 'danger');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });

    // Initial setup
    async function init() {
        recordAttendanceFormContainer.style.display = 'none';
        attendanceTableContainer.style.display = 'none';
        await populateEnrollmentDropdown();
    }

    init();
});
