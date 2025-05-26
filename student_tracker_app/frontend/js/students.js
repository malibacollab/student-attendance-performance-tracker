document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api'; 
    const studentsTableBody = document.getElementById('studentsTableBody');
    const addStudentForm = document.getElementById('addStudentForm');
    const editStudentForm = document.getElementById('editStudentForm');
    const addStudentModal = $('#addStudentModal'); // jQuery instance for Bootstrap modal methods
    const editStudentModal = $('#editStudentModal'); // jQuery instance
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

        // Automatically dismiss after 5 seconds
        setTimeout(() => {
            $(wrapper.firstChild).alert('close');
        }, 5000);
    }

    // Fetch and display students
    async function fetchStudents() {
        try {
            const response = await fetch(`${API_URL}/students`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const students = await response.json();
            
            studentsTableBody.innerHTML = ''; // Clear existing rows
            students.forEach(student => {
                const row = studentsTableBody.insertRow();
                row.insertCell().textContent = student.student_id;
                row.insertCell().textContent = student.name;
                row.insertCell().textContent = student.email;
                row.insertCell().textContent = student.other_details || '';
                
                const actionsCell = row.insertCell();
                const editButton = document.createElement('button');
                editButton.classList.add('btn', 'btn-sm', 'btn-warning', 'mr-2');
                editButton.textContent = 'Edit';
                editButton.addEventListener('click', () => openEditModal(student));
                
                const deleteButton = document.createElement('button');
                deleteButton.classList.add('btn', 'btn-sm', 'btn-danger');
                deleteButton.textContent = 'Delete';
                deleteButton.addEventListener('click', () => deleteStudent(student.student_id));
                
                actionsCell.appendChild(editButton);
                actionsCell.appendChild(deleteButton);
            });
        } catch (error) {
            console.error('Failed to fetch students:', error);
            showAlert(`Failed to fetch students: ${error.message}`, 'danger');
        }
    }

    // Handle Add Student form submission
    addStudentForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitButton = addStudentForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';

        const name = document.getElementById('addStudentName').value;
        const email = document.getElementById('addStudentEmail').value;
        const other_details = document.getElementById('addStudentOtherDetails').value;

        try {
            const response = await fetch(`${API_URL}/students`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, other_details })
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || `HTTP error! status: ${response.status}`);
            }
            addStudentModal.modal('hide');
            addStudentForm.reset(); // Clear form
            fetchStudents();
            showAlert('Student added successfully!');
        } catch (error) {
            console.error('Failed to add student:', error);
            showAlert(`Failed to add student: ${error.message}`, 'danger');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });

    // Open Edit Modal and populate form
    window.openEditModal = (student) => { // Make it global to be accessible from table buttons
        document.getElementById('editStudentId').value = student.student_id;
        document.getElementById('editStudentName').value = student.name;
        document.getElementById('editStudentEmail').value = student.email;
        document.getElementById('editStudentOtherDetails').value = student.other_details || '';
        editStudentModal.modal('show');
    };

    // Handle Edit Student form submission
    editStudentForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitButton = editStudentForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Saving Changes...';

        const studentId = document.getElementById('editStudentId').value;
        const name = document.getElementById('editStudentName').value;
        const email = document.getElementById('editStudentEmail').value;
        const other_details = document.getElementById('editStudentOtherDetails').value;

        try {
            const response = await fetch(`${API_URL}/students/${studentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, other_details })
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || `HTTP error! status: ${response.status}`);
            }
            editStudentModal.modal('hide');
            fetchStudents();
            showAlert('Student updated successfully!');
        } catch (error) {
            console.error('Failed to update student:', error);
            showAlert(`Failed to update student: ${error.message}`, 'danger');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });

    // Delete Student
    window.deleteStudent = async (studentId) => { // Make it global
        // Find the specific delete button that was clicked to show loading state
        // This requires passing the button element or finding it based on studentId if buttons have unique IDs.
        // For simplicity, direct button manipulation for delete is omitted here, but can be added.
        if (confirm('Are you sure you want to delete this student?')) {
            try {
                // Consider adding a loading indicator near the row or globally
                const response = await fetch(`${API_URL}/students/${studentId}`, {
                    method: 'DELETE'
                });
                const result = await response.json(); 
                if (!response.ok) {
                     throw new Error(result.message || `HTTP error! status: ${response.status}`);
                }
                fetchStudents();
                showAlert('Student deleted successfully!');
            } catch (error) {
                console.error('Failed to delete student:', error);
                showAlert(`Failed to delete student: ${error.message}`, 'danger');
            }
        }
    };

    // Auto-focus on modal shown
    addStudentModal.on('shown.bs.modal', () => {
        document.getElementById('addStudentName').focus();
    });

    editStudentModal.on('shown.bs.modal', () => {
        document.getElementById('editStudentName').focus();
    });

    // Initial fetch of students
    fetchStudents();
});
