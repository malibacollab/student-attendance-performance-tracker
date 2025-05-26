document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api'; 
    const subjectsTableBody = document.getElementById('subjectsTableBody');
    const addSubjectForm = document.getElementById('addSubjectForm');
    const editSubjectForm = document.getElementById('editSubjectForm');
    const addSubjectModal = $('#addSubjectModal'); // jQuery instance for Bootstrap modal methods
    const editSubjectModal = $('#editSubjectModal'); // jQuery instance
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

    // Fetch and display subjects
    async function fetchSubjects() {
        try {
            const response = await fetch(`${API_URL}/subjects`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
                throw new Error(errorData.message);
            }
            const subjects = await response.json();
            
            subjectsTableBody.innerHTML = ''; // Clear existing rows
            subjects.forEach(subject => {
                const row = subjectsTableBody.insertRow();
                row.insertCell().textContent = subject.subject_id;
                row.insertCell().textContent = subject.name;
                row.insertCell().textContent = subject.description || '';
                
                const actionsCell = row.insertCell();
                const editButton = document.createElement('button');
                editButton.classList.add('btn', 'btn-sm', 'btn-warning', 'mr-2');
                editButton.textContent = 'Edit';
                editButton.addEventListener('click', () => openEditSubjectModal(subject));
                
                const deleteButton = document.createElement('button');
                deleteButton.classList.add('btn', 'btn-sm', 'btn-danger');
                deleteButton.textContent = 'Delete';
                deleteButton.addEventListener('click', () => deleteSubject(subject.subject_id));
                
                actionsCell.appendChild(editButton);
                actionsCell.appendChild(deleteButton);
            });
        } catch (error) {
            console.error('Failed to fetch subjects:', error);
            showAlert(`Failed to fetch subjects: ${error.message || error}`, 'danger');
        }
    }

    // Handle Add Subject form submission
    addSubjectForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitButton = addSubjectForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';

        const name = document.getElementById('addSubjectName').value;
        const description = document.getElementById('addSubjectDescription').value;

        try {
            const response = await fetch(`${API_URL}/subjects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description })
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || `HTTP error! status: ${response.status}`);
            }
            addSubjectModal.modal('hide');
            addSubjectForm.reset(); // Clear form
            fetchSubjects();
            showAlert('Subject added successfully!');
        } catch (error) {
            console.error('Failed to add subject:', error);
            showAlert(`Failed to add subject: ${error.message || error}`, 'danger');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });

    // Open Edit Subject Modal and populate form
    window.openEditSubjectModal = (subject) => { // Make it global
        document.getElementById('editSubjectId').value = subject.subject_id;
        document.getElementById('editSubjectName').value = subject.name;
        document.getElementById('editSubjectDescription').value = subject.description || '';
        editSubjectModal.modal('show');
    };

    // Handle Edit Subject form submission
    editSubjectForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitButton = editSubjectForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Saving Changes...';

        const subjectId = document.getElementById('editSubjectId').value;
        const name = document.getElementById('editSubjectName').value;
        const description = document.getElementById('editSubjectDescription').value;

        try {
            const response = await fetch(`${API_URL}/subjects/${subjectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description })
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || `HTTP error! status: ${response.status}`);
            }
            editSubjectModal.modal('hide');
            fetchSubjects();
            showAlert('Subject updated successfully!');
        } catch (error) {
            console.error('Failed to update subject:', error);
            showAlert(`Failed to update subject: ${error.message || error}`, 'danger');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });

    // Delete Subject
    window.deleteSubject = async (subjectId) => { // Make it global
        if (confirm('Are you sure you want to delete this subject? This might fail if the subject has related enrollments or assignments.')) {
            try {
                const response = await fetch(`${API_URL}/subjects/${subjectId}`, {
                    method: 'DELETE'
                });
                // Backend might return 200 with a message or 204 with no content on successful delete
                // Or 400/409 if deletion is not allowed
                const resultText = await response.text(); // Read response text
                if (!response.ok) {
                    let errorMessage = `HTTP error! status: ${response.status}`;
                    try {
                        const resultJson = JSON.parse(resultText); // Try to parse as JSON
                        errorMessage = resultJson.message || errorMessage;
                    } catch (e) {
                        // If not JSON, use the text itself if it's not empty
                        if(resultText) errorMessage = resultText;
                    }
                    throw new Error(errorMessage);
                }
                
                fetchSubjects();
                // If response.ok and there is a message in result, show it. Otherwise, a generic one.
                let successMessage = 'Subject deleted successfully!';
                try {
                    const resultJson = JSON.parse(resultText);
                    if (resultJson && resultJson.message) {
                        successMessage = resultJson.message;
                    }
                } catch(e) { /* Do nothing if not JSON */ }
                showAlert(successMessage);

            } catch (error) {
                console.error('Failed to delete subject:', error);
                showAlert(`Failed to delete subject: ${error.message || error}`, 'danger');
            }
        }
    };

    // Initial fetch of subjects
    fetchSubjects();

    // Auto-focus on modal shown
    addSubjectModal.on('shown.bs.modal', () => {
        document.getElementById('addSubjectName').focus();
    });

    editSubjectModal.on('shown.bs.modal', () => {
        document.getElementById('editSubjectName').focus();
    });
});
