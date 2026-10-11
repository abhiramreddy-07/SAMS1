# Student Attendance Management System (SAMS)

A modern, responsive, frontend-only web application designed for colleges and universities to digitize student attendance, manage student records, compute attendance percentages automatically, produce analytical reports, and enable touchless QR-based session attendance.

---

## 1. Project Overview

**Project Name:** Student Attendance Management System (SAMS)  
**Project Type:** Client-Side Web Application (Static Website)  
**Deployment Target:** Render Static Site, GitHub Pages, or Netlify  
**Target Audience:** College Administration, Faculty, and Students  

SAMS is built entirely with modern web standards (HTML5, CSS3, Vanilla ES6+ JavaScript, and browser LocalStorage). It requires **zero backend servers**, no Python/Node.js web servers, and no external database daemon to run. It functions completely self-contained in modern web browsers and can be served statically.

---

## 2. Key Features and Modules

### 1. Authentication & Role-Based Access Control
- **Dual Role Support:** Dedicated workflows for **Admin / Faculty** and **Students**.
- **Role Verification:** Protected page guards check authentication state and role permissions before allowing access. Students attempting to access administrative routes are automatically denied and redirected to their personal portal.
- **Show/Hide Password:** Accessible password toggle.
- **Demo Quick-Fill:** One-click pre-fill buttons on the login screen for testing.

### 2. Faculty / Admin Dashboard
- **Metric Cards:** Real-time counters for Total Enrolled Students, Total Attendance Records, Students Present Today, Students Absent Today, and Institutional Average Attendance Rate.
- **Quick Action Bar:** Direct shortcuts to Mark Attendance, Add Student, Generate QR Session, and Export Reports.
- **Interactive Charts (Chart.js):**
  - 7-Day Attendance Trend (Present vs. Absent bar chart).
  - Department Attendance Performance (Doughnut chart).
- **Recent Activity Log:** Live chronological audit log of attendance sessions.

### 3. Student Management (CRUD)
- **Directory Table:** Responsive list with real-time search by name or roll number, and filters by department and academic year.
- **Add / Edit Modal:** Full client-side validation ensuring:
  - Required fields are non-empty.
  - Roll number is globally unique (rejects duplicates).
  - Valid 10-digit mobile number format.
  - Valid email address format.
- **Student Profile View Modal:** Inspect academic records, contact info, working days, present/absent counts, and calculated attendance percentage.
- **Safe Deletion:** Modal confirmation preventing accidental record loss with automatic cascade cleanup of corresponding attendance entries.

### 4. Daily Attendance Marking Console
- **Class & Date Selection:** Filter by Department and Year. Default date set to today.
- **Future Date Guard:** Future dates are blocked with validation alerts to prevent recording attendance in advance.
- **Duplicate Prevention:** Seamlessly detects whether attendance was previously recorded for the chosen date and class. Editing an existing date updates the existing records rather than creating duplicate entries.
- **Bulk Actions:** "Mark All Present", "Mark All Absent", and "Invert Selection".
- **Real-Time Counters:** Instant tally of Present, Absent, and Total students.

### 5. Automatic Attendance Percentage Calculation
- **Unified Formula:**
  $$\text{Attendance Percentage} = \left(\frac{\text{Present Days}}{\text{Total Recorded Working Days}}\right) \times 100$$
- **Edge-Case Resilience:** Handles zero working days gracefully ($0.0\%$, no division-by-zero errors).
- **Consistency:** The exact same calculation is executed across the Admin Dashboard, Student Management table, Student Profile view, Student Dashboard, and Exported Reports.

### 6. Student Dashboard & Portal
- **Data Isolation:** Students can only view their own attendance records, monthly summaries, and personal details. Private records of other students are inaccessible.
- **Visual Status Progress Bar:** Color-coded progress bar:
  - **$\ge 75\%$ (Green):** Good standing, eligible for university examinations.
  - **$60\% - 74\%$ (Amber):** Borderline attendance notice.
  - **$< 60\%$ (Red):** Critical attendance shortage warning.
- **Monthly Attendance Chart:** Month-by-month attendance breakdown.
- **Filterable Personal History:** Filter personal attendance records by date range and status (Present/Absent).
- **Notice Board:** Personal announcements sent to their cohort.

### 7. Touchless QR Code Attendance
- **Faculty Workflow:** Select department, year, date, and validity duration (e.g. 30 mins) to generate an active QR session code (e.g. `SAMS-CS3-20261011-8492`). Displays the QR code along with a live table of students who have checked in.
- **Student Workflow:**
  - **Camera Scanner:** Instant camera scan using `html5-qrcode` with graceful handling if camera permission is denied or unavailable.
  - **Manual Session Code Fallback:** Dedicated input field allowing students to manually enter or paste the session code shown on the faculty screen if camera access is restricted.
  - Validates session expiration, department match, and prevents duplicate check-ins for the same student and session date.

### 8. Institutional Reports & CSV Export
- **4 Report Modes:**
  1. *Daily Attendance Report:* Filter by date and department.
  2. *Date-Range Report:* Aggregate attendance across date spans.
  3. *Student-Wise Report:* Comprehensive audit trail for an individual student.
  4. *Department-Wise Summary:* Institutional overview comparing student counts, session counts, and average attendance rates across all engineering departments.
- **Export to CSV:** Generates RFC 4180 compliant CSV files with UTF-8 BOM for Microsoft Excel compatibility.
- **Print View:** Dedicated `@media print` styling that formats the report cleanly for paper or PDF export, hiding sidebars and buttons.

### 9. Announcements & In-App Notifications
- **Admin Broadcasts:** Administrators can send campus-wide notices or target a specific student by roll number.
- **Notification Types:** General Info, Advisory Warning, and Critical Alert.
- **Student Feed:** Students view notices targeted to them or broadcast to all students.

### 10. Profile Management
- **Role-Based Security:**
  - Students can edit contact info (mobile, email, avatar URL), but their **Roll Number**, **Department**, **Academic Year**, and **Role** are strictly locked.
  - Administrators can update their name, email, department, and credentials.

---

## 3. Technologies Used

- **HTML5:** Semantic layouts, forms, and dialogs.
- **CSS3:** Custom responsive layout, CSS variables, flexbox, grid, and `@media print` print styles.
- **Vanilla JavaScript (ES6+):** Modular scripts without framework bloat.
- **Browser LocalStorage API:** Client-side persistence for accounts, students, attendance logs, QR sessions, and notifications.
- **Chart.js (v4.x via CDN):** Responsive trend line/bar charts and doughnut charts.
- **QRCode.js (via CDN):** Session QR rendering to canvas/SVG with visual fallback.
- **Html5-QRCode (via CDN):** Camera-based QR scanning with graceful permission handling.
- **Font Awesome 6 (via CDN):** Clean dashboard iconography.

---

## 4. Project File Structure

```
attendence management system/
├── index.html                 # Login page with demo credentials helper
├── admin-dashboard.html       # Faculty / Administrator overview dashboard
├── student-dashboard.html     # Isolated student portal & attendance history
├── students.html              # Student CRUD management directory
├── attendance.html            # Daily attendance marking console
├── attendance-history.html    # Full attendance audit log & filters
├── qr-attendance.html         # QR generator (Admin) & Scanner/Fallback (Student)
├── reports.html               # Daily, range, student & dept reports + CSV/Print
├── notifications.html         # Campus notice board & authoring console
├── profile.html               # User profile settings & security
├── render.yaml                # Render Static Site deployment blueprint
├── css/
│   ├── style.css              # Main theme, cards, tables, badges, and print CSS
│   └── responsive.css         # Responsive drawer and mobile layout overrides
├── js/
│   ├── storage.js             # Centralized LocalStorage manager & demo data
│   ├── auth.js                # Session management & role-based route guard
│   ├── app.js                 # Shared UI helpers, modals, and toasts
│   ├── dashboard.js           # Admin dashboard metrics and Chart.js charts
│   ├── student-dashboard.js   # Student dashboard statistics and charts
│   ├── students.js            # Student CRUD and profile modal
│   ├── attendance.js          # Attendance marking & duplicate prevention
│   ├── attendance-history.js  # History table, status toggling, and filters
│   ├── qr-attendance.js       # QR generation, scanner, and manual fallback
│   ├── reports.js             # Report generation, CSV download, and printing
│   ├── notifications.js       # Announcement publishing and student feed
│   └── profile.js             # User profile updating with role locking
├── tests/
│   ├── test-sams.js           # 57 automated unit tests (calculations, CRUD, auth)
│   └── test-html-links.js     # Static asset & HTML link integrity validator
└── README.md                  # Comprehensive documentation
```

---

## 5. How to Run Locally

Because SAMS is a purely client-side static web application, it does not require a complex runtime or database server.

### Option A: Using NPM Commands (Recommended)
With Node.js installed, you can run the local server or execute tests directly:

```bash
# 1. Start the local server (zero external dependencies required)
npm start

# 2. Run the complete automated test suite (57 unit tests + HTML asset validator)
npm test

# 3. Run individual test suites
npm run test:unit      # Tests storage, formulas, duplicate prevention, and auth
npm run test:links     # Scans all HTML files for link and script integrity
```

### Option B: Open directly in any Web Browser
Double-click `index.html` or open it directly in Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari.

### Option C: Using a lightweight Python HTTP Server
```bash
python -m http.server 8000
```
Open your browser at `http://localhost:8000`.

---

## 6. Demonstration Login Credentials

The application initializes with realistic demo accounts in browser LocalStorage:

| Role | Username / Roll Number | Password | Name | Department |
| :--- | :--- | :--- | :--- | :--- |
| **Faculty Admin** | `admin` | `admin123` | Dr. Robert Vance | Administration |
| **Faculty Admin** | `faculty` | `faculty123` | Prof. Sarah Jenkins | Computer Science |
| **Student** | `CS2023001` | `student123` | Alex Johnson | Computer Science (3rd Yr) |
| **Student** | `EC2023014` | `student123` | Priya Sharma | Electronics (3rd Yr) |
| **Student** | `ME2024005` | `student123` | Michael Chen | Mechanical (2nd Yr) |

> **Tip:** You can click the **Quick Demonstration Credentials** pills on the login page to fill credentials in one click.

---

## 7. Attendance Percentage Calculation

The system calculates student attendance percentages using the standard academic formula:

$$\text{Attendance Percentage} = \left(\frac{\text{Present Days}}{\text{Total Recorded Working Days}}\right) \times 100$$

- **Worked Example:** If student Alex Johnson (`CS2023001`) has 45 recorded Present days out of 50 recorded working days:
  $$\text{Percentage} = \left(\frac{45}{50}\right) \times 100 = 90.0\%$$
- **Zero Days Safe:** If no attendance has been recorded yet ($\text{Total Days} = 0$), the formula returns `0.0%` without division-by-zero errors.
- **Precision:** Percentages are rounded to 1 decimal place.

---

## 8. Limitations & Security Disclaimers

### Browser Local Storage Limitations
1. **Device Isolation:** Data stored in browser LocalStorage exists only on the specific browser and machine where it was entered. It does not automatically synchronize across different physical computers or incognito tabs.
2. **Data Reset:** A **"Reset Demo Data"** button is provided in the top header. Clicking it restores the factory demo dataset at any time.

### QR Attendance Limitations
1. **Demonstration Architecture:** In this client-side version, QR sessions and student check-ins are validated in JavaScript and stored in LocalStorage.
2. **Real-World Differences:** In a production university environment with high-stakes grading, QR attendance must be coupled with backend cryptographically signed one-time-passwords (TOTP), IP subnet validation, and GPS geolocation fences to prevent students from sharing screenshots with absent peers.

---

## 9. Render Deployment Steps (Static Site)

Deploying SAMS to **Render** takes under 2 minutes:

1. Push this repository to **GitHub** or **GitLab**.
2. Log in to [dashboard.render.com](https://dashboard.render.com).
3. Click **New +** $\rightarrow$ **Static Site**.
4. Connect your GitHub repository.
5. Configure the deployment settings:
   - **Name:** `student-attendance-management-system`
   - **Branch:** `main` (or `master`)
   - **Build Command:** `echo "Static site - no build required"`
   - **Publish Directory:** `.`
6. Click **Create Static Site**.
7. Render will publish the site immediately and provide a live `https://<your-app>.onrender.com` URL.

---

## 10. Manual Testing Checklist

| # | Test Scenario | Expected Result | Verified |
| :- | :--- | :--- | :-: |
| 1 | **Login as Admin** with `admin` / `admin123` | Redirects to `admin-dashboard.html` with faculty metrics | [x] |
| 2 | **Login as Student** with `CS2023001` / `student123` | Redirects to `student-dashboard.html` showing personal stats only | [x] |
| 3 | **Unauthorized Route Protection** | If a logged-in student visits `admin-dashboard.html`, redirects to `student-dashboard.html` with an access alert | [x] |
| 4 | **Add Student** with duplicate roll number | Displays error: `Roll number "CS2023001" is already registered` | [x] |
| 5 | **Mark Attendance** | Present/Absent toggle updates counters; saves without errors | [x] |
| 6 | **Future Date Prevention** | Date picker rejects future dates; displays warning banner | [x] |
| 7 | **Duplicate Attendance Check** | Re-marking attendance for a past date updates records instead of duplicating | [x] |
| 8 | **Percentage Calculation** | Formula computes `(Present / Total) * 100` consistently across all pages | [x] |
| 9 | **QR Code Generation** | Admin generates session code (e.g. `SAMS-CS3-...`); QR canvas renders | [x] |
| 10 | **Manual QR Fallback** | Student enters valid session code; records attendance as `Marked: QR` | [x] |
| 11 | **Notifications** | Admin publishes notice; student views notice on personal dashboard | [x] |
| 12 | **Reports & CSV Export** | Generates filtered table; downloads CSV file with correct headers | [x] |
| 13 | **Print View** | Print dialog opens cleanly without sidebar or action buttons | [x] |
| 14 | **Student Profile Lock** | Student cannot edit roll number, department, or academic year | [x] |
| 15 | **Reset Demo Data** | Clicking Reset restores all students, attendance records, and notices | [x] |

---

## 11. License & Academic Disclaimer

Developed as an academic demonstration for the **Student Attendance Management System (SAMS)** specification. All sample names and credentials included in demo datasets are fictitious.
