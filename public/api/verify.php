<?php
/**
 * IEI MGR STUDENTS CHAPTER — Database Connectivity & Schema Verification Utility
 * Can be run via CLI: php database/verify.php
 * Or via HTTP: https://yourdomain.com/api/verify.php
 *
 * Security: Never outputs database passwords or sensitive internal stack traces.
 * In production (after setup lockfile .installed exists), HTTP access requires admin authorization.
 */
declare(strict_types=1);

$isCli = (php_sapi_name() === 'cli');

// Resolve path to api/config.php
$possibleConfigPaths = [
    __DIR__ . '/config.php',
    __DIR__ . '/../public/api/config.php',
    __DIR__ . '/../api/config.php',
    dirname(__DIR__) . '/public/api/config.php',
    dirname(__DIR__) . '/dist/api/config.php',
];

$configPath = null;
foreach ($possibleConfigPaths as $p) {
    if (file_exists($p)) {
        $configPath = $p;
        break;
    }
}

// In production, guard HTTP requests from unauthorized information disclosure
$apiDir = $configPath ? dirname($configPath) : __DIR__;
$lockFile = $apiDir . '/.installed';
if (!$isCli && file_exists($lockFile)) {
    // Require valid, non-revoked Master Administrator authentication
    $bootstrapPath = $apiDir . '/bootstrap.php';
    if (file_exists($bootstrapPath)) {
        require_once $bootstrapPath;
        try {
            $pdoAuth = getDb();
            $authAdmin = getAuthenticatedUser($pdoAuth);
            if (!$authAdmin || !isMasterAdmin($authAdmin)) {
                http_response_code(403);
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode([
                    'ok' => false,
                    'error' => 'FORBIDDEN',
                    'message' => 'Schema verification endpoint requires Master Administrator authentication in production. Use CLI or sign in as Master Administrator.'
                ]);
                exit;
            }
        } catch (Throwable $e) {
            http_response_code(403);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'ok' => false,
                'error' => 'VERIFY_LOCKED',
                'message' => 'Verification endpoint locked.'
            ]);
            exit;
        }
    } else {
        http_response_code(403);
        exit;
    }
}

$results = [
    'timestamp' => gmdate('c'),
    'php_version' => PHP_VERSION,
    'php_version_ok' => version_compare(PHP_VERSION, '8.0.0', '>='),
    'extensions' => [],
    'config_exists' => false,
    'db_connection' => false,
    'tables' => [],
    'uploads_writable' => false,
    'all_passed' => false,
    'summary' => [
        'passed' => 0,
        'failed' => 0,
    ]
];

// 1. PHP Extensions Check
$requiredExts = ['pdo', 'pdo_mysql', 'json', 'mbstring', 'fileinfo'];
foreach ($requiredExts as $ext) {
    $loaded = extension_loaded($ext);
    $results['extensions'][$ext] = $loaded;
    if ($loaded) $results['summary']['passed']++;
    else $results['summary']['failed']++;
}

// 2. Config File Check
if ($configPath !== null) {
    $results['config_exists'] = true;
    $results['summary']['passed']++;
} else {
    $results['summary']['failed']++;
}

// 3. Database Connectivity & Schema Checks
$pdo = null;
if ($configPath !== null) {
    $config = require $configPath;
    $host = $config['DB_HOST'] ?? 'localhost';
    $port = $config['DB_PORT'] ?? '3306';
    $name = $config['DB_NAME'] ?? '';
    $user = $config['DB_USER'] ?? '';
    $pass = $config['DB_PASS'] ?? '';

    $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";
    try {
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        $results['db_connection'] = true;
        $results['summary']['passed']++;
    } catch (Throwable $e) {
        $results['db_connection'] = false;
        $results['summary']['failed']++;
        $results['db_error'] = 'Connection failed. Verify host, dbname, user, and password in config.php.';
    }
}

// 4. Verify All 17 Required Tables
$expectedTables = [
    'iei_sync_meta'       => ['collection_name', 'version'],
    'iei_members'         => ['id', 'username', 'role', 'status', 'password_hash', 'data_json'],
    'iei_tasks'           => ['id', 'title', 'status', 'week_id', 'data_json'],
    'iei_updates'         => ['id', 'author_id', 'data_json'],
    'iei_events'          => ['id', 'title', 'event_date', 'data_json'],
    'iei_attendance'      => ['id', 'event_id', 'event_date', 'data_json'],
    'iei_announcements'   => ['id', 'title', 'priority', 'data_json'],
    'iei_certificates'    => ['id', 'title', 'data_json'],
    'iei_achievements'    => ['id', 'title', 'data_json'],
    'iei_notifications'   => ['id', 'recipient_id', 'is_read', 'data_json'],
    'iei_public_profile'  => ['id', 'official_email', 'data_json'],
    'iei_public_events'   => ['id', 'title', 'event_date', 'data_json'],
    'iei_uploads'         => ['id', 'folder', 'stored_name', 'public_url'],
    'system_audit_logs'   => ['id', 'event_timestamp', 'action', 'module', 'status', 'data_json'],
    'iei_system_settings' => ['id', 'data_json'],
    'iei_login_attempts'  => ['id', 'ip_address', 'identifier', 'attempt_time'],
    'iei_revoked_tokens'  => ['token_hash', 'revoked_at', 'expires_at'],
];

if ($pdo instanceof PDO) {
    foreach ($expectedTables as $tableName => $requiredColumns) {
        try {
            $stmt = $pdo->prepare("SHOW TABLES LIKE ?");
            $stmt->execute([$tableName]);
            $exists = ($stmt->fetch() !== false);

            if ($exists) {
                // Check required columns
                $colStmt = $pdo->query("SHOW COLUMNS FROM `{$tableName}`");
                $existingCols = $colStmt->fetchAll(PDO::FETCH_COLUMN);
                $missingCols = array_diff($requiredColumns, $existingCols);

                if (empty($missingCols)) {
                    $results['tables'][$tableName] = ['exists' => true, 'columns_ok' => true];
                    $results['summary']['passed']++;
                } else {
                    $results['tables'][$tableName] = ['exists' => true, 'columns_ok' => false, 'missing' => array_values($missingCols)];
                    $results['summary']['failed']++;
                }
            } else {
                $results['tables'][$tableName] = ['exists' => false];
                $results['summary']['failed']++;
            }
        } catch (Throwable $e) {
            $results['tables'][$tableName] = ['exists' => false, 'error' => 'Query error'];
            $results['summary']['failed']++;
        }
    }
} else {
    foreach (array_keys($expectedTables) as $tableName) {
        $results['tables'][$tableName] = ['exists' => false, 'error' => 'No database connection'];
        $results['summary']['failed']++;
    }
}

// 5. Check Uploads Directory
$possibleUploads = [
    __DIR__ . '/../public/uploads',
    __DIR__ . '/../uploads',
    dirname(__DIR__) . '/public/uploads',
    dirname(__DIR__) . '/dist/uploads',
];
$uploadsPath = null;
foreach ($possibleUploads as $u) {
    if (is_dir($u)) {
        $uploadsPath = $u;
        break;
    }
}

if ($uploadsPath && is_writable($uploadsPath)) {
    $results['uploads_writable'] = true;
    $results['summary']['passed']++;
} else {
    $results['uploads_writable'] = false;
    $results['summary']['failed']++;
}

$results['all_passed'] = ($results['summary']['failed'] === 0);

// CLI Output formatting
if ($isCli) {
    echo "================================================================\n";
    echo "  IEI MGR STUDENTS CHAPTER — DATABASE & HOSTING VERIFICATION    \n";
    echo "================================================================\n\n";

    echo "PHP Version: {$results['php_version']} " . ($results['php_version_ok'] ? "[PASS]" : "[FAIL - Need PHP 8.0+]") . "\n";
    echo "Extensions:\n";
    foreach ($results['extensions'] as $ext => $loaded) {
        echo "  - {$ext}: " . ($loaded ? "[PASS]" : "[FAIL - MISSING]") . "\n";
    }

    echo "\nConfiguration:\n";
    echo "  - api/config.php: " . ($results['config_exists'] ? "[PASS] Found" : "[FAIL] Missing (copy config.example.php)") . "\n";
    echo "  - MySQL Connection: " . ($results['db_connection'] ? "[PASS] Connected" : "[FAIL] " . ($results['db_error'] ?? 'Failed')) . "\n";

    echo "\nDatabase Tables (16 required):\n";
    foreach ($results['tables'] as $tbl => $info) {
        if (!empty($info['exists']) && !empty($info['columns_ok'])) {
            echo "  - {$tbl}: [PASS]\n";
        } elseif (!empty($info['exists'])) {
            echo "  - {$tbl}: [WARN - Missing columns: " . implode(', ', $info['missing'] ?? []) . "]\n";
        } else {
            echo "  - {$tbl}: [FAIL - Table does not exist in MySQL]\n";
        }
    }

    echo "\nStorage:\n";
    echo "  - Uploads directory writable: " . ($results['uploads_writable'] ? "[PASS]" : "[FAIL - Check 755 permissions]") . "\n";

    echo "\n================================================================\n";
    echo "SUMMARY: {$results['summary']['passed']} PASSED, {$results['summary']['failed']} FAILED\n";
    echo "STATUS:  " . ($results['all_passed'] ? "READY FOR PRODUCTION" : "ACTION REQUIRED") . "\n";
    echo "================================================================\n";
    exit($results['all_passed'] ? 0 : 1);
}

// HTTP JSON response
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
http_response_code($results['all_passed'] ? 200 : 503);
echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
