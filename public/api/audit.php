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
    $user = getAuthenticatedUser($pdo);
    $body = getJsonBody();
    if ($user && empty($body['actor'])) {
        $body['actor'] = $user;
    }
    $record = appendAuditLog($pdo, $body);
    sendJson(['ok' => true, 'record' => $record], 201);
}

// ABSOLUTE IMMUTABILITY: Never permit PUT, PATCH, or DELETE on audit logs
sendJson([
    'ok' => false,
    'error' => 'IMMUTABLE_AUDIT_LOG',
    'message' => 'Audit logs are strictly append-only and cannot be modified or deleted.'
], 405);
