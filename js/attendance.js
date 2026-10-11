/**
 * SAMS - Attendance Marking Controller
 * Handles department/class selection, date validation, present/absent toggling,
 * bulk actions, and duplicate prevention.
 */

let currentMarkingList = [];

document.addEventListener('DOMContentLoaded', () => {
  // Ensure admin authentication
  const currentUser = Auth.requireAuth(['admin']);
  if (!currentUser) return;

  // Initialize shared UI layout
  App.init(currentUser);

  initAttendanceForm();
  setupEventListeners();
});

function initAttendanceForm() {
  const dateInput = document.getElementById('att-date-picker');
  const today = getTodayDateString();

  if (dateInput) {
    dateInput.value = today;
    dateInput.max = today; // Prevent future dates
  }

  // Initial load
  loadStudentsForMarking();
}

function setupEventListeners() {
  const deptSelect = document.getElementById('att-dept-select');
  const yearSelect = document.getElementById('att-year-select');
  const dateInput = document.getElementById('att-date-picker');
  const searchInput = document.getElementById('att-search-input');

  if (deptSelect) deptSelect.addEventListener('change', loadStudentsForMarking);
  if (yearSelect) yearSelect.addEventListener('change', loadStudentsForMarking);
  if (dateInput) {
    dateInput.addEventListener('change', () => {
      const selected = dateInput.value;
      if (isFutureDate(selected)) {
        showToast('Future dates cannot be selected for marking attendance.', 'danger');
        dateInput.value = getTodayDateString();
        return;
      }
      loadStudentsForMarking();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderMarkingTable();
    });
  }

  // Bulk actions
  const btnAllPresent = document.getElementById('btn-mark-all-present');
  const btnAllAbsent = document.getElementById('btn-mark-all-absent');
  const btnInvert = document.getElementById('btn-invert-selection');
  const btnSave = document.getElementById('btn-save-attendance');

  if (btnAllPresent) {
    btnAllPresent.addEventListener('click', () => {
      currentMarkingList.forEach(item => item.status = 'Present');
      renderMarkingTable();
      showToast('All students marked as Present.', 'info');
    });
  }

  if (btnAllAbsent) {
    btnAllAbsent.addEventListener('click', () => {
      currentMarkingList.forEach(item => item.status = 'Absent');
      renderMarkingTable();
      showToast('All students marked as Absent.', 'info');
    });
  }

  if (btnInvert) {
    btnInvert.addEventListener('click', () => {
      currentMarkingList.forEach(item => {
        item.status = item.status === 'Present' ? 'Absent' : 'Present';
      });
      renderMarkingTable();
    });
  }

  if (btnSave) {
    btnSave.addEventListener('click', saveCurrentAttendance);
  }
}

function loadStudentsForMarking() {
  const dept = document.getElementById('att-dept-select')?.value || 'all';
  const year = document.getElementById('att-year-select')?.value || 'all';
  const selectedDate = document.getElementById('att-date-picker')?.value || getTodayDateString();

  if (isFutureDate(selectedDate)) {
    showToast('Cannot mark attendance for future dates.', 'danger');
    return;
  }

  const allStudents = Storage.getStudents();
  let students = allStudents;

  if (dept !== 'all') {
    students = students.filter(s => s.department === dept);
  }
  if (year !== 'all') {
    students = students.filter(s => s.year === year);
  }

  // Fetch already recorded attendance for this date
  const allAttendance = Storage.getAttendance();
  const existingRecords = allAttendance.filter(r => r.date === selectedDate);
  const existingMap = {};
  existingRecords.forEach(r => {
    existingMap[r.rollNumber.toLowerCase()] = r;
  });

  const isEditingExisting = existingRecords.length > 0;
  const statusBanner = document.getElementById('att-status-banner');
  if (statusBanner) {
    if (isEditingExisting) {
      statusBanner.style.display = 'block';
      statusBanner.className = 'notification-card notif-info';
      statusBanner.innerHTML = `
        <div class="notification-icon"><i class="fa-solid fa-clock-rotate-left"></i></div>
        <div class="notification-content">
          <strong>Previously Recorded Session:</strong> Attendance records already exist for ${formatDate(selectedDate)}. 
          Saving changes will update the existing records rather than creating duplicates.
        </div>
      `;
    } else {
      statusBanner.style.display = 'none';
    }
  }

  // Build the marking array
  currentMarkingList = students.map(student => {
    const existing = existingMap[student.rollNumber.toLowerCase()];
    return {
      studentId: student.id,
      rollNumber: student.rollNumber,
      studentName: student.name,
      department: student.department,
      year: student.year,
      status: existing ? existing.status : 'Present', // Default to Present for ease
      markedBy: existing ? existing.markedBy : 'Faculty Admin'
    };
  });

  renderMarkingTable();
}

function renderMarkingTable() {
  const container = document.getElementById('att-marking-table-body');
  if (!container) return;

  const searchVal = (document.getElementById('att-search-input')?.value || '').trim().toLowerCase();

  const filtered = currentMarkingList.filter(item => {
    return !searchVal || 
      item.studentName.toLowerCase().includes(searchVal) || 
      item.rollNumber.toLowerCase().includes(searchVal);
  });

  // Update counters
  const presentCount = currentMarkingList.filter(i => i.status === 'Present').length;
  const absentCount = currentMarkingList.filter(i => i.status === 'Absent').length;
  const totalCount = currentMarkingList.length;

  const countPresentEl = document.getElementById('att-count-present');
  const countAbsentEl = document.getElementById('att-count-absent');
  const countTotalEl = document.getElementById('att-count-total');

  if (countPresentEl) countPresentEl.textContent = presentCount;
  if (countAbsentEl) countAbsentEl.textContent = absentCount;
  if (countTotalEl) countTotalEl.textContent = totalCount;

  if (filtered.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          <i class="fa-solid fa-user-group empty-state-icon"></i>
          <div class="empty-state-title">No students found</div>
          <div class="empty-state-desc">No students match the selected Department and Year criteria.</div>
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const isPresent = item.status === 'Present';

    return `
      <tr>
        <td><strong>${escapeHtml(item.rollNumber)}</strong></td>
        <td>
          <div style="font-weight:600; color:var(--slate-900);">${escapeHtml(item.studentName)}</div>
        </td>
        <td>${escapeHtml(item.department)} - ${escapeHtml(item.year)}</td>
        <td>
          <span class="badge ${isPresent ? 'badge-present' : 'badge-absent'}">
            <i class="fa-solid ${isPresent ? 'fa-check' : 'fa-xmark'}"></i>
            ${escapeHtml(item.status)}
          </span>
        </td>
        <td style="text-align:right;">
          <div class="attendance-toggle-group">
            <button type="button" 
              class="att-btn ${isPresent ? 'active-present' : ''}" 
              onclick="toggleStudentAttendance('${item.rollNumber}', 'Present')">
              <i class="fa-solid fa-check"></i> Present
            </button>
            <button type="button" 
              class="att-btn ${!isPresent ? 'active-absent' : ''}" 
              onclick="toggleStudentAttendance('${item.rollNumber}', 'Absent')">
              <i class="fa-solid fa-xmark"></i> Absent
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function toggleStudentAttendance(rollNumber, newStatus) {
  const item = currentMarkingList.find(i => i.rollNumber === rollNumber);
  if (item) {
    item.status = newStatus;
    renderMarkingTable();
  }
}

function saveCurrentAttendance() {
  const date = document.getElementById('att-date-picker')?.value;
  if (!date) {
    showToast('Please select a valid date.', 'danger');
    return;
  }

  if (isFutureDate(date)) {
    showToast('Cannot save attendance for future dates.', 'danger');
    return;
  }

  if (currentMarkingList.length === 0) {
    showToast('No students loaded to mark attendance.', 'warning');
    return;
  }

  const currentUser = Auth.getCurrentUser();
  const markedBy = currentUser ? (currentUser.name || 'Faculty Admin') : 'Faculty Admin';

  const recordsToSave = currentMarkingList.map(item => ({
    studentId: item.studentId,
    rollNumber: item.rollNumber,
    studentName: item.studentName,
    department: item.department,
    year: item.year,
    date: date,
    status: item.status,
    markedBy: markedBy
  }));

  const result = Storage.saveAttendanceBatch(recordsToSave);

  showToast(`Attendance for ${formatDate(date)} saved successfully! (${result.updated} updated, ${result.inserted} recorded)`, 'success');

  // Reload to update status banner
  loadStudentsForMarking();
}
