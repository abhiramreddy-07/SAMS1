/**
 * SAMS - Reports Controller
 * Supports 4 report types: Daily, Date-Range, Student-Wise, and Department Summary.
 * Includes CSV export download and print layout generation.
 */

let currentReportData = [];
let currentReportType = 'daily';

document.addEventListener('DOMContentLoaded', () => {
  // Ensure admin authentication
  const currentUser = Auth.requireAuth(['admin']);
  if (!currentUser) return;

  App.init(currentUser);

  initReports();
  setupEventListeners();
});

function initReports() {
  const today = getTodayDateString();
  const dailyDate = document.getElementById('report-daily-date');
  const startDate = document.getElementById('report-start-date');
  const endDate = document.getElementById('report-end-date');

  if (dailyDate) {
    dailyDate.value = today;
    dailyDate.max = today;
  }
  if (startDate) startDate.value = today;
  if (endDate) {
    endDate.value = today;
    endDate.max = today;
  }

  // Populate Student Select dropdown for student-wise report
  const studentSelect = document.getElementById('report-student-select');
  if (studentSelect) {
    const students = Storage.getStudents();
    studentSelect.innerHTML = '<option value="">-- Choose Student --</option>' + 
      students.map(s => `<option value="${escapeHtml(s.rollNumber)}">${escapeHtml(s.rollNumber)} - ${escapeHtml(s.name)} (${escapeHtml(s.department)})</option>`).join('');
  }

  generateReport();
}

function setupEventListeners() {
  // Report type tabs
  const typeRadios = document.querySelectorAll('input[name="report-type"]');
  typeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      currentReportType = radio.value;
      updateFilterControlsVisibility();
      generateReport();
    });
  });

  // Filter triggers
  const form = document.getElementById('report-filter-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      generateReport();
    });
  }

  // Export CSV
  const btnExport = document.getElementById('btn-export-csv');
  if (btnExport) {
    btnExport.addEventListener('click', exportToCsv);
  }

  // Print Report
  const btnPrint = document.getElementById('btn-print-report');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }
}

function updateFilterControlsVisibility() {
  const boxDaily = document.getElementById('filter-group-daily');
  const boxRange = document.getElementById('filter-group-range');
  const boxStudent = document.getElementById('filter-group-student');
  const boxDept = document.getElementById('filter-group-dept');

  if (boxDaily) boxDaily.style.display = currentReportType === 'daily' ? 'block' : 'none';
  if (boxRange) boxRange.style.display = currentReportType === 'range' ? 'block' : 'none';
  if (boxStudent) boxStudent.style.display = currentReportType === 'student' ? 'block' : 'none';
  if (boxDept) boxDept.style.display = (currentReportType !== 'student') ? 'block' : 'none';
}

function generateReport() {
  const dept = document.getElementById('report-dept-select')?.value || 'all';

  if (currentReportType === 'daily') {
    generateDailyReport(dept);
  } else if (currentReportType === 'range') {
    generateRangeReport(dept);
  } else if (currentReportType === 'student') {
    generateStudentReport();
  } else if (currentReportType === 'dept_summary') {
    generateDeptSummaryReport();
  }
}

/* 1. Daily Report */
function generateDailyReport(dept) {
  const date = document.getElementById('report-daily-date')?.value || getTodayDateString();
  const allRecords = Storage.getAttendance();

  let records = allRecords.filter(r => r.date === date);
  if (dept !== 'all') {
    records = records.filter(r => r.department === dept);
  }

  records.sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));

  const total = records.length;
  const present = records.filter(r => r.status === 'Present').length;
  const absent = records.filter(r => r.status === 'Absent').length;
  const percentage = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;

  updateSummaryWidgets({
    title: `Daily Attendance Report (${formatDate(date)})`,
    subtitle: dept === 'all' ? 'All Departments' : `Department: ${dept}`,
    stat1: { label: 'Total Marked', val: total },
    stat2: { label: 'Present', val: present },
    stat3: { label: 'Absent', val: absent },
    stat4: { label: 'Attendance Rate', val: `${percentage}%` }
  });

  currentReportData = records.map(r => ({
    Date: r.date,
    'Roll Number': r.rollNumber,
    'Student Name': r.studentName,
    Department: r.department,
    Year: r.year,
    Status: r.status,
    'Marked By': r.markedBy || 'Manual'
  }));

  renderReportTable(['Date', 'Roll Number', 'Student Name', 'Department', 'Year', 'Status', 'Marked By'], records.map(r => `
    <tr>
      <td>${formatDate(r.date)}</td>
      <td><strong>${escapeHtml(r.rollNumber)}</strong></td>
      <td>${escapeHtml(r.studentName)}</td>
      <td>${escapeHtml(r.department)}</td>
      <td>${escapeHtml(r.year)}</td>
      <td>
        <span class="badge ${r.status === 'Present' ? 'badge-present' : 'badge-absent'}">
          ${escapeHtml(r.status)}
        </span>
      </td>
      <td>${escapeHtml(r.markedBy || 'Manual')}</td>
    </tr>
  `));
}

/* 2. Range Report */
function generateRangeReport(dept) {
  const startDate = document.getElementById('report-start-date')?.value || getTodayDateString();
  const endDate = document.getElementById('report-end-date')?.value || getTodayDateString();
  const allRecords = Storage.getAttendance();

  let records = allRecords.filter(r => r.date >= startDate && r.date <= endDate);
  if (dept !== 'all') {
    records = records.filter(r => r.department === dept);
  }

  records.sort((a, b) => b.date.localeCompare(a.date));

  const total = records.length;
  const present = records.filter(r => r.status === 'Present').length;
  const absent = records.filter(r => r.status === 'Absent').length;
  const percentage = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;

  updateSummaryWidgets({
    title: `Date-Range Attendance Report (${formatDate(startDate)} to ${formatDate(endDate)})`,
    subtitle: dept === 'all' ? 'All Departments' : `Department: ${dept}`,
    stat1: { label: 'Total Records', val: total },
    stat2: { label: 'Total Present', val: present },
    stat3: { label: 'Total Absent', val: absent },
    stat4: { label: 'Average Attendance', val: `${percentage}%` }
  });

  currentReportData = records.map(r => ({
    Date: r.date,
    'Roll Number': r.rollNumber,
    'Student Name': r.studentName,
    Department: r.department,
    Year: r.year,
    Status: r.status,
    'Marked By': r.markedBy || 'Manual'
  }));

  renderReportTable(['Date', 'Roll Number', 'Student Name', 'Department', 'Year', 'Status', 'Marked By'], records.map(r => `
    <tr>
      <td>${formatDate(r.date)}</td>
      <td><strong>${escapeHtml(r.rollNumber)}</strong></td>
      <td>${escapeHtml(r.studentName)}</td>
      <td>${escapeHtml(r.department)}</td>
      <td>${escapeHtml(r.year)}</td>
      <td>
        <span class="badge ${r.status === 'Present' ? 'badge-present' : 'badge-absent'}">
          ${escapeHtml(r.status)}
        </span>
      </td>
      <td>${escapeHtml(r.markedBy || 'Manual')}</td>
    </tr>
  `));
}

/* 3. Student-Wise Report */
function generateStudentReport() {
  const roll = document.getElementById('report-student-select')?.value;
  if (!roll) {
    updateSummaryWidgets({
      title: 'Student-Wise Attendance Report',
      subtitle: 'Please select a student from the dropdown filter above.',
      stat1: { label: 'Working Days', val: 0 },
      stat2: { label: 'Present', val: 0 },
      stat3: { label: 'Absent', val: 0 },
      stat4: { label: 'Attendance Rate', val: '0%' }
    });
    renderReportTable(['Date', 'Department', 'Year', 'Status', 'Marked Via'], []);
    currentReportData = [];
    return;
  }

  const student = Storage.getStudentByRoll(roll);
  const stats = Storage.getStudentStats(roll);
  const allRecords = Storage.getAttendance();
  const records = allRecords.filter(r => r.rollNumber.toLowerCase() === roll.toLowerCase());

  records.sort((a, b) => b.date.localeCompare(a.date));

  updateSummaryWidgets({
    title: `Attendance Report: ${student ? student.name : roll} (${roll})`,
    subtitle: student ? `${student.department} - ${student.year} | Mobile: ${student.mobile}` : '',
    stat1: { label: 'Working Days', val: stats.totalDays },
    stat2: { label: 'Present Days', val: stats.presentDays },
    stat3: { label: 'Absent Days', val: stats.absentDays },
    stat4: { label: 'Attendance %', val: `${stats.percentage}%` }
  });

  currentReportData = records.map(r => ({
    'Roll Number': r.rollNumber,
    'Student Name': r.studentName,
    Date: r.date,
    Department: r.department,
    Status: r.status,
    'Marked By': r.markedBy || 'Manual'
  }));

  renderReportTable(['Date', 'Department', 'Year', 'Status', 'Marked Via'], records.map(r => `
    <tr>
      <td>${formatDate(r.date)}</td>
      <td>${escapeHtml(r.department)}</td>
      <td>${escapeHtml(r.year)}</td>
      <td>
        <span class="badge ${r.status === 'Present' ? 'badge-present' : 'badge-absent'}">
          ${escapeHtml(r.status)}
        </span>
      </td>
      <td>${escapeHtml(r.markedBy || 'Manual')}</td>
    </tr>
  `));
}

/* 4. Department-Wise Summary */
function generateDeptSummaryReport() {
  const students = Storage.getStudents();
  const attendance = Storage.getAttendance();

  // Distinct departments
  const depts = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Information Technology'];

  const rows = depts.map(dept => {
    const deptStudents = students.filter(s => s.department === dept);
    const deptAttendance = attendance.filter(r => r.department === dept);

    const totalRecords = deptAttendance.length;
    const presentRecords = deptAttendance.filter(r => r.status === 'Present').length;
    const absentRecords = deptAttendance.filter(r => r.status === 'Absent').length;
    const percentage = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 1000) / 10 : 0;

    return {
      department: dept,
      studentCount: deptStudents.length,
      totalRecords,
      presentRecords,
      absentRecords,
      percentage
    };
  });

  updateSummaryWidgets({
    title: 'Department-Wise Attendance Performance Summary',
    subtitle: 'Comparative analysis of all institutional faculties',
    stat1: { label: 'Total Departments', val: depts.length },
    stat2: { label: 'Enrolled Students', val: students.length },
    stat3: { label: 'Total Records', val: attendance.length },
    stat4: { label: 'Campus Attendance', val: Storage.getOverallStats().averagePercentage + '%' }
  });

  currentReportData = rows.map(r => ({
    Department: r.department,
    'Total Students': r.studentCount,
    'Total Recorded Sessions': r.totalRecords,
    'Present Count': r.presentRecords,
    'Absent Count': r.absentRecords,
    'Attendance Rate %': `${r.percentage}%`
  }));

  renderReportTable(['Department', 'Total Students', 'Total Recorded Sessions', 'Present Count', 'Absent Count', 'Average %'], rows.map(r => `
    <tr>
      <td><strong>${escapeHtml(r.department)}</strong></td>
      <td>${r.studentCount}</td>
      <td>${r.totalRecords}</td>
      <td><span style="color:var(--success-600); font-weight:600;">${r.presentRecords}</span></td>
      <td><span style="color:var(--danger-600); font-weight:600;">${r.absentRecords}</span></td>
      <td>
        <span class="badge ${r.percentage >= 75 ? 'badge-present' : 'badge-absent'}">
          ${r.percentage}%
        </span>
      </td>
    </tr>
  `));
}

function updateSummaryWidgets({ title, subtitle, stat1, stat2, stat3, stat4 }) {
  const titleEl = document.getElementById('report-header-title');
  const subtitleEl = document.getElementById('report-header-subtitle');
  if (titleEl) titleEl.textContent = title;
  if (subtitleEl) subtitleEl.textContent = subtitle;

  const printTitle = document.getElementById('print-report-title');
  const printSub = document.getElementById('print-report-subtitle');
  if (printTitle) printTitle.textContent = title;
  if (printSub) printSub.textContent = subtitle;

  const s1L = document.getElementById('rep-s1-label');
  const s1V = document.getElementById('rep-s1-val');
  const s2L = document.getElementById('rep-s2-label');
  const s2V = document.getElementById('rep-s2-val');
  const s3L = document.getElementById('rep-s3-label');
  const s3V = document.getElementById('rep-s3-val');
  const s4L = document.getElementById('rep-s4-label');
  const s4V = document.getElementById('rep-s4-val');

  if (s1L) s1L.textContent = stat1.label;
  if (s1V) s1V.textContent = stat1.val;
  if (s2L) s2L.textContent = stat2.label;
  if (s2V) s2V.textContent = stat2.val;
  if (s3L) s3L.textContent = stat3.label;
  if (s3V) s3V.textContent = stat3.val;
  if (s4L) s4L.textContent = stat4.label;
  if (s4V) s4V.textContent = stat4.val;
}

function renderReportTable(headers, rowHtmlArray) {
  const headEl = document.getElementById('report-table-head');
  const bodyEl = document.getElementById('report-table-body');
  if (!headEl || !bodyEl) return;

  headEl.innerHTML = `<tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`;

  if (rowHtmlArray.length === 0) {
    bodyEl.innerHTML = `
      <tr>
        <td colspan="${headers.length}" class="empty-state">
          <i class="fa-solid fa-file-excel empty-state-icon"></i>
          <div class="empty-state-title">No records found for current criteria</div>
          <div class="empty-state-desc">Try modifying the selected date, department, or student.</div>
        </td>
      </tr>
    `;
    return;
  }

  bodyEl.innerHTML = rowHtmlArray.join('');
}

function exportToCsv() {
  if (!currentReportData || currentReportData.length === 0) {
    showToast('No data available to export.', 'warning');
    return;
  }

  const keys = Object.keys(currentReportData[0]);
  let csvContent = '\uFEFF'; // UTF-8 BOM for Excel compatibility

  // Header row
  csvContent += keys.map(k => `"${k.replace(/"/g, '""')}"`).join(',') + '\r\n';

  // Data rows
  currentReportData.forEach(row => {
    const line = keys.map(k => {
      const val = row[k] !== undefined && row[k] !== null ? String(row[k]) : '';
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',');
    csvContent += line + '\r\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  const dateStr = getTodayDateString();

  downloadLink.href = url;
  downloadLink.download = `SAMS_Attendance_Report_${currentReportType}_${dateStr}.csv`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  showToast('Report CSV successfully generated and downloaded.', 'success');
}
