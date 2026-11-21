<?php
/**
 * /api/setup.php — Secure One-Time Master Administrator Setup Utility
 *
 * Requirements:
 * 1. One-time setup only. If Master Administrator already exists or .installed lockfile
 *    is present, this endpoint is permanently locked (HTTP 403).
 * 2. Enforces strong password policy (min 12 chars, uppercase, lowercase, number, symbol).
 * 3. Hashes password with password_hash() using PASSWORD_DEFAULT (bcrypt).
 * 4. Never exposes credentials in source code or client JS bundles.
 * 5. Logs setup event into immutable audit trail (system_audit_logs).
 */
declare(strict_types=1);

// Prevent caching
header('Cache-Control: no-store, no-cache, must-revalidate');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    http_response_code(503);
    echo '<!DOCTYPE html><html><head><title>Configuration Missing</title><style>body{font-family:sans-serif;padding:40px;background:#f8fafc;color:#1e293b;}</style></head><body>';
    echo '<h2>Database Configuration Missing</h2>';
    echo '<p>Please copy <code>api/config.example.php</code> to <code>api/config.php</code> and configure your Hostinger MySQL credentials first.</p>';
    echo '</body></html>';
    exit;
}

require_once __DIR__ . '/bootstrap.php';

$pdo = getDb();
$lockFile = __DIR__ . '/.installed';

// Check if setup is already locked
$isAlreadyInstalled = file_exists($lockFile);

if (!$isAlreadyInstalled) {
    try {
        $stmt = $pdo->query("SELECT COUNT(*) FROM iei_members WHERE is_master_admin = 1 OR role = 'Administrator'");
        $adminCount = (int)$stmt->fetchColumn();
        if ($adminCount > 0) {
            $isAlreadyInstalled = true;
            @file_put_contents($lockFile, "Installed on " . gmdate('c'));
        }
    } catch (Throwable $e) {
        // Table might not exist yet
    }
}

// Start PHP session for CSRF handling
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'httponly' => true,
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
        'samesite' => 'Lax',
    ]);
    session_start();
}

if (empty($_SESSION['iei_setup_csrf'])) {
    $_SESSION['iei_setup_csrf'] = bin2hex(random_bytes(32));
}
$csrfToken = $_SESSION['iei_setup_csrf'];

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// If already installed, reject all access
if ($isAlreadyInstalled) {
    http_response_code(403);
    if (($method === 'POST') || (isset($_SERVER['HTTP_ACCEPT']) && str_contains($_SERVER['HTTP_ACCEPT'], 'application/json'))) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'ok' => false,
            'error' => 'SETUP_LOCKED',
            'message' => 'System has already been initialized. First administrator setup is permanently locked.'
        ]);
        exit;
    }

    echo '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Setup Locked — IEI MGR Chapter</title>';
    echo '<meta name="viewport" content="width=device-width, initial-scale=1">';
    echo '<style>body{font-family:system-ui,-apple-system,sans-serif;background:#0b192c;color:#f1f5f9;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;}';
    echo '.card{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:32px;max-width:480px;text-align:center;box-shadow:0 10px 25px rgba(0,0,0,0.3);}';
    echo 'h2{color:#f59e0b;margin-top:0;}p{color:#94a3b8;line-height:1.6;}';
    echo 'a.btn{display:inline-block;margin-top:20px;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;}';
    echo 'a.btn:hover{background:#1d4ed8;}</style></head><body>';
    echo '<div class="card">';
    echo '<h2>System Setup Locked</h2>';
    echo '<p>The Master Administrator account has already been initialized for this portal. For security reasons, the first-time setup utility is locked and cannot be executed again.</p>';
    echo '<a href="/#/login" class="btn">Proceed to Login</a>';
    echo '</div></body></html>';
    exit;
}

$error = null;
$success = null;

if ($method === 'POST') {
    $isJson = isset($_SERVER['CONTENT_TYPE']) && str_contains($_SERVER['CONTENT_TYPE'], 'application/json');
    $data = $isJson ? getJsonBody() : $_POST;

    $postedCsrf = $data['csrf_token'] ?? '';
    if (!hash_equals($csrfToken, (string)$postedCsrf)) {
        if ($isJson) {
            sendJson(['ok' => false, 'error' => 'INVALID_CSRF', 'message' => 'CSRF verification failed.'], 403);
        }
        $error = 'Security session expired. Please refresh the page and try again.';
    } else {
        $name = trim((string)($data['name'] ?? 'Master Administrator'));
        $username = strtolower(trim((string)($data['username'] ?? 'admin.master-01')));
        $email = strtolower(trim((string)($data['email'] ?? 'iei@drmgrdu.ac.in')));
        $phone = trim((string)($data['phone'] ?? '+91 98401 23456'));
        $department = trim((string)($data['department'] ?? 'Institutional Administration'));
        $password = (string)($data['password'] ?? '');
        $passwordConfirm = (string)($data['password_confirm'] ?? '');

        // Validation
        if ($name === '' || $username === '' || $email === '' || $password === '') {
            $error = 'Please fill in all required fields.';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $error = 'Please enter a valid official email address.';
        } elseif ($password !== $passwordConfirm) {
            $error = 'Password confirmation does not match.';
        } elseif (strlen($password) < 12) {
            $error = 'Password must be at least 12 characters in length.';
        } elseif (!preg_match('/[A-Z]/', $password)) {
            $error = 'Password must include at least one uppercase letter (A-Z).';
        } elseif (!preg_match('/[a-z]/', $password)) {
            $error = 'Password must include at least one lowercase letter (a-z).';
        } elseif (!preg_match('/[0-9]/', $password)) {
            $error = 'Password must include at least one number (0-9).';
        } elseif (!preg_match('/[!@#$%^&*()_+\-=\[\]{};\':"\\\\|,.<>\/?]/', $password)) {
            $error = 'Password must include at least one special character (!@#$%^&*...).';
        }

        if (!$error) {
            try {
                // Atomic transaction to prevent race conditions during initialization
                $pdo->beginTransaction();

                // 1. Strict check: Refuse initialization if an administrator already exists
                $adminCheck = $pdo->query("SELECT COUNT(*) FROM iei_members WHERE is_master_admin = 1 OR role = 'Administrator' FOR UPDATE");
                if ((int)$adminCheck->fetchColumn() > 0) {
                    $pdo->rollBack();
                    @file_put_contents($lockFile, "Installed on " . gmdate('c'));
                    if ($isJson) {
                        sendJson([
                            'ok' => false,
                            'error' => 'SETUP_LOCKED',
                            'message' => 'System has already been initialized. First administrator setup is permanently locked.'
                        ], 403);
                    }
                    $error = 'System has already been initialized. First administrator setup is locked.';
                    throw new Exception($error);
                }

                // 2. Conflict check: Refuse if chosen username, email, or ID collides with ANY existing member
                $userId = 'user-administrator';
                $conflictStmt = $pdo->prepare(
                    'SELECT id, username, email FROM iei_members
                     WHERE LOWER(username) = ?
                        OR LOWER(email) = ?
                        OR LOWER(secondary_username) = ?
                        OR LOWER(secondary_email) = ?
                        OR id = ?
                     LIMIT 1'
                );
                $conflictStmt->execute([$username, $email, $username, $email, $userId]);
                $existingCollision = $conflictStmt->fetch();
                if ($existingCollision) {
                    $pdo->rollBack();
                    if ($isJson) {
                        sendJson([
                            'ok' => false,
                            'error' => 'ACCOUNT_CONFLICT',
                            'message' => 'The chosen username or email is already registered to an existing member record. Account collision prevented.'
                        ], 409);
                    }
                    $error = 'The chosen username or email is already in use by an existing member record.';
                    throw new Exception($error);
                }

                $passwordHash = password_hash($password, PASSWORD_DEFAULT);

                $memberData = [
                    'id' => $userId,
                    'name' => $name,
                    'role' => 'Administrator',
                    'username' => $username,
                    'secondaryUsername' => 'administrator',
                    'email' => $email,
                    'secondaryEmail' => 'admin.master@drmgrdu.ac.in',
                    'phone' => $phone,
                    'department' => $department,
                    'membershipId' => 'IEI-ROOT-001',
                    'year' => 'Master Administration',
                    'status' => 'Active',
                    'avatar' => 'https://ui-avatars.com/api/?name=' . urlencode($name) . '&background=4F46E5&color=fff',
                    'isMasterAdmin' => true,
                    'joinedDate' => gmdate('Y-m-d')
                ];

                $json = json_encode($memberData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

                // 3. Strict INSERT (Strict single insert to prevent account promotion races)
                $insertStmt = $pdo->prepare(
                    'INSERT INTO iei_members
                     (id, name, role, username, secondary_username, email, secondary_email, phone, department, membership_id, year, status, is_master_admin, password_hash, data_json)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
                );

                $insertStmt->execute([
                    $userId,
                    $name,
                    'Administrator',
                    $username,
                    'administrator',
                    $email,
                    'admin.master@drmgrdu.ac.in',
                    $phone,
                    $department,
                    'IEI-ROOT-001',
                    'Master Administration',
                    'Active',
                    1,
                    $passwordHash,
                    $json
                ]);

                bumpSyncVersion($pdo, 'members');

                // Append immutable audit log
                appendAuditLog($pdo, [
                    'actorUid' => $userId,
                    'actorName' => $name,
                    'actorUsername' => $username,
                    'actorRole' => 'Administrator',
                    'action' => 'AUTH_INITIAL_SETUP',
                    'module' => 'SECURITY',
                    'status' => 'SUCCESS',
                    'details' => "Master Administrator account initialized successfully for @{$username} via secure atomic setup utility.",
                    'targetId' => $userId
                ]);

                // Commit transaction
                $pdo->commit();

                // Write permanent lock file
                @file_put_contents($lockFile, "Installed by {$username} on " . gmdate('c'));

                if ($isJson) {
                    sendJson([
                        'ok' => true,
                        'message' => 'Master Administrator configured successfully. Setup is now permanently locked.',
                        'user' => [
                            'id' => $userId,
                            'name' => $name,
                            'username' => $username,
                            'role' => 'Administrator',
                            'email' => $email,
                        ]
                    ]);
                }

                $success = true;
            } catch (Throwable $e) {
                error_log('[IEI SETUP ERROR] ' . $e->getMessage());
                $error = 'Failed to create Master Administrator account: ' . $e->getMessage();
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Master Administrator Setup — IEI MGR Chapter</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0b192c;
      color: #f1f5f9;
      margin: 0;
      padding: 30px 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .container {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 32px;
      max-width: 520px;
      width: 100%;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    }
    .header {
      text-align: center;
      margin-bottom: 24px;
      border-bottom: 1px solid #334155;
      padding-bottom: 16px;
    }
    .badge {
      display: inline-block;
      background: #f59e0b;
      color: #0b192c;
      font-weight: 700;
      font-size: 11px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    h2 { margin: 0 0 6px 0; font-size: 22px; color: #fff; }
    p.subtitle { margin: 0; color: #94a3b8; font-size: 13px; }
    .alert-error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid #ef4444;
      color: #fca5a5;
      padding: 12px 14px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 13px;
    }
    .alert-success {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid #10b981;
      color: #6ee7b7;
      padding: 18px;
      border-radius: 8px;
      text-align: center;
    }
    .form-group { margin-bottom: 16px; }
    label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #cbd5e1;
      margin-bottom: 6px;
    }
    input {
      width: 100%;
      padding: 10px 12px;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 6px;
      color: #fff;
      font-size: 14px;
    }
    input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
    .policy-box {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 6px;
      padding: 10px 12px;
      font-size: 11px;
      color: #94a3b8;
      margin-bottom: 18px;
    }
    .policy-box ul { margin: 4px 0 0 0; padding-left: 18px; }
    .btn-submit {
      width: 100%;
      padding: 12px;
      background: #2563eb;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .btn-submit:hover { background: #1d4ed8; }
    a.btn-login {
      display: inline-block;
      margin-top: 16px;
      padding: 10px 20px;
      background: #10b981;
      color: #0b192c;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 700;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">Security Initialization</span>
      <h2>IEI Master Administrator Setup</h2>
      <p class="subtitle">Dr. M.G.R. Educational and Research Institute Student Chapter</p>
    </div>

    <?php if ($success): ?>
      <div class="alert-success">
        <h3 style="margin-top:0; color:#10b981;">Setup Complete!</h3>
        <p style="margin: 8px 0; color: #cbd5e1; font-size: 14px;">
          The Master Administrator account has been securely created and hashed with bcrypt.
          The setup endpoint is now permanently locked.
        </p>
        <a href="/#/login" class="btn-login">Proceed to Login &rarr;</a>
      </div>
    <?php else: ?>
      <?php if ($error): ?>
        <div class="alert-error"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></div>
      <?php endif; ?>

      <form method="POST" action="">
        <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrfToken, ENT_QUOTES, 'UTF-8') ?>">

        <div class="form-group">
          <label>Administrator Full Name</label>
          <input type="text" name="name" value="Master Administrator" required>
        </div>

        <div class="form-group">
          <label>Master Username</label>
          <input type="text" name="username" value="admin.master-01" required>
        </div>

        <div class="form-group">
          <label>Official Chapter Email</label>
          <input type="email" name="email" value="iei@drmgrdu.ac.in" required>
        </div>

        <div class="form-group">
          <label>Department / Office</label>
          <input type="text" name="department" value="Institutional Administration" required>
        </div>

        <div class="form-group">
          <label>Master Password</label>
          <input type="password" name="password" required autocomplete="new-password">
        </div>

        <div class="form-group">
          <label>Confirm Password</label>
          <input type="password" name="password_confirm" required autocomplete="new-password">
        </div>

        <div class="policy-box">
          <strong>Strong Password Policy Requirements:</strong>
          <ul>
            <li>Minimum 12 characters</li>
            <li>At least one uppercase (A-Z) and one lowercase (a-z)</li>
            <li>At least one numeric digit (0-9)</li>
            <li>At least one special character (!@#$%^&*...)</li>
          </ul>
        </div>

        <button type="submit" class="btn-submit">Initialize Master Administrator & Lock Setup</button>
      </form>
    <?php endif; ?>
  </div>
</body>
</html>
