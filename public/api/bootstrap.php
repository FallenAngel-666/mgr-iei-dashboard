<?php
/**
 * IEI MGR STUDENTS CHAPTER — PHP 8 API Core Bootstrap (Hostinger MySQL + Storage)
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store, no-cache, must-revalidate');

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    http_response_code(503);
    echo json_encode([
        'ok' => false,
        'error' => 'SERVER_NOT_CONFIGURED',
        'message' => 'Copy api/config.example.php to api/config.php and configure your Hostinger MySQL credentials.'
    ]);
    exit;
}

$CONFIG = require $configPath;

// Safe CORS handling for same-origin or configured production domains
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = $CONFIG['ALLOWED_ORIGINS'] ?? [];
if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Vary: Origin');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function sendJson(array $payload, int $status = 200): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function getJsonBody(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        sendJson(['ok' => false, 'error' => 'INVALID_JSON', 'message' => 'Malformed JSON request body.'], 400);
    }
    return $decoded;
}

function getDb(): PDO {
    static $pdo = null;
    global $CONFIG;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = $CONFIG['DB_HOST'] ?? 'localhost';
    $port = $CONFIG['DB_PORT'] ?? '3306';
    $name = $CONFIG['DB_NAME'] ?? '';
    $user = $CONFIG['DB_USER'] ?? '';
    $pass = $CONFIG['DB_PASS'] ?? '';

    $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";
    try {
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        return $pdo;
    } catch (Throwable $e) {
        error_log('[IEI DB CONNECTION ERROR] ' . $e->getMessage());
        sendJson([
            'ok' => false,
            'error' => 'DATABASE_CONNECTION_FAILED',
            'message' => 'Unable to connect to Hostinger MySQL database. Verify api/config.php credentials.'
        ], 500);
    }
}

function base64UrlEncode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode(string $data): string {
    $pad = strlen($data) % 4;
    if ($pad > 0) {
        $data .= str_repeat('=', 4 - $pad);
    }
    return base64_decode(strtr($data, '-_', '+/')) ?: '';
}

function createAuthToken(array $member): string {
    global $CONFIG;
    $secret = (string)($CONFIG['APP_SECRET'] ?? '');
    if (strlen($secret) < 16 || str_contains($secret, 'REPLACE_WITH')) {
        sendJson(['ok' => false, 'error' => 'WEAK_APP_SECRET', 'message' => 'Set a strong APP_SECRET in api/config.php.'], 500);
    }

    $ttl = (int)($CONFIG['SESSION_TTL_SECONDS'] ?? 604800);
    $header = base64UrlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload = base64UrlEncode(json_encode([
        'sub' => $member['id'],
        'username' => $member['username'] ?? '',
        'role' => $member['role'] ?? '',
        'name' => $member['name'] ?? '',
        'iat' => time(),
        'exp' => time() + $ttl,
    ]));
    $sig = base64UrlEncode(hash_hmac('sha256', "{$header}.{$payload}", $secret, true));
    return "{$header}.{$payload}.{$sig}";
}

function getBearerToken(): ?string {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if ($auth === '' && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }
    if (preg_match('/Bearer\s+([A-Za-z0-9\-_\.]+)/i', $auth, $m)) {
        return $m[1];
    }
    return null;
}

function getAuthenticatedUser(PDO $pdo): ?array {
    global $CONFIG;
    $token = getBearerToken();
    if ($token === null) return null;

    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$h, $p, $s] = $parts;

    $secret = (string)($CONFIG['APP_SECRET'] ?? '');
    $expected = base64UrlEncode(hash_hmac('sha256', "{$h}.{$p}", $secret, true));
    if (!hash_equals($expected, $s)) return null;

    $claims = json_decode(base64UrlDecode($p), true);
    if (!is_array($claims) || empty($claims['sub']) || (int)($claims['exp'] ?? 0) < time()) {
        return null;
    }

    $stmt = $pdo->prepare('SELECT * FROM iei_members WHERE id = ? LIMIT 1');
    $stmt->execute([$claims['sub']]);
    $row = $stmt->fetch();
    if (!$row) return null;

    $member = json_decode($row['data_json'], true) ?: [];
    $member['id'] = $row['id'];
    $member['name'] = $row['name'];
    $member['role'] = $row['role'];
    $member['username'] = $row['username'];
    $member['email'] = $row['email'];
    $member['status'] = $row['status'];

    if (strtolower((string)$member['status']) !== 'active') {
        return null;
    }
    return $member;
}

function requireAuth(PDO $pdo): array {
    $user = getAuthenticatedUser($pdo);
    if (!$user) {
        sendJson(['ok' => false, 'error' => 'UNAUTHORIZED', 'message' => 'Authentication required. Please sign in.'], 401);
    }
    return $user;
}

// ============================================================================
// SERVER-SIDE RBAC HELPERS (Exact mirror of src/config/roles.js)
// ============================================================================
function isMasterAdmin(?array $user): bool {
    if (!$user) return false;
    return ($user['role'] ?? '') === 'Administrator'
        || !empty($user['isMasterAdmin'])
        || in_array(strtolower((string)($user['username'] ?? '')), ['admin.master-01', 'administrator'], true);
}

function canAccessActivityConsole(?array $user): bool {
    if (!$user) return false;
    if (isMasterAdmin($user)) return true;
    $username = strtolower((string)($user['username'] ?? ''));
    $name = strtolower((string)($user['name'] ?? ''));
    $role = (string)($user['role'] ?? '');
    return $username === 'sripriyan.jsec-01'
        || ($role === 'Joint Secretary' && str_contains($name, 'sripriyan'));
}

function canAccessMembersDirectory(?array $user): bool {
    if (!$user) return false;
    if (isMasterAdmin($user)) return true;
    $username = strtolower((string)($user['username'] ?? ''));
    $name = strtolower((string)($user['name'] ?? ''));
    $allowedUsers = ['sripriyan.jsec-01', 'ramya.emhead-01', 'ramya.memdir-01', 'swathi.memdir-01', 'swathi.emhead-01'];
    if (in_array($username, $allowedUsers, true)) return true;
    return str_contains($name, 'sripriyan') || str_contains($name, 'ramya') || str_contains($name, 'swathi');
}

function canAccessProfileUpdate(?array $user): bool {
    if (!$user) return false;
    $allowedRoles = ['Administrator', 'Chairman', 'Vice Chairman', 'Secretary', 'Joint Secretary'];
    return in_array((string)($user['role'] ?? ''), $allowedRoles, true);
}

function sanitizeMemberForClient(array $member, ?array $viewer): array {
    unset($member['password_hash']);
    // Only Master Administrator and authorized directory managers may view credentials
    if (!canAccessMembersDirectory($viewer)) {
        unset($member['password']);
    }
    return $member;
}

function bumpSyncVersion(PDO $pdo, string $collection): int {
    $stmt = $pdo->prepare(
        'INSERT INTO iei_sync_meta (collection_name, version) VALUES (?, 2)
         ON DUPLICATE KEY UPDATE version = version + 1, updated_at = CURRENT_TIMESTAMP'
    );
    $stmt->execute([$collection]);

    $sel = $pdo->prepare('SELECT version FROM iei_sync_meta WHERE collection_name = ?');
    $sel->execute([$collection]);
    return (int)($sel->fetchColumn() ?: 1);
}

function redactSensitiveData(mixed $value): mixed {
    if (!is_array($value)) return $value;
    $sensitive = ['password', 'password_hash', 'token', 'secret', 'apikey', 'api_key', 'authorization'];
    $out = [];
    foreach ($value as $k => $v) {
        $lk = strtolower((string)$k);
        $isSensitive = false;
        foreach ($sensitive as $s) {
            if (str_contains($lk, $s)) {
                $isSensitive = true;
                break;
            }
        }
        $out[$k] = $isSensitive ? '[REDACTED]' : redactSensitiveData($v);
    }
    return $out;
}

function appendAuditLog(PDO $pdo, array $entry): array {
    $id = $entry['id'] ?? ('audit-' . (int)(microtime(true) * 1000) . '-' . bin2hex(random_bytes(3)));
    $timestamp = gmdate('c');
    $actor = is_array($entry['actor'] ?? null) ? $entry['actor'] : [];
    $record = [
        'id' => $id,
        'timestamp' => $timestamp,
        'actorUid' => $entry['actorUid'] ?? ($actor['id'] ?? 'system'),
        'actorName' => $entry['actorName'] ?? ($actor['name'] ?? 'System'),
        'actorUsername' => $entry['actorUsername'] ?? ($actor['username'] ?? 'system'),
        'actorRole' => $entry['actorRole'] ?? ($actor['role'] ?? 'System'),
        'action' => (string)($entry['action'] ?? 'GENERIC_OPERATION'),
        'module' => (string)($entry['module'] ?? 'SECURITY'),
        'status' => in_array(($entry['status'] ?? 'SUCCESS'), ['SUCCESS', 'FAILED', 'DENIED'], true) ? $entry['status'] : 'SUCCESS',
        'details' => (string)($entry['details'] ?? ''),
        'targetId' => (string)($entry['targetId'] ?? ''),
        'correlationId' => (string)($entry['correlationId'] ?? ('corr-' . bin2hex(random_bytes(4)))),
        'previousValues' => isset($entry['previousValues']) ? redactSensitiveData($entry['previousValues']) : null,
        'newValues' => isset($entry['newValues']) ? redactSensitiveData($entry['newValues']) : null,
    ];

    $stmt = $pdo->prepare(
        'INSERT INTO system_audit_logs
         (id, event_timestamp, actor_uid, actor_name, actor_username, actor_role, action, module, status, target_id, data_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $record['id'],
        $record['timestamp'],
        $record['actorUid'],
        $record['actorName'],
        $record['actorUsername'],
        $record['actorRole'],
        $record['action'],
        $record['module'],
        $record['status'],
        $record['targetId'],
        json_encode($record, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    ]);

    return $record;
}
