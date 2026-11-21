<?php
/**
 * /api/auth.php — Institutional Authentication (Hostinger MySQL + HMAC Token + Secure PHP Session)
 *
 * Security Enhancements:
 * - Login rate limiting (max 5 failed attempts per 15 minutes per IP/Account)
 * - Secure session handling with session_regenerate_id(true)
 * - HttpOnly, Secure, and SameSite cookie policies
 * - password_verify() with automatic upgrading via password_hash(PASSWORD_DEFAULT)
 * - Server-side audit recording for every authentication event
 */
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

$pdo = getDb();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? ($method === 'GET' ? 'me' : 'login');

// Configure secure session cookies
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => '',
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    session_start();
}

// ----------------------------------------------------------------------------
// GET ?action=me — Validate active session & return fresh profile
// ----------------------------------------------------------------------------
if ($method === 'GET' && $action === 'me') {
    $user = requireAuth($pdo);
    sendJson(['ok' => true, 'user' => sanitizeMemberForClient($user, $user)]);
}

// ----------------------------------------------------------------------------
// POST ?action=logout — Terminate active session and record audit trail
// ----------------------------------------------------------------------------
if ($method === 'POST' && $action === 'logout') {
    $token = getBearerToken();
    $user = getAuthenticatedUser($pdo);

    // 1. Invalidate Bearer Token via MySQL Token Revocation Blacklist
    if ($token !== null) {
        $tokenHash = hash('sha256', $token);
        $parts = explode('.', $token);
        $exp = time() + 604800;
        if (count($parts) === 3) {
            $claims = json_decode(base64UrlDecode($parts[1]), true);
            if (is_array($claims) && !empty($claims['exp'])) {
                $exp = (int)$claims['exp'];
            }
        }
        try {
            $pdo->prepare('INSERT IGNORE INTO iei_revoked_tokens (token_hash, expires_at) VALUES (?, ?)')
                ->execute([$tokenHash, $exp]);
            // Clean up old expired revoked tokens
            $pdo->prepare('DELETE FROM iei_revoked_tokens WHERE expires_at < ?')->execute([time()]);
        } catch (Throwable $e) {
            error_log('[IEI LOGOUT TOKEN REVOCATION NOTICE] ' . $e->getMessage());
        }
    }

    // 2. Append Audit Log
    if ($user) {
        appendAuditLog($pdo, [
            'actor' => $user,
            'action' => 'AUTH_LOGOUT',
            'module' => 'AUTH',
            'status' => 'SUCCESS',
            'details' => "User {$user['name']} (@{$user['username']}) signed out of the portal. Token revoked and session destroyed.",
            'targetId' => $user['id'],
        ]);
    }

    // 3. Invalidate PHP Session & Cookies
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params["path"],
            $params["domain"],
            $params["secure"],
            $params["httponly"]
        );
    }
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_destroy();
    }

    sendJson(['ok' => true, 'message' => 'Signed out successfully. Token revoked.']);
}

// ----------------------------------------------------------------------------
// POST ?action=login — Authenticate with rate limiting & password_verify()
// ----------------------------------------------------------------------------
if ($method === 'POST' && $action === 'login') {
    $body = getJsonBody();
    $identifier = strtolower(trim((string)($body['identifier'] ?? '')));
    $password = trim((string)($body['password'] ?? ''));

    if ($identifier === '' || $password === '') {
        sendJson(['ok' => false, 'error' => 'MISSING_CREDENTIALS', 'message' => 'Please enter both username/email and password.'], 400);
    }

    // Determine client IP for rate limiting
    $ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $ip = trim(explode(',', $ip)[0]);

    // 1. Rate Limiting Check (Max 5 failed attempts per 15 min window)
    $cutoff = time() - 900; // 15 minutes ago
    try {
        // Prune old attempt records
        $pdo->prepare('DELETE FROM iei_login_attempts WHERE attempt_time < ?')->execute([$cutoff]);

        // Check recent failures
        $rateStmt = $pdo->prepare(
            'SELECT COUNT(*) FROM iei_login_attempts
             WHERE (ip_address = ? OR identifier = ?) AND attempt_time >= ?'
        );
        $rateStmt->execute([$ip, $identifier, $cutoff]);
        $attempts = (int)$rateStmt->fetchColumn();

        if ($attempts >= 5) {
            appendAuditLog($pdo, [
                'actorName' => $identifier,
                'actorUsername' => $identifier,
                'actorRole' => 'Guest',
                'action' => 'AUTH_RATE_LIMIT_BLOCKED',
                'module' => 'SECURITY',
                'status' => 'DENIED',
                'details' => "Authentication temporarily locked for {$identifier} from IP {$ip} due to excessive failed attempts ({$attempts}).",
            ]);
            sendJson([
                'ok' => false,
                'error' => 'TOO_MANY_ATTEMPTS',
                'message' => 'Too many failed login attempts. Please wait 15 minutes before trying again.'
            ], 429);
        }
    } catch (Throwable $e) {
        // If rate limit table is not created yet, log and proceed gracefully
        error_log('[AUTH RATE LIMIT CHECK NOTICE] ' . $e->getMessage());
    }

    // 2. Query User by Username or Email
    $stmt = $pdo->prepare(
        'SELECT * FROM iei_members
         WHERE LOWER(username) = ?
            OR LOWER(secondary_username) = ?
            OR LOWER(email) = ?
            OR LOWER(secondary_email) = ?
         LIMIT 1'
    );
    $stmt->execute([$identifier, $identifier, $identifier, $identifier]);
    $row = $stmt->fetch();

    if (!$row) {
        // Record failed attempt for rate limiting
        try {
            $pdo->prepare('INSERT INTO iei_login_attempts (ip_address, identifier, attempt_time) VALUES (?, ?, ?)')
                ->execute([$ip, $identifier, time()]);
        } catch (Throwable) {}

        appendAuditLog($pdo, [
            'actorName' => $identifier,
            'actorUsername' => $identifier,
            'actorRole' => 'Guest',
            'action' => 'AUTH_LOGIN_FAILED',
            'module' => 'AUTH',
            'status' => 'FAILED',
            'details' => "Failed login attempt for unrecognized account: {$identifier} from IP {$ip}.",
        ]);
        sendJson(['ok' => false, 'error' => 'USER_NOT_FOUND', 'message' => 'User not found. Please verify your official IEI username or registered email address.'], 401);
    }

    // Check account status
    if (strtolower((string)$row['status']) !== 'active') {
        appendAuditLog($pdo, [
            'actorUid' => $row['id'],
            'actorName' => $row['name'],
            'actorUsername' => $row['username'],
            'actorRole' => $row['role'],
            'action' => 'AUTH_LOGIN_FAILED',
            'module' => 'AUTH',
            'status' => 'DENIED',
            'details' => "Blocked sign-in attempt for deactivated account @{$row['username']}.",
            'targetId' => $row['id'],
        ]);
        sendJson(['ok' => false, 'error' => 'ACCOUNT_INACTIVE', 'message' => 'This account is inactive. Please contact the Master Administrator or Staff Coordinator.'], 403);
    }

    $storedHash = (string)$row['password_hash'];
    $member = json_decode($row['data_json'], true) ?: [];
    $member['id'] = $row['id'];
    $member['name'] = $row['name'];
    $member['role'] = $row['role'];
    $member['username'] = $row['username'];
    $member['email'] = $row['email'];
    $member['status'] = $row['status'];

    $passwordValid = false;
    $needsRehash = false;

    // Verify password with password_verify()
    if (str_starts_with($storedHash, '$2y$') || str_starts_with($storedHash, '$2a$') || str_starts_with($storedHash, '$argon2')) {
        $passwordValid = password_verify($password, $storedHash);
        if ($passwordValid && password_needs_rehash($storedHash, PASSWORD_DEFAULT)) {
            $needsRehash = true;
        }
    } else {
        // One-time migration for legacy seeds -> upgrade to PASSWORD_DEFAULT on first login
        $passwordValid = hash_equals($storedHash, $password);
        $needsRehash = $passwordValid;
    }

    if (!$passwordValid) {
        // Record failed attempt for rate limiting
        try {
            $pdo->prepare('INSERT INTO iei_login_attempts (ip_address, identifier, attempt_time) VALUES (?, ?, ?)')
                ->execute([$ip, $identifier, time()]);
        } catch (Throwable) {}

        appendAuditLog($pdo, [
            'actorUid' => $row['id'],
            'actorName' => $row['name'],
            'actorUsername' => $row['username'],
            'actorRole' => $row['role'],
            'action' => 'AUTH_LOGIN_FAILED',
            'module' => 'AUTH',
            'status' => 'FAILED',
            'details' => "Invalid password entered for @{$row['username']} from IP {$ip}.",
            'targetId' => $row['id'],
        ]);
        sendJson(['ok' => false, 'error' => 'INVALID_PASSWORD', 'message' => 'Incorrect password. Please check your credentials or contact the Chapter Staff Coordinator.'], 401);
    }

    // Rehash password if needed
    if ($needsRehash) {
        $newHash = password_hash($password, PASSWORD_DEFAULT);
        $up = $pdo->prepare('UPDATE iei_members SET password_hash = ? WHERE id = ?');
        $up->execute([$newHash, $row['id']]);
    }

    // Clear failed attempts upon successful authentication
    try {
        $pdo->prepare('DELETE FROM iei_login_attempts WHERE ip_address = ? OR identifier = ?')
            ->execute([$ip, $identifier]);
    } catch (Throwable) {}

    // Regenerate PHP session ID to prevent session fixation attacks
    session_regenerate_id(true);
    $_SESSION['iei_user_id'] = $member['id'];
    $_SESSION['iei_username'] = $member['username'];
    $_SESSION['iei_role'] = $member['role'];

    $token = createAuthToken($member);

    appendAuditLog($pdo, [
        'actor' => $member,
        'action' => 'AUTH_LOGIN',
        'module' => 'AUTH',
        'status' => 'SUCCESS',
        'details' => "User {$member['name']} (@{$member['username']}) authenticated successfully as {$member['role']}.",
        'targetId' => $member['id'],
    ]);

    sendJson([
        'ok' => true,
        'token' => $token,
        'user' => sanitizeMemberForClient($member, $member),
    ]);
}

sendJson(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED'], 405);
