<?php
/**
 * POST /api/upload.php — Secure Hostinger File & Image Storage API
 * Stores validated files on Hostinger NVMe storage (/uploads/<folder>/)
 * and indexes all upload metadata in Hostinger MySQL (iei_uploads table).
 */
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

$pdo = getDb();
$user = requireAuth($pdo);

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    sendJson(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED'], 405);
}

if (empty($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'])) {
    sendJson(['ok' => false, 'error' => 'NO_FILE', 'message' => 'No valid file upload received.'], 400);
}

$file = $_FILES['file'];
if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
    sendJson(['ok' => false, 'error' => 'UPLOAD_ERROR', 'message' => 'File upload failed with PHP error code ' . (int)$file['error']], 400);
}

$maxBytes = (int)($CONFIG['MAX_UPLOAD_BYTES'] ?? (10 * 1024 * 1024));
$size = (int)$file['size'];
if ($size <= 0 || $size > $maxBytes) {
    sendJson(['ok' => false, 'error' => 'FILE_TOO_LARGE', 'message' => 'File must be between 1 byte and 10 MB.'], 413);
}

// Inspect real file magic bytes (never trust client filename extension alone)
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$detectedMime = $finfo ? (string)finfo_file($finfo, $file['tmp_name']) : '';
if ($finfo) finfo_close($finfo);

$MIME_TO_EXT = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
    'image/gif'  => 'gif',
    'application/pdf' => 'pdf',
    'text/plain' => 'txt',
    'application/msword' => 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
];

if (!isset($MIME_TO_EXT[$detectedMime])) {
    appendAuditLog($pdo, [
        'actor' => $user,
        'action' => 'SECURITY_UPLOAD_BLOCKED',
        'module' => 'SECURITY',
        'status' => 'DENIED',
        'details' => "Blocked unsupported file upload ({$detectedMime}) by @{$user['username']}.",
    ]);
    sendJson([
        'ok' => false,
        'error' => 'UNSUPPORTED_FILE_TYPE',
        'message' => 'Unsupported file format. Only JPG, PNG, WebP, GIF, PDF, TXT, DOC, and DOCX are permitted.'
    ], 415);
}

$allowedFolders = ['general', 'gallery', 'event-posters', 'community-updates', 'avatars', 'documents'];
$rawFolder = strtolower(trim((string)($_POST['folder'] ?? 'general')));
$folder = in_array($rawFolder, $allowedFolders, true) ? $rawFolder : 'general';

$ext = $MIME_TO_EXT[$detectedMime];
$storedName = time() . '_' . bin2hex(random_bytes(8)) . '.' . $ext;
$uploadsRoot = dirname(__DIR__) . '/uploads';
$targetDir = $uploadsRoot . '/' . $folder;

if (!is_dir($targetDir) && !@mkdir($targetDir, 0755, true)) {
    sendJson(['ok' => false, 'error' => 'STORAGE_DIR_ERROR', 'message' => 'Unable to create Hostinger uploads directory. Check folder permissions (755).'], 500);
}

$targetPath = $targetDir . '/' . $storedName;
if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    sendJson(['ok' => false, 'error' => 'STORAGE_WRITE_ERROR', 'message' => 'Failed to save uploaded file on Hostinger storage.'], 500);
}

@chmod($targetPath, 0644);
$publicUrl = "/uploads/{$folder}/{$storedName}";
$uploadId = 'upl-' . (int)(microtime(true) * 1000) . '-' . bin2hex(random_bytes(3));
$originalName = substr(preg_replace('/[^a-zA-Z0-9._\-\s]/', '_', (string)($file['name'] ?? $storedName)), 0, 200);

$stmt = $pdo->prepare(
    'INSERT INTO iei_uploads (id, folder, original_name, stored_name, mime_type, file_size, public_url, uploaded_by_id, uploaded_by_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
);
$stmt->execute([
    $uploadId,
    $folder,
    $originalName,
    $storedName,
    $detectedMime,
    $size,
    $publicUrl,
    $user['id'] ?? null,
    $user['name'] ?? null,
]);

appendAuditLog($pdo, [
    'actor' => $user,
    'action' => 'FILE_UPLOADED',
    'module' => 'GALLERY',
    'status' => 'SUCCESS',
    'details' => "Uploaded {$originalName} ({$detectedMime}, {$size} bytes) to Hostinger storage at {$publicUrl}.",
    'targetId' => $uploadId,
]);

sendJson([
    'ok' => true,
    'id' => $uploadId,
    'url' => $publicUrl,
    'storagePath' => "uploads/{$folder}/{$storedName}",
    'mimeType' => $detectedMime,
    'size' => $size,
    'mode' => 'hostinger-storage',
], 201);
