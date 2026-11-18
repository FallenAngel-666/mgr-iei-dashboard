<?php
/**
 * /api/auth.php — Institutional Authentication (Hostinger MySQL + HMAC Token)
 * - POST ?action=login   : Verify username/email + password -> return user + signed Bearer token
 * - GET  ?action=me      : Verify active Bearer token -> return fresh profile from MySQL
 * - POST ?action=logout  : Record logout in immutable audit trail
 */
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

$pdo = getDb();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? ($method === 'GET' ? 'me' : 'login');

if ($method === 'GET' && $action === 'me') {
    $user = requireAuth($pdo);
    sendJson(['ok' => true, 'user' => sanitizeMemberForClient($user, $user)]);
}

if ($method === 'POST' && $action === 'logout') {
    $user = getAuthenticatedUser($pdo);
    if ($user) {
        appendAuditLog($pdo, [
            'actor' => $user,
            'action' => 'AUTH_LOGOUT',
            'module' => 'AUTH',
            'status' => 'SUCCESS',
            'details' => "User {$user['name']} (@{$user['username']}) signed out of the portal.",
            'targetId' => $user['id'],
        ]);
    }
    sendJson(['ok' => true]);
}

if ($method === 'POST' && $action === 'login') {
    $body = getJsonBody();
    $identifier = strtolower(trim((string)($body['identifier'] ?? '')));
    $password = trim((string)($body['password'] ?? ''));

    if ($identifier === '' || $password === '') {
        sendJson(['ok' => false, 'error' => 'MISSING_CREDENTIALS', 'message' => 'Please enter both username/email and password.'], 400);
    }

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
        appendAuditLog($pdo, [
            'actorName' => $identifier,
            'actorUsername' => $identifier,
            'actorRole' => 'Guest',
            'action' => 'AUTH_LOGIN_FAILED',
            'module' => 'AUTH',
            'status' => 'FAILED',
            'details' => "Failed login attempt for unrecognized account: {$identifier}.",
        ]);
        sendJson(['ok' => false, 'error' => 'USER_NOT_FOUND', 'message' => 'User not found. Please verify your official IEI username or registered email address.'], 401);
    }

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

    if (str_starts_with($storedHash, '$2y$') || str_starts_with($storedHash, '$2a$') || str_starts_with($storedHash, '$argon2')) {
        $passwordValid = password_verify($password, $storedHash);
    } else {
        // One-time seamless migration for seeded accounts -> upgrade to bcrypt on first login
        $passwordValid = hash_equals($storedHash, $password);
        $needsRehash = $passwordValid;
    }

    if (!$passwordValid) {
        appendAuditLog($pdo, [
            'actorUid' => $row['id'],
            'actorName' => $row['name'],
            'actorUsername' => $row['username'],
            'actorRole' => $row['role'],
            'action' => 'AUTH_LOGIN_FAILED',
            'module' => 'AUTH',
            'status' => 'FAILED',
            'details' => "Invalid password entered for @{$row['username']}.",
            'targetId' => $row['id'],
        ]);
        sendJson(['ok' => false, 'error' => 'INVALID_PASSWORD', 'message' => 'Incorrect password. Please check your credentials or contact the Chapter Staff Coordinator.'], 401);
    }

    if ($needsRehash) {
        $newHash = password_hash($password, PASSWORD_BCRYPT);
        $up = $pdo->prepare('UPDATE iei_members SET password_hash = ? WHERE id = ?');
        $up->execute([$newHash, $row['id']]);
    }

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
