# Institutional Deployment Guide — MGR IEI Student Chapter Management Platform
### Dr. M.G.R. Educational and Research Institute (Deemed to be University)
**Accredited with A+ Grade by NAAC | Graded Autonomy Status | ISO 21001:2018 Certified**

---

## 1. Live Production Deployment Status

The web platform is currently live and deployed globally on Google Firebase Hosting with high-availability CDN caching and security headers:

- **Primary Production URL:** [https://sachin-crackers-smartpos-81c6a.web.app](https://sachin-crackers-smartpos-81c6a.web.app)
- **Secondary Production URL:** [https://sachin-crackers-smartpos-81c6a.firebaseapp.com](https://sachin-crackers-smartpos-81c6a.firebaseapp.com)
- **Google Firebase Console:** [https://console.firebase.google.com/project/sachin-crackers-smartpos-81c6a/overview](https://console.firebase.google.com/project/sachin-crackers-smartpos-81c6a/overview)

---

## 2. Institutional Deliverables Checklist

| Target Platform | Package / Binary | Path | Status |
|---|---|---|---|
| **Live Web App** | Firebase Hosting CDN | `https://sachin-crackers-smartpos-81c6a.web.app` | **LIVE (HTTP 200)** |
| **Windows Desktop (Portable)** | `mgr-iei-windows-app.exe` | [`mgr-iei-windows-app.exe`](file:///C:/Users/Sripriyan/.gemini/antigravity/scratch/mgr-iei-platform/mgr-iei-windows-app.exe) | **COMPILED (106 MB)** |
| **Windows Desktop (Direct)** | `MGR IEI Student Chapter.exe` | [`win-unpacked/MGR IEI Student Chapter.exe`](file:///C:/Users/Sripriyan/.gemini/antigravity/scratch/mgr-iei-platform/release/win-unpacked/MGR%20IEI%20Student%20Chapter.exe) | **COMPILED (249 MB)** |
| **Android Mobile** | `mgr-iei-app-debug.apk` | [`mgr-iei-app-debug.apk`](file:///C:/Users/Sripriyan/.gemini/antigravity/scratch/mgr-iei-platform/mgr-iei-app-debug.apk) | **COMPILED (9.88 MB)** |
| **Firestore Security Rules** | `firestore.rules` | Active on Cloud Firestore | **RELEASED & SEALED** |

---

## 3. How to Deploy Updates in One Click

### Method A — Windows Batch (Double-Click)
Run the automated script in the project directory:
```cmd
deploy.bat
```
This automatically executes the 12-scenario integration test suite, compiles the optimized production bundle, and deploys to Firebase Hosting.

### Method B — PowerShell
```powershell
./deploy.ps1
```

### Method C — NPM Scripts
```bash
# Full verification + build + Firebase deployment
npm run deploy

# Deploy hosting assets only
npm run deploy:hosting

# Deploy Firestore security rules only
npm run deploy:rules
```

---

## 4. Multi-Platform Hosting Configurations

The repository includes pre-configured settings for standard institutional cloud hosts:

### 1. Google Firebase Hosting
- Configuration: `firebase.json` and `.firebaserc`
- Includes single-page application (SPA) rewrite rules to `/index.html`
- Configured with HTTP security headers (`X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`)
- Immutable 1-year asset caching (`Cache-Control: public, max-age=31536000, immutable`)

### 2. Vercel
- Configuration: `vercel.json`
- Supports automatic deployment via GitHub repository import or `vercel deploy --prod`.

### 3. Netlify
- Configuration: `netlify.toml` and `public/_redirects`
- Zero-config deployment with SPA redirects (`/* /index.html 200`).

### 4. GitHub Actions CI/CD
- Configuration: `.github/workflows/deploy.yml`
- Automatically runs `npm test` and `npm run build` on every push to `main`.
- Can deploy to Firebase Hosting on merge if the secret `FIREBASE_SERVICE_ACCOUNT` is set in GitHub Repository Secrets.

---

## 5. Security & Environment Configuration

### Environment Variables
Environment templates are stored in `.env.example` and `.env.production`:
```env
VITE_FIREBASE_API_KEY=AIzaSyCddFLGz2TjRGmpg8cNcWrm-rtYmNNXvXE
VITE_FIREBASE_AUTH_DOMAIN=sachin-crackers-smartpos-81c6a.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=sachin-crackers-smartpos-81c6a
VITE_FIREBASE_STORAGE_BUCKET=sachin-crackers-smartpos-81c6a.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=143073801647
VITE_FIREBASE_APP_ID=1:143073801647:web:e75f4300893c55b39a6b5a
VITE_FIREBASE_MEASUREMENT_ID=G-3R5NMW0K39
```

### Cloud Storage Note
To enable file attachment uploads (PDFs, photos for community posts & reports) in production Firebase Storage:
1. Open the [Firebase Storage Console](https://console.firebase.google.com/project/sachin-crackers-smartpos-81c6a/storage).
2. Click **Get Started** and select default location.
3. Deploy storage security rules via:
   ```bash
   firebase deploy --only storage
   ```

---

## 6. Official Institutional Accounts (For Testing & Access)

| Role | Email Address | Password |
|---|---|---|
| **Admin (Staff Coordinator)** | `admin.iei@drmgrdu.ac.in` | `StaffCoord@2026` |
| **Chairman** | `chairman.iei@drmgrdu.ac.in` | `Chairman@2026` |
| **Vice Chairman** | `vicechairman.iei@drmgrdu.ac.in` | `ViceChair@2026` |
| **Secretary** | `secretary.iei@drmgrdu.ac.in` | `Secretary@2026` |
| **Joint Secretary** | `jointsec.iei@drmgrdu.ac.in` | `JointSec@2026` |
| **Treasurer** | `treasurer.iei@drmgrdu.ac.in` | `Treasurer@2026` |
| **Joint Treasurer** | `jointtreasurer.iei@drmgrdu.ac.in` | `JointTreas@2026` |
| **Membership Director** | `membership.iei@drmgrdu.ac.in` | `MemberDir@2026` |
| **Event Management Head** | `events.iei@drmgrdu.ac.in` | `EventHead@2026` |
| **Executive Member** | `executive.member@drmgrdu.ac.in` | `Executive@2026` |
