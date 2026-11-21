# MGR IEI Students Chapter — Database Setup & Architecture Guide

This guide provides instructions for setting up, configuring, and verifying the MySQL database for the **IEI MGR Students Chapter Dashboard** on Hostinger Unlimited Web Hosting.

---

## 1. Architecture Overview

The database is built on standard **MySQL 8.0+ / MariaDB 10.6+** and supports over **1,500+ registered student members** with full indexing, delta synchronization, and immutable activity auditing.

```
+-------------------------------------------------------------------------+
|                    HOSTINGER MYSQL DATABASE ARCHITECTURE                |
+-------------------------------------------------------------------------+
| 1. Synchronous Core:                                                    |
|    - iei_members         : User identities, roles, hashed passwords     |
|    - iei_sync_meta       : Multi-user real-time versioning              |
|    - iei_login_attempts  : Brute-force rate limiting (5 / 15 min)       |
|                                                                         |
| 2. Work & Governance:                                                   |
|    - iei_tasks           : Assigned tasks, progress & 2-level approvals |
|    - iei_system_settings : Weekly submission restrictions & rules       |
|    - iei_updates         : Private community chat stream                |
|                                                                         |
| 3. Programs & Records:                                                  |
|    - iei_events          : Scheduled meetings & symposia                |
|    - iei_attendance      : Verified event attendance registers          |
|    - iei_announcements   : Official circulars & directives              |
|    - iei_certificates    : Issued student certificates                  |
|    - iei_achievements    : Chapter honors & awards                      |
|    - iei_notifications   : Notification alerts                          |
|                                                                         |
| 4. Public Welcome Portal:                                               |
|    - iei_public_profile  : Faculty advisor, mentor, contact data        |
|    - iei_public_events   : Publicly visible event listings              |
|                                                                         |
| 5. Security & Storage:                                                  |
|    - iei_uploads         : Metadata index for Hostinger NVMe files      |
|    - system_audit_logs   : Append-only immutable institutional log      |
+-------------------------------------------------------------------------+
```

---

## 2. Table Specifications & Relationships

| Table Name | Description | Key Indexes |
| :--- | :--- | :--- |
| **`iei_sync_meta`** | Tracks collection versions for live client delta synchronization. | `PRIMARY KEY (collection_name)` |
| **`iei_members`** | Registered members, officers, and administrators. Passwords are saved strictly as bcrypt hashes. | `PRIMARY KEY (id)`, `UNIQUE (username)`, `(role, status)`, `email` |
| **`iei_tasks`** | Tasks assigned to students, duration logged (hours/minutes), and approval states. | `PRIMARY KEY (id)`, `(week_id, status)`, `(assignee_id, created_at)` |
| **`iei_updates`** | Private chapter updates, announcements, and work media posts. | `PRIMARY KEY (id)`, `(created_at)` |
| **`iei_events`** | Official committee meetings, webinars, and national symposia. | `PRIMARY KEY (id)`, `(event_date)` |
| **`iei_attendance`** | Attendance logs linked to official chapter events. | `PRIMARY KEY (id)`, `(event_id, event_date)` |
| **`iei_announcements`**| Official notices, agendas, and circulars with priority tags. | `PRIMARY KEY (id)`, `(created_at)` |
| **`iei_certificates`** | Certificates issued to student participants. | `PRIMARY KEY (id)` |
| **`iei_achievements`** | Chapter milestones, awards, and recognitions. | `PRIMARY KEY (id)` |
| **`iei_notifications`**| Real-time alerts for task assignment, submission, and review. | `PRIMARY KEY (id)`, `(recipient_id, is_read, created_at)` |
| **`iei_public_profile`**| Public landing page configuration (Faculty Advisor: Dr. Antony Xavier Bronson). | `PRIMARY KEY (id)` |
| **`iei_public_events`** | Upcoming events shown to external visitors. | `PRIMARY KEY (id)`, `(event_date)` |
| **`iei_uploads`** | File upload metadata (original name, stored random name, size, MIME type). | `PRIMARY KEY (id)`, `(folder, created_at)` |
| **`system_audit_logs`** | Append-only immutable log of every action taken in the portal. | `PRIMARY KEY (id)`, `(module, created_at)`, `(actor_username)` |
| **`iei_system_settings`**| Global portal rules (e.g. Weekly Work Submission Restriction). | `PRIMARY KEY (id)` |
| **`iei_login_attempts`**| IP and username tracking to block brute-force password attempts. | `PRIMARY KEY (id)`, `(ip_address, attempt_time)` |

---

## 3. Step-by-Step Hostinger Database Installation

### Step 1: Create Database in Hostinger hPanel
1. Open **Hostinger hPanel** (`hpanel.hostinger.com`).
2. Go to **Websites** $\rightarrow$ Click **Manage** on your domain.
3. In the sidebar, navigate to **Databases** $\rightarrow$ **Management**.
4. Fill in:
   - **Database Name**: e.g., `u123456789_iei_db`
   - **Username**: e.g., `u123456789_iei_user`
   - **Password**: Create a strong password (save this in a secure place).
5. Click **Create**.

### Step 2: Import Schema & Seed via phpMyAdmin
1. On the same Databases page, click **Enter phpMyAdmin** next to your new database.
2. Select your database from the left navigation tree.
3. Click the **Import** tab in the top navigation bar.
4. Click **Choose File** $\rightarrow$ select **`database/schema.sql`** $\rightarrow$ Click **Import** (or **Go**).
   - *All 16 tables will be created.*
5. Click **Import** tab again $\rightarrow$ choose **`database/seed.sql`** $\rightarrow$ Click **Import** (or **Go**).
   - *Initial system rules, public profile, and sync metadata will be seeded.*

### Step 3: Configure Database Credentials in `api/config.php`
1. In Hostinger hPanel, open **File Manager** $\rightarrow$ Navigate to `public_html/api/`.
2. Copy `config.example.php` and rename it to `config.php`.
3. Open `config.php` and update your MySQL connection parameters:
   ```php
   return [
       'DB_HOST' => 'localhost',
       'DB_PORT' => '3306',
       'DB_NAME' => 'u123456789_iei_db',
       'DB_USER' => 'u123456789_iei_user',
       'DB_PASS' => 'YOUR_HOSTINGER_DB_PASSWORD',
       'APP_SECRET' => 'REPLACE_WITH_A_RANDOM_64_CHARACTER_HEX_SECRET_STRING',
       'ALLOWED_ORIGINS' => [
           'https://yourdomain.com',
           'https://www.yourdomain.com'
       ],
       'MAX_UPLOAD_BYTES' => 10 * 1024 * 1024,
       'SESSION_TTL_SECONDS' => 7 * 24 * 60 * 60,
   ];
   ```
4. Save the file.

---

## 4. Verification & Testing

### Automated Verification via Web
Open your browser and visit:
```text
https://yourdomain.com/api/verify.php
```
You will receive a JSON health report checking:
- PHP version $\ge 8.0$ (`[PASS]`)
- Required PHP extensions: `pdo`, `pdo_mysql`, `json`, `mbstring`, `fileinfo` (`[PASS]`)
- `api/config.php` existence (`[PASS]`)
- MySQL database connectivity (`[PASS]`)
- Existence of all 16 required tables (`[PASS]`)
- Uploads folder permissions (`[PASS]`)

### Verification via Command Line (SSH)
```bash
php database/verify.php
```

---

## 5. Security & Maintenance Rules

1. **Passwords are Never Stored in Plaintext**:
   - The system uses PHP `password_hash()` with `PASSWORD_DEFAULT` (bcrypt) for all accounts.
2. **Never Expose `config.php`**:
   - Direct HTTP requests to `config.php` are blocked by `api/.htaccess`.
3. **Database Backups**:
   - On Hostinger Business Web Hosting, automated daily backups run every 24 hours.
   - You can also export backups from phpMyAdmin $\rightarrow$ **Export** $\rightarrow$ **Quick** $\rightarrow$ **Go**.
4. **Audit Trail Immutability**:
   - The `system_audit_logs` table is strictly append-only. No member or administrator can edit or delete activity records.
