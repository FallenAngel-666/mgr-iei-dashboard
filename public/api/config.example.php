<?php
/**
 * ============================================================================
 * IEI MGR STUDENTS CHAPTER — HOSTINGER SERVER CONFIGURATION TEMPLATE
 * ============================================================================
 * INSTRUCTIONS:
 * 1. Copy this file to `public_html/api/config.php` on your Hostinger server.
 * 2. Fill in your Hostinger MySQL database details from hPanel -> Databases.
 * 3. Replace APP_SECRET with a random 64-character secret string.
 * 4. NEVER commit `config.php` to Git or share it publicly.
 * ============================================================================
 */

return [
    // Hostinger MySQL Database Settings (hPanel -> Databases -> Management)
    'DB_HOST' => 'localhost',
    'DB_PORT' => '3306',
    'DB_NAME' => 'u000000000_iei_mgr_db',
    'DB_USER' => 'u000000000_iei_admin',
    'DB_PASS' => 'REPLACE_WITH_YOUR_HOSTINGER_MYSQL_PASSWORD',

    // Cryptographic secret for signing session tokens (generate 64 random hex chars)
    'APP_SECRET' => 'REPLACE_WITH_A_RANDOM_64_CHARACTER_HEX_SECRET_BEFORE_LAUNCH',

    // Allowed production origin(s) — leave empty to default to same-origin automatically
    'ALLOWED_ORIGINS' => [
        // 'https://your-domain.com',
        // 'https://www.your-domain.com',
    ],

    // Upload storage limits
    'MAX_UPLOAD_BYTES' => 10 * 1024 * 1024, // 10 MB
    'SESSION_TTL_SECONDS' => 7 * 24 * 60 * 60, // 7 days
];
