/**
 * SAMS - Automated Test Suite
 * Validates Core Data Models, Percentage Calculations, Role Guards,
 * Duplicate Checks, and File Structure Integrity.
 */

const fs = require('fs');
const path = require('path');

// Mock browser localStorage
const localStorageStore = {};
global.localStorage = {
  getItem: (key) => localStorageStore[key] || null,
  setItem: (key, val) => { localStorageStore[key] = String(val); },
  removeItem: (key) => { delete localStorageStore[key]; },
  clear: () => {
    Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]);
  }
};
global.window = {};

// Load storage and auth
const { Storage, StorageKeys } = require('../js/storage.js');
global.Storage = Storage;
global.StorageKeys = StorageKeys;

const { Auth } = require('../js/auth.js');
global.Auth = Auth;

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    totalPassed++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    totalFailed++;
  }
}

console.log('====================================================');
console.log('STARTING SAMS AUTOMATED TEST SUITE');
console.log('====================================================\n');

// TEST SUITE 1: Initialization & Demo Data
console.log('--- Test Suite 1: Storage Initialization & Demo Data ---');
Storage.init(true);
const initialStudents = Storage.getStudents();
const initialAttendance = Storage.getAttendance();
const initialUsers = Storage.getUsers();
const initialNotifs = Storage.getNotifications();

assert(initialStudents.length >= 8, `Initial demo students loaded (Count: ${initialStudents.length})`);
assert(initialAttendance.length > 20, `Initial attendance records seeded (Count: ${initialAttendance.length})`);
assert(initialUsers.length >= 5, `Initial auth users seeded (Count: ${initialUsers.length})`);
assert(initialNotifs.length >= 3, `Initial notifications seeded (Count: ${initialNotifs.length})`);

// TEST SUITE 2: Authentication & Role Verification
console.log('\n--- Test Suite 2: Authentication & Role Verification ---');
const adminLoginValid = Auth.login('admin', 'admin123', 'admin');
assert(adminLoginValid.success === true, 'Admin login with valid credentials succeeds');
assert(adminLoginValid.user.role === 'admin', 'Admin session has role "admin"');

const studentLoginValid = Auth.login('CS2023001', 'student123', 'student');
assert(studentLoginValid.success === true, 'Student login with roll number succeeds');
assert(studentLoginValid.user.role === 'student', 'Student session has role "student"');

const studentWrongPass = Auth.login('CS2023001', 'wrongpass', 'student');
assert(studentWrongPass.success === false, 'Student login with incorrect password fails');

const roleMismatch = Auth.login('admin', 'admin123', 'student');
assert(roleMismatch.success === false, 'Login fails when selecting wrong role');

const unknownAccount = Auth.login('nonexistent', 'pass123', 'student');
assert(unknownAccount.success === false, 'Login fails for non-existent account');

// TEST SUITE 3: Student Management & Unique Roll Number
console.log('\n--- Test Suite 3: Student Management CRUD ---');
const newStudent = Storage.saveStudent({
  name: 'Test Candidate',
  rollNumber: 'TEST9999',
  department: 'Computer Science',
  year: '1st Year',
  mobile: '9876543210',
  email: 'test@candidate.edu',
  password: 'testpassword'
});
assert(newStudent.rollNumber === 'TEST9999', 'New student saved with correct roll number');

const rollTakenCheck = Storage.isRollNumberTaken('TEST9999');
assert(rollTakenCheck === true, 'Duplicate roll number detection correctly reports taken');

const rollFreeCheck = Storage.isRollNumberTaken('FREE1234');
assert(rollFreeCheck === false, 'Unused roll number correctly reports not taken');

// Edit student
const updatedStudent = Storage.updateStudent(newStudent.id, {
  name: 'Updated Test Candidate',
  mobile: '9123456789'
});
assert(updatedStudent.name === 'Updated Test Candidate', 'Student name updated successfully');
assert(updatedStudent.mobile === '9123456789', 'Student mobile updated successfully');

// Delete student
const deleteResult = Storage.deleteStudent(newStudent.id);
assert(deleteResult === true, 'Student deleted successfully');
assert(Storage.getStudentByRoll('TEST9999') === null, 'Deleted student no longer exists in storage');

// TEST SUITE 4: Attendance Percentage Calculation Formula
console.log('\n--- Test Suite 4: Attendance Percentage Calculations ---');
// Formula: Attendance Percentage = (Present Days / Total Recorded Working Days) * 100
// Edge case 1: Zero working days
const zeroDaysStudent = Storage.getStudentStats('NONEXISTENT_STUDENT');
assert(zeroDaysStudent.totalDays === 0, 'Zero working days student has totalDays === 0');
assert(zeroDaysStudent.percentage === 0, 'Zero working days handles division without error (returns 0%)');

// Edge case 2: Perfect 100% attendance
const testRoll100 = 'PERFECT100';
Storage.saveStudent({
  name: 'Perfect Student',
  rollNumber: testRoll100,
  department: 'Computer Science',
  year: '1st Year',
  mobile: '9876543210',
  email: 'perf@college.edu'
});
Storage.saveAttendanceBatch([
  { rollNumber: testRoll100, date: '2026-10-01', status: 'Present' },
  { rollNumber: testRoll100, date: '2026-10-02', status: 'Present' }
]);
const stats100 = Storage.getStudentStats(testRoll100);
assert(stats100.totalDays === 2 && stats100.presentDays === 2 && stats100.percentage === 100, 'Perfect attendance calculates to 100%');

// Edge case 3: 45 present out of 50 total = 90% (from prompt section 7)
const testRoll90 = 'MATH90';
Storage.saveStudent({
  name: 'Math Student',
  rollNumber: testRoll90,
  department: 'Mechanical',
  year: '2nd Year',
  mobile: '9876543211',
  email: 'math@college.edu'
});
const batch90 = [];
for (let i = 1; i <= 50; i++) {
  const dStr = `2026-05-${String(i).padStart(2, '0')}`;
  batch90.push({
    rollNumber: testRoll90,
    date: dStr,
    status: i <= 45 ? 'Present' : 'Absent'
  });
}
Storage.saveAttendanceBatch(batch90);
const stats90 = Storage.getStudentStats(testRoll90);
assert(stats90.totalDays === 50, 'Total days equals 50');
assert(stats90.presentDays === 45, 'Present days equals 45');
assert(stats90.percentage === 90, 'Attendance formula calculates exact 90% (45/50 * 100)');

// Clean up test students
Storage.deleteStudent(Storage.getStudentByRoll(testRoll100).id);
Storage.deleteStudent(Storage.getStudentByRoll(testRoll90).id);

// TEST SUITE 5: Attendance Duplicate Prevention on Same Date
console.log('\n--- Test Suite 5: Attendance Duplicate Prevention ---');
const sampleRoll = 'CS2023001';
const testDate = '2026-10-09';
const initialRecs = Storage.getAttendance().filter(r => r.rollNumber === sampleRoll && r.date === testDate);

// Mark as Absent
Storage.saveAttendanceBatch([
  { rollNumber: sampleRoll, date: testDate, status: 'Absent', department: 'Computer Science', year: '3rd Year' }
]);
// Re-mark as Present on the exact same date
Storage.saveAttendanceBatch([
  { rollNumber: sampleRoll, date: testDate, status: 'Present', department: 'Computer Science', year: '3rd Year' }
]);
const finalRecs = Storage.getAttendance().filter(r => r.rollNumber === sampleRoll && r.date === testDate);
assert(finalRecs.length === 1, 'Only 1 record exists for student on the same date (no duplicates)');
assert(finalRecs[0].status === 'Present', 'Editing record updated status to Present');

// TEST SUITE 6: QR Session & Validation
console.log('\n--- Test Suite 6: QR Code Session Lifecycle ---');
const newQrSession = Storage.createQrSession({
  department: 'Computer Science',
  year: '3rd Year',
  date: '2026-10-11',
  validMinutes: 30,
  createdBy: 'Prof. Tester'
});
assert(newQrSession.code.startsWith('SAMS-CS3-'), 'QR session code formatted with department and year prefix');

const activeSession = Storage.getActiveQrSessionByCode(newQrSession.code);
assert(activeSession !== null && activeSession.expired === false, 'QR session retrieved and verified active');

const invalidSession = Storage.getActiveQrSessionByCode('SAMS-INVALID-CODE');
assert(invalidSession === null, 'Invalid QR code correctly rejected');

// TEST SUITE 7: Notifications Targeting
console.log('\n--- Test Suite 7: In-App Notifications Targeting ---');
const broadcastNotif = Storage.createNotification({
  title: 'Campus Notice',
  message: 'Campus closed on Friday',
  target: 'all',
  type: 'info'
});
const targetedNotif = Storage.createNotification({
  title: 'Personal Notice',
  message: 'Meet your counselor',
  target: 'CS2023001',
  type: 'warning'
});

const stu1Notifs = Storage.getNotificationsForUser({ role: 'student', rollNumber: 'CS2023001' });
const stu2Notifs = Storage.getNotificationsForUser({ role: 'student', rollNumber: 'EC2023014' });

assert(stu1Notifs.some(n => n.id === targetedNotif.id), 'Targeted student receives personal notification');
assert(!stu2Notifs.some(n => n.id === targetedNotif.id), 'Other student does NOT receive private notification');
assert(stu2Notifs.some(n => n.id === broadcastNotif.id), 'All students receive broadcast notification');

// TEST SUITE 8: HTML Files and Link Integrity
console.log('\n--- Test Suite 8: File Structure & Link Integrity ---');
const requiredFiles = [
  'index.html',
  'admin-dashboard.html',
  'student-dashboard.html',
  'students.html',
  'attendance.html',
  'attendance-history.html',
  'qr-attendance.html',
  'reports.html',
  'notifications.html',
  'profile.html',
  'css/style.css',
  'css/responsive.css',
  'js/storage.js',
  'js/auth.js',
  'js/app.js',
  'js/dashboard.js',
  'js/student-dashboard.js',
  'js/students.js',
  'js/attendance.js',
  'js/attendance-history.js',
  'js/qr-attendance.js',
  'js/reports.js',
  'js/notifications.js',
  'js/profile.js',
  'render.yaml'
];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  assert(fs.existsSync(filePath), `Required file exists: ${file}`);
});

console.log('\n====================================================');
console.log(`TEST RESULTS: ${totalPassed} PASSED, ${totalFailed} FAILED`);
console.log('====================================================');

if (totalFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
