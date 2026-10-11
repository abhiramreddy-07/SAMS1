/**
 * SAMS - Storage Manager
 * Centralized data management using browser LocalStorage.
 * Handles students, attendance records, QR sessions, notifications, and auth sessions.
 */

const StorageKeys = {
  USERS: 'sams_users',
  STUDENTS: 'sams_students',
  ATTENDANCE: 'sams_attendance',
  QR_SESSIONS: 'sams_qr_sessions',
  NOTIFICATIONS: 'sams_notifications',
  CURRENT_SESSION: 'sams_session',
  INITIALIZED: 'sams_initialized_v2'
};

const Storage = {
  /**
   * Helper to safely read from localStorage
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item);
    } catch (e) {
      console.error(`Error reading ${key} from localStorage:`, e);
      return defaultValue;
    }
  },

  /**
   * Helper to safely write to localStorage
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Error writing ${key} to localStorage:`, e);
      return false;
    }
  },

  /**
   * Remove a key
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error(`Error removing ${key} from localStorage:`, e);
      return false;
    }
  },

  /**
   * Initialize demo data if not already present
   */
  init(forceReset = false) {
    const isInit = this.get(StorageKeys.INITIALIZED);
    if (isInit && !forceReset) {
      return;
    }

    // Demo Admin & Student Users
    const demoUsers = [
      {
        id: 'usr_admin',
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        name: 'Dr. Robert Vance',
        email: 'admin@college.edu',
        department: 'Administration',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
      },
      {
        id: 'usr_faculty',
        username: 'faculty',
        password: 'faculty123',
        role: 'admin',
        name: 'Prof. Sarah Jenkins',
        email: 'sarah.jenkins@college.edu',
        department: 'Computer Science',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'
      },
      {
        id: 'usr_CS2023001',
        username: 'CS2023001',
        rollNumber: 'CS2023001',
        password: 'student123',
        role: 'student',
        name: 'Alex Johnson',
        email: 'alex.johnson@college.edu',
        department: 'Computer Science',
        year: '3rd Year',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
      },
      {
        id: 'usr_EC2023014',
        username: 'EC2023014',
        rollNumber: 'EC2023014',
        password: 'student123',
        role: 'student',
        name: 'Priya Sharma',
        email: 'priya.sharma@college.edu',
        department: 'Electronics',
        year: '3rd Year',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
      },
      {
        id: 'usr_ME2024005',
        username: 'ME2024005',
        rollNumber: 'ME2024005',
        password: 'student123',
        role: 'student',
        name: 'Michael Chen',
        email: 'michael.chen@college.edu',
        department: 'Mechanical',
        year: '2nd Year',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
      }
    ];

    // Demo Students list
    const demoStudents = [
      {
        id: 'stu_1',
        rollNumber: 'CS2023001',
        name: 'Alex Johnson',
        department: 'Computer Science',
        year: '3rd Year',
        mobile: '9876543210',
        email: 'alex.johnson@college.edu',
        username: 'CS2023001',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        createdAt: '2026-08-01'
      },
      {
        id: 'stu_2',
        rollNumber: 'CS2023002',
        name: 'Sophia Martinez',
        department: 'Computer Science',
        year: '3rd Year',
        mobile: '9876543211',
        email: 'sophia.m@college.edu',
        username: 'CS2023002',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        createdAt: '2026-08-01'
      },
      {
        id: 'stu_3',
        rollNumber: 'CS2023003',
        name: 'David Kim',
        department: 'Computer Science',
        year: '3rd Year',
        mobile: '9876543212',
        email: 'david.kim@college.edu',
        username: 'CS2023003',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        createdAt: '2026-08-01'
      },
      {
        id: 'stu_4',
        rollNumber: 'EC2023014',
        name: 'Priya Sharma',
        department: 'Electronics',
        year: '3rd Year',
        mobile: '9876543213',
        email: 'priya.sharma@college.edu',
        username: 'EC2023014',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        createdAt: '2026-08-01'
      },
      {
        id: 'stu_5',
        rollNumber: 'EC2023015',
        name: 'Lucas Brown',
        department: 'Electronics',
        year: '3rd Year',
        mobile: '9876543214',
        email: 'lucas.b@college.edu',
        username: 'EC2023015',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
        createdAt: '2026-08-01'
      },
      {
        id: 'stu_6',
        rollNumber: 'ME2024005',
        name: 'Michael Chen',
        department: 'Mechanical',
        year: '2nd Year',
        mobile: '9876543215',
        email: 'michael.chen@college.edu',
        username: 'ME2024005',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        createdAt: '2026-08-01'
      },
      {
        id: 'stu_7',
        rollNumber: 'ME2024006',
        name: 'Emma Wilson',
        department: 'Mechanical',
        year: '2nd Year',
        mobile: '9876543216',
        email: 'emma.w@college.edu',
        username: 'ME2024006',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        createdAt: '2026-08-01'
      },
      {
        id: 'stu_8',
        rollNumber: 'CE2024010',
        name: 'Aarav Patel',
        department: 'Civil',
        year: '2nd Year',
        mobile: '9876543217',
        email: 'aarav.p@college.edu',
        username: 'CE2024010',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
        createdAt: '2026-08-01'
      }
    ];

    // Ensure all demo students have auth accounts
    demoStudents.forEach(stu => {
      if (!demoUsers.some(u => u.username === stu.rollNumber)) {
        demoUsers.push({
          id: `usr_${stu.rollNumber}`,
          username: stu.rollNumber,
          rollNumber: stu.rollNumber,
          password: 'student123',
          role: 'student',
          name: stu.name,
          email: stu.email,
          department: stu.department,
          year: stu.year,
          avatar: stu.avatar
        });
      }
    });

    // Generate realistic past dates for attendance (last 5 business days)
    const today = new Date();
    const dates = [];
    let d = new Date(today);
    // Include today and past days
    for (let i = 0; i < 7 && dates.length < 5; i++) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0) { // skip Sunday
        dates.push(d.toISOString().split('T')[0]);
      }
      d.setDate(d.getDate() - 1);
    }
    dates.reverse(); // chronological order

    const demoAttendance = [];
    let attId = 1;

    // Populate attendance for past dates
    dates.forEach((dateStr, dateIdx) => {
      demoStudents.forEach((stu, stuIdx) => {
        // Vary attendance realistically: Alex Johnson Present most of the time, David Kim absent once, etc.
        let status = 'Present';
        if ((stuIdx + dateIdx) % 5 === 0 && dateIdx !== dates.length - 1) {
          status = 'Absent';
        }

        demoAttendance.push({
          id: `att_${attId++}`,
          studentId: stu.id,
          rollNumber: stu.rollNumber,
          studentName: stu.name,
          department: stu.department,
          year: stu.year,
          date: dateStr,
          status: status,
          markedBy: dateIdx === dates.length - 1 ? 'QR' : 'Faculty Admin',
          timestamp: new Date(`${dateStr}T09:15:00`).toISOString()
        });
      });
    });

    // Demo Notifications
    const demoNotifications = [
      {
        id: 'notif_1',
        title: 'Mid-Term Examination Schedule Announced',
        message: 'Mid-Term examinations for all 2nd and 3rd-year engineering students commence on October 25th. The detailed schedule is posted on the notice board.',
        target: 'all',
        targetName: 'All Students',
        type: 'info',
        createdAt: '2026-10-08T10:00:00.000Z',
        createdBy: 'Academic Dean'
      },
      {
        id: 'notif_2',
        title: 'Attendance Advisory - Minimum 75% Requirement',
        message: 'Please review your current attendance percentage. Students with attendance below 75% will not be eligible to appear for the semester end examinations.',
        target: 'all',
        targetName: 'All Students',
        type: 'warning',
        createdAt: '2026-10-09T14:30:00.000Z',
        createdBy: 'Attendance Controller'
      },
      {
        id: 'notif_3',
        title: 'Library Book Return Notice',
        message: 'You have books due for return at the Central Library. Please return them by this Friday to avoid overdue fines.',
        target: 'CS2023001',
        targetName: 'Alex Johnson (CS2023001)',
        type: 'info',
        createdAt: '2026-10-10T11:15:00.000Z',
        createdBy: 'Library Officer'
      }
    ];

    // Demo QR sessions
    const demoQrSessions = [
      {
        sessionId: 'qr_sess_demo',
        code: 'SAMS-CS-20261011-9821',
        department: 'Computer Science',
        year: '3rd Year',
        date: dates[dates.length - 1],
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        createdBy: 'Prof. Sarah Jenkins',
        active: true
      }
    ];

    this.set(StorageKeys.USERS, demoUsers);
    this.set(StorageKeys.STUDENTS, demoStudents);
    this.set(StorageKeys.ATTENDANCE, demoAttendance);
    this.set(StorageKeys.NOTIFICATIONS, demoNotifications);
    this.set(StorageKeys.QR_SESSIONS, demoQrSessions);
    this.set(StorageKeys.INITIALIZED, true);

    console.log('SAMS demo data initialized successfully.');
  },

  /**
   * Reset all demo data to fresh initial state
   */
  resetDemoData() {
    this.remove(StorageKeys.USERS);
    this.remove(StorageKeys.STUDENTS);
    this.remove(StorageKeys.ATTENDANCE);
    this.remove(StorageKeys.NOTIFICATIONS);
    this.remove(StorageKeys.QR_SESSIONS);
    this.remove(StorageKeys.INITIALIZED);
    this.init(true);
  },

  /* ====================== USERS & AUTH ====================== */
  getUsers() {
    return this.get(StorageKeys.USERS, []);
  },

  saveUser(user) {
    const users = this.getUsers();
    users.push(user);
    this.set(StorageKeys.USERS, users);
  },

  updateUser(id, updatedFields) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === id || u.username === id || u.rollNumber === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updatedFields };
      this.set(StorageKeys.USERS, users);
      return users[index];
    }
    return null;
  },

  getCurrentSession() {
    return this.get(StorageKeys.CURRENT_SESSION, null);
  },

  setCurrentSession(user) {
    return this.set(StorageKeys.CURRENT_SESSION, user);
  },

  clearSession() {
    return this.remove(StorageKeys.CURRENT_SESSION);
  },

  /* ====================== STUDENTS ====================== */
  getStudents() {
    return this.get(StorageKeys.STUDENTS, []);
  },

  getStudentById(id) {
    const students = this.getStudents();
    return students.find(s => s.id === id);
  },

  getStudentByRoll(rollNumber) {
    if (!rollNumber) return null;
    const students = this.getStudents();
    const found = students.find(s => s.rollNumber.trim().toLowerCase() === rollNumber.trim().toLowerCase());
    return found || null;
  },

  isRollNumberTaken(rollNumber, excludeId = null) {
    if (!rollNumber) return false;
    const students = this.getStudents();
    return students.some(s => 
      s.rollNumber.trim().toLowerCase() === rollNumber.trim().toLowerCase() && 
      (!excludeId || s.id !== excludeId)
    );
  },

  saveStudent(studentData) {
    const students = this.getStudents();
    const newStudent = {
      id: studentData.id || `stu_${Date.now()}`,
      rollNumber: studentData.rollNumber.trim().toUpperCase(),
      name: studentData.name.trim(),
      department: studentData.department,
      year: studentData.year,
      mobile: studentData.mobile.trim(),
      email: studentData.email.trim().toLowerCase(),
      username: studentData.username ? studentData.username.trim() : studentData.rollNumber.trim().toUpperCase(),
      avatar: studentData.avatar || '',
      createdAt: studentData.createdAt || new Date().toISOString().split('T')[0]
    };

    students.push(newStudent);
    this.set(StorageKeys.STUDENTS, students);

    // Also register login credentials for this student
    const users = this.getUsers();
    users.push({
      id: `usr_${newStudent.rollNumber}`,
      username: newStudent.rollNumber,
      rollNumber: newStudent.rollNumber,
      password: studentData.password || 'student123',
      role: 'student',
      name: newStudent.name,
      email: newStudent.email,
      department: newStudent.department,
      year: newStudent.year,
      avatar: newStudent.avatar
    });
    this.set(StorageKeys.USERS, users);

    return newStudent;
  },

  updateStudent(id, studentData) {
    const students = this.getStudents();
    const index = students.findIndex(s => s.id === id);
    if (index === -1) return null;

    const oldStudent = students[index];
    const oldRollNumber = oldStudent.rollNumber;
    const newRollNumber = (studentData.rollNumber || oldStudent.rollNumber).trim().toUpperCase();

    const updated = {
      ...oldStudent,
      ...studentData,
      rollNumber: newRollNumber,
      name: studentData.name ? studentData.name.trim() : oldStudent.name,
      department: studentData.department || oldStudent.department,
      year: studentData.year || oldStudent.year,
      mobile: studentData.mobile ? studentData.mobile.trim() : oldStudent.mobile,
      email: studentData.email ? studentData.email.trim().toLowerCase() : oldStudent.email,
      avatar: studentData.avatar !== undefined ? studentData.avatar : oldStudent.avatar
    };

    students[index] = updated;
    this.set(StorageKeys.STUDENTS, students);

    // Update in auth users list as well
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.rollNumber === oldRollNumber || u.username === oldRollNumber);
    if (userIndex !== -1) {
      users[userIndex] = {
        ...users[userIndex],
        username: newRollNumber,
        rollNumber: newRollNumber,
        name: updated.name,
        email: updated.email,
        department: updated.department,
        year: updated.year,
        avatar: updated.avatar,
        password: studentData.password || users[userIndex].password
      };
      this.set(StorageKeys.USERS, users);
    }

    // Update any attendance records with new name or roll number if changed
    if (oldRollNumber !== newRollNumber || oldStudent.name !== updated.name) {
      const attendance = this.getAttendance();
      let modified = false;
      attendance.forEach(rec => {
        if (rec.rollNumber === oldRollNumber) {
          rec.rollNumber = newRollNumber;
          rec.studentName = updated.name;
          rec.department = updated.department;
          rec.year = updated.year;
          modified = true;
        }
      });
      if (modified) {
        this.set(StorageKeys.ATTENDANCE, attendance);
      }
    }

    // If current session is this student, update session
    const currentSession = this.getCurrentSession();
    if (currentSession && currentSession.rollNumber === oldRollNumber) {
      this.setCurrentSession({
        ...currentSession,
        rollNumber: newRollNumber,
        username: newRollNumber,
        name: updated.name,
        email: updated.email,
        department: updated.department,
        year: updated.year,
        avatar: updated.avatar
      });
    }

    return updated;
  },

  deleteStudent(id) {
    const students = this.getStudents();
    const student = students.find(s => s.id === id);
    if (!student) return false;

    const filteredStudents = students.filter(s => s.id !== id);
    this.set(StorageKeys.STUDENTS, filteredStudents);

    // Remove user account
    const users = this.getUsers().filter(u => u.rollNumber !== student.rollNumber && u.username !== student.rollNumber);
    this.set(StorageKeys.USERS, users);

    // Remove attendance records for this student
    const attendance = this.getAttendance().filter(a => a.rollNumber !== student.rollNumber);
    this.set(StorageKeys.ATTENDANCE, attendance);

    return true;
  },

  /* ====================== ATTENDANCE ====================== */
  getAttendance() {
    return this.get(StorageKeys.ATTENDANCE, []);
  },

  /**
   * Save or update batch attendance for a specific date and class.
   * Ensures no duplicates: if an attendance record exists for student + date, update it.
   */
  saveAttendanceBatch(records) {
    if (!Array.isArray(records) || records.length === 0) return { count: 0, updated: 0, inserted: 0 };

    const attendance = this.getAttendance();
    let inserted = 0;
    let updated = 0;

    records.forEach(newRec => {
      // Find existing record by rollNumber AND date
      const existingIndex = attendance.findIndex(
        r => r.rollNumber === newRec.rollNumber && r.date === newRec.date
      );

      if (existingIndex !== -1) {
        // Update existing record
        attendance[existingIndex] = {
          ...attendance[existingIndex],
          status: newRec.status,
          department: newRec.department || attendance[existingIndex].department,
          year: newRec.year || attendance[existingIndex].year,
          markedBy: newRec.markedBy || attendance[existingIndex].markedBy,
          timestamp: new Date().toISOString()
        };
        updated++;
      } else {
        // Insert new record
        attendance.push({
          id: newRec.id || `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          studentId: newRec.studentId || '',
          rollNumber: newRec.rollNumber,
          studentName: newRec.studentName,
          department: newRec.department,
          year: newRec.year,
          date: newRec.date,
          status: newRec.status,
          markedBy: newRec.markedBy || 'Manual',
          timestamp: new Date().toISOString()
        });
        inserted++;
      }
    });

    this.set(StorageKeys.ATTENDANCE, attendance);
    return { count: records.length, updated, inserted };
  },

  /**
   * Mark single attendance (e.g. from QR scan)
   */
  markSingleAttendance({ rollNumber, date, status = 'Present', markedBy = 'QR' }) {
    const student = this.getStudentByRoll(rollNumber);
    if (!student) {
      return { success: false, message: 'Student record not found.' };
    }

    const attendance = this.getAttendance();
    const existingIndex = attendance.findIndex(
      r => r.rollNumber === student.rollNumber && r.date === date
    );

    if (existingIndex !== -1) {
      if (attendance[existingIndex].status === 'Present') {
        return { success: false, message: `Attendance for ${date} is already marked as Present.` };
      }
      attendance[existingIndex].status = 'Present';
      attendance[existingIndex].markedBy = markedBy;
      attendance[existingIndex].timestamp = new Date().toISOString();
      this.set(StorageKeys.ATTENDANCE, attendance);
      return { success: true, message: 'Attendance status updated to Present.', record: attendance[existingIndex] };
    }

    const newRecord = {
      id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      studentId: student.id,
      rollNumber: student.rollNumber,
      studentName: student.name,
      department: student.department,
      year: student.year,
      date: date,
      status: status,
      markedBy: markedBy,
      timestamp: new Date().toISOString()
    };

    attendance.push(newRecord);
    this.set(StorageKeys.ATTENDANCE, attendance);
    return { success: true, message: 'Attendance successfully marked!', record: newRecord };
  },

  deleteAttendanceRecord(id) {
    const attendance = this.getAttendance();
    const filtered = attendance.filter(r => r.id !== id);
    if (filtered.length !== attendance.length) {
      this.set(StorageKeys.ATTENDANCE, filtered);
      return true;
    }
    return false;
  },

  /* ====================== CALCULATIONS ====================== */
  /**
   * Calculate attendance stats for a single student.
   * Formula: Attendance Percentage = (Present Days / Total Recorded Working Days) * 100
   * Safe with zero working days.
   */
  getStudentStats(rollNumber) {
    if (!rollNumber) {
      return { totalDays: 0, presentDays: 0, absentDays: 0, percentage: 0 };
    }

    const attendance = this.getAttendance();
    // Unique records by date for this student
    const studentRecords = attendance.filter(r => r.rollNumber.trim().toLowerCase() === rollNumber.trim().toLowerCase());

    const totalDays = studentRecords.length;
    const presentDays = studentRecords.filter(r => r.status === 'Present').length;
    const absentDays = studentRecords.filter(r => r.status === 'Absent').length;

    const percentage = totalDays > 0 
      ? Math.round((presentDays / totalDays) * 1000) / 10 
      : 0;

    return {
      totalDays,
      presentDays,
      absentDays,
      percentage
    };
  },

  /**
   * Calculate aggregate attendance statistics
   */
  getOverallStats(filters = {}) {
    const students = this.getStudents();
    const attendance = this.getAttendance();
    const today = new Date().toISOString().split('T')[0];

    // Filter students if department or year specified
    let filteredStudents = students;
    if (filters.department && filters.department !== 'all') {
      filteredStudents = filteredStudents.filter(s => s.department === filters.department);
    }
    if (filters.year && filters.year !== 'all') {
      filteredStudents = filteredStudents.filter(s => s.year === filters.year);
    }

    const totalStudents = filteredStudents.length;

    // Filter attendance records
    let filteredAttendance = attendance;
    if (filters.department && filters.department !== 'all') {
      filteredAttendance = filteredAttendance.filter(r => r.department === filters.department);
    }
    if (filters.year && filters.year !== 'all') {
      filteredAttendance = filteredAttendance.filter(r => r.year === filters.year);
    }
    if (filters.startDate) {
      filteredAttendance = filteredAttendance.filter(r => r.date >= filters.startDate);
    }
    if (filters.endDate) {
      filteredAttendance = filteredAttendance.filter(r => r.date <= filters.endDate);
    }

    // Today's attendance
    const todayRecords = attendance.filter(r => r.date === today);
    const presentToday = todayRecords.filter(r => r.status === 'Present').length;
    const absentToday = todayRecords.filter(r => r.status === 'Absent').length;

    // Average attendance calculation across recorded student entries
    const totalRecords = filteredAttendance.length;
    const totalPresent = filteredAttendance.filter(r => r.status === 'Present').length;
    const totalAbsent = filteredAttendance.filter(r => r.status === 'Absent').length;

    const averagePercentage = totalRecords > 0
      ? Math.round((totalPresent / totalRecords) * 1000) / 10
      : 0;

    return {
      totalStudents,
      totalRecords,
      presentToday,
      absentToday,
      totalPresent,
      totalAbsent,
      averagePercentage,
      todayDate: today
    };
  },

  /* ====================== QR SESSIONS ====================== */
  getQrSessions() {
    return this.get(StorageKeys.QR_SESSIONS, []);
  },

  createQrSession({ department, year, date, validMinutes = 30, createdBy }) {
    const sessions = this.getQrSessions();
    const deptPrefixMap = {
      'Computer Science': 'CS',
      'Electronics': 'EC',
      'Mechanical': 'ME',
      'Civil': 'CE',
      'Information Technology': 'IT'
    };
    const deptPrefix = deptPrefixMap[department] || (department ? department.slice(0, 2).toUpperCase() : 'GN');
    const yearPrefix = year ? year.slice(0, 1) : '1';
    const code = `SAMS-${deptPrefix}${yearPrefix}-${date.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const expiresAt = new Date(Date.now() + validMinutes * 60 * 1000).toISOString();

    const newSession = {
      sessionId: `qr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      code: code,
      department: department,
      year: year,
      date: date,
      expiresAt: expiresAt,
      createdBy: createdBy || 'Faculty',
      active: true,
      createdAt: new Date().toISOString()
    };

    sessions.push(newSession);
    this.set(StorageKeys.QR_SESSIONS, sessions);
    return newSession;
  },

  getActiveQrSessionByCode(code) {
    if (!code) return null;
    const sessions = this.getQrSessions();
    const cleanCode = code.trim().toUpperCase();
    const session = sessions.find(s => s.code.toUpperCase() === cleanCode);
    if (!session) return null;

    // Check expiration
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    if (now > expiresAt) {
      return { ...session, expired: true };
    }

    return { ...session, expired: false };
  },

  /* ====================== NOTIFICATIONS ====================== */
  getNotifications() {
    return this.get(StorageKeys.NOTIFICATIONS, []);
  },

  createNotification({ title, message, target = 'all', targetName = 'All Students', type = 'info', createdBy = 'Administrator' }) {
    const notifications = this.getNotifications();
    const newNotif = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: title.trim(),
      message: message.trim(),
      target: target,
      targetName: targetName,
      type: type,
      createdAt: new Date().toISOString(),
      createdBy: createdBy
    };
    notifications.unshift(newNotif);
    this.set(StorageKeys.NOTIFICATIONS, notifications);
    return newNotif;
  },

  deleteNotification(id) {
    const notifications = this.getNotifications();
    const filtered = notifications.filter(n => n.id !== id);
    if (filtered.length !== notifications.length) {
      this.set(StorageKeys.NOTIFICATIONS, filtered);
      return true;
    }
    return false;
  },

  getNotificationsForUser(user) {
    const notifications = this.getNotifications();
    if (!user) return [];
    if (user.role === 'admin') return notifications;

    return notifications.filter(n => n.target === 'all' || n.target === user.rollNumber);
  }
};

// Auto-initialize demo data on load if needed
if (typeof window !== 'undefined') {
  Storage.init();
}

// Support Node.js test environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Storage, StorageKeys };
}
