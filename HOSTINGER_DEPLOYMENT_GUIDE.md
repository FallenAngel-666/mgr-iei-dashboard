# 100% HOSTINGER PRODUCTION DEPLOYMENT GUIDE
**Project:** IEI MGR STUDENTS CHAPTER (`IEI DASHBOARD SYSTEM`)  
**Institution:** Dr. M.G.R. Educational and Research Institute (Deemed to be University)  
**Official IEI Mail:** `iei@drmgrdu.ac.in`

---

## 1. Hostinger Compatibility Audit Report (100% Hostinger Architecture)

This application is engineered to run **100% natively on Hostinger** with **zero Firebase dependency and zero external database/storage fees** — even with **1,500+ registered student members**:

| Layer | Technology | Hostinger Native Component |
| :--- | :--- | :--- |
| **Frontend** | React 18.3 + Vite 5.2 + Tailwind CSS (Multi-page Public Portal + Dashboard) | Static SPA served via LiteSpeed (`public_html/`) |
| **Backend API** | Zero-dependency PHP 8.x REST API (`public_html/api/*.php`) | Native Hostinger PHP 8.1 / 8.2 / 8.3 (no Composer needed) |
| **Database** | **Hostinger MySQL 8 / MariaDB** (14 indexed tables in `database/schema.sql`) | Native Hostinger MySQL + phpMyAdmin |
| **File & Image Storage** | **Hostinger NVMe Disk (`/uploads/`) + MySQL `iei_uploads` table** | Native Hostinger storage (100–200 GB included) with `php_flag engine off` |
| **Real-Time Multi-User Sync** | Lightweight 4-second version-delta polling (`/api/sync.php` via `iei_sync_meta`) | Near-zero MySQL load; automatic live updates without browser refresh |
| **Audit Console Security** | Append-only `system_audit_logs` + optional MySQL triggers + server RBAC | Strictly restricted to CBN Joint Secretary & Master Administrator |

### Compatible Hostinger Plans
* **Hostinger Premium / Business Web Hosting (Shared — Recommended):** 100% compatible out of the box (PHP 8.2 + MySQL + LiteSpeed + Free SSL + 100–200 GB NVMe storage).
* **Hostinger Cloud Startup / Cloud Professional:** 100% compatible with dedicated resources.
* **Hostinger VPS:** 100% compatible (Apache/LiteSpeed or Nginx + PHP-FPM + MySQL).

> **Important Exclusion:** Do **not** upload `electron/`, `android/`, `release/`, `backups/`, or `*.apk` to Hostinger `public_html`. Only upload `hostinger-deploy-package.zip` (generated from `dist/`).

---

## 2. Step-by-Step Hostinger Deployment Instructions

### Step A: Generate the Hostinger Package & MySQL Seed File Locally
Run these two commands in the project workspace:
```bash
npm run migrate:mysql
npm run build:hostinger
```
This produces:
1. **`database/schema.sql`** — All 14 MySQL tables + composite indexes for 1,500+ members.
2. **`database/seed-from-firestore.sql`** — All 23 official committee accounts + Public Welcome Profile (Mentor Dr. L. Ramesh, Faculty Advisor Dr. Anthony Xavier, `iei@drmgrdu.ac.in`, gallery config).
3. **`hostinger-deploy-package.zip`** — Complete production frontend + PHP 8 `/api/` + hardened `.htaccess` + `/uploads/.htaccess` (with **zero secrets** inside).

---

### Step B: Create & Import Your Hostinger MySQL Database
1. Log in to **Hostinger hPanel** → **Websites** → **Manage** → **Databases** → **Management**.
2. Create a new MySQL database:
   * **Database Name** (e.g., `u123456789_iei_mgr`)
   * **Username** (e.g., `u123456789_iei_user`)
   * **Strong Password** (save this securely!)
3. Click **Enter phpMyAdmin** next to your new database.
4. Click the **Import** tab → upload **`database/schema.sql`** → click **Import** (creates all 14 tables cleanly).
5. Click **Import** again → upload **`database/seed-from-firestore.sql`** → click **Import** (loads all 23 official accounts + public profile).
6. *(Optional Extra SQL-Level Audit Lock)* Import **`database/immutability_triggers.sql`** if your Hostinger MySQL user grants `TRIGGER` privilege (PHP API already enforces strict append-only immutability either way).

---

### Step C: Upload & Extract Application Files to `public_html`
1. In **Hostinger hPanel** → **Files** → **File Manager** → open **`public_html/`**.
2. Delete Hostinger's placeholder `default.php` if present.
3. Click **Upload** → **File** → upload **`hostinger-deploy-package.zip`**.
4. Right-click `hostinger-deploy-package.zip` → **Extract** → enter `.` (directly into `public_html/`).
5. Delete `hostinger-deploy-package.zip` after extraction.
6. Confirm `public_html/` contains:
   * `index.html`
   * `.htaccess`
   * `manifest.webmanifest`
   * `assets/`
   * `api/` (`auth.php`, `data.php`, `sync.php`, `public.php`, `audit.php`, `upload.php`, `health.php`, `bootstrap.php`, `config.example.php`, `.htaccess`)
   * `uploads/` (`.htaccess`) — verify folder permission is **`755`** so PHP can save uploaded photos/posters.

---

### Step D: Configure Server Credentials (`public_html/api/config.php`)
1. Inside Hostinger File Manager, open **`public_html/api/`**.
2. Copy **`config.example.php`** to **`config.php`** (note: `api/.htaccess` strictly denies HTTP access to `config.php`).
3. Edit **`public_html/api/config.php`** and fill in:
   * `'DB_HOST' => 'localhost'`
   * `'DB_NAME' => '<your_hostinger_db_name>'`
   * `'DB_USER' => '<your_hostinger_db_user>'`
   * `'DB_PASS' => '<your_hostinger_db_password>'`
   * `'APP_SECRET' => '<64-character random hex string>'`
   * `'ALLOWED_ORIGINS' => ['https://your-domain.com', 'https://www.your-domain.com']`
4. Verify PHP version in **hPanel → Advanced → PHP Configuration** is **PHP 8.1, 8.2, or 8.3** with `pdo_mysql` and `fileinfo` extensions enabled (enabled by default on Hostinger).

---

### Step E: Verify Live Backend & Storage Health
Open in your browser:
```
https://your-domain.com/api/health.php
```
You should receive JSON confirming:
```json
{
  "ok": true,
  "backend": "hostinger-mysql-php8",
  "databaseConnected": true,
  "ieiTablesCount": 13,
  "membersCount": 23,
  "storageWritable": true
}
```

---

## 3. Required Environment Variables

See `.env.example` (zero real credentials committed):
* `VITE_BACKEND_MODE=hostinger` (set automatically by `npm run build:hostinger`)
* `VITE_API_BASE_URL=/api`
* `VITE_APP_URL=` *(optional: `https://your-domain.com`, auto-detects `window.location.origin` if blank)*
* `VITE_APP_ENV=production`
* `VITE_ENABLE_ERROR_LOGGING=true`

---

## 4. Custom Domain DNS & SSL Activation

### DNS Configuration
* **Hostinger Domain:** Verify `A` record (`@` → Hostinger IPv4) and `CNAME` (`www` → `your-domain.com`) in **hPanel → Domains → DNS / Nameservers**.
* **External Registrar:** Point nameservers to `ns1.dns-parking.com` and `ns2.dns-parking.com` (or configure `A` and `CNAME` manually).
* **www vs non-www:** Open `public_html/.htaccess` and uncomment Option A (`www` → `non-www`, recommended) or Option B (`non-www` → `www`).

### SSL Activation
1. Open **Hostinger hPanel → Security → SSL**.
2. Click **Install SSL** (Free Lifetime Let's Encrypt SSL) on your purchased domain.
3. Once status shows **Active**, HTTP requests automatically redirect (`301`) to HTTPS via `public_html/.htaccess`.

---

## 5. Backup & Disaster Recovery (Hostinger MySQL + Storage)

1. **Automated Hostinger Backups:** Hostinger automatically creates weekly (Premium) or daily (Business/Cloud) backups of both **Files (`public_html` + `uploads/`)** and **MySQL Databases** under **hPanel → Files → Backups**.
2. **Manual MySQL Backup:** Open **hPanel → Databases → phpMyAdmin** → select your database → **Export** → Quick / SQL → save locally or to encrypted institutional Google Drive.
3. **Manual Restore:** Open **phpMyAdmin → Import** → select your `.sql` backup file.
4. **Uploaded Files Backup:** Download `public_html/uploads/` periodically via Hostinger File Manager or SFTP.

---

## 6. Security Highlights

* **Passwords:** Verified with PHP `password_verify()` and automatically upgraded to **bcrypt** (`PASSWORD_BCRYPT`) on first login; passwords are NEVER returned to public visitors or non-authorized users.
* **Server-Side RBAC:** Enforced directly in PHP (`bootstrap.php`, `data.php`, `public.php`, `audit.php`) — non-authorized requests to the **System Activity Console** receive HTTP `403 Forbidden` and trigger a `SECURITY_ACCESS_DENIED` audit log.
* **Hardened File Uploads:** `upload.php` inspects real magic bytes (`finfo_file`), rejects non-whitelisted types, assigns random filenames, logs uploads in MySQL `iei_uploads`, and `uploads/.htaccess` disables PHP execution (`php_flag engine off`).
* **SQL Injection Protection:** 100% PDO prepared statements with `ATTR_EMULATE_PREPARES => false`.

---

## 7. Manual Configuration Checklist (After Purchasing Your Domain & Hostinger Plan)

1. [ ] Purchase your custom domain and Hostinger Web Hosting plan (Premium or Business).
2. [ ] Create a MySQL database & user in Hostinger hPanel → Databases.
3. [ ] Import `database/schema.sql` and `database/seed-from-firestore.sql` via phpMyAdmin.
4. [ ] Upload & extract `hostinger-deploy-package.zip` directly into `public_html/`.
5. [ ] Copy `public_html/api/config.example.php` → `public_html/api/config.php` and enter your MySQL credentials + 64-char random `APP_SECRET`.
6. [ ] Verify `public_html/uploads/` folder permissions are `755`.
7. [ ] Uncomment your preferred `www` or non-`www` rule in `public_html/.htaccess`.
8. [ ] Configure DNS records & install Free SSL in Hostinger hPanel → Security → SSL.
9. [ ] Verify `https://your-domain.com/api/health.php` returns `"ok": true, "databaseConnected": true, "storageWritable": true`.
10. [ ] Sign in as Master Administrator (`admin.master-01`) and Staff Coordinator (`staff.login`) and rotate default passwords.
