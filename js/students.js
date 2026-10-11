/**
 * SAMS - Student Management Controller
 * Handles student CRUD operations, unique roll number validation, search/filters, and profile modal.
 */

let editingStudentId = null;

document.addEventListener('DOMContentLoaded', () => {
  // Ensure admin authentication
  const currentUser = Auth.requireAuth(['admin']);
  if (!currentUser) return;

  // Initialize shared UI layout
  App.init(currentUser);

  // Initial load
  loadStudentsTable();
  setupEventListeners();
});

function loadStudentsTable() {
  const container = document.getElementById('students-table-body');
  if (!container) return;

  const students = Storage.getStudents();
  const searchVal = (document.getElementById('search-student')?.value || '').trim().toLowerCase();
  const deptFilter = document.getElementById('filter-dept')?.value || 'all';
  const yearFilter = document.getElementById('filter-year')?.value || 'all';

  let filtered = students.filter(student => {
    const matchSearch = !searchVal || 
      student.name.toLowerCase().includes(searchVal) || 
      student.rollNumber.toLowerCase().includes(searchVal);
    const matchDept = deptFilter === 'all' || student.department === deptFilter;
    const matchYear = yearFilter === 'all' || student.year === yearFilter;
    return matchSearch && matchDept && matchYear;
  });

  const countBadge = document.getElementById('students-count-badge');
  if (countBadge) countBadge.textContent = `${filtered.length} of ${students.length} Students`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <i class="fa-solid fa-user-slash empty-state-icon"></i>
          <div class="empty-state-title">No students found</div>
          <div class="empty-state-desc">Try clearing search filters or add a new student using the button above.</div>
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = filtered.map(student => {
    const stats = Storage.getStudentStats(student.rollNumber);
    const avatarSrc = student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=2563eb&color=fff`;

    return `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:10px;">
            <img src="${avatarSrc}" alt="${escapeHtml(student.name)}" class="user-avatar" style="width:34px; height:34px;" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=2563eb&color=fff'">
            <div>
              <div style="font-weight:600; color:var(--slate-900);">${escapeHtml(student.name)}</div>
              <small class="text-muted">${escapeHtml(student.email)}</small>
            </div>
          </div>
        </td>
        <td><strong>${escapeHtml(student.rollNumber)}</strong></td>
        <td>${escapeHtml(student.department)}</td>
        <td>${escapeHtml(student.year)}</td>
        <td>${escapeHtml(student.mobile)}</td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-weight:700; color:${stats.percentage >= 75 ? 'var(--success-600)' : 'var(--danger-600)'};">
              ${stats.percentage}%
            </span>
            <small class="text-muted">(${stats.presentDays}/${stats.totalDays}d)</small>
          </div>
        </td>
        <td>
          <div style="display:flex; gap:6px;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="viewStudentProfile('${student.id}')" title="View Profile">
              <i class="fa-solid fa-eye"></i>
            </button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="openEditStudentModal('${student.id}')" title="Edit Student">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button type="button" class="btn btn-danger btn-sm" onclick="confirmDeleteStudent('${student.id}')" title="Delete Student">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function setupEventListeners() {
  // Search and filter triggers
  const searchInput = document.getElementById('search-student');
  const deptFilter = document.getElementById('filter-dept');
  const yearFilter = document.getElementById('filter-year');
  const resetBtn = document.getElementById('btn-reset-filters');

  if (searchInput) searchInput.addEventListener('input', loadStudentsTable);
  if (deptFilter) deptFilter.addEventListener('change', loadStudentsTable);
  if (yearFilter) yearFilter.addEventListener('change', loadStudentsTable);

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (deptFilter) deptFilter.value = 'all';
      if (yearFilter) yearFilter.value = 'all';
      loadStudentsTable();
    });
  }

  // Add Student Button
  const btnAddStudent = document.getElementById('btn-add-student-modal');
  if (btnAddStudent) {
    btnAddStudent.addEventListener('click', () => {
      openAddStudentModal();
    });
  }

  // Form submit
  const studentForm = document.getElementById('student-modal-form');
  if (studentForm) {
    studentForm.addEventListener('submit', handleSaveStudent);
  }

  // Modal close buttons
  const modalClose = document.getElementById('student-modal-close');
  const modalCancel = document.getElementById('student-modal-cancel');
  if (modalClose) modalClose.addEventListener('click', closeStudentModal);
  if (modalCancel) modalCancel.addEventListener('click', closeStudentModal);

  // Profile modal close
  const profileModalClose = document.getElementById('profile-modal-close');
  const profileModalDone = document.getElementById('profile-modal-done');
  if (profileModalClose) profileModalClose.addEventListener('click', closeProfileModal);
  if (profileModalDone) profileModalDone.addEventListener('click', closeProfileModal);
}

function openAddStudentModal() {
  editingStudentId = null;
  const modal = document.getElementById('student-form-modal');
  const title = document.getElementById('student-modal-title');
  const form = document.getElementById('student-modal-form');

  if (title) title.textContent = 'Add New Student';
  if (form) form.reset();

  // Reset errors
  clearFormErrors();

  if (modal) modal.classList.add('active');
}

function openEditStudentModal(id) {
  editingStudentId = id;
  const student = Storage.getStudentById(id);
  if (!student) {
    showToast('Student not found.', 'danger');
    return;
  }

  const modal = document.getElementById('student-form-modal');
  const title = document.getElementById('student-modal-title');

  if (title) title.textContent = 'Edit Student Details';

  document.getElementById('form-student-name').value = student.name;
  document.getElementById('form-student-roll').value = student.rollNumber;
  document.getElementById('form-student-dept').value = student.department;
  document.getElementById('form-student-year').value = student.year;
  document.getElementById('form-student-mobile').value = student.mobile;
  document.getElementById('form-student-email').value = student.email;
  document.getElementById('form-student-avatar').value = student.avatar || '';

  // Password placeholder or current
  const pwdInput = document.getElementById('form-student-password');
  if (pwdInput) pwdInput.value = '';

  clearFormErrors();
  if (modal) modal.classList.add('active');
}

function closeStudentModal() {
  const modal = document.getElementById('student-form-modal');
  if (modal) modal.classList.remove('active');
  editingStudentId = null;
}

function clearFormErrors() {
  document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
}

function handleSaveStudent(e) {
  e.preventDefault();
  clearFormErrors();

  const name = document.getElementById('form-student-name').value.trim();
  const rollNumber = document.getElementById('form-student-roll').value.trim().toUpperCase();
  const department = document.getElementById('form-student-dept').value;
  const year = document.getElementById('form-student-year').value;
  const mobile = document.getElementById('form-student-mobile').value.trim();
  const email = document.getElementById('form-student-email').value.trim();
  const avatar = document.getElementById('form-student-avatar').value.trim();
  const password = document.getElementById('form-student-password').value.trim();

  let hasError = false;

  if (!name) {
    document.getElementById('error-student-name').textContent = 'Full name is required.';
    hasError = true;
  }

  if (!rollNumber) {
    document.getElementById('error-student-roll').textContent = 'Roll number is required.';
    hasError = true;
  } else if (Storage.isRollNumberTaken(rollNumber, editingStudentId)) {
    document.getElementById('error-student-roll').textContent = `Roll number "${rollNumber}" is already registered.`;
    hasError = true;
  }

  if (!department) {
    document.getElementById('error-student-dept').textContent = 'Please select a department.';
    hasError = true;
  }

  if (!year) {
    document.getElementById('error-student-year').textContent = 'Please select academic year.';
    hasError = true;
  }

  // Validate phone: 10 digits
  const phoneRegex = /^[0-9]{10,14}$/;
  if (!mobile) {
    document.getElementById('error-student-mobile').textContent = 'Mobile number is required.';
    hasError = true;
  } else if (!phoneRegex.test(mobile)) {
    document.getElementById('error-student-mobile').textContent = 'Enter a valid 10-digit mobile number.';
    hasError = true;
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    document.getElementById('error-student-email').textContent = 'Email address is required.';
    hasError = true;
  } else if (!emailRegex.test(email)) {
    document.getElementById('error-student-email').textContent = 'Enter a valid email address.';
    hasError = true;
  }

  if (hasError) return;

  const studentPayload = {
    name,
    rollNumber,
    department,
    year,
    mobile,
    email,
    avatar,
    password: password || 'student123'
  };

  if (editingStudentId) {
    const updated = Storage.updateStudent(editingStudentId, studentPayload);
    if (updated) {
      showToast(`Student ${updated.name} updated successfully!`, 'success');
    }
  } else {
    const created = Storage.saveStudent(studentPayload);
    showToast(`Student ${created.name} (${created.rollNumber}) added successfully!`, 'success');
  }

  closeStudentModal();
  loadStudentsTable();
}

function confirmDeleteStudent(id) {
  const student = Storage.getStudentById(id);
  if (!student) return;

  showConfirmModal({
    title: 'Delete Student Record',
    message: `Are you sure you want to delete ${student.name} (${student.rollNumber})? This will also remove their attendance history and login credentials.`,
    confirmText: 'Delete Student',
    confirmClass: 'btn-danger',
    onConfirm: () => {
      const deleted = Storage.deleteStudent(id);
      if (deleted) {
        showToast(`Student ${student.name} deleted.`, 'info');
        loadStudentsTable();
      }
    }
  });
}

function viewStudentProfile(id) {
  const student = Storage.getStudentById(id);
  if (!student) return;

  const stats = Storage.getStudentStats(student.rollNumber);
  const modal = document.getElementById('student-profile-view-modal');

  const avatarSrc = student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=2563eb&color=fff&size=128`;

  document.getElementById('pv-avatar').src = avatarSrc;
  document.getElementById('pv-name').textContent = student.name;
  document.getElementById('pv-roll').textContent = student.rollNumber;
  document.getElementById('pv-dept').textContent = student.department;
  document.getElementById('pv-year').textContent = student.year;
  document.getElementById('pv-email').textContent = student.email;
  document.getElementById('pv-mobile').textContent = student.mobile;
  document.getElementById('pv-working-days').textContent = stats.totalDays;
  document.getElementById('pv-present').textContent = stats.presentDays;
  document.getElementById('pv-absent').textContent = stats.absentDays;
  document.getElementById('pv-percentage').textContent = `${stats.percentage}%`;

  const bar = document.getElementById('pv-progress-bar');
  if (bar) {
    bar.style.width = `${Math.min(stats.percentage, 100)}%`;
    bar.className = stats.percentage >= 75 ? 'progress-bar-fill progress-fill-green' : stats.percentage >= 60 ? 'progress-bar-fill progress-fill-amber' : 'progress-bar-fill progress-fill-red';
  }

  if (modal) modal.classList.add('active');
}

function closeProfileModal() {
  const modal = document.getElementById('student-profile-view-modal');
  if (modal) modal.classList.remove('active');
}
