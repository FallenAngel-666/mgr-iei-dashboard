<?php
/**
 * /api/data.php — Authenticated CRUD API for Hostinger MySQL Collections
 * Supports: members, tasks, updates, events, attendance, announcements,
 *           certificates, achievements, notifications
 */
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

$pdo = getDb();
$user = requireAuth($pdo);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$collection = strtolower(trim((string)($_GET['collection'] ?? '')));
$id = trim((string)($_GET['id'] ?? ''));

$ALLOWED_TABLES = [
    'members'       => 'iei_members',
    'tasks'         => 'iei_tasks',
    'updates'       => 'iei_updates',
    'events'        => 'iei_events',
    'attendance'    => 'iei_attendance',
    'announcements' => 'iei_announcements',
    'certificates'  => 'iei_certificates',
    'achievements'  => 'iei_achievements',
    'notifications' => 'iei_notifications',
    'settings'      => 'iei_system_settings',
];

if (!isset($ALLOWED_TABLES[$collection])) {
    sendJson(['ok' => false, 'error' => 'INVALID_COLLECTION', 'message' => 'Unknown collection requested.'], 400);
}

$table = $ALLOWED_TABLES[$collection];

// ============================================================================
// GET — Fetch Collection
// ============================================================================
if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM `{$table}` ORDER BY created_at DESC");
    $rows = $stmt->fetchAll();
    $items = [];
    foreach ($rows as $row) {
        $doc = json_decode((string)$row['data_json'], true) ?: [];
        $doc['id'] = $row['id'];
        if ($collection === 'members') {
            $doc = sanitizeMemberForClient($doc, $user);
        }
        $items[] = $doc;
    }

    $verStmt = $pdo->prepare('SELECT version FROM iei_sync_meta WHERE collection_name = ?');
    $verStmt->execute([$collection]);
    $version = (int)($verStmt->fetchColumn() ?: 1);

    sendJson(['ok' => true, 'collection' => $collection, 'version' => $version, 'items' => $items]);
}

// ============================================================================
// POST / PUT — Upsert Document (Insert or Merge/Replace)
// ============================================================================
if ($method === 'POST' || $method === 'PUT') {
    $body = getJsonBody();
    $docId = $id !== '' ? $id : trim((string)($body['id'] ?? ''));
    $isMerge = !empty($body['_merge']) || $method === 'PUT';
    $data = isset($body['data']) && is_array($body['data']) ? $body['data'] : $body;
    unset($data['_merge']);

    if ($docId === '') {
        sendJson(['ok' => false, 'error' => 'MISSING_ID', 'message' => 'Document id is required.'], 400);
    }
    $data['id'] = $docId;

    // Server-side RBAC check for members creation/edit
    if ($collection === 'members') {
        $isSelfEdit = ($docId === ($user['id'] ?? ''));
        if (!$isSelfEdit && !canAccessMembersDirectory($user)) {
            appendAuditLog($pdo, [
                'actor' => $user,
                'action' => 'SECURITY_ACCESS_DENIED',
                'module' => 'MEMBERS',
                'status' => 'DENIED',
                'details' => "Unauthorized attempt to modify member {$docId} by @{$user['username']}.",
                'targetId' => $docId,
            ]);
            sendJson(['ok' => false, 'error' => 'FORBIDDEN', 'message' => 'Only authorized directory managers or Master Administrator can modify other members.'], 403);
        }
    }

    // Merge with existing record if requested
    $existingRow = null;
    $sel = $pdo->prepare("SELECT * FROM `{$table}` WHERE id = ? LIMIT 1");
    $sel->execute([$docId]);
    $existingRow = $sel->fetch() ?: null;

    if ($isMerge && $existingRow) {
        $existingData = json_decode((string)$existingRow['data_json'], true) ?: [];
        $data = array_merge($existingData, $data);
        $data['id'] = $docId;
    }

    // Prevent non-admin users from escalating their own role via self-edit
    if ($collection === 'members' && $existingRow && !isMasterAdmin($user) && !canAccessMembersDirectory($user)) {
        $data['role'] = $existingRow['role'];
        $data['status'] = $existingRow['status'];
        $data['isMasterAdmin'] = (bool)$existingRow['is_master_admin'];
    }

    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    switch ($collection) {
        case 'members':
            $plainPass = isset($data['password']) && is_string($data['password']) && $data['password'] !== '' ? $data['password'] : null;
            if ($plainPass !== null) {
                $passwordHash = password_hash($plainPass, PASSWORD_BCRYPT);
            } elseif ($existingRow) {
                $passwordHash = (string)$existingRow['password_hash'];
            } else {
                $passwordHash = password_hash(bin2hex(random_bytes(12)), PASSWORD_BCRYPT);
            }
            $stmt = $pdo->prepare(
                'INSERT INTO iei_members
                 (id, name, role, username, secondary_username, email, secondary_email, phone, department, membership_id, year, status, is_master_admin, password_hash, data_json)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                   name = VALUES(name), role = VALUES(role), username = VALUES(username),
                   secondary_username = VALUES(secondary_username), email = VALUES(email),
                   secondary_email = VALUES(secondary_email), phone = VALUES(phone),
                   department = VALUES(department), membership_id = VALUES(membership_id),
                   year = VALUES(year), status = VALUES(status),
                   is_master_admin = VALUES(is_master_admin), password_hash = VALUES(password_hash),
                   data_json = VALUES(data_json), updated_at = CURRENT_TIMESTAMP'
            );
            $stmt->execute([
                $docId,
                (string)($data['name'] ?? 'Member'),
                (string)($data['role'] ?? 'Executive Member'),
                (string)($data['username'] ?? $docId),
                $data['secondaryUsername'] ?? null,
                (string)($data['email'] ?? ''),
                $data['secondaryEmail'] ?? null,
                $data['phone'] ?? null,
                (string)($data['department'] ?? 'Engineering'),
                $data['membershipId'] ?? null,
                $data['year'] ?? null,
                (string)($data['status'] ?? 'Active'),
                !empty($data['isMasterAdmin']) ? 1 : 0,
                $passwordHash,
                $json,
            ]);
            break;

        case 'tasks':
            $stmt = $pdo->prepare(
                'INSERT INTO iei_tasks (id, title, status, week_id, assignee_id, assigned_by_id, data_json)
                 VALUES (?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                   title = VALUES(title), status = VALUES(status), week_id = VALUES(week_id),
                   assignee_id = VALUES(assignee_id), assigned_by_id = VALUES(assigned_by_id),
                   data_json = VALUES(data_json), updated_at = CURRENT_TIMESTAMP'
            );
            $stmt->execute([
                $docId,
                (string)($data['title'] ?? 'Untitled Task'),
                (string)($data['status'] ?? 'Assigned'),
                $data['weekId'] ?? null,
                $data['assigneeId'] ?? null,
                $data['assignedById'] ?? null,
                $json,
            ]);
            break;

        case 'updates':
            $stmt = $pdo->prepare(
                'INSERT INTO iei_updates (id, author_id, author_name, data_json)
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                   author_id = VALUES(author_id), author_name = VALUES(author_name),
                   data_json = VALUES(data_json), updated_at = CURRENT_TIMESTAMP'
            );
            $stmt->execute([
                $docId,
                $data['authorId'] ?? ($data['author']['id'] ?? null),
                $data['authorName'] ?? ($data['author']['name'] ?? null),
                $json,
            ]);
            break;

        case 'events':
            $stmt = $pdo->prepare(
                'INSERT INTO iei_events (id, title, event_date, category, data_json)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                   title = VALUES(title), event_date = VALUES(event_date), category = VALUES(category),
                   data_json = VALUES(data_json), updated_at = CURRENT_TIMESTAMP'
            );
            $stmt->execute([
                $docId,
                (string)($data['title'] ?? 'Event'),
                $data['date'] ?? null,
                $data['category'] ?? null,
                $json,
            ]);
            break;

        case 'attendance':
            $stmt = $pdo->prepare(
                'INSERT INTO iei_attendance (id, event_id, event_date, data_json)
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                   event_id = VALUES(event_id), event_date = VALUES(event_date),
                   data_json = VALUES(data_json), updated_at = CURRENT_TIMESTAMP'
            );
            $stmt->execute([
                $docId,
                $data['eventId'] ?? null,
                $data['date'] ?? null,
                $json,
            ]);
            break;

        case 'announcements':
            $stmt = $pdo->prepare(
                'INSERT INTO iei_announcements (id, title, priority, data_json)
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                   title = VALUES(title), priority = VALUES(priority),
                   data_json = VALUES(data_json), updated_at = CURRENT_TIMESTAMP'
            );
            $stmt->execute([
                $docId,
                (string)($data['title'] ?? 'Circular'),
                (string)($data['priority'] ?? 'Normal'),
                $json,
            ]);
            break;

        case 'notifications':
            $stmt = $pdo->prepare(
                'INSERT INTO iei_notifications (id, recipient_id, recipient_role, is_read, data_json)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                   recipient_id = VALUES(recipient_id), recipient_role = VALUES(recipient_role),
                   is_read = VALUES(is_read), data_json = VALUES(data_json)'
            );
            $stmt->execute([
                $docId,
                (string)($data['recipientId'] ?? 'all'),
                $data['recipientRole'] ?? null,
                !empty($data['read']) ? 1 : 0,
                $json,
            ]);
            break;

        default: // certificates, achievements
            $stmt = $pdo->prepare(
                "INSERT INTO `{$table}` (id, title, data_json)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                   title = VALUES(title), data_json = VALUES(data_json), updated_at = CURRENT_TIMESTAMP"
            );
            $stmt->execute([$docId, $data['title'] ?? null, $json]);
            break;
    }

    $version = bumpSyncVersion($pdo, $collection);
    sendJson([
        'ok' => true,
        'id' => $docId,
        'version' => $version,
        'item' => $collection === 'members' ? sanitizeMemberForClient($data, $user) : $data,
    ]);
}

// ============================================================================
// DELETE — Remove Document
// ============================================================================
if ($method === 'DELETE') {
    if ($id === '') {
        sendJson(['ok' => false, 'error' => 'MISSING_ID', 'message' => 'Document id is required.'], 400);
    }

    if ($collection === 'members' && !canAccessMembersDirectory($user)) {
        appendAuditLog($pdo, [
            'actor' => $user,
            'action' => 'SECURITY_ACCESS_DENIED',
            'module' => 'MEMBERS',
            'status' => 'DENIED',
            'details' => "Unauthorized delete attempt on member {$id} by @{$user['username']}.",
            'targetId' => $id,
        ]);
        sendJson(['ok' => false, 'error' => 'FORBIDDEN', 'message' => 'Insufficient permissions to delete members.'], 403);
    }

    $stmt = $pdo->prepare("DELETE FROM `{$table}` WHERE id = ?");
    $stmt->execute([$id]);
    $version = bumpSyncVersion($pdo, $collection);

    sendJson(['ok' => true, 'deletedId' => $id, 'version' => $version]);
}

sendJson(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED'], 405);
