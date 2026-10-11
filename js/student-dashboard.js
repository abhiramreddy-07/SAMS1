/**
 * SAMS - Student Dashboard Controller
 * Displays isolated attendance data and records for the logged-in student only.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Ensure student authentication
  const currentUser = Auth.requireAuth(['student']);
  if (!currentUser) return;

  // Initialize shared UI layout
  App.init(currentUser);

  // Render Student Profile & Metrics
  renderStudentProfile(currentUser);
  renderStudentStats(currentUser);
  renderStudentAttendanceHistory(currentUser);
  renderStudentNotifications(currentUser);

  // Set up filter handlers
  setupFilters(currentUser);
});

function renderStudentProfile(user) {
  const nameEl = document.getElementById('student-profile-name');
  const rollEl = document.getElementById('student-profile-roll');
  const deptEl = document.getElementById('student-profile-dept');
  const yearEl = document.getElementById('student-profile-year');
  const emailEl = document.getElementById('student-profile-email');
  const avatarEl = document.getElementById('student-hero-avatar');

  if (nameEl) nameEl.textContent = user.name || 'Student';
  if (rollEl) rollEl.textContent = user.rollNumber || user.username;
  if (deptEl) deptEl.textContent = user.department || 'General';
  if (yearEl) yearEl.textContent = user.year || 'N/A';
  if (emailEl) emailEl.textContent = user.email || 'N/A';

  if (avatarEl) {
    if (user.avatar) {
      avatarEl.src = user.avatar;
    } else {
      avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Student')}&background=2563eb&color=fff&size=128`;
    }
  }
}

function renderStudentStats(user) {
  const stats = Storage.getStudentStats(user.rollNumber);

  const elTotalDays = document.getElementById('student-stat-total-days');
  const elPresent = document.getElementById('student-stat-present');
  const elAbsent = document.getElementById('student-stat-absent');
  const elPercentage = document.getElementById('student-stat-percentage');
  const elProgressBar = document.getElementById('student-stat-progress-bar');
  const elEligibilityBadge = document.getElementById('student-eligibility-badge');

  if (elTotalDays) elTotalDays.textContent = stats.totalDays;
  if (elPresent) elPresent.textContent = stats.presentDays;
  if (elAbsent) elAbsent.textContent = stats.absentDays;
  if (elPercentage) elPercentage.textContent = `${stats.percentage}%`;

  if (elProgressBar) {
    elProgressBar.style.width = `${Math.min(stats.percentage, 100)}%`;
    if (stats.percentage >= 75) {
      elProgressBar.className = 'progress-bar-fill progress-fill-green';
    } else if (stats.percentage >= 60) {
      elProgressBar.className = 'progress-bar-fill progress-fill-amber';
    } else {
      elProgressBar.className = 'progress-bar-fill progress-fill-red';
    }
  }

  if (elEligibilityBadge) {
    if (stats.totalDays === 0) {
      elEligibilityBadge.innerHTML = '<span class="badge badge-student"><i class="fa-solid fa-clock"></i> No Attendance Recorded Yet</span>';
    } else if (stats.percentage >= 75) {
      elEligibilityBadge.innerHTML = '<span class="badge badge-present"><i class="fa-solid fa-shield-check"></i> Eligible for Semester Examinations (&ge; 75%)</span>';
    } else {
      elEligibilityBadge.innerHTML = '<span class="badge badge-absent"><i class="fa-solid fa-triangle-exclamation"></i> Critical Shortage Warning (&lt; 75%)</span>';
    }
  }

  // Monthly breakdown chart
  renderMonthlyChart(user);
}

function renderMonthlyChart(user) {
  const chartCanvas = document.getElementById('chart-student-monthly');
  if (!chartCanvas || typeof Chart === 'undefined') return;

  const attendance = Storage.getAttendance();
  const studentRecords = attendance.filter(r => r.rollNumber.toLowerCase() === user.rollNumber.toLowerCase());

  // Group by month
  const monthlyData = {};
  studentRecords.forEach(rec => {
    const monthKey = rec.date.substring(0, 7); // YYYY-MM
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { present: 0, total: 0 };
    }
    monthlyData[monthKey].total++;
    if (rec.status === 'Present') monthlyData[monthKey].present++;
  });

  const sortedMonths = Object.keys(monthlyData).sort();
  const labels = sortedMonths.map(m => {
    const [y, mon] = m.split('-');
    const date = new Date(y, mon - 1, 1);
    return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  });

  const percentages = sortedMonths.map(m => {
    const data = monthlyData[m];
    return data.total > 0 ? Math.round((data.present / data.total) * 1000) / 10 : 0;
  });

  new Chart(chartCanvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: labels.length ? labels : ['Current Term'],
      datasets: [{
        label: 'Monthly Attendance %',
        data: percentages.length ? percentages : [0],
        backgroundColor: '#2563eb',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: {
            callback: (val) => `${val}%`
          }
        }
      }
    }
  });
}

function renderStudentAttendanceHistory(user, filterOptions = {}) {
  const container = document.getElementById('student-history-table-body');
  if (!container) return;

  const attendance = Storage.getAttendance();
  let records = attendance.filter(r => r.rollNumber.toLowerCase() === user.rollNumber.toLowerCase());

  // Apply filters
  if (filterOptions.status && filterOptions.status !== 'all') {
    records = records.filter(r => r.status.toLowerCase() === filterOptions.status.toLowerCase());
  }
  if (filterOptions.startDate) {
    records = records.filter(r => r.date >= filterOptions.startDate);
  }
  if (filterOptions.endDate) {
    records = records.filter(r => r.date <= filterOptions.endDate);
  }

  // Sort newest first
  records.sort((a, b) => b.date.localeCompare(a.date));

  if (records.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          <i class="fa-solid fa-calendar-xmark empty-state-icon"></i>
          <div class="empty-state-title">No matching attendance records found</div>
          <div class="empty-state-desc">Try clearing the date or status filters.</div>
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = records.map(rec => `
    <tr>
      <td><strong>${formatDate(rec.date)}</strong></td>
      <td>${escapeHtml(rec.department)} - ${escapeHtml(rec.year)}</td>
      <td>
        <span class="badge ${rec.status === 'Present' ? 'badge-present' : 'badge-absent'}">
          <i class="fa-solid ${rec.status === 'Present' ? 'fa-check' : 'fa-xmark'}"></i>
          ${escapeHtml(rec.status)}
        </span>
      </td>
      <td>
        <span class="badge badge-student">
          <i class="fa-solid ${rec.markedBy === 'QR' ? 'fa-qrcode' : 'fa-user-pen'}"></i>
          ${escapeHtml(rec.markedBy || 'Manual')}
        </span>
      </td>
      <td><small class="text-muted">${formatDateTime(rec.timestamp)}</small></td>
    </tr>
  `).join('');
}

function renderStudentNotifications(user) {
  const container = document.getElementById('student-notifications-list');
  if (!container) return;

  const notifications = Storage.getNotificationsForUser(user);

  if (notifications.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-bell-slash empty-state-icon"></i>
        <div class="empty-state-title">No notifications</div>
        <div class="empty-state-desc">You are all caught up with official updates!</div>
      </div>
    `;
    return;
  }

  container.innerHTML = notifications.map(notif => `
    <div class="notification-card notif-${notif.type || 'info'}">
      <div class="notification-icon">
        <i class="fa-solid ${notif.type === 'warning' ? 'fa-triangle-exclamation' : notif.type === 'danger' ? 'fa-circle-exclamation' : 'fa-bullhorn'}"></i>
      </div>
      <div class="notification-content">
        <div class="notification-header">
          <h4 class="notification-title">${escapeHtml(notif.title)}</h4>
          <span class="notification-time">${formatDate(notif.createdAt)}</span>
        </div>
        <p class="notification-text">${escapeHtml(notif.message)}</p>
        <div style="margin-top: 6px; font-size: 0.75rem; color: var(--slate-400);">
          From: ${escapeHtml(notif.createdBy || 'Administration')}
        </div>
      </div>
    </div>
  `).join('');
}

function setupFilters(user) {
  const filterForm = document.getElementById('student-filter-form');
  const btnReset = document.getElementById('student-filter-reset');

  if (filterForm) {
    filterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const status = document.getElementById('filter-status').value;
      const startDate = document.getElementById('filter-start-date').value;
      const endDate = document.getElementById('filter-end-date').value;

      renderStudentAttendanceHistory(user, { status, startDate, endDate });
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (document.getElementById('filter-status')) document.getElementById('filter-status').value = 'all';
      if (document.getElementById('filter-start-date')) document.getElementById('filter-start-date').value = '';
      if (document.getElementById('filter-end-date')) document.getElementById('filter-end-date').value = '';
      renderStudentAttendanceHistory(user, {});
    });
  }
}
