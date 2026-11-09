# Project Architecture & Scope: MGR IEI Student Chapter

## Architecture Synthesis
- **Frontend Stack**: React 18.3.1, Vite 5.2.11, Tailwind CSS 3.4.3, Lucide React icons, date-fns, jsPDF.
- **Packaging**: Multi-platform distribution targeting Web SPA, Windows Portable Executable via Electron 45.2.1 (`in.edu.drmgrdu.iei.studentchapter`), and Android Mobile APK via Capacitor 8.6.0.
- **Routing**: Component state-driven tab switching (`activeTab` in `DashboardPage.jsx`), wrapped by root authentication gate in `App.jsx`.
- **Backend / Cloud**: Firebase 10.12.0 under project `sachin-crackers-smartpos-81c6a` and hosting `https://sachin-crackers-smartpos-81c6a.web.app`.
- **Persistence Architecture**: Dual-layer architecture:
  - Layer 1: In-memory reactive pub/sub store with `localStorage` fallback (`iei_mgr_v6_` prefix).
  - Layer 2: Cloud Firestore collection `iei_members`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Read-Only Architecture Inspection | Map routing, auth, persistence, and component tree | Completed | Survey (Explorers 1, 2, 3) |
| 2 | Strict Confidentiality Gate | Restrict access to Sri Priyan S, Ramya Sri M, Master Admin; hide from sidebar and block unauthorized roles | Planned | Approved Spec R2.1 |
| 3 | Automated Credential Generation | `<firstname>.<roletag>-<sequential_number>`, `IEI#...` prefix password, copyable distribution notice | Planned | Approved Spec R2.2 |
| 4 | Exact 11-Role Architecture | 11 institutional roles; sanitize legacy ghost roles | Planned | Approved Spec R2.3 |
| 5 | Active Committee Register | 23 real seeded accounts (21 committee + 1 Staff Coordinator + 1 Master Admin), clean state | Completed / Verified | Approved Spec R2.4 |
| 6 | Dual-Layer Persistence & Real-time Sync | Reactive store + localStorage + Firestore `iei_members` background sync and security rules | Planned | Approved Spec R2.5 |

## Gap Analysis Matrix
| Area | Approved Specification | Current Codebase Implementation | Identified Gap / Required Action |
|---|---|---|---|
| **Confidentiality Gate** | Only 3 users authorized: Sripriyan S (`sripriyan.jsec-01`), Ramya Sri M (`ramya.memdir-01`), Master Admin (`admin.master-01`). Completely hidden from sidebar and blocked for all other 8 roles. | Gated in `Sidebar.jsx` and `DashboardPage.jsx` via `canAccessMembersDirectory`. However, `isRamyaSri` falls back to `role === ROLES.MEMBERSHIP_DIRECTOR`, `canManageMembers` accepts role string and allows any `Joint Secretary`, `MetricCards.jsx` leaks navigation via "Total Members" card, and `DashboardPage.jsx` subscribes to members data for all users. | 1. Refactor `canAccessMembersDirectory` to strict username/email equality.<br>2. Require `currentUser` object in `canManageMembers`.<br>3. Suppress click/navigation on "Total Members" metric card for unauthorized roles.<br>4. Gate in-memory `subscribeToData('members')` in `DashboardPage.jsx`. |
| **Credential Generation** | Auto-generate username `<firstname>.<tag>-<sequential>`, password prefixed with `IEI#...` (e.g. `IEI#Ramya*9164`), and copyable official notice. | Implemented in `credentialService.js`, `MemberFormModal.jsx`, and `MembersList.jsx`. | In `credentialService.js`, `generateStrongPassword` randomly selects delimiter 1 from `['*', '#', '$', '!', '@']`, causing non-`#` prefixes (e.g. `IEI$`, `IEI*`). Must enforce strict `IEI#...` prefix. |
| **Role Architecture** | 11 exact roles: Administrator, Staff Coordinator, Chairman, Vice Chairman, Secretary, Joint Secretary, Treasurer, Joint Treasurer, Membership Director, Event Management Head, Executive Member. | 11 roles defined in `ROLES` and `ROLE_LIST`. | Legacy ghost role `'Admin (Staff Coordinator)'` persists in `FINAL_APPROVER_ROLES`, `roles.js`, and `firestore.rules`. Must be removed/normalized. |
| **Active Committee Register** | 23 real seeded accounts (21 committee + 1 Staff Coordinator titled "Staff Coordinator" + 1 Master Admin). No dummy or mock data. | Exactly 23 real seeded accounts in `seedData.js`, `COMMITTEE_CREDENTIALS.csv`, `COMMITTEE_CREDENTIALS.md`. All operational arrays empty `[]`. | Zero gaps. Verified 100% compliant with 35/35 test suite assertions passing. |
| **Persistence & Firebase** | Dual-layer: reactive store + localStorage + Firestore `iei_members` under `sachin-crackers-smartpos-81c6a`. | `saveMember` writes to `iei_members` in Firestore, and reads/writes to `localStorage['iei_mgr_v6_members']`. | 1. `collectionsToSync` omits `iei_members` (no incoming `onSnapshot` real-time sync).<br>2. `firestore.rules` has no rule for `iei_members` (only `iei_users`).<br>3. `getMembers()` never queries Firestore fallback. |
