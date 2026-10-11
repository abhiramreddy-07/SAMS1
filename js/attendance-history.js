/**
 * SAMS - Attendance History Controller
 * Search, filter, inspect, toggle, and manage past attendance records.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Ensure admin authentication
  const currentUser = Auth.requireAuth(['admin']);
  if (!currentUser) return;

  // Initialize shared UI layout
  App.init(currentUser);

  initHistoryFilters();
  loadHistoryTable();
});

function initHistoryFilters() {
  const searchInput = document.getElementById('hist-search');
  const deptSelect = document.getElementById('hist-dept');
  const yearSelect = document.getElementById('hist-year');
  const statusSelect = document.getElementById('hist-status');
  const startDateInput = document.getElementById('hist-start-date');
  const endDateInput = document.getElementById('hist-end-date');
  const resetBtn = document.getElementById('btn-hist-reset');

  const triggerChange = () => loadHistoryTable();

  if (searchInput) searchInput.addEventListener('input', triggerChange);
  if (deptSelect) deptSelect.addEventListener('change', triggerChange);
  if (yearSelect) yearSelect.addEventListener('change', triggerChange);
  if (statusSelect) statusSelect.addEventListener('change', triggerChange);
  if (startDateInput) startDateInput.addEventListener('change', triggerChange);
  if (endDateInput) endDateInput.addEventListener('change', triggerChange);

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (deptSelect) deptSelect.value = 'all';
      if (yearSelect) yearSelect.value = 'all';
      if (statusSelect) statusSelect.value = 'all';
      if (startDateInput) startDateInput.value = '';
      if (endDateInput) endDateInput.value = '';
      loadHistoryTable();
    });
  }
}

function loadHistoryTable() {
  const container = document.getElementById('history-table-body');
  if (!container) return;

  const searchVal = (document.getElementById('hist-search')?.value || '').trim().toLowerCase();
  const dept = document.getElementById('hist-dept')?.value || 'all';
  const year = document.getElementById('hist-year')?.value || 'all';
  const status = document.getElementById('hist-status')?.value || 'all';
  const startDate = document.getElementById('hist-start-date')?.value;
  const endDate = document.getElementById('hist-end-date')?.value;

  const allRecords = Storage.getAttendance();

  let filtered = allRecords.filter(rec => {
    const matchSearch = !searchVal || 
      rec.studentName.toLowerCase().includes(searchVal) || 
      rec.rollNumber.toLowerCase().includes(searchVal);
    const matchDept = dept === 'all' || rec.department === dept;
    const matchYear = year === 'all' || rec.year === year;
    const matchStatus = status === 'all' || rec.status === status;
    const matchStart = !startDate || rec.date >= startDate;
    const matchEnd = !endDate || rec.date <= endDate;

    return matchSearch && matchDept && matchYear && matchStatus && matchStart && matchEnd;
  });

  // Sort newest date first
  filtered.sort((a, b) => b.date.localeCompare(a.date));

  // Compute summary metrics for filtered records
  const totalCount = filtered.length;
  const presentCount = filtered.filter(r => r.status === 'Present').length;
  const absentCount = filtered.filter(r => r.status === 'Absent').length;
  const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 1000) / 10 : 0;

  const elTotal = document.getElementById('hist-summary-total');
  const elPresent = document.getElementById('hist-summary-present');
  const elAbsent = document.getElementById('hist-summary-absent');
  const elPercent = document.getElementById('hist-summary-percent');

  if (elTotal) elTotal.textContent = totalCount;
  if (elPresent) elPresent.textContent = presentCount;
  if (elAbsent) elAbsent.textContent = absentCount;
  if (elPercent) elPercent.textContent = `${percentage}%`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <i class="fa-solid fa-folder-open empty-state-icon"></i>
          <div class="empty-state-title">No attendance records found</div>
          <div class="empty-state-desc">Try clearing or widening your search/date filters.</div>
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = filtered.map(rec => {
    const isPresent = rec.status === 'Present';
    return `
      <tr>
        <td><strong>${formatDate(rec.date)}</strong></td>
        <td><strong>${escapeHtml(rec.rollNumber)}</strong></td>
        <td>${escapeHtml(rec.studentName)}</td>
        <td>${escapeHtml(rec.department)} - ${escapeHtml(rec.year)}</td>
        <td>
          <span class="badge ${isPresent ? 'badge-present' : 'badge-absent'}">
            <i class="fa-solid ${isPresent ? 'fa-check' : 'fa-xmark'}"></i>
            ${escapeHtml(rec.status)}
          </span>
        </td>
        <td>
          <span class="badge badge-student">
            <i class="fa-solid ${rec.markedBy === 'QR' ? 'fa-qrcode' : 'fa-user-pen'}"></i>
            ${escapeHtml(rec.markedBy || 'Manual')}
          </span>
        </td>
        <td>
          <div style="display:flex; gap:6px;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="toggleRecordStatus('${rec.id}')" title="Toggle Present/Absent">
              <i class="fa-solid fa-repeat"></i> Toggle
            </button>
            <button type="button" class="btn btn-danger btn-sm" onclick="confirmDeleteRecord('${rec.id}')" title="Delete Record">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function toggleRecordStatus(recordId) {
  const attendance = Storage.getAttendance();
  const rec = attendance.find(r => r.id === recordId);
  if (!rec) return;

  rec.status = rec.status === 'Present' ? 'Absent' : 'Present';
  rec.timestamp = new Date().toISOString();
  Storage.set(StorageKeys.ATTENDANCE, attendance);

  showToast(`Attendance for ${rec.studentName} updated to ${rec.status}.`, 'success');
  loadHistoryTable();
}

function confirmDeleteRecord(recordId) {
  const attendance = Storage.getAttendance();
  const rec = attendance.find(r => r.id === recordId);
  if (!rec) return;

  showConfirmModal({
    title: 'Delete Attendance Entry',
    message: `Are you sure you want to delete the attendance record for ${rec.studentName} on ${formatDate(rec.date)}?`,
    confirmText: 'Delete Entry',
    confirmClass: 'btn-danger',
    onConfirm: () => {
      Storage.deleteAttendanceRecord(recordId);
      showToast('Attendance record deleted.', 'info');
      loadHistoryTable();
    }
  });
}
