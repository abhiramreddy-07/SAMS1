/**
 * SAMS - Admin Dashboard Controller
 * Displays key metrics, attendance summaries, Chart.js visuals, and recent activities.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Ensure authentication for admin
  const currentUser = Auth.requireAuth(['admin']);
  if (!currentUser) return;

  // Initialize shared UI layout
  App.init(currentUser);

  // Render Dashboard Data
  renderDashboardStats();
  renderAttendanceCharts();
  renderRecentActivity();
});

function renderDashboardStats() {
  const students = Storage.getStudents();
  const attendance = Storage.getAttendance();
  const today = getTodayDateString();

  const totalStudents = students.length;
  const totalAttendanceRecords = attendance.length;

  // Today's attendance
  const todayRecords = attendance.filter(r => r.date === today);
  const presentToday = todayRecords.filter(r => r.status === 'Present').length;
  const absentToday = todayRecords.filter(r => r.status === 'Absent').length;

  // Average attendance percentage across all records
  let avgPercentage = 0;
  if (totalAttendanceRecords > 0) {
    const totalPresent = attendance.filter(r => r.status === 'Present').length;
    avgPercentage = Math.round((totalPresent / totalAttendanceRecords) * 1000) / 10;
  }

  // Update DOM elements
  const elTotalStudents = document.getElementById('stat-total-students');
  const elTotalRecords = document.getElementById('stat-total-records');
  const elPresentToday = document.getElementById('stat-present-today');
  const elAbsentToday = document.getElementById('stat-absent-today');
  const elAvgAttendance = document.getElementById('stat-avg-attendance');

  if (elTotalStudents) elTotalStudents.textContent = totalStudents;
  if (elTotalRecords) elTotalRecords.textContent = totalAttendanceRecords;
  if (elPresentToday) elPresentToday.textContent = presentToday;
  if (elAbsentToday) elAbsentToday.textContent = absentToday;
  if (elAvgAttendance) elAvgAttendance.textContent = `${avgPercentage}%`;
}

function renderAttendanceCharts() {
  const attendance = Storage.getAttendance();
  const students = Storage.getStudents();

  // 1. Weekly / Recent Days Trend
  const datesMap = {};
  attendance.forEach(rec => {
    if (!datesMap[rec.date]) {
      datesMap[rec.date] = { present: 0, absent: 0 };
    }
    if (rec.status === 'Present') datesMap[rec.date].present++;
    else datesMap[rec.date].absent++;
  });

  const sortedDates = Object.keys(datesMap).sort().slice(-7);
  const labels = sortedDates.map(d => formatDate(d));
  const presentData = sortedDates.map(d => datesMap[d].present);
  const absentData = sortedDates.map(d => datesMap[d].absent);

  // 2. Department-wise Attendance
  const deptMap = {};
  attendance.forEach(rec => {
    const dept = rec.department || 'Other';
    if (!deptMap[dept]) {
      deptMap[dept] = { present: 0, total: 0 };
    }
    deptMap[dept].total++;
    if (rec.status === 'Present') deptMap[dept].present++;
  });

  const deptLabels = Object.keys(deptMap);
  const deptPercentages = deptLabels.map(dept => {
    const d = deptMap[dept];
    return d.total > 0 ? Math.round((d.present / d.total) * 1000) / 10 : 0;
  });

  // Check if Chart.js is available
  if (typeof Chart !== 'undefined') {
    // Trend Chart
    const trendCtx = document.getElementById('chart-attendance-trend');
    if (trendCtx) {
      new Chart(trendCtx.getContext('2d'), {
        type: 'bar',
        data: {
          labels: labels.length ? labels : ['No Data'],
          datasets: [
            {
              label: 'Present',
              data: presentData.length ? presentData : [0],
              backgroundColor: '#10b981',
              borderRadius: 4
            },
            {
              label: 'Absent',
              data: absentData.length ? absentData : [0],
              backgroundColor: '#ef4444',
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top' }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { precision: 0 }
            }
          }
        }
      });
    }

    // Department Chart
    const deptCtx = document.getElementById('chart-dept-attendance');
    if (deptCtx) {
      new Chart(deptCtx.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: deptLabels.length ? deptLabels : ['General'],
          datasets: [{
            data: deptPercentages.length ? deptPercentages : [100],
            backgroundColor: [
              '#2563eb',
              '#3b82f6',
              '#60a5fa',
              '#93c5fd',
              '#10b981'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' },
            tooltip: {
              callbacks: {
                label: (context) => `${context.label}: ${context.raw}%`
              }
            }
          }
        }
      });
    }
  } else {
    console.warn('Chart.js library not loaded; charts display fallback text.');
    const trendContainer = document.getElementById('trend-chart-container');
    if (trendContainer) {
      trendContainer.innerHTML = '<div class="empty-state"><i class="fa-solid fa-chart-line empty-state-icon"></i><p>Chart.js is offline. Attendance records are safely stored.</p></div>';
    }
  }
}

function renderRecentActivity() {
  const container = document.getElementById('recent-activity-table-body');
  if (!container) return;

  const attendance = Storage.getAttendance();
  // Sort descending by timestamp or date
  const sorted = [...attendance].sort((a, b) => {
    const tA = a.timestamp || a.date;
    const tB = b.timestamp || b.date;
    return tB.localeCompare(tA);
  }).slice(0, 8);

  if (sorted.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <i class="fa-solid fa-clipboard-list empty-state-icon"></i>
          <div class="empty-state-title">No attendance records yet</div>
          <div class="empty-state-desc">Mark attendance from the sidebar to populate records.</div>
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = sorted.map(rec => `
    <tr>
      <td><strong>${escapeHtml(rec.rollNumber)}</strong></td>
      <td>${escapeHtml(rec.studentName)}</td>
      <td>${escapeHtml(rec.department)}</td>
      <td>${formatDate(rec.date)}</td>
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
    </tr>
  `).join('');
}
