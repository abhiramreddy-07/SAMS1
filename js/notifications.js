/**
 * SAMS - Notifications Controller
 * Handles notification authoring by Admin, targeted student delivery, and student feed.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Authentication: both Admin and Student can access notifications
  const currentUser = Auth.requireAuth(['admin', 'student']);
  if (!currentUser) return;

  App.init(currentUser);

  if (currentUser.role === 'admin') {
    setupAdminNotifications(currentUser);
  } else {
    setupStudentNotifications(currentUser);
  }
});

function setupAdminNotifications(user) {
  const adminPanel = document.getElementById('notif-admin-panel');
  const studentPanel = document.getElementById('notif-student-panel');

  if (adminPanel) adminPanel.style.display = 'block';
  if (studentPanel) studentPanel.style.display = 'none';

  // Populate target student dropdown
  const targetSelect = document.getElementById('notif-target-select');
  if (targetSelect) {
    const students = Storage.getStudents();
    let options = '<option value="all">All Students (Campus Broadcast)</option>';
    students.forEach(s => {
      options += `<option value="${escapeHtml(s.rollNumber)}">${escapeHtml(s.name)} (${escapeHtml(s.rollNumber)} - ${escapeHtml(s.department)})</option>`;
    });
    targetSelect.innerHTML = options;
  }

  // Handle form submission
  const form = document.getElementById('notif-create-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('notif-title').value.trim();
      const message = document.getElementById('notif-message').value.trim();
      const target = document.getElementById('notif-target-select').value;
      const type = document.getElementById('notif-type').value;

      if (!title || !message) {
        showToast('Please provide both title and announcement message.', 'warning');
        return;
      }

      let targetName = 'All Students';
      if (target !== 'all') {
        const student = Storage.getStudentByRoll(target);
        targetName = student ? `${student.name} (${student.rollNumber})` : target;
      }

      Storage.createNotification({
        title,
        message,
        target,
        targetName,
        type,
        createdBy: user.name || 'Faculty Admin'
      });

      showToast('Notification published successfully!', 'success');
      form.reset();
      loadAdminNotificationHistory();
    });
  }

  loadAdminNotificationHistory();
}

function loadAdminNotificationHistory() {
  const container = document.getElementById('notif-history-list');
  if (!container) return;

  const notifications = Storage.getNotifications();

  if (notifications.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-bullhorn empty-state-icon"></i>
        <div class="empty-state-title">No notifications sent yet</div>
        <div class="empty-state-desc">Use the form above to broadcast messages to students.</div>
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
        <div style="margin-top: 8px; display:flex; justify-content:space-between; align-items:center; font-size:0.78rem; color:var(--slate-500);">
          <div>
            <strong>Recipient:</strong> <span class="badge badge-student">${escapeHtml(notif.targetName || notif.target)}</span>
            &bull; <strong>By:</strong> ${escapeHtml(notif.createdBy || 'Admin')}
          </div>
          <button type="button" class="btn btn-danger btn-sm" onclick="confirmDeleteNotification('${notif.id}')" title="Delete Announcement">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function confirmDeleteNotification(id) {
  showConfirmModal({
    title: 'Delete Notification',
    message: 'Are you sure you want to delete this notification announcement?',
    confirmText: 'Delete',
    confirmClass: 'btn-danger',
    onConfirm: () => {
      Storage.deleteNotification(id);
      showToast('Notification deleted.', 'info');
      loadAdminNotificationHistory();
    }
  });
}

function setupStudentNotifications(user) {
  const adminPanel = document.getElementById('notif-admin-panel');
  const studentPanel = document.getElementById('notif-student-panel');

  if (adminPanel) adminPanel.style.display = 'none';
  if (studentPanel) studentPanel.style.display = 'block';

  const container = document.getElementById('student-notif-feed');
  if (!container) return;

  const notifications = Storage.getNotificationsForUser(user);

  if (notifications.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-bell-slash empty-state-icon"></i>
        <div class="empty-state-title">No notifications</div>
        <div class="empty-state-desc">You have no pending announcements or messages.</div>
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
        <div style="margin-top: 8px; font-size:0.75rem; color:var(--slate-400);">
          Posted by: ${escapeHtml(notif.createdBy || 'Administration')}
        </div>
      </div>
    </div>
  `).join('');
}
