document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api'; 
    const teachersTableBody = document.getElementById('teachersTableBody');
    const addTeacherForm = document.getElementById('addTeacherForm');
    const editTeacherForm = document.getElementById('editTeacherForm');
    const addTeacherModal = $('#addTeacherModal'); // jQuery instance for Bootstrap modal methods
    const editTeacherModal = $('#editTeacherModal'); // jQuery instance
    const alertPlaceholder = document.getElementById('alertPlaceholder');

    // Function to display alerts (can be moved to main.js if shared)
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
            if (wrapper.firstChild) { // Check if the alert still exists
                 $(wrapper.firstChild).alert('close');
            }
        }, 5000);
    }

    // Fetch and display teachers
    async function fetchTeachers() {
        try {
            const response = await fetch(`${API_URL}/teachers`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
                throw new Error(errorData.message);
            }
            const teachers = await response.json();
            
            teachersTableBody.innerHTML = ''; // Clear existing rows
            teachers.forEach(teacher => {
                const row = teachersTableBody.insertRow();
                row.insertCell().textContent = teacher.teacher_id;
                row.insertCell().textContent = teacher.name;
                row.insertCell().textContent = teacher.email;
                
                const actionsCell = row.insertCell();
                const editButton = document.createElement('button');
                editButton.classList.add('btn', 'btn-sm', 'btn-warning', 'mr-2');
                editButton.textContent = 'Edit';
                editButton.addEventListener('click', () => openEditTeacherModal(teacher));
                
                const deleteButton = document.createElement('button');
                deleteButton.classList.add('btn', 'btn-sm', 'btn-danger');
                deleteButton.textContent = 'Delete';
                deleteButton.addEventListener('click', () => deleteTeacher(teacher.teacher_id));
                
                actionsCell.appendChild(editButton);
                actionsCell.appendChild(deleteButton);
            });
        } catch (error) {
            console.error('Failed to fetch teachers:', error);
            showAlert(`Failed to fetch teachers: ${error.message || error}`, 'danger');
        }
    }

    // Handle Add Teacher form submission
    addTeacherForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitButton = addTeacherForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';

        const name = document.getElementById('addTeacherName').value;
        const email = document.getElementById('addTeacherEmail').value;

        try {
            const response = await fetch(`${API_URL}/teachers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email })
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || `HTTP error! status: ${response.status}`);
            }
            addTeacherModal.modal('hide');
            addTeacherForm.reset(); // Clear form
            fetchTeachers();
            showAlert('Teacher added successfully!');
        } catch (error) {
            console.error('Failed to add teacher:', error);
            showAlert(`Failed to add teacher: ${error.message || error}`, 'danger');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });

    // Open Edit Teacher Modal and populate form
    window.openEditTeacherModal = (teacher) => { // Make it global
        document.getElementById('editTeacherId').value = teacher.teacher_id;
        document.getElementById('editTeacherName').value = teacher.name;
        document.getElementById('editTeacherEmail').value = teacher.email;
        editTeacherModal.modal('show');
    };

    // Handle Edit Teacher form submission
    editTeacherForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitButton = editTeacherForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Saving Changes...';

        const teacherId = document.getElementById('editTeacherId').value;
        const name = document.getElementById('editTeacherName').value;
        const email = document.getElementById('editTeacherEmail').value;

        try {
            const response = await fetch(`${API_URL}/teachers/${teacherId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email })
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || `HTTP error! status: ${response.status}`);
            }
            editTeacherModal.modal('hide');
            fetchTeachers();
            showAlert('Teacher updated successfully!');
        } catch (error) {
            console.error('Failed to update teacher:', error);
            showAlert(`Failed to update teacher: ${error.message || error}`, 'danger');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });

    // Delete Teacher
    window.deleteTeacher = async (teacherId) => { // Make it global
        if (confirm('Are you sure you want to delete this teacher? This might fail if the teacher is associated with enrollments.')) {
            try {
                const response = await fetch(`${API_URL}/teachers/${teacherId}`, {
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
                
                fetchTeachers();
                let successMessage = 'Teacher deleted successfully!';
                try {
                    const resultJson = JSON.parse(resultText);
                    if (resultJson && resultJson.message) {
                        successMessage = resultJson.message;
                    }
                } catch(e) { /* Do nothing if not JSON */ }
                showAlert(successMessage);

            } catch (error) {
                console.error('Failed to delete teacher:', error);
                showAlert(`Failed to delete teacher: ${error.message || error}`, 'danger');
            }
        }
    };

    // Initial fetch of teachers
    fetchTeachers();

    // Auto-focus on modal shown
    addTeacherModal.on('shown.bs.modal', () => {
        document.getElementById('addTeacherName').focus();
    });

    editTeacherModal.on('shown.bs.modal', () => {
        document.getElementById('editTeacherName').focus();
    });
});
