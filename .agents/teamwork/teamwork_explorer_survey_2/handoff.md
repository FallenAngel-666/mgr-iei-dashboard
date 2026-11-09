# Survey 2 Handoff Report: Authentication, Role Architecture, Data Models & Persistence

## 1. Observation

Direct observations from inspecting the codebase at `C:\Users\Sripriyan\.gemini\antigravity\scratch\mgr-iei-platform`:

### 1.1 Authentication & Session Management
- **File**: `src/context/AuthContext.jsx` (Lines 11–148)
  - **Context Definition**: `const AuthContext = createContext(null);` (Line 11)
  - **Active Session State**: 
    ```javascript
    15: const [currentUser, setCurrentUser] = useState(() => {
    16:   try {
    17:     if (typeof localStorage === 'undefined') return null;
    18:     const stored = localStorage.getItem('iei_mgr_active_user');
    19:     return stored ? JSON.parse(stored) : null;
    20:   } catch {
    21:     return null;
    22:   }
    23: });
    ```
  - **Session Persistence**:
    ```javascript
    28: useEffect(() => {
    29:   if (typeof localStorage === 'undefined') return;
    30:   if (currentUser) {
    31:     localStorage.setItem('iei_mgr_active_user', JSON.stringify(currentUser));
    32:   } else {
    33:     localStorage.removeItem('iei_mgr_active_user');
    34:   }
    35: }, [currentUser]);
    ```
  - **Login Handler** (`login(usernameOrEmail, password)`):
    - Normalizes identifier: `cleanIdentifier = (usernameOrEmail || '').trim().toLowerCase();` (Line 42)
    - Retrieves members via `const allMembers = await getMembers();` (Line 49)
    - Matches across four attributes: `u === cleanIdentifier || su === cleanIdentifier || e === cleanIdentifier || se === cleanIdentifier` where `u` = `username`, `su` = `secondaryUsername`, `e` = `email`, `se` = `secondaryEmail` (Lines 50–56).
    - Checks password: `if (matched.password && matched.password !== cleanPassword)` throws `'Incorrect password...'` (Lines 60–62).
    - Sets current user: `setCurrentUser(matched)` (Line 65).
    - Fallback to Firebase Auth: If identifier contains `@`, invokes `signInWithEmailAndPassword(auth, cleanIdentifier, cleanPassword)` (Line 73). On success, creates a synthesized fallback user object with default role `'Executive Member'` (Lines 74–84).
  - **Logout Handler** (`logout()`):
    - Calls `await fbSignOut(auth);` (Line 101), sets `setCurrentUser(null)` (Line 105), and clears `localStorage.removeItem('iei_mgr_active_user')` (Line 107).
  - **Password Reset**: Calls `sendPasswordResetEmail(auth, email)` (Line 114).
  - **Context Value Exposed**: `{ currentUser, setCurrentUser, isAuthenticated: !!currentUser, loading, authError, login, logout, resetPassword }` (Lines 125–136).
  - **Application Route Gate** (`src/App.jsx`, Lines 27–33):
    - No React Router package is installed in `package.json`.
    - If `!isAuthenticated`, renders `<LoginPage />` (Line 29).
    - If `isAuthenticated`, renders `<DashboardPage />` (Line 32).

### 1.2 Role Definitions & Role Architecture
- **File**: `src/config/roles.js` (Lines 1–170)
  - **Roles Enum/Constant** (`ROLES` object, Lines 1–13):
    ```javascript
    export const ROLES = {
      ADMINISTRATOR: 'Administrator',
      STAFF_COORDINATOR: 'Staff Coordinator',
      CHAIRMAN: 'Chairman',
      VICE_CHAIRMAN: 'Vice Chairman',
      SECRETARY: 'Secretary',
      JOINT_SECRETARY: 'Joint Secretary',
      TREASURER: 'Treasurer',
      JOINT_TREASURER: 'Joint Treasurer',
      MEMBERSHIP_DIRECTOR: 'Membership Director',
      EVENT_MANAGEMENT_HEAD: 'Event Management Head',
      EXECUTIVE_MEMBER: 'Executive Member'
    };
    ```
  - **Role List**: `export const ROLE_LIST = [ ...11 roles... ];` (Lines 15–27).
  - **First-Level Approvers**: `ROLES.ADMINISTRATOR`, `ROLES.CHAIRMAN`, `ROLES.VICE_CHAIRMAN`, `ROLES.SECRETARY`, `ROLES.JOINT_SECRETARY` (Lines 30–36).
  - **Final Approvers**: `ROLES.ADMINISTRATOR`, `ROLES.STAFF_COORDINATOR`, and legacy string `'Admin (Staff Coordinator)'` (Lines 39–43).
  - **Role Helpers**:
    - `isMasterAdmin(role)`: `role === ROLES.ADMINISTRATOR` (Lines 55–57).
    - `isStaffCoordinator(role)`: checks `role === ROLES.STAFF_COORDINATOR || role === 'Admin (Staff Coordinator)' || isMasterAdmin(role)` (Lines 63–69).
    - `canAssignWork(role)`: checks `isMasterAdmin`, `isStaffCoordinator`, `FIRST_LEVEL_APPROVER_ROLES`, or `EVENT_MANAGEMENT_HEAD` (Lines 71–78).
    - `canAccessMembersDirectory(user)` (Lines 86–108):
      - Master Admin: `if (isMasterAdmin(user.role)) return true;` (Line 90).
      - Sri Priyan S: `username.includes('sripriyan') || email === 'sri.priyan.s.2607@gmail.com' || name.includes('SRIPRIYAN')` (Lines 96–99).
      - Ramya Sri M: `username.includes('ramya') || email === 'ramyoshiii017@gmail.com' || name.includes('RAMYA SRI') || user.role === ROLES.MEMBERSHIP_DIRECTOR` (Lines 101–105).
    - `canManageMembers(userOrRole)` (Lines 110–117):
      - Line 114: `if (typeof userOrRole === 'string') return isMasterAdmin(userOrRole) || userOrRole === ROLES.MEMBERSHIP_DIRECTOR || userOrRole === ROLES.JOINT_SECRETARY;`
      - Line 116: `return canAccessMembersDirectory(userOrRole);`
  - **Discrepancy / Inconsistency Observations**:
    - Legacy role string `'Admin (Staff Coordinator)'` is present in `FINAL_APPROVER_ROLES` (Line 42), `isStaffCoordinator` (Line 66), `firestore.rules` (Line 16), and `DEPLOYMENT.md` (Line 111).
    - `canManageMembers` accepts a string and checks `userOrRole === ROLES.JOINT_SECRETARY`. In `src/components/members/MembersList.jsx` (Line 38), it is invoked with `canManageMembers(currentUser?.role)`. Passing a role string bypasses the strict Sri Priyan identity check and would permit any hypothetical Joint Secretary to edit members.
    - `canAccessMembersDirectory(user)` grants access to ANY user whose role is `ROLES.MEMBERSHIP_DIRECTOR` (Line 105), whereas for Joint Secretary it strictly checks for Sri Priyan's username/email/name.

### 1.3 User & Member Data Models
- **File**: `src/config/seedData.js` (Lines 3–378)
  - **Active Committee Register**: Exactly 23 seeded accounts (1 Master Administrator, 1 Staff Coordinator, 21 Committee Members):
    1. `user-administrator`: `Administrator`, role: `ROLES.ADMINISTRATOR`, username: `admin.master-01`, alias: `administrator`, email: `admin@drmgrdu.ac.in`, password: `IEI#MasterAdmin*2026`, membershipId: `IEI-ROOT-001`.
    2. `user-staff-coord`: `Staff Coordinator`, role: `ROLES.STAFF_COORDINATOR`, username: `staff.login`, alias: `staff.coord-01`, email: `staff.iei@drmgrdu.ac.in`, password: `IEI#StaffCoord*2026`, membershipId: `IEI-FAC-001`.
    3. `user-chair-sriman`: `SRIMAN NARAYANA MOORTHY S`, role: `ROLES.CHAIRMAN`, username: `sriman.chair-01`, password: `IEI#Sriman*9427`, email: `srimannarayanamoorthysridhar@gmail.com`.
    4. `user-chair-geetha`: `GEETHALAKSHMI A`, role: `ROLES.CHAIRMAN`, username: `geethalakshmi.chair-02`, password: `IEI#Geetha*8162`.
    5. `user-vchair-alan`: `ALAN PAUL R`, role: `ROLES.VICE_CHAIRMAN`, username: `alan.vchair-01`, password: `IEI#Alan*5931`.
    6. `user-sec-mariya`: `MARIYA MERLINA I E`, role: `ROLES.SECRETARY`, username: `mariya.sec-01`, password: `IEI#Mariya*6281`.
    7. `user-sec-hemanth`: `J L HEMANTH`, role: `ROLES.SECRETARY`, username: `hemanth.sec-02`, password: `IEI#Hemanth*4915`.
    8. `user-jsec-sripriyan`: `SRIPRIYAN S`, role: `ROLES.JOINT_SECRETARY`, username: `sripriyan.jsec-01`, password: `IEI#SriPriyan*7342`, email: `sri.priyan.s.2607@gmail.com`.
    9. `user-tres-lokeshvari`: `LOKESHVARI V`, role: `ROLES.TREASURER`, username: `lokeshvari.tres-01`, password: `IEI#Lokesh*3829`.
    10. `user-jtres-kalaivani`: `KALAIVANI N`, role: `ROLES.JOINT_TREASURER`, username: `kalaivani.jtres-01`, password: `IEI#Kalaivani*7154`.
    11. `user-memdir-ramya`: `RAMYA SRI M`, role: `ROLES.MEMBERSHIP_DIRECTOR`, username: `ramya.memdir-01`, alias: `ramya.emhead-01`, password: `IEI#Ramya*9164`, email: `ramyoshiii017@gmail.com`.
    12. `user-emhead-swathi`: `SWATHI NANDHANA M`, role: `ROLES.EVENT_MANAGEMENT_HEAD`, username: `swathi.emhead-01`, alias: `swathi.memdir-01`, password: `IEI#Swathi*8392`.
    13–23. 11 Executive Members: `aakanish.exec-01` through `saiswaroopa.exec-11`.
  - **Member Object Schema Fields**:
    - `id` (string)
    - `name` (string)
    - `role` (string, one of the 11 `ROLES`)
    - `username` (string, institutional format `<name>.<tag>-<nn>`)
    - `secondaryUsername` (string, optional alias)
    - `password` (string, cleartext for prototype institutional distribution)
    - `email` (string)
    - `secondaryEmail` (string, optional)
    - `phone` (string)
    - `department` (string)
    - `membershipId` (string)
    - `year` (string: e.g. `'Third Year (III)'`, `'Faculty Advisor'`, `'Master Administration'`)
    - `status` (string: `'Active'`, `'Inactive'`, `'Pending'`)
    - `avatar` (string URL)
    - `isMasterAdmin` (boolean, optional)
    - `joinedDate` (string, `YYYY-MM-DD`)
    - `updatedAt` (string, ISO timestamp, on update)
- **File**: `src/services/credentialService.js` (Lines 1–92)
  - `ROLE_TAGS`: Exactly 11 mappings (`admin`, `staff`, `chair`, `vchair`, `sec`, `jsec`, `tres`, `jtres`, `memdir`, `emhead`, `exec`).
  - `generateUsername(name, role, existingMembers)`: Generates `<firstname>.<tag>-<index_padded_2_digits>`.
  - `generateStrongPassword(name)` (Lines 52–71):
    ```javascript
    53: const symbols = ['*', '#', '$', '!', '@'];
    54: const sym1 = symbols[Math.floor(Math.random() * symbols.length)];
    55: const sym2 = symbols[Math.floor(Math.random() * symbols.length)];
    ...
    70: return `IEI${sym1}${cleanName}${sym2}${randomDigits}`;
    ```
    - Observed: `sym1` is randomly selected from `['*', '#', '$', '!', '@']`. Therefore, generated passwords can start with `IEI$`, `IEI!`, `IEI@`, or `IEI*` instead of strictly `IEI#...` as required by Approved Requirement R2.2.
  - `formatCredentialNotice(member)`: Formats the copyable notice for WhatsApp / Email.

### 1.4 Persistence Layer & Firestore `iei_members` Status
- **File**: `src/services/firebaseService.js` (Lines 31–245)
  - **LocalStorage Storage Prefix**: `const STORAGE_PREFIX = 'iei_mgr_v6_'` (Line 33).
  - **Keys in LocalStorage**:
    - `'iei_mgr_v6_members'`: Serialized JSON array of members.
    - `'iei_mgr_v6_tasks'`: Serialized JSON array of tasks.
    - `'iei_mgr_v6_updates'`: Serialized JSON array of community posts.
    - `'iei_mgr_v6_events'`: Serialized JSON array of events.
    - `'iei_mgr_v6_attendance'`: Serialized JSON array of attendance records.
    - `'iei_mgr_v6_announcements'`: Serialized JSON array of announcements.
    - `'iei_mgr_v6_certificates'`: Serialized JSON array of certificates.
    - `'iei_mgr_v6_achievements'`: Serialized JSON array of achievements.
    - `'iei_mgr_v6_notifications'`: Serialized JSON array of notifications.
    - `'iei_mgr_active_user'`: Active session record (handled in `AuthContext.jsx`).
  - **In-Memory Store Initialization**:
    - `let membersStore = getLocalData('members', INITIAL_MEMBERS);` (Line 55).
  - **Dual-Layer Write Sync**:
    - In `saveMember(member)`:
      - Line 219 (Update): `syncToFirestore('iei_members', updated.id, updated, true);`
      - Line 235 (Create): `syncToFirestore('iei_members', newMember.id, newMember);`
    - In `deleteMember(id)`:
      - Line 243: `syncDeleteFromFirestore('iei_members', id);`
  - **Dual-Layer Read / Listener Sync GAP**:
    - In lines 149–160:
      ```javascript
      151: const collectionsToSync = [
      152:   { name: 'iei_tasks', channel: 'tasks', getStore: () => tasksStore, setStore: (s) => { tasksStore = s; } },
      153:   { name: 'iei_updates', channel: 'updates', getStore: () => updatesStore, setStore: (s) => { updatesStore = s; } },
      154:   { name: 'iei_events', channel: 'events', getStore: () => eventsStore, setStore: (s) => { eventsStore = s; } },
      155:   { name: 'iei_attendance', channel: 'attendance', getStore: () => attendanceStore, setStore: (s) => { attendanceStore = s; } },
      156:   { name: 'iei_announcements', channel: 'announcements', getStore: () => announcementsStore, setStore: (s) => { announcementsStore = s; } }
      157: ];
      ```
      - Observed: `iei_members` is **completely omitted** from `collectionsToSync`. There is **no** `onSnapshot` listener for `iei_members`.
    - In `getMembers()` (Lines 205–207):
      ```javascript
      205: export async function getMembers() {
      206:   return [...membersStore];
      207: }
      ```
      - Observed: `getMembers()` returns only `membersStore` from in-memory/localStorage and **never** queries Cloud Firestore collection `iei_members`.
- **File**: `firestore.rules` (Lines 1–98)
  - Lines 28–32:
    ```
    // Members / Users Collection
    match /iei_users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isStaffCoordinator() || request.auth.uid == userId;
    }
    ```
  - Observed: `firestore.rules` contains rules for collection `/iei_users/{userId}`, but **no match rule exists for `/iei_members/{memberId}`**.
  - Any write to Firestore `iei_members` operates against a collection without explicit security rules (falling back to Firestore default deny if not open).
  - The `isStaffCoordinator()` helper in `firestore.rules` (Lines 14–19) checks for `'Admin (Staff Coordinator)'` and does not grant permissions to Sri Priyan or Ramya Sri.

### 1.5 Verification Suite Execution
- **Command**: `cd C:\Users\Sripriyan\.gemini\antigravity\scratch\mgr-iei-platform; npm test`
- **Result**:
  - `TEST SUITE SUMMARY: 35 PASSED, 0 FAILED`
  - Validated: 11 exact roles, 23 seeded accounts, clean initial registers for tasks/events/attendance, first-level & final approval logic, confidential access checks for Sri Priyan, Ramya Sri, and Master Admin.

---

## 2. Logic Chain

From the direct observations above, the architectural state and gaps are deduced through the following chain:

1. **Authentication Architecture**:
   - *Premise (Obs 1.1)*: `AuthContext.jsx` checks credentials by searching the in-memory array `membersStore` (populated from localStorage key `iei_mgr_v6_members` or `INITIAL_MEMBERS`).
   - *Inference*: Authentication is self-contained client-side matching. It does not require online Firebase Auth tokens for the 23 committee members, though it supports an email-based Firebase Auth fallback for external users.
   - *Session Lifecycle*: Login saves the user object to `localStorage.getItem('iei_mgr_active_user')`. Logout clears only this session key and calls Firebase `signOut`. All committee data remains intact in `iei_mgr_v6_...` keys.

2. **Role Architecture Breakdown (Existing vs Approved 11 Roles)**:
   - *Premise (Obs 1.2)*: The 11 roles defined in `ROLES` and `ROLE_LIST` are:
     1. `Administrator` (Master User)
     2. `Staff Coordinator`
     3. `Chairman`
     4. `Vice Chairman`
     5. `Secretary`
     6. `Joint Secretary`
     7. `Treasurer`
     8. `Joint Treasurer`
     9. `Membership Director`
     10. `Event Management Head`
     11. `Executive Member`
   - *Comparison with Approved Spec*: The 11 roles match the approved specification exactly.
   - *Legacy Role Discrepancies*:
     - A 12th ghost string `'Admin (Staff Coordinator)'` exists in `FINAL_APPROVER_ROLES` (`roles.js`:42), `isStaffCoordinator` (`roles.js`:66), `firestore.rules` (line 16), and `DEPLOYMENT.md` (line 111).
     - In `seedData.js`, the account role is strictly `ROLES.STAFF_COORDINATOR` (`'Staff Coordinator'`). The legacy `'Admin (Staff Coordinator)'` is an artifact from prior iterations and should be normalized.
   - *Confidentiality Logic Discrepancies*:
     - In `canManageMembers(userOrRole)` (`roles.js`:114), if a string is passed, it permits `userOrRole === ROLES.JOINT_SECRETARY`. In `MembersList.jsx` (line 38), `canManageMembers(currentUser?.role)` is called with a string. While the outer tab in `DashboardPage.jsx` uses `canAccessMembersDirectory(currentUser)` (passing the user object), calling `canManageMembers` with a role string is a semantic hole.
     - In `canAccessMembersDirectory(user)`, line 105 allows `user.role === ROLES.MEMBERSHIP_DIRECTOR`. If another Membership Director account were created, they would inherit access, whereas the specification designates Ramya Sri M specifically.

3. **Data Model Inspection & Schema Gaps**:
   - *Premise (Obs 1.3)*: The member model has 17 active fields (`id`, `name`, `role`, `username`, `secondaryUsername`, `password`, `email`, `secondaryEmail`, `phone`, `department`, `membershipId`, `year`, `status`, `avatar`, `isMasterAdmin`, `joinedDate`, `updatedAt`).
   - *Gaps vs Approved Spec*:
     - *Password Generator*: Requirement R2.2 specifies passwords prefixed with `IEI#...` (e.g. `IEI#Ramya*9164`). In `credentialService.js` (line 54), `sym1` is randomly picked from `['*', '#', '$', '!', '@']`, producing prefixes like `IEI$` or `IEI!`.
     - *No TypeScript / Runtime Schema*: There are no TypeScript types or runtime schema validators (such as Zod/Yup) to guard data integrity during additions.

4. **Persistence Layer & Firestore Status**:
   - *Premise (Obs 1.4)*:
     - `saveMember` and `deleteMember` fire `syncToFirestore('iei_members', ...)` and `syncDeleteFromFirestore('iei_members', ...)`.
     - However, `collectionsToSync` in `firebaseService.js` omits `iei_members`.
     - `getMembers()` never queries Firestore.
     - `firestore.rules` has no rule for `iei_members`, only `/iei_users/{userId}`.
   - *Inference*: The dual-layer persistence for `iei_members` is **half-wired**: write operations push to Firestore in the background, but inbound sync, real-time updates across multiple clients, and cloud security rules for `iei_members` are completely missing. If a user logs in on a second device, changes made to members on the first device will not propagate via Firestore.

---

## 3. Caveats

1. **No External Network Calls Tested**: The inspection was conducted in the local offline development environment. Live connectivity to Firebase project `sachin-crackers-smartpos-81c6a` was not validated against live cloud endpoints.
2. **Cleartext Passwords**: Passwords in `seedData.js` and `membersStore` are stored in plain text to allow the copyable credential notice feature (`formatCredentialNotice`). In an institutional production rollout, hashing (e.g. bcrypt or Firebase Auth native credential storage) may be desired, but plain text is currently utilized to satisfy the automated credential distribution requirement.
3. **No Unapproved Modifications**: Per the strict Read-Only constraint, zero repository files were touched.

---

## 4. Conclusion

1. **Authentication Architecture**: Successfully decoupled from external dependencies for offline capability, with session persistence anchored in `localStorage['iei_mgr_active_user']`. Protected route enforcement in `App.jsx` cleanly blocks unauthenticated users.
2. **Role Definitions**: The 11 approved roles are accurately defined and matched in `ROLES` and `ROLE_LIST`. Legacy references to `'Admin (Staff Coordinator)'` in `FINAL_APPROVER_ROLES`, `roles.js`, and `firestore.rules` must be sanitized.
3. **Data Model**: The member schema contains all necessary institutional attributes. The password generator in `credentialService.js` must be adjusted to strictly prefix with `IEI#` instead of random symbols.
4. **Persistence Layer**: The local reactive layer (`localStorage['iei_mgr_v6_members']` and `subscribers['members']`) is functional, but the Firestore sync layer for `iei_members` requires:
   - Adding `iei_members` to `collectionsToSync` with real-time `onSnapshot`.
   - Updating `firestore.rules` to include `/iei_members/{memberId}` with appropriate read/write guards.
   - Updating `canManageMembers` call sites to pass the `currentUser` object rather than role strings.

---

## 5. Verification Method

To independently verify the observations and conclusions in this report:

1. **Execute Project Verification Suite**:
   ```bash
   cd C:\Users\Sripriyan\.gemini\antigravity\scratch\mgr-iei-platform
   npm test
   ```
   *Expected Result*: All 35 tests pass, confirming role hierarchy, 23 seeded accounts, clean slate registers, and confidential directory access logic.

2. **Inspect Authentication & Session Logic**:
   - Open `src/context/AuthContext.jsx` lines 15–35 (localStorage key `'iei_mgr_active_user'`) and lines 38–96 (`login` matching logic).
   - In browser DevTools: Inspect `Application > Local Storage > iei_mgr_active_user` upon login/logout.

3. **Inspect Role Definitions & Approvers**:
   - Open `src/config/roles.js` lines 1–27 (`ROLES`, `ROLE_LIST`), lines 39–43 (`FINAL_APPROVER_ROLES` noting `'Admin (Staff Coordinator)'`), and lines 86–117 (`canAccessMembersDirectory`, `canManageMembers`).

4. **Inspect Persistence & Firestore Rules Mismatch**:
   - Open `src/services/firebaseService.js` lines 151–157 (observe absence of `iei_members` in `collectionsToSync`).
   - Open `src/services/firebaseService.js` lines 205–207 (observe `getMembers()` returns local store only).
   - Open `firestore.rules` lines 28–32 (observe rule matches `iei_users` instead of `iei_members`).

5. **Invalidation Conditions**:
   - If `npm test` fails, the verified claims regarding the 11 roles or 23 seeded accounts are invalidated.
   - If `iei_members` is found in `collectionsToSync` or `firestore.rules`, the persistence gap observation is invalidated.
