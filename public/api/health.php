<?php
/**
 * GET /api/health.php — Hostinger MySQL & Storage Readiness Probe
 */
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

$pdo = getDb();
$tables = $pdo->query("SHOW TABLES LIKE 'iei_%'")->fetchAll(PDO::FETCH_COLUMN);
$memberCount = (int)$pdo->query('SELECT COUNT(*) FROM iei_members')->fetchColumn();
$uploadsDir = dirname(__DIR__) . '/uploads';
$uploadsWritable = is_dir($uploadsDir) ? is_writable($uploadsDir) : @mkdir($uploadsDir, 0755, true);

sendJson([
    'ok' => true,
    'service' => 'IEI MGR STUDENTS CHAPTER API',
    'backend' => 'hostinger-mysql-php8',
    'phpVersion' => PHP_VERSION,
    'databaseConnected' => true,
    'ieiTablesCount' => count($tables),
    'membersCount' => $memberCount,
    'storageWritable' => (bool)$uploadsWritable,
    'serverTime' => gmdate('c'),
]);
