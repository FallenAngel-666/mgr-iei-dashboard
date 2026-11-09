# Institution of Engineers (India) — MGR Student Chapter Management Platform
### Dr. M.G.R. Educational and Research Institute (Deemed to be University)
**Accredited with A+ Grade by NAAC | Graded Autonomy Status | ISO 21001:2018 Certified**

---

## 1. Executive Summary

This is the official, production-ready institutional web application and mobile-responsive platform for the **Institution of Engineers (India) — MGR Student Chapter**. It serves as the permanent digital operations center for the Chapter's Office Bearers, Executive Committee Members, Staff Coordinator, and University leadership.

---

## 2. Institutional Branding & Logos

Both uploaded logos have been permanently integrated without redrawing, distortion, or alteration:

1. **Website Logo (`public/assets/website-logo.png`):**
   - Official Dr. M.G.R. Educational and Research Institute University banner with NAAC A+ accreditation emblem.
   - Configured in the login portal, navigation top-bar, modal dialogs, and official institutional PDF reports.

2. **APK Logo (`public/assets/apk-logo.png`):**
   - Official Institution of Engineers (India) Royal Charter circular crest (Established 1935).
   - Configured as the Android application launcher icon (all 6 mipmap densities: mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi), PWA Web App Manifest, Apple Touch icon, and sidebar insignia.

---

## 3. User Roles & Access Hierarchy

The platform implements the exact 10 IEI Student Chapter roles:

| S.No | Chapter Role | Authority Tier | Work Scope |
|---|---|---|---|
| 1 | **Chairman** | First-Level Approver | Overall chapter governance, 1st-level report review & approval, executive submissions to Staff Coordinator |
| 2 | **Vice Chairman** | First-Level Approver | Governance support, 1st-level report review & approval, executive submissions |
| 3 | **Secretary** | First-Level Approver | Official chapter minutes, records, 1st-level report review & approval, meeting attendance |
| 4 | **Joint Secretary** | First-Level Approver | Secretarial assistance, 1st-level report review & approval, attendance recording |
| 5 | **Treasurer** | Chapter Finance Officer | Chapter accounts, budget reconciliations, financial report submissions |
| 6 | **Joint Treasurer** | Chapter Finance Lead | Accounts support, vouchers, financial submissions |
| 7 | **Membership Director** | Membership Directorate | Chapter enrolment verification, member audit rolls, student onboarding |
| 8 | **Event Management Head** | Events Directorate | Technical symposiums, workshops, venue coordination, task assignment |
| 9 | **Executive Member** | Committee Lead | Task execution, progress updates, work report submission, community interaction |
| 10 | **Admin (Staff Coordinator)** | Final Authority | Final institutional approval authority, user & role management, official records sealed |

---

## 4. Work Report Submission & Two-Level Approval Workflow

The workflow enforces strict institutional governance:

```
[Member Submits Report]
          │
          ▼
Status: `Pending First-Level Approval`
          │
          ├──> Reviewed by ANY ONE of:
          │    • Chairman
          │    • Vice Chairman
          │    • Secretary
          │    • Joint Secretary
          │
          ├──> [If Rejected]: Status -> `Rejected` (Returns to member with reason for correction)
          │
          └──> [If Approved]:
               • Records: `First-Level Approved By: [Name] — [Role]`, Timestamp, Remarks
               • Status -> `Pending Final Approval`
               • Locks out duplicate first-level approvals
               • Forwards directly to Admin (Staff Coordinator)
                         │
                         ▼
             [Final Staff Coordinator Review]
                         │
                         ├──> [If Rejected]: Status -> `Rejected` (Requires resubmission)
                         │
                         └──> [If Approved]:
                              • ONLY Staff Coordinator approval sets status -> `Completed`
                              • Records: Final Approver Identity, Timestamp, Remarks
                              • Generates downloadable signed institutional PDF
```

### Direct Escalation for Officer Submissions
When a First-Level Approver (Chairman, Vice Chairman, Secretary, Joint Secretary) submits their own work report, the submission **bypasses Level 1** and is forwarded **DIRECTLY to Admin (Staff Coordinator)** with status `Pending Final Approval`.

---

## 5. Mandatory Weekly Status Module

A dedicated **Weekly Status** section is embedded directly into the central dashboard:
- **Weekly Filter:** Filter by Current Week (Week 45), Week 44, Week 43, or All Weeks.
- **5-Metric Register:**
  1. Work Assigned This Week
  2. Work Completed This Week (Strictly requires final Staff Coordinator sign-off)
  3. Work Pending / In Progress
  4. Work Awaiting Approval (1st-Level + Final)
  5. Rejected Work Requiring Correction
- **Completion Rate Visualization:** Interactive progress bar calculating percentage of tasks sealed as Completed.
- **Weekly Work Register Table:** Inspect each task's 1st-level approver identity and final approver identity.
- **One-Click Export:** Download official formatted Weekly Status PDF with signature blocks.

---

## 6. Community-Style Work Updates

A private institutional social stream replacing rigid PPM checklists:
- Members post work completed or ongoing progress.
- Include rich text, uploaded work photos, and attached document names.
- Displays author name, official role badge, and timestamps.
- Peer acknowledgement: "Acknowledge" (Like) and "Commend" (Celebrate) reactions.
- Preserved chronologically for future institutional audit.

---

## 7. Attendance Management Scope

**STRICT COMPLIANCE RULE:** Attendance tracking is exclusively restricted to **official Committee Meetings and Chapter Events**. Routine classroom attendance is completely barred.
- Attendance records must be explicitly linked to a scheduled meeting or event.
- Roll call captures: `Present`, `Absent`, or `Excused`.
- Notes and signed attendance sheets are stored and exportable as official PDF sheets.

---

## 8. Firebase Backend & Architecture

- **Firebase Authentication:** Secure email/password login, password resets, session state.
- **Cloud Firestore:** Collections for `iei_users`, `iei_tasks`, `iei_updates`, `iei_events`, `iei_attendance`, `iei_announcements`, `iei_certificates`, `iei_achievements`, `iei_notifications`.
- **Firebase Storage:** Encrypted storage for report proofs, posters, and signed certificates.
- **Security Rules:** Enforces server-side role validation (`firestore.rules` and `storage.rules`). Only Staff Coordinator can mark tasks as `Completed`.

---

## 9. Native Applications: Windows Desktop & Android APK

The platform provides compiled standalone executables for both **Windows Desktop** and **Android Mobile**:

### A. Windows Desktop Application
The Windows desktop application is packaged using Electron and Electron-Builder with native window controls, responsive DPI scaling, and official IEI window & taskbar icon (`public/assets/icon.ico`).

- **Standalone Portable Executable (Root Deliverable):**
  `C:\Users\Sripriyan\.gemini\antigravity\scratch\mgr-iei-platform\mgr-iei-windows-app.exe` (111 MB)
  *(Double-click to launch directly on any 64-bit Windows machine without installation).*

- **Direct Unpacked Native Executable (Zero startup delay):**
  `C:\Users\Sripriyan\.gemini\antigravity\scratch\mgr-iei-platform\release\win-unpacked\MGR IEI Student Chapter.exe`

- **Build Windows Executable Command:**
  ```bash
  npm run build:win
  ```

---

### B. Android Mobile Application (APK)
The Android mobile application is built using Capacitor 7 with OpenJDK 25 and Android SDK:
- Application ID: `in.edu.drmgrdu.iei.studentchapter`
- App Name: `MGR IEI Student Chapter`
- Android Launcher Icons: Uploaded circular IEI Royal Charter crest deployed across all mipmap folders (`mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`).
- **Compiled Debug APK (Root Deliverable):**
  `C:\Users\Sripriyan\.gemini\antigravity\scratch\mgr-iei-platform\mgr-iei-app-debug.apk` (9.8 MB)
- **Original Gradle Output:**
  `android/app/build/outputs/apk/debug/app-debug.apk`
- **Build Android APK Command:**
  ```bash
  npm run build:android
  ```

---

## 10. Running & Testing

### Run Development Server
```bash
npm run dev
```

### Execute Automated Test Suite (12 Scenarios)
```bash
npm test
```

### Production Build
```bash
npm run build
```
