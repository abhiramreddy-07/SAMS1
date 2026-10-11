/**
 * SAMS - Common Application Utilities & UI Controllers
 * Handles toast alerts, confirm dialogs, responsive sidebar, user badge, and helpers.
 */

// XSS Prevention helper
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Date helpers
function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

function formatDateTime(isoStr) {
  if (!isoStr) return 'N/A';
  try {
    const d = new Date(isoStr);
    return isNaN(d.getTime()) ? isoStr : d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return isoStr;
  }
}

function isFutureDate(dateStr) {
  if (!dateStr) return false;
  const today = getTodayDateString();
  return dateStr > today;
}

// Toast notification system
function showToast(message, type = 'info', duration = 3500) {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;

  const iconMap = {
    success: 'fa-circle-check',
    danger: 'fa-circle-exclamation',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info'
  };

  const iconClass = iconMap[type] || 'fa-circle-info';

  toast.innerHTML = `
    <i class="fa-solid ${iconClass} toast-icon"></i>
    <div class="toast-message">${escapeHtml(message)}</div>
    <button type="button" class="toast-close" aria-label="Close">&times;</button>
  `;

  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.remove();
  });

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

// Global Confirmation Modal
function showConfirmModal({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', confirmClass = 'btn-primary', onConfirm }) {
  let modalOverlay = document.getElementById('global-confirm-modal');
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'global-confirm-modal';
    modalOverlay.className = 'modal-backdrop';
    modalOverlay.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title" id="confirm-modal-title">Confirm Action</h3>
            <button type="button" class="modal-close-btn" id="confirm-modal-close">&times;</button>
          </div>
          <div class="modal-body" id="confirm-modal-body">Are you sure?</div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="confirm-modal-cancel">Cancel</button>
            <button type="button" class="btn ${confirmClass}" id="confirm-modal-action">Confirm</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modalOverlay);
  }

  document.getElementById('confirm-modal-title').textContent = title || 'Confirm Action';
  document.getElementById('confirm-modal-body').textContent = message || 'Are you sure?';
  const actionBtn = document.getElementById('confirm-modal-action');
  actionBtn.textContent = confirmText;
  actionBtn.className = `btn ${confirmClass}`;
  document.getElementById('confirm-modal-cancel').textContent = cancelText;

  const closeModal = () => {
    modalOverlay.classList.remove('active');
  };

  document.getElementById('confirm-modal-close').onclick = closeModal;
  document.getElementById('confirm-modal-cancel').onclick = closeModal;
  modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) closeModal();
  };

  actionBtn.onclick = () => {
    closeModal();
    if (typeof onConfirm === 'function') {
      onConfirm();
    }
  };

  modalOverlay.classList.add('active');
}

// App Common Layout Initialization
const App = {
  init(currentUser) {
    this.setupSidebar();
    this.setupUserNav(currentUser);
    this.setupNotificationsBadge(currentUser);
    this.setupResetDemoButton();
    this.highlightActiveNav();
  },

  setupSidebar() {
    const toggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('active');
      });
    }

    if (overlay && sidebar) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      });
    }
  },

  highlightActiveNav() {
    const currentFile = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href === currentFile || (currentFile === '' && href === 'index.html'))) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  },

  setupUserNav(user) {
    if (!user) return;
    const nameEl = document.getElementById('nav-user-name');
    const roleEl = document.getElementById('nav-user-role');
    const avatarEl = document.getElementById('nav-user-avatar');

    if (nameEl) nameEl.textContent = user.name || user.username;
    if (roleEl) {
      roleEl.textContent = user.role === 'admin' ? 'Faculty Admin' : `Student (${user.rollNumber || 'SAMS'})`;
    }
    if (avatarEl) {
      if (user.avatar) {
        avatarEl.src = user.avatar;
      } else {
        avatarEl.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name || 'User') + '&background=2563eb&color=fff';
      }
      avatarEl.alt = user.name || 'User avatar';
    }

    // Attach logout buttons
    const logoutBtns = document.querySelectorAll('.btn-logout-trigger');
    logoutBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        showConfirmModal({
          title: 'Confirm Logout',
          message: 'Are you sure you want to sign out from SAMS?',
          confirmText: 'Sign Out',
          confirmClass: 'btn-danger',
          onConfirm: () => {
            Auth.logout();
          }
        });
      });
    });
  },

  setupNotificationsBadge(user) {
    if (!user) return;
    const badge = document.getElementById('nav-notif-badge');
    if (badge) {
      const notifs = Storage.getNotificationsForUser(user);
      if (notifs.length > 0) {
        badge.textContent = notifs.length > 9 ? '9+' : notifs.length;
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    }
  },

  setupResetDemoButton() {
    const resetBtns = document.querySelectorAll('.btn-reset-demo');
    resetBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        showConfirmModal({
          title: 'Reset Demo Data',
          message: 'This will reset all students, attendance records, and notifications back to initial demo state. Do you want to continue?',
          confirmText: 'Reset All Data',
          confirmClass: 'btn-danger',
          onConfirm: () => {
            Storage.resetDemoData();
            showToast('All demo data has been restored to factory default.', 'success');
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        });
      });
    });
  }
};
