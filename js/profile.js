/**
 * SAMS - Profile Controller
 * Handles user profile display and updates with role-based field restrictions.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Authentication: both Admin and Student can manage their profile
  const currentUser = Auth.requireAuth(['admin', 'student']);
  if (!currentUser) return;

  App.init(currentUser);

  loadUserProfile(currentUser);
  setupProfileForm(currentUser);
});

function loadUserProfile(user) {
  const isStudent = user.role === 'student';

  // Identity cards
  const heroName = document.getElementById('profile-hero-name');
  const heroRole = document.getElementById('profile-hero-role');
  const heroAvatar = document.getElementById('profile-hero-avatar');

  if (heroName) heroName.textContent = user.name || user.username;
  if (heroRole) heroRole.textContent = isStudent ? `Student (${user.rollNumber})` : 'Faculty Administrator';
  if (heroAvatar) {
    heroAvatar.src = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=2563eb&color=fff&size=128`;
  }

  // Populate form fields
  document.getElementById('profile-name').value = user.name || '';
  document.getElementById('profile-email').value = user.email || '';
  document.getElementById('profile-avatar').value = user.avatar || '';

  const rollGroup = document.getElementById('group-profile-roll');
  const rollInput = document.getElementById('profile-roll');
  const deptInput = document.getElementById('profile-dept');
  const yearInput = document.getElementById('profile-year');
  const mobileInput = document.getElementById('profile-mobile');

  if (isStudent) {
    if (rollGroup) rollGroup.style.display = 'block';
    if (rollInput) {
      rollInput.value = user.rollNumber || '';
      rollInput.disabled = true; // Roll number is strictly locked for students
    }
    if (deptInput) {
      deptInput.value = user.department || '';
      deptInput.disabled = true; // Academic department is locked
    }
    if (yearInput) {
      yearInput.value = user.year || '';
      yearInput.disabled = true; // Academic year is locked
    }
    // Fetch student's mobile from student storage if available
    const stuRecord = Storage.getStudentByRoll(user.rollNumber);
    if (stuRecord && mobileInput) {
      mobileInput.value = stuRecord.mobile || '';
    }
  } else {
    // Admin view
    if (rollGroup) rollGroup.style.display = 'none';
    if (deptInput) {
      deptInput.value = user.department || 'Administration';
      deptInput.disabled = false;
    }
    const yearGroup = document.getElementById('group-profile-year');
    if (yearGroup) yearGroup.style.display = 'none';
  }
}

function setupProfileForm(currentUser) {
  const form = document.getElementById('profile-form');
  const avatarInput = document.getElementById('profile-avatar');
  const previewImg = document.getElementById('profile-hero-avatar');

  if (avatarInput && previewImg) {
    avatarInput.addEventListener('input', () => {
      const url = avatarInput.value.trim();
      if (url) {
        previewImg.src = url;
      }
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('profile-name').value.trim();
      const email = document.getElementById('profile-email').value.trim();
      const avatar = document.getElementById('profile-avatar').value.trim();
      const newPassword = document.getElementById('profile-new-password')?.value.trim();

      const isStudent = currentUser.role === 'student';
      let mobile = '';
      if (isStudent) {
        mobile = document.getElementById('profile-mobile')?.value.trim() || '';
      }

      if (!name) {
        showToast('Full name cannot be empty.', 'danger');
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        showToast('Please provide a valid email address.', 'danger');
        return;
      }

      // Phone validation for students
      if (isStudent) {
        const phoneRegex = /^[0-9]{10,14}$/;
        if (!mobile || !phoneRegex.test(mobile)) {
          showToast('Please enter a valid 10-digit mobile number.', 'danger');
          return;
        }
      }

      // Update in storage
      if (isStudent) {
        const stuRecord = Storage.getStudentByRoll(currentUser.rollNumber);
        if (stuRecord) {
          const updateData = {
            name,
            email,
            mobile,
            avatar
          };
          if (newPassword) updateData.password = newPassword;
          Storage.updateStudent(stuRecord.id, updateData);
        }
      } else {
        // Admin
        const updateData = {
          name,
          email,
          avatar,
          department: document.getElementById('profile-dept')?.value.trim() || currentUser.department
        };
        if (newPassword) updateData.password = newPassword;
        Storage.updateUser(currentUser.id, updateData);
      }

      // Update current session
      const updatedSession = {
        ...currentUser,
        name,
        email,
        avatar
      };
      Storage.setCurrentSession(updatedSession);

      showToast('Profile updated successfully!', 'success');
      loadUserProfile(updatedSession);
      App.setupUserNav(updatedSession);
    });
  }
}
