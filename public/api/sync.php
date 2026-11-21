<?php
/**
 * GET /api/sync.php — High-Performance Delta Synchronization Endpoint
 * Reads iei_sync_meta (11 tiny rows) and ONLY fetches collections whose version changed.
 * Keeps Hostinger MySQL load near zero even with hundreds of simultaneous connected users.
 */
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

$pdo = getDb();
$user = requireAuth($pdo);

$clientVersions = [];
if (!empty($_GET['versions'])) {
    $parsed = json_decode((string)$_GET['versions'], true);
    if (is_array($parsed)) {
        $clientVersions = $parsed;
    }
}

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

$metaRows = $pdo->query('SELECT collection_name, version FROM iei_sync_meta')->fetchAll();
$serverVersions = [];
foreach ($metaRows as $r) {
    $serverVersions[$r['collection_name']] = (int)$r['version'];
}

$changed = [];
foreach ($ALLOWED_TABLES as $col => $table) {
    $serverVer = $serverVersions[$col] ?? 1;
    $clientVer = isset($clientVersions[$col]) ? (int)$clientVersions[$col] : 0;

    if ($clientVer !== $serverVer) {
        $stmt = $pdo->query("SELECT id, data_json FROM `{$table}` ORDER BY created_at DESC");
        $items = [];
        foreach ($stmt->fetchAll() as $row) {
            $doc = json_decode((string)$row['data_json'], true) ?: [];
            $doc['id'] = $row['id'];
            if ($col === 'members') {
                $doc = sanitizeMemberForClient($doc, $user);
            }
            $items[] = $doc;
        }
        $changed[$col] = $items;
    }
}

sendJson([
    'ok' => true,
    'versions' => $serverVersions,
    'changed' => $changed,
    'serverTime' => gmdate('c'),
]);
