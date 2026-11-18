<?php
/**
 * /api/public.php — Public Welcome Page Profile & Upcoming Events API
 * - GET    (public, no login needed): Returns main_config profile + upcoming events
 * - PUT    (authorized officers only): Updates main_config profile
 * - POST   (authorized officers only): Creates/updates a public upcoming event
 * - DELETE (authorized officers only): Deletes a public upcoming event
 */
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

$pdo = getDb();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$resource = strtolower(trim((string)($_GET['resource'] ?? 'all')));
$id = trim((string)($_GET['id'] ?? ''));

if ($method === 'GET') {
    $profStmt = $pdo->prepare('SELECT data_json FROM iei_public_profile WHERE id = ? LIMIT 1');
    $profStmt->execute(['main_config']);
    $profRow = $profStmt->fetch();
    $profile = $profRow ? (json_decode((string)$profRow['data_json'], true) ?: null) : null;

    $evtRows = $pdo->query('SELECT id, data_json FROM iei_public_events ORDER BY created_at DESC')->fetchAll();
    $events = [];
    foreach ($evtRows as $r) {
        $doc = json_decode((string)$r['data_json'], true) ?: [];
        $doc['id'] = $r['id'];
        $events[] = $doc;
    }

    sendJson([
        'ok' => true,
        'profile' => $profile,
        'events' => $events,
    ]);
}

// All mutations require authentication + Profile Update clearance
$user = requireAuth($pdo);
if (!canAccessProfileUpdate($user)) {
    appendAuditLog($pdo, [
        'actor' => $user,
        'action' => 'SECURITY_ACCESS_DENIED',
        'module' => 'PROFILE',
        'status' => 'DENIED',
        'details' => "Unauthorized public profile modification attempt by @{$user['username']} ({$user['role']}).",
        'targetId' => 'main_config',
    ]);
    sendJson(['ok' => false, 'error' => 'FORBIDDEN', 'message' => 'Only Chairman, Vice Chairman, Secretary, Joint Secretary, or Administrator can update the public profile.'], 403);
}

if (($method === 'PUT' || $method === 'POST') && $resource === 'profile') {
    $body = getJsonBody();
    $data = isset($body['data']) && is_array($body['data']) ? $body['data'] : $body;
    $officialEmail = (string)($data['officialEmail'] ?? 'iei@drmgrdu.ac.in');
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $stmt = $pdo->prepare(
        'INSERT INTO iei_public_profile (id, official_email, data_json)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
           official_email = VALUES(official_email),
           data_json = VALUES(data_json),
           updated_at = CURRENT_TIMESTAMP'
    );
    $stmt->execute(['main_config', $officialEmail, $json]);
    $ver = bumpSyncVersion($pdo, 'public_profile');

    sendJson(['ok' => true, 'version' => $ver, 'profile' => $data]);
}

if (($method === 'POST' || $method === 'PUT') && $resource === 'event') {
    $body = getJsonBody();
    $data = isset($body['data']) && is_array($body['data']) ? $body['data'] : $body;
    $eventId = $id !== '' ? $id : trim((string)($data['id'] ?? ('pub-evt-' . (int)(microtime(true) * 1000))));
    $data['id'] = $eventId;
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $stmt = $pdo->prepare(
        'INSERT INTO iei_public_events (id, title, event_date, poster_url, data_json)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           title = VALUES(title), event_date = VALUES(event_date),
           poster_url = VALUES(poster_url), data_json = VALUES(data_json),
           updated_at = CURRENT_TIMESTAMP'
    );
    $stmt->execute([
        $eventId,
        (string)($data['title'] ?? 'Chapter Event'),
        $data['date'] ?? null,
        $data['posterUrl'] ?? null,
        $json,
    ]);
    $ver = bumpSyncVersion($pdo, 'public_events');

    sendJson(['ok' => true, 'version' => $ver, 'event' => $data]);
}

if ($method === 'DELETE' && $resource === 'event') {
    if ($id === '') {
        sendJson(['ok' => false, 'error' => 'MISSING_ID'], 400);
    }
    $stmt = $pdo->prepare('DELETE FROM iei_public_events WHERE id = ?');
    $stmt->execute([$id]);
    $ver = bumpSyncVersion($pdo, 'public_events');
    sendJson(['ok' => true, 'deletedId' => $id, 'version' => $ver]);
}

sendJson(['ok' => false, 'error' => 'INVALID_REQUEST'], 400);
