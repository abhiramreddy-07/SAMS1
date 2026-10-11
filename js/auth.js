/**
 * SAMS - Authentication and Session Management
 * Handles login validation, role checking, route protection, and logout.
 */

const Auth = {
  /**
   * Login user with username/roll number, password, and expected role
   */
  login(identifier, password, role) {
    if (!identifier || !identifier.trim()) {
      return { success: false, message: 'Please enter your Username or Roll Number.' };
    }
    if (!password) {
      return { success: false, message: 'Please enter your password.' };
    }
    if (!role) {
      return { success: false, message: 'Please select a role (Admin/Faculty or Student).' };
    }

    const cleanId = identifier.trim().toLowerCase();
    const users = Storage.getUsers();

    // Find matching user by username or rollNumber
    const user = users.find(u => 
      (u.username && u.username.toLowerCase() === cleanId) || 
      (u.rollNumber && u.rollNumber.toLowerCase() === cleanId)
    );

    if (!user) {
      return { 
        success: false, 
        message: 'Account not found. For testing, use "admin" or sample roll number "CS2023001".' 
      };
    }

    // Validate role
    if (user.role !== role) {
      return { 
        success: false, 
        message: `Role mismatch. The account "${identifier}" is registered as "${user.role}", not "${role}".` 
      };
    }

    // Validate password (plain comparison for demo version)
    if (user.password !== password) {
      return { success: false, message: 'Incorrect password. Please try again.' };
    }

    // Build session object
    const sessionUser = {
      id: user.id,
      username: user.username,
      rollNumber: user.rollNumber || null,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || 'General',
      year: user.year || '',
      avatar: user.avatar || '',
      loginAt: new Date().toISOString()
    };

    Storage.setCurrentSession(sessionUser);

    return {
      success: true,
      message: 'Login successful!',
      user: sessionUser
    };
  },

  /**
   * Log out active user and redirect to login page
   */
  logout() {
    Storage.clearSession();
    window.location.href = 'index.html?logged_out=1';
  },

  /**
   * Get currently authenticated user
   */
  getCurrentUser() {
    return Storage.getCurrentSession();
  },

  /**
   * Guard a page: verify authentication and authorized role
   * @param {Array<string>} allowedRoles e.g. ['admin'], ['student'], or ['admin', 'student']
   */
  requireAuth(allowedRoles = ['admin']) {
    const user = this.getCurrentUser();

    if (!user) {
      // Redirect to login
      const currentPath = window.location.pathname.split('/').pop() || 'index.html';
      window.location.href = `index.html?redirect=${encodeURIComponent(currentPath)}&auth_required=1`;
      return null;
    }

    // Check role authorization
    if (!allowedRoles.includes(user.role)) {
      if (user.role === 'student') {
        // Students cannot access admin areas
        alert('Access Denied: Student accounts do not have administrative privileges.');
        window.location.href = 'student-dashboard.html';
        return null;
      } else if (user.role === 'admin') {
        // Admin redirected to admin dashboard
        window.location.href = 'admin-dashboard.html';
        return null;
      }
    }

    return user;
  },

  /**
   * Check if user is already logged in (used on login page)
   */
  redirectIfLoggedIn() {
    const user = this.getCurrentUser();
    if (user) {
      if (user.role === 'admin') {
        window.location.href = 'admin-dashboard.html';
      } else if (user.role === 'student') {
        window.location.href = 'student-dashboard.html';
      }
    }
  }
};

// Support Node.js test environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Auth };
}
