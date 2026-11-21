<?php
/**
 * /api/audit.php — Immutable System Activity Console Audit Trail (Hostinger MySQL)
 * - GET  : STRICTLY restricted to CBN Joint Secretary (sripriyan.jsec-01) & Master Administrator
 * - POST : Append-only activity log insertion with server timestamp & secret redaction
 * - PUT / DELETE : STRICTLY PROHIBITED (405 Method Not Allowed)
 */
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

$pdo = getDb();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $user = requireAuth($pdo);
    if (!canAccessActivityConsole($user)) {
        appendAuditLog($pdo, [
            'actor' => $user,
            'action' => 'SECURITY_ACCESS_DENIED',
            'module' => 'SECURITY',
            'status' => 'DENIED',
            'details' => "Unauthorized API read attempt on System Activity Console by {$user['name']} (@{$user['username']}, {$user['role']}). Blocked.",
            'targetId' => 'system_audit_logs',
        ]);
        sendJson([
            'ok' => false,
            'error' => 'FORBIDDEN',
            'message' => 'System Activity Console is strictly restricted to CBN Joint Secretary and Master Administrator.'
        ], 403);
    }

    $limit = min(2000, max(1, (int)($_GET['limit'] ?? 500)));
    $stmt = $pdo->prepare("SELECT data_json FROM system_audit_logs ORDER BY created_at DESC LIMIT ?");
    $stmt->bindValue(1, $limit, PDO::PARAM_INT);
    $stmt->execute();

    $logs = [];
    foreach ($stmt->fetchAll() as $row) {
        $doc = json_decode((string)$row['data_json'], true);
        if (is_array($doc)) {
            $logs[] = $doc;
        }
    }

    sendJson(['ok' => true, 'logs' => $logs, 'count' => count($logs)]);
}

if ($method === 'POST') {
    // 1. Require a valid authenticated user. Unauthenticated POST requests are rejected with 401.
    $user = requireAuth($pdo);
    $body = getJsonBody();

    // 2. Validate permitted audit actions and modules
    $ALLOWED_ACTIONS = [
        'AUTH_LOGIN', 'AUTH_LOGOUT', 'AUTH_LOGIN_FAILED', 'AUTH_RATE_LIMIT_BLOCKED', 'AUTH_INITIAL_SETUP',
        'MEMBER_CREATE', 'MEMBER_UPDATE', 'MEMBER_DELETE',
        'TASK_CREATE', 'TASK_UPDATE', 'TASK_DELETE', 'TASK_SUBMIT', 'TASK_APPROVE', 'TASK_REJECT',
        'EVENT_CREATE', 'EVENT_UPDATE', 'EVENT_DELETE',
        'ATTENDANCE_RECORD', 'ATTENDANCE_UPDATE',
        'ANNOUNCEMENT_CREATE', 'ANNOUNCEMENT_UPDATE', 'ANNOUNCEMENT_DELETE',
        'SETTINGS_UPDATE', 'UPLOAD_FILE', 'UPLOAD_DELETE',
        'SECURITY_ACCESS_DENIED', 'GENERIC_OPERATION'
    ];

    $ALLOWED_MODULES = [
        'AUTH', 'SECURITY', 'MEMBERS', 'TASKS', 'EVENTS', 'ATTENDANCE',
        'ANNOUNCEMENTS', 'SETTINGS', 'STORAGE', 'REPORTS', 'CERTIFICATES', 'SYSTEM'
    ];

    $action = strtoupper(trim((string)($body['action'] ?? 'GENERIC_OPERATION')));
    if (!in_array($action, $ALLOWED_ACTIONS, true)) {
        $action = 'GENERIC_OPERATION';
    }

    $module = strtoupper(trim((string)($body['module'] ?? 'SECURITY')));
    if (!in_array($module, $ALLOWED_MODULES, true)) {
        $module = 'SECURITY';
    }

    // 3. Derive actor identity EXCLUSIVELY from verified server-side user record (Zero client forgery)
    $cleanEntry = [
        'actorUid' => $user['id'],
        'actorName' => $user['name'],
        'actorUsername' => $user['username'],
        'actorRole' => $user['role'],
        'action' => $action,
        'module' => $module,
        'status' => in_array(($body['status'] ?? 'SUCCESS'), ['SUCCESS', 'FAILED', 'DENIED'], true) ? $body['status'] : 'SUCCESS',
        'details' => substr(trim((string)($body['details'] ?? '')), 0, 1000),
        'targetId' => substr(trim((string)($body['targetId'] ?? '')), 0, 120),
        'previousValues' => isset($body['previousValues']) ? redactSensitiveData($body['previousValues']) : null,
        'newValues' => isset($body['newValues']) ? redactSensitiveData($body['newValues']) : null,
    ];

    $record = appendAuditLog($pdo, $cleanEntry);
    sendJson(['ok' => true, 'record' => $record], 201);
}

// ABSOLUTE IMMUTABILITY: Never permit PUT, PATCH, or DELETE on audit logs
sendJson([
    'ok' => false,
    'error' => 'IMMUTABLE_AUDIT_LOG',
    'message' => 'Audit logs are strictly append-only and cannot be modified or deleted.'
], 405);
