# IEI MGR Students Chapter — Hostinger Database Setup

This directory contains the complete MySQL 8.0+ / MariaDB 10.6+ database schema and essential configuration seed for deploying the **IEI MGR Students Chapter Dashboard** on Hostinger Unlimited / Business Web Hosting.

---

## Files in this Directory

| File | Purpose |
| :--- | :--- |
| **`schema.sql`** | Complete MySQL schema creating all 16 required tables with indexes. |
| **`seed.sql`** | Essential initial configuration data (collection versions, public profile, weekly restriction rules). Zero hardcoded passwords. Zero fake students. |
| **`verify.php`** | Automated verification utility to check database connectivity, table integrity, and storage permissions. |
| **`immutability_triggers.sql`** | Optional MySQL engine-level triggers preventing updates/deletes on `system_audit_logs`. |

---

## Step-by-Step Installation Instructions

### Step 1: Create MySQL Database in Hostinger hPanel
1. Log in to your **Hostinger hPanel** (`hpanel.hostinger.com`).
2. Go to **Websites** $\rightarrow$ click **Manage** next to your domain.
3. In the left menu, navigate to **Databases** $\rightarrow$ **Management**.
4. Under **Create a New MySQL Database and Database User**:
   - **Database Name**: e.g., `u123456789_iei_db`
   - **Username**: e.g., `u123456789_iei_admin`
   - **Password**: Generate a strong password (copy this down safely).
5. Click **Create**.

---

### Step 2: Import Database Schema & Seed via phpMyAdmin
1. In the same **Databases** page in hPanel, scroll to your newly created database and click **Enter phpMyAdmin**.
2. Inside phpMyAdmin, click on your database name in the left panel.
3. Click the **Import** tab in the top navigation bar.
4. Click **Choose File** $\rightarrow$ select **`database/schema.sql`**.
5. Leave all format settings as default (UTF-8, SQL) and click **Import** (or **Go**) at the bottom.
   - *Result: All 16 tables will be created.*
6. Click the **Import** tab again $\rightarrow$ choose **`database/seed.sql`** $\rightarrow$ click **Import**.
   - *Result: Essential metadata, public profile, and system rules will be seeded.*

---

### Step 3: Configure Database Credentials in `api/config.php`
1. In Hostinger hPanel, open **File Manager** $\rightarrow$ go to `public_html/api/`.
2. Find `config.example.php` and copy or rename it to **`config.php`**.
3. Edit `config.php` and fill in your Hostinger MySQL details:
   ```php
   return [
       'DB_HOST' => 'localhost',
       'DB_PORT' => '3306',
       'DB_NAME' => 'u123456789_iei_db',
       'DB_USER' => 'u123456789_iei_admin',
       'DB_PASS' => 'YOUR_HOSTINGER_DB_PASSWORD',
       'APP_SECRET' => 'GENERATE_A_RANDOM_64_CHAR_KEY_HERE',
       'ALLOWED_ORIGINS' => [
           'https://yourdomain.com',
           'https://www.yourdomain.com',
       ],
   ];
   ```
4. Save the file.

---

### Step 4: Verify Database Connectivity
You can verify that everything is working properly:
- **Via SSH / Terminal**:
  ```bash
  php database/verify.php
  ```
- **Via Web Browser**:
  Visit `https://yourdomain.com/api/verify.php`
  *(All checks should report `[PASS]` and status `READY FOR PRODUCTION`).*

---

### Step 5: Initialize Master Administrator Account
Visit:
```text
https://yourdomain.com/api/setup.php
```
Fill in the one-time Master Administrator setup form with your official email (`iei@drmgrdu.ac.in`) and a secure password. Once completed, the setup utility locks itself permanently and redirects you to the dashboard login!
