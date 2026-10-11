/**
 * SAMS - QR Code Attendance Controller
 * Handles Session QR code generation for Admin/Faculty,
 * and Camera-based QR Scanning + Manual Code Fallback for Students.
 */

let activeScanner = null;
let currentAdminSession = null;

document.addEventListener('DOMContentLoaded', () => {
  // Authentication: both Admin and Student can access this page,
  // but they see different interfaces tailored to their role.
  const currentUser = Auth.requireAuth(['admin', 'student']);
  if (!currentUser) return;

  App.init(currentUser);

  if (currentUser.role === 'admin') {
    setupAdminQrView(currentUser);
  } else {
    setupStudentQrView(currentUser);
  }
});

/* ==========================================================================
   ADMIN WORKFLOW: Generate & Display Session QR Code
   ========================================================================== */

function setupAdminQrView(user) {
  const adminSection = document.getElementById('qr-admin-section');
  const studentSection = document.getElementById('qr-student-section');

  if (adminSection) adminSection.style.display = 'block';
  if (studentSection) studentSection.style.display = 'none';

  // Set default date to today
  const dateInput = document.getElementById('qr-gen-date');
  if (dateInput) {
    dateInput.value = getTodayDateString();
    dateInput.max = getTodayDateString();
  }

  // Load existing active session if any
  const sessions = Storage.getQrSessions();
  const today = getTodayDateString();
  const existingTodaySession = sessions.find(s => s.date === today && !s.expired);
  if (existingTodaySession) {
    displayAdminSession(existingTodaySession);
  }

  // Form submit
  const genForm = document.getElementById('qr-generation-form');
  if (genForm) {
    genForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const department = document.getElementById('qr-gen-dept').value;
      const year = document.getElementById('qr-gen-year').value;
      const date = document.getElementById('qr-gen-date').value;
      const duration = parseInt(document.getElementById('qr-gen-duration').value, 10) || 30;

      if (!department || !year || !date) {
        showToast('Please select Department, Academic Year, and Date.', 'warning');
        return;
      }

      if (isFutureDate(date)) {
        showToast('Cannot generate QR session for a future date.', 'danger');
        return;
      }

      const session = Storage.createQrSession({
        department,
        year,
        date,
        validMinutes: duration,
        createdBy: user.name || 'Faculty Admin'
      });

      showToast('Attendance QR Session generated successfully!', 'success');
      displayAdminSession(session);
    });
  }
}

function displayAdminSession(session) {
  currentAdminSession = session;
  const container = document.getElementById('qr-display-container');
  const qrCanvasTarget = document.getElementById('qr-canvas-holder');
  const codeEl = document.getElementById('qr-display-code');
  const detailsEl = document.getElementById('qr-display-details');
  const expiresEl = document.getElementById('qr-display-expires');

  if (container) container.style.display = 'block';
  if (codeEl) codeEl.textContent = session.code;
  if (detailsEl) detailsEl.textContent = `${session.department} - ${session.year} | ${formatDate(session.date)}`;

  if (expiresEl) {
    const expDate = new Date(session.expiresAt);
    expiresEl.textContent = `Valid until ${expDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  }

  // Generate QR Code using QRCode library or SVG fallback
  if (qrCanvasTarget) {
    qrCanvasTarget.innerHTML = '';
    renderQrCode(qrCanvasTarget, session.code);
  }

  // Refresh live attendees list
  refreshSessionAttendees(session);
}

function renderQrCode(targetElement, text) {
  // If QRCode.js CDN is loaded
  if (typeof QRCode !== 'undefined') {
    try {
      new QRCode(targetElement, {
        text: text,
        width: 220,
        height: 220,
        colorDark: '#0f172a',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });
      return;
    } catch (e) {
      console.warn('QRCode library error:', e);
    }
  }

  // Fallback visual QR Representation
  targetElement.innerHTML = `
    <div style="width:200px; height:200px; border:2px dashed var(--primary-600); display:flex; flex-direction:column; align-items:center; justify-content:center; padding:12px; text-align:center; background:#f8fafc; border-radius:8px;">
      <i class="fa-solid fa-qrcode" style="font-size:4rem; color:var(--primary-600); margin-bottom:8px;"></i>
      <strong style="font-size:0.85rem; color:var(--slate-800);">${escapeHtml(text)}</strong>
      <small style="font-size:0.7rem; color:var(--slate-500); margin-top:4px;">Students scan or enter code</small>
    </div>
  `;
}

function refreshSessionAttendees(session) {
  const tableBody = document.getElementById('qr-attendees-table-body');
  const countBadge = document.getElementById('qr-attendees-count');
  if (!tableBody) return;

  const attendance = Storage.getAttendance();
  const sessionRecords = attendance.filter(r => 
    r.date === session.date && 
    (session.department === 'all' || r.department === session.department) &&
    r.markedBy === 'QR'
  );

  if (countBadge) countBadge.textContent = `${sessionRecords.length} Students Checked In`;

  if (sessionRecords.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state" style="padding:24px;">
          <i class="fa-solid fa-user-clock empty-state-icon" style="font-size:2rem;"></i>
          <div class="empty-state-title" style="font-size:0.95rem;">Awaiting check-ins</div>
          <div class="empty-state-desc" style="font-size:0.8rem;">Students scanning this QR code will appear here in real-time.</div>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = sessionRecords.map(rec => `
    <tr>
      <td><strong>${escapeHtml(rec.rollNumber)}</strong></td>
      <td>${escapeHtml(rec.studentName)}</td>
      <td>${escapeHtml(rec.department)}</td>
      <td><span class="badge badge-present"><i class="fa-solid fa-check"></i> ${formatDateTime(rec.timestamp)}</span></td>
    </tr>
  `).join('');
}

/* ==========================================================================
   STUDENT WORKFLOW: Scan QR or Enter Session Code Fallback
   ========================================================================== */

function setupStudentQrView(user) {
  const adminSection = document.getElementById('qr-admin-section');
  const studentSection = document.getElementById('qr-student-section');

  if (adminSection) adminSection.style.display = 'none';
  if (studentSection) studentSection.style.display = 'block';

  // Display student identity confirmation
  const infoEl = document.getElementById('student-qr-info');
  if (infoEl) {
    infoEl.textContent = `Signed in as: ${user.name} (${user.rollNumber}) - ${user.department}`;
  }

  // Camera start button
  const startCameraBtn = document.getElementById('btn-start-camera');
  const stopCameraBtn = document.getElementById('btn-stop-camera');
  const scannerContainer = document.getElementById('qr-reader-container');

  if (startCameraBtn) {
    startCameraBtn.addEventListener('click', () => {
      startQrScanner(user);
    });
  }

  if (stopCameraBtn) {
    stopCameraBtn.addEventListener('click', () => {
      stopQrScanner();
    });
  }

  // Manual fallback form
  const manualForm = document.getElementById('qr-manual-form');
  if (manualForm) {
    manualForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const codeInput = document.getElementById('qr-manual-code').value.trim();
      if (!codeInput) {
        showToast('Please enter the session code displayed on the screen.', 'warning');
        return;
      }
      processQrAttendance(codeInput, user);
    });
  }
}

function startQrScanner(user) {
  const readerElement = document.getElementById('qr-reader');
  const startBtn = document.getElementById('btn-start-camera');
  const stopBtn = document.getElementById('btn-stop-camera');
  const feedbackEl = document.getElementById('qr-scan-feedback');

  if (typeof Html5Qrcode === 'undefined') {
    if (feedbackEl) {
      feedbackEl.innerHTML = `
        <div class="toast-item toast-warning" style="margin-top:10px;">
          <i class="fa-solid fa-camera-slash toast-icon"></i>
          <div>Camera scanner library is offline or unavailable. Please use the <strong>Manual Session Code</strong> input below.</div>
        </div>
      `;
    }
    return;
  }

  try {
    if (activeScanner) {
      activeScanner.stop().catch(() => {});
    }

    activeScanner = new Html5Qrcode('qr-reader');
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    activeScanner.start(
      { facingMode: 'environment' },
      config,
      (decodedText) => {
        // Successful QR scan
        stopQrScanner();
        processQrAttendance(decodedText, user);
      },
      (errorMessage) => {
        // Scanning frame without QR; keep scanning silently
      }
    ).then(() => {
      if (startBtn) startBtn.style.display = 'none';
      if (stopBtn) stopBtn.style.display = 'inline-flex';
      if (feedbackEl) feedbackEl.innerHTML = '<span class="text-muted"><i class="fa-solid fa-spinner fa-spin"></i> Point your camera at the session QR code...</span>';
    }).catch(err => {
      console.warn('Camera access denied or failed:', err);
      if (feedbackEl) {
        feedbackEl.innerHTML = `
          <div class="toast-item toast-warning" style="margin-top:10px;">
            <i class="fa-solid fa-triangle-exclamation toast-icon"></i>
            <div>Camera access was denied or not supported on this browser. Please use the <strong>Manual Session Code</strong> input below.</div>
          </div>
        `;
      }
    });
  } catch (err) {
    console.warn('Error starting scanner:', err);
  }
}

function stopQrScanner() {
  if (activeScanner) {
    activeScanner.stop().then(() => {
      activeScanner.clear();
      activeScanner = null;
    }).catch(() => {
      activeScanner = null;
    });
  }

  const startBtn = document.getElementById('btn-start-camera');
  const stopBtn = document.getElementById('btn-stop-camera');
  const feedbackEl = document.getElementById('qr-scan-feedback');

  if (startBtn) startBtn.style.display = 'inline-flex';
  if (stopBtn) stopBtn.style.display = 'none';
  if (feedbackEl) feedbackEl.innerHTML = '';
}

function processQrAttendance(rawCode, user) {
  const resultCard = document.getElementById('qr-result-card');
  const resultMsg = document.getElementById('qr-result-message');

  // Verify session with Storage
  const session = Storage.getActiveQrSessionByCode(rawCode);

  if (!session) {
    showToast('Invalid session code. Please verify the code displayed by your faculty.', 'danger');
    if (resultCard) {
      resultCard.style.display = 'block';
      resultCard.className = 'notification-card notif-danger';
      resultMsg.innerHTML = '<strong>Validation Failed:</strong> The session code is invalid or does not exist.';
    }
    return;
  }

  if (session.expired) {
    showToast('This QR attendance session has expired.', 'danger');
    if (resultCard) {
      resultCard.style.display = 'block';
      resultCard.className = 'notification-card notif-danger';
      resultMsg.innerHTML = '<strong>Session Expired:</strong> This QR code is no longer valid. Ask faculty for a new session.';
    }
    return;
  }

  // Check department match if session is department-specific
  if (session.department !== 'all' && user.department && user.department !== session.department) {
    showToast(`Session mismatch: This session is for ${session.department}, but you belong to ${user.department}.`, 'danger');
    if (resultCard) {
      resultCard.style.display = 'block';
      resultCard.className = 'notification-card notif-danger';
      resultMsg.innerHTML = `<strong>Department Mismatch:</strong> This session was generated for <strong>${session.department}</strong>.`;
    }
    return;
  }

  // Record Attendance for this student
  const markResult = Storage.markSingleAttendance({
    rollNumber: user.rollNumber,
    date: session.date,
    status: 'Present',
    markedBy: 'QR'
  });

  if (!markResult.success) {
    showToast(markResult.message, 'warning');
    if (resultCard) {
      resultCard.style.display = 'block';
      resultCard.className = 'notification-card notif-warning';
      resultMsg.innerHTML = `<strong>Already Recorded:</strong> ${escapeHtml(markResult.message)}`;
    }
    return;
  }

  // Success
  showToast('Attendance recorded successfully via QR session!', 'success');
  if (resultCard) {
    resultCard.style.display = 'block';
    resultCard.className = 'notification-card notif-info';
    resultMsg.innerHTML = `
      <strong><i class="fa-solid fa-circle-check" style="color:var(--success-500);"></i> Attendance Marked Present!</strong><br>
      Date: ${formatDate(session.date)}<br>
      Student: ${escapeHtml(user.name)} (${escapeHtml(user.rollNumber)})<br>
      Timestamp: ${new Date().toLocaleTimeString()}
    `;
  }

  // Clear manual input
  const manualInput = document.getElementById('qr-manual-code');
  if (manualInput) manualInput.value = '';
}
