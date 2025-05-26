document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api'; 

    // Common elements
    const alertPlaceholder = document.getElementById('alertPlaceholder');

    // Subject Average Grade elements
    const reportSubjectSelectAvgGrade = document.getElementById('reportSubjectSelectAvgGrade');
    const getSubjectAvgGradeBtn = document.getElementById('getSubjectAvgGradeBtn');
    const subjectAvgGradeResult = document.getElementById('subjectAvgGradeResult');

    // Student Overall Average Grade elements
    const reportStudentSelectAvgGrade = document.getElementById('reportStudentSelectAvgGrade');
    const getStudentAvgGradeBtn = document.getElementById('getStudentAvgGradeBtn');
    const studentAvgGradeResult = document.getElementById('studentAvgGradeResult');

    // Low Attendance Alert elements
    const reportSubjectSelectLowAttendance = document.getElementById('reportSubjectSelectLowAttendance');
    const attendanceThresholdInput = document.getElementById('attendanceThreshold');
    const getLowAttendanceBtn = document.getElementById('getLowAttendanceBtn');
    const lowAttendanceResultArea = document.getElementById('lowAttendanceResultArea');
    const lowAttendanceTable = document.getElementById('lowAttendanceTable');
    const lowAttendanceTableBody = document.getElementById('lowAttendanceTableBody');

    // Function to display alerts
    function showAlert(message, type = 'success', placeholder = alertPlaceholder) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = [
            `<div class="alert alert-${type} alert-dismissible" role="alert">`,
            `   <div>${message}</div>`,
            '   <button type="button" class="close" data-dismiss="alert" aria-label="Close">',
            '       <span aria-hidden="true">&times;</span>',
            '   </button>',
            '</div>'
        ].join('');
        // Clear previous alerts in the specific placeholder
        if (placeholder) {
            placeholder.innerHTML = ''; 
            placeholder.append(wrapper);
        } else { // Fallback to general placeholder
            alertPlaceholder.innerHTML = '';
            alertPlaceholder.append(wrapper);
        }


        setTimeout(() => {
            if (wrapper.firstChild) {
                $(wrapper.firstChild).alert('close');
            }
        }, 5000);
    }

    // Populate Subject Dropdowns
    async function populateSubjectDropdowns() {
        try {
            const response = await fetch(`${API_URL}/subjects`);
            if (!response.ok) throw new Error('Failed to load subjects');
            const subjects = await response.json();

            const dropdowns = [reportSubjectSelectAvgGrade, reportSubjectSelectLowAttendance];
            dropdowns.forEach(dropdown => {
                if (!dropdown) return;
                dropdown.innerHTML = '<option value="">Select Subject...</option>';
                if (subjects.length === 0) {
                    dropdown.innerHTML = '<option value="">No subjects available</option>';
                    return;
                }
                subjects.forEach(subject => {
                    const option = document.createElement('option');
                    option.value = subject.subject_id;
                    option.textContent = subject.name;
                    dropdown.appendChild(option);
                });
            });
        } catch (error) {
            console.error('Error populating subject dropdowns:', error);
            showAlert(`Error populating subject dropdowns: ${error.message}`, 'danger');
        }
    }

    // Populate Student Dropdown
    async function populateStudentDropdown() {
        try {
            const response = await fetch(`${API_URL}/students`);
            if (!response.ok) throw new Error('Failed to load students');
            const students = await response.json();

            if (!reportStudentSelectAvgGrade) return;
            reportStudentSelectAvgGrade.innerHTML = '<option value="">Select Student...</option>';
            if (students.length === 0) {
                 reportStudentSelectAvgGrade.innerHTML = '<option value="">No students available</option>';
                 return;
            }
            students.forEach(student => {
                const option = document.createElement('option');
                option.value = student.student_id;
                option.textContent = student.name;
                reportStudentSelectAvgGrade.appendChild(option);
            });
        } catch (error) {
            console.error('Error populating student dropdown:', error);
            showAlert(`Error populating student dropdown: ${error.message}`, 'danger');
        }
    }

    // Event Handler for "Get Subject Average Grade"
    if (getSubjectAvgGradeBtn) {
        getSubjectAvgGradeBtn.addEventListener('click', async () => {
            const subjectId = reportSubjectSelectAvgGrade.value;
            subjectAvgGradeResult.innerHTML = ''; // Clear previous result
            const originalButtonText = getSubjectAvgGradeBtn.textContent;
            getSubjectAvgGradeBtn.disabled = true;
            getSubjectAvgGradeBtn.textContent = 'Generating...';

            if (!subjectId) {
                showAlert('Please select a subject.', 'warning', subjectAvgGradeResult);
                getSubjectAvgGradeBtn.disabled = false;
                getSubjectAvgGradeBtn.textContent = originalButtonText;
                return;
            }

            try {
                const response = await fetch(`${API_URL}/reports/subjects/${subjectId}/average_grade`);
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || `HTTP error! status: ${response.status}`);
                }
                if (data.average_grade !== null) {
                    subjectAvgGradeResult.innerHTML = `<p class="text-success">Average Grade for ${data.subject_name}: <strong>${parseFloat(data.average_grade).toFixed(2)}%</strong></p>`;
                } else {
                    subjectAvgGradeResult.innerHTML = `<p class="text-info">${data.message || `No grades found for ${data.subject_name}.`}</p>`;
                }
            } catch (error) {
                console.error('Error fetching subject average grade:', error);
                showAlert(`Error: ${error.message || error}`, 'danger', subjectAvgGradeResult);
            } finally {
                getSubjectAvgGradeBtn.disabled = false;
                getSubjectAvgGradeBtn.textContent = originalButtonText;
            }
        });
    }

    // Event Handler for "Get Student Average Grade"
    if (getStudentAvgGradeBtn) {
        getStudentAvgGradeBtn.addEventListener('click', async () => {
            const studentId = reportStudentSelectAvgGrade.value;
            studentAvgGradeResult.innerHTML = ''; // Clear previous result
            const originalButtonText = getStudentAvgGradeBtn.textContent;
            getStudentAvgGradeBtn.disabled = true;
            getStudentAvgGradeBtn.textContent = 'Generating...';

            if (!studentId) {
                showAlert('Please select a student.', 'warning', studentAvgGradeResult);
                getStudentAvgGradeBtn.disabled = false;
                getStudentAvgGradeBtn.textContent = originalButtonText;
                return;
            }

            try {
                const response = await fetch(`${API_URL}/reports/students/${studentId}/average_grade`);
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || `HTTP error! status: ${response.status}`);
                }
                if (data.overall_average_grade !== null) {
                    studentAvgGradeResult.innerHTML = `<p class="text-success">Overall Average Grade for ${data.student_name}: <strong>${parseFloat(data.overall_average_grade).toFixed(2)}%</strong></p>`;
                } else {
                    studentAvgGradeResult.innerHTML = `<p class="text-info">${data.message || `No grades found for ${data.student_name}.`}</p>`;
                }
            } catch (error) {
                console.error('Error fetching student average grade:', error);
                showAlert(`Error: ${error.message || error}`, 'danger', studentAvgGradeResult);
            } finally {
                getStudentAvgGradeBtn.disabled = false;
                getStudentAvgGradeBtn.textContent = originalButtonText;
            }
        });
    }
    
    // Event Handler for "Get Low Attendance Report"
    if (getLowAttendanceBtn) {
        getLowAttendanceBtn.addEventListener('click', async () => {
            const subjectId = reportSubjectSelectLowAttendance.value;
            const thresholdPercent = parseFloat(attendanceThresholdInput.value);
            lowAttendanceTableBody.innerHTML = ''; // Clear previous results
            lowAttendanceTable.classList.add('d-none'); // Hide table initially
            lowAttendanceResultArea.innerHTML = ''; // Clear area in case of messages
            const originalButtonText = getLowAttendanceBtn.textContent;
            getLowAttendanceBtn.disabled = true;
            getLowAttendanceBtn.textContent = 'Generating...';

            if (!subjectId) {
                showAlert('Please select a subject.', 'warning', lowAttendanceResultArea);
                getLowAttendanceBtn.disabled = false;
                getLowAttendanceBtn.textContent = originalButtonText;
                return;
            }
            if (isNaN(thresholdPercent) || thresholdPercent < 0 || thresholdPercent > 100) {
                showAlert('Please enter a valid threshold (0-100).', 'warning', lowAttendanceResultArea);
                getLowAttendanceBtn.disabled = false;
                getLowAttendanceBtn.textContent = originalButtonText;
                return;
            }
            const thresholdDecimal = thresholdPercent / 100;

            try {
                const response = await fetch(`${API_URL}/reports/subjects/${subjectId}/low_attendance?threshold=${thresholdDecimal}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || `HTTP error! status: ${response.status}`);
                }
                
                const students = data.low_attendance_students;
                if (students && students.length > 0) {
                    students.forEach(student => {
                        const row = lowAttendanceTableBody.insertRow();
                        row.insertCell().textContent = student.student_id;
                        row.insertCell().textContent = student.student_name;
                        row.insertCell().textContent = `${(student.attendance_rate * 100).toFixed(2)}%`;
                        row.insertCell().textContent = student.present_days;
                        row.insertCell().textContent = student.total_days;
                    });
                    lowAttendanceTable.classList.remove('d-none'); // Show table
                } else {
                    lowAttendanceResultArea.innerHTML = `<p class="text-info">No students found below the ${thresholdPercent}% attendance threshold for ${data.subject_name}.</p>`;
                }
            } catch (error) {
                console.error('Error fetching low attendance report:', error);
                showAlert(`Error: ${error.message || error}`, 'danger', lowAttendanceResultArea);
            } finally {
                getLowAttendanceBtn.disabled = false;
                getLowAttendanceBtn.textContent = originalButtonText;
            }
        });
    }

    // Initial Data Load
    async function init() {
        await populateSubjectDropdowns();
        await populateStudentDropdown();
    }

    init();
});
