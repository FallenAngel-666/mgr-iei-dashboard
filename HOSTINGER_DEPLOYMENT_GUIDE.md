# Hostinger Production Deployment Guide — IEI MGR Students Chapter

This guide provides simple, step-by-step instructions for deploying the **IEI MGR Students Chapter Dashboard** on **Hostinger Unlimited / Business Web Hosting**.

---

## Prerequisites

Before starting, ensure you have:
1. An active **Hostinger Web Hosting account** (Business Web Hosting or Premium Web Hosting).
2. A purchased domain connected to your Hostinger account (e.g. `ieidrmgrdu.ac.in` or `mgr-iei.com`).
3. The production deployment file: **`hostinger-deploy-package.zip`** (located in this project root).

---

## 4-Step Deployment Walkthrough

```
+-----------------------------------------------------------------------------------------+
| STEP 1: Upload Files         STEP 2: Create Database       STEP 3: Configure Database    |
| Upload & Extract ZIP      -> Create MySQL DB in         -> Rename config.example.php     |
| into public_html             phpMyAdmin & import SQL       to config.php & enter DB info|
+-----------------------------------------------------------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------------+
| STEP 4: First Admin Setup                                                               |
| Visit /api/setup.php in browser, create Master Administrator account, and launch!       |
+-----------------------------------------------------------------------------------------+
```

---

### Step 1: Upload & Extract Application Files
1. Log in to **Hostinger hPanel** at [hpanel.hostinger.com](https://hpanel.hostinger.com).
2. Under **Websites**, click **Manage** next to your domain.
3. In the left menu, click **File Manager** (or navigate to **Files** $\rightarrow$ **File Manager**).
4. Click on **`public_html`**.
5. Click the **Upload** icon (upward arrow in top-right corner) and choose **File**.
6. Select **`hostinger-deploy-package.zip`** from your computer.
7. Once uploaded, right-click `hostinger-deploy-package.zip` and select **Extract**.
8. Set destination directory to `public_html` and click **Extract**.
   - *After extraction, you should see `index.html`, `.htaccess`, `assets/`, `api/`, `database/`, and `uploads/` in `public_html`.*
9. (Optional) Delete the `hostinger-deploy-package.zip` file to save disk space.

---

### Step 2: Create MySQL Database & Import Tables
1. In hPanel, go to **Databases** $\rightarrow$ **Management**.
2. Under **Create a New MySQL Database and Database User**:
   - **Database Name**: e.g., `u123456789_iei_db`
   - **Username**: e.g., `u123456789_iei_user`
   - **Password**: Enter a strong password (copy and save this password!).
3. Click **Create**.
4. Scroll down to your newly created database and click **Enter phpMyAdmin**.
5. Inside phpMyAdmin:
   - Click your database name in the left sidebar.
   - Click the **Import** tab at the top.
   - Click **Choose File** $\rightarrow$ navigate into the extracted `database/` folder and select **`schema.sql`**.
   - Click **Import** (or **Go**) at the bottom.
     *(This creates all 17 required tables).*
   - Click the **Import** tab again $\rightarrow$ choose **`database/seed.sql`** $\rightarrow$ Click **Import**.
     *(This seeds initial system rules, collection versions, and public profile).*

---

### Step 3: Configure Database Connection
1. In **File Manager**, navigate into `public_html/api/`.
2. Find `config.example.php`.
3. Right-click `config.example.php` and click **Rename** (or **Copy**) to **`config.php`**.
4. Double-click `config.php` to edit it:
   ```php
   return [
       'DB_HOST' => 'localhost',
       'DB_PORT' => '3306',
       'DB_NAME' => 'u123456789_iei_db',        // Your Hostinger DB Name from Step 2
       'DB_USER' => 'u123456789_iei_user',      // Your Hostinger DB Username from Step 2
       'DB_PASS' => 'YOUR_DB_PASSWORD',         // Your Hostinger DB Password from Step 2

       // Generate a random string of 64 characters for signing user session tokens:
       'APP_SECRET' => 'a9f8b472e391d846c501938472918475a827461938472918475a827461938472',

       'ALLOWED_ORIGINS' => [
           'https://yourdomain.com',
           'https://www.yourdomain.com'
       ],
       'MAX_UPLOAD_BYTES' => 10 * 1024 * 1024,
       'SESSION_TTL_SECONDS' => 7 * 24 * 60 * 60,
   ];
   ```
5. Click **Save & Close**.

---

### Step 4: One-Time Master Administrator Setup
1. Open your web browser and navigate to:
   ```text
   https://yourdomain.com/api/setup.php
   ```
2. You will see the **IEI Master Administrator Setup** page.
3. Fill in the form:
   - **Administrator Full Name**: e.g., `Master Administrator`
   - **Master Username**: e.g., `admin.master-01`
   - **Official Chapter Email**: `iei@drmgrdu.ac.in`
   - **Master Password**: Enter your strong administrative password (minimum 12 characters, uppercase, lowercase, numbers, and special symbols).
4. Click **Initialize Master Administrator & Lock Setup**.
   - *The administrator is created with bcrypt hashing.*
   - *A security lockfile `.installed` is written.*
   - *The setup page is permanently locked against any future executions.*
5. Click **Proceed to Login** and log in with your credentials at `https://yourdomain.com/#/login`!

---

## Verifying Your Installation

Visit the automated verification endpoint:
```text
https://yourdomain.com/api/verify.php
```
Verify that all checks return `[PASS]` and status is `READY FOR PRODUCTION`.

---

## Frequently Asked Questions (FAQ)

### 1. Does this deployment require a VPS or Node.js running on the server?
**No.** The application is 100% pre-compiled static HTML/JavaScript/CSS and native PHP 8 REST APIs. It runs on standard Hostinger Web Hosting without needing Node.js processes, daemons, or root access.

### 2. How do student members register or get access?
The Master Administrator can log in to the dashboard, navigate to **Members Directory**, and click **Add New Member**. The system automatically generates the official institutional username and temporary password.

### 3. How does the weekly submission restriction work?
Inside the **Dashboard & Weekly** view, the Master Administrator has an ON/OFF toggle card.
- **ON**: Students can only submit reports for dates within the current week (Monday–Sunday, `Asia/Kolkata` timezone).
- **OFF**: Students can submit historical reports for any previous date.

### 4. How are files and photos stored?
All photos, certificates, and work reports uploaded by students are validated via PHP `finfo`, assigned randomized filenames, and stored securely on Hostinger disk storage inside `public_html/uploads/`. Direct execution of scripts inside `uploads/` is strictly blocked by `uploads/.htaccess`.
