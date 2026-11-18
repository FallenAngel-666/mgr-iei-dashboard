# HOSTINGER PRODUCTION DEPLOYMENT GUIDE
**Project:** IEI MGR STUDENTS CHAPTER (`IEI DASHBOARD SYSTEM`)  
**Institution:** Dr. M.G.R. Educational and Research Institute (Deemed to be University)  
**Official IEI Mail:** `iei@drmgrdu.ac.in`

---

## 1. Hostinger Compatibility Audit Report

### Architecture & Technology Stack
| Layer | Technology | Version / Service | Hostinger Runtime Needed? |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React + Vite (SPA) | React 18.3.1, Vite 5.2.11 | Static HTML/CSS/JS only |
| **Styling & UI** | Tailwind CSS + Lucide Icons | Tailwind 3.4.3 | Compiled static CSS |
| **PDF Reports Engine** | jsPDF + jsPDF-AutoTable | Client-side browser PDF | None (runs in browser) |
| **Authentication** | Firebase Auth + Committee RBAC | Firebase SDK 10.12.0 | Managed Cloud (Google) |
| **Primary Database** | Google Cloud Firestore | Real-time NoSQL (`onSnapshot`) | Managed Cloud (Google) |
| **File / Image Storage** | Firebase Cloud Storage | 10 MB MIME-validated uploads | Managed Cloud (Google) |
| **Web Server Rules** | Apache / LiteSpeed `.htaccess` | Included in `public/.htaccess` | Native Hostinger LiteSpeed |

### Hostinger Hosting Plan Compatibility
| Hostinger Plan | Compatibility | Notes |
| :--- | :--- | :--- |
| **Single / Premium / Business Web Hosting (Shared)** | **100% Compatible (Recommended)** | Serves compiled `dist/` via LiteSpeed CDN + `.htaccess`. Zero Node.js or PHP runtime required on Hostinger. |
| **Cloud Startup / Cloud Professional** | **100% Compatible** | Dedicated resources + LiteSpeed. Over-provisioned for static hosting; great if scaling to 10,000+ daily visitors. |
| **Hostinger VPS (Ubuntu + Nginx/Apache)** | **Compatible** | Requires manual Nginx `try_files $uri $uri/ /index.html;` or Apache `.htaccess` setup. |

### Technology Limitations & Resource Scaling (1,500+ Registered Members)
1. **Hostinger Bandwidth & Static Assets:**
   - The compiled bundle (`dist/`) is ~2.8 MB total (with Gzip + 1-year immutable asset caching via `.htaccess`).
   - Even with 1,500 active members, repeat page loads transfer `< 5 KB` (`index.html`), well within Hostinger Premium/Business bandwidth limits.
2. **Firebase Spark (Free) vs. Blaze (Pay-As-You-Go) Plan at 1,500 Members:**
   - **Important:** Firebase Spark (Free) allows **50,000 Firestore reads/day** and **20,000 writes/day**.
   - With 23 committee members, Spark Free is more than sufficient.
   - **Once you exceed ~200–300 active daily users or 1,500 registered members**, each user loading a 1,500-member directory consumes 1,500 reads per initial sync. Upgrade the Firebase project to **Blaze Plan** (pay-as-you-go with the free tier included + a monthly billing budget alert) before onboarding 1,500 members!
3. **Desktop/Mobile Wrappers Excluded from Hostinger:**
   - The repository also contains `electron/`, `android/`, `release/`, and `*.apk` for desktop/mobile builds. **Never upload these folders to Hostinger `public_html`.** Only upload the compiled contents of `dist/` (or `hostinger-deploy-package.zip`).

---

## 2. Required Environment Variables

Copy `.env.example` to `.env.production` locally before building. **Never commit `.env.production` or real secrets to Git.**

| Variable | Required | Description |
| :--- | :--- | :--- |
| `VITE_APP_URL` | Optional | Your custom HTTPS domain (e.g., `https://your-domain.com`, no trailing slash). If left blank, the app automatically resolves `window.location.origin`. |
| `VITE_APP_ENV` | Yes | Set to `production`. |
| `VITE_FIREBASE_API_KEY` | Yes | Firebase Web API key from Firebase Console → Project Settings. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | `<project-id>.firebaseapp.com` (or your custom Firebase Auth domain). |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Your Firebase Project ID. |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | `<project-id>.firebasestorage.app`. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase Messaging Sender ID. |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase Web App ID. |
| `VITE_FIREBASE_MEASUREMENT_ID` | Optional | Google Analytics Measurement ID. |
| `VITE_ENABLE_ERROR_LOGGING` | Optional | `true` (default) to log unhandled runtime errors to the immutable audit stream. |

---

## 3. Exact Hostinger Deployment Instructions

### Method A: Direct Upload via Hostinger hPanel File Manager (Fastest — Recommended)

1. **Build & Package Locally:**
   ```bash
   npm install
   npm run build:hostinger
   ```
   This runs Vite production compilation, verifies `.htaccess`, `index.html`, and all assets, checks for leaked secrets, and generates **`hostinger-deploy-package.zip`** in the project root.

2. **Prepare Hostinger `public_html`:**
   - Log in to **Hostinger hPanel** → **Websites** → click **Manage** on your domain.
   - Open **Files** → **File Manager** → open the **`public_html`** folder.
   - Delete Hostinger's default `default.php` file if present.

3. **Upload & Extract:**
   - Click **Upload** → **File** → select `hostinger-deploy-package.zip`.
   - Right-click `hostinger-deploy-package.zip` → click **Extract** → enter `.` (current directory, `public_html`) as the destination folder.
   - Verify that **`index.html`**, **`.htaccess`**, **`manifest.webmanifest`**, and the **`assets/`** folder are directly inside `public_html/` (NOT inside a nested `dist/` subfolder!).
   - Delete `hostinger-deploy-package.zip` from `public_html` after extraction.

4. **Enable Hidden Files Check:**
   - Confirm `.htaccess` is visible in `public_html` (Hostinger File Manager shows dotfiles by default).

### Method B: Automated Git Deployment via Hostinger hPanel (Alternative)
If your Hostinger plan includes Git deployment with Node.js build support:
- Connect your GitHub repository (`main` branch).
- Note: Hostinger shared plans typically deploy repository contents directly without running `npm run build` unless using a CI workflow (GitHub Actions FTP/SFTP deploy).
- **Recommended CI pattern:** Build `dist/` in GitHub Actions with your `VITE_FIREBASE_*` repository secrets and deploy `dist/` to Hostinger `public_html` via FTPS/SFTP (`SamKirkland/FTP-Deploy-Action`).

---

## 4. Custom Domain DNS Configuration

Once you purchase your domain (through Hostinger or an external registrar like GoDaddy/Namecheap/Cloudflare):

### If Domain is Purchased on Hostinger
- Hostinger automatically links the domain to your hosting plan's IPv4 address. Verify under **hPanel → Domains → DNS / Nameservers**:
  - **Type:** `A` | **Name:** `@` | **Points to:** `<Your Hostinger Server IP>` | **TTL:** `14400`
  - **Type:** `CNAME` | **Name:** `www` | **Target:** `<your-domain.com>` | **TTL:** `14400`

### If Domain is Purchased on an External Registrar
- Option 1 (Easiest): Point Nameservers to Hostinger:
  - `ns1.dns-parking.com`
  - `ns2.dns-parking.com`
- Option 2 (Keep External DNS): Add the `A` record (`@` → Hostinger IP from hPanel → Plan Details) and `CNAME` record (`www` → `your-domain.com`).
- Wait 15 minutes to 24 hours for global DNS propagation.

### Canonical Domain (`www` vs non-`www`)
Open `public_html/.htaccess` and uncomment **either** Option A (redirect `www` → `non-www`, recommended) **or** Option B (redirect `non-www` → `www`). Do **not** enable both simultaneously.

### CRITICAL: Authorize Your New Domain in Firebase
1. Open **Firebase Console** → **Authentication** → **Settings** → **Authorized domains**.
2. Click **Add domain** and add BOTH:
   - `your-domain.com`
   - `www.your-domain.com`
3. (Recommended) In **Google Cloud Console → APIs & Services → Credentials → Browser API key**, restrict your `VITE_FIREBASE_API_KEY` HTTP referrers to `https://your-domain.com/*` and `https://www.your-domain.com/*`.

---

## 5. SSL / HTTPS Activation on Hostinger

1. Go to **Hostinger hPanel** → **Security** → **SSL**.
2. Click **Install SSL** (Lifetime Free Let's Encrypt SSL is included on Hostinger plans).
3. Select your domain (`your-domain.com`) and click **Install SSL** (takes 2–10 minutes after DNS points to Hostinger).
4. Once SSL status shows **Active**, verify **Force HTTPS** is enabled in hPanel (also enforced automatically at the server level by `public_html/.htaccess`).
5. Visit `http://your-domain.com` and confirm it permanently redirects (`301`) to `https://your-domain.com` with a valid padlock icon.

---

## 6. Database, Rules & Storage Setup

Cloud Firestore is already configured as the centralized, persistent production database.

### Deploying Rules & Production Indexes
Run from your local workspace whenever updating rules or indexes:
```bash
npm run deploy:rules
```
This deploys:
- `firestore.rules` (enforces schema validation and **absolute immutability** on `system_audit_logs`: `allow update: if false; allow delete: if false;`)
- `storage.rules` (enforces 10 MB size cap and safe image/PDF/document MIME-type allowlist)
- `firestore.indexes.json` (composite indexes for `iei_members`, `iei_tasks`, `iei_notifications`, and `system_audit_logs` to support 1,500+ members)

### Security Architecture Note (Important Transparency)
- The portal currently uses committee username/password lookup against `iei_members` combined with Firebase Auth fallback so all 23 pre-provisioned institutional accounts work without manual Firebase Auth console onboarding.
- Because `iei_members` is queried prior to sign-in, Firestore read rules are currently open at the transport layer while UI/RBAC + audit logging govern module access (including strict restriction of the **System Activity Console** to CBN Joint Secretary and Master Administrator).
- **Recommended Post-Launch Security Upgrade:** Once live on your custom domain, provision all committee accounts in Firebase Authentication + deploy a lightweight Firebase Cloud Function with Custom Claims (`role`, `isMasterAdmin`) so `firestore.rules` can enforce `request.auth != null` on every internal collection.

---

## 7. Backup & Disaster Recovery

### Creating a Complete Database Backup
```bash
npm run backup:db
```
- Exports all 12 Cloud Firestore collections (`iei_members`, `iei_public_profile`, `iei_public_events`, `iei_tasks`, `iei_updates`, `iei_events`, `iei_attendance`, `iei_announcements`, `iei_certificates`, `iei_achievements`, `iei_notifications`, `system_audit_logs`) into a timestamped JSON file inside `backups/` (git-ignored).
- **Schedule:** Run weekly before major chapter events and store encrypted copies offline (e.g., institutional Google Drive).

### Restoring from a Backup
```bash
node scripts/firestore-restore.mjs backups/iei-firestore-backup-YYYY-MM-DDTHH-MM-SS-MMMZ.json
```
- Restores collections in safe 400-document Firestore batches (`merge: true`).
- Automatically skips `system_audit_logs` to preserve immutable audit compliance.

### Hostinger File Backups
- Hostinger automatically creates weekly (Premium) or daily (Business/Cloud) backups of `public_html` under **hPanel → Files → Backups**.

---

## 8. Error Logging & Monitoring

- Global browser runtime errors (`window.onerror`), unhandled promise rejections (`unhandledrejection`), and React `ErrorBoundary` crashes are automatically captured by `src/utils/errorLogger.js`.
- Rate-limited to max 10 events/minute to protect Firestore quotas, with zero credentials logged.
- Recorded directly into `system_audit_logs` (`action: SYSTEM_RUNTIME_ERROR`, `status: FAILED`) for inspection by **CBN Joint Secretary** and **Master Administrator** in the **System Activity Console**.

---

## 9. Manual Configuration Checklist (After Purchasing Domain & Hostinger Plan)

1. [ ] Purchase your custom domain and Hostinger Web Hosting plan (Premium or Business recommended).
2. [ ] Set `VITE_APP_URL=https://your-domain.com` in your local `.env.production` file.
3. [ ] Run `npm run build:hostinger` to generate `hostinger-deploy-package.zip`.
4. [ ] Upload and extract `hostinger-deploy-package.zip` directly into Hostinger `public_html/`.
5. [ ] Uncomment your preferred `www` or non-`www` redirect block in `public_html/.htaccess`.
6. [ ] Configure DNS (`A` and `CNAME` records) and wait for propagation.
7. [ ] Activate Free Let's Encrypt SSL in Hostinger hPanel → Security → SSL.
8. [ ] Add `your-domain.com` and `www.your-domain.com` in **Firebase Console → Authentication → Settings → Authorized domains**.
9. [ ] Restrict `VITE_FIREBASE_API_KEY` HTTP referrers to your custom domain in Google Cloud Console.
10. [ ] Run `npm run deploy:rules` to publish updated `storage.rules` and `firestore.indexes.json` to Firebase.
11. [ ] Change default Master Administrator & Staff Coordinator passwords immediately after initial production verification.
12. [ ] Upgrade Firebase to Blaze plan (with a monthly budget alert) before onboarding 1,500+ registered student members.
