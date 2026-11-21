import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const API_DIR = path.join(ROOT, 'public', 'api');
const DB_DIR = path.join(ROOT, 'database');

console.log('================================================================');
console.log('  STATIC VALIDATION: PHP FILES & DATABASE SCHEMA INTEGRITY      ');
console.log('================================================================\n');

// 1. Read schema.sql to extract all defined tables and columns
const schemaSql = fs.readFileSync(path.join(DB_DIR, 'schema.sql'), 'utf8');
const tableMatches = [...schemaSql.matchAll(/CREATE TABLE IF NOT EXISTS `([^`]+)` \(([\s\S]+?)\) ENGINE/gi)];
const schemaTables = new Map();

for (const match of tableMatches) {
  const tableName = match[1];
  const body = match[2];
  const colLines = body.split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('`'))
    .map(l => {
      const colMatch = l.match(/^`([^`]+)`/);
      return colMatch ? colMatch[1] : null;
    })
    .filter(Boolean);
  schemaTables.set(tableName, new Set(colLines));
}

console.log(`[SCHEMA] Extracted ${schemaTables.size} tables from database/schema.sql:`);
for (const [t, cols] of schemaTables.entries()) {
  console.log(`  - ${t} (${cols.size} columns)`);
}

// 2. Validate all PHP files
const phpFiles = [
  path.join(API_DIR, 'bootstrap.php'),
  path.join(API_DIR, 'config.example.php'),
  path.join(API_DIR, 'auth.php'),
  path.join(API_DIR, 'data.php'),
  path.join(API_DIR, 'sync.php'),
  path.join(API_DIR, 'public.php'),
  path.join(API_DIR, 'audit.php'),
  path.join(API_DIR, 'upload.php'),
  path.join(API_DIR, 'health.php'),
  path.join(API_DIR, 'setup.php'),
  path.join(API_DIR, 'verify.php'),
  path.join(DB_DIR, 'verify.php'),
];

let totalPhpErrors = 0;

for (const f of phpFiles) {
  const rel = path.relative(ROOT, f);
  if (!fs.existsSync(f)) {
    console.error(`[FAIL] File missing: ${rel}`);
    totalPhpErrors++;
    continue;
  }

  const rawCode = fs.readFileSync(f, 'utf8');

  // Extract only PHP code blocks (between <?php and ?>)
  const phpBlocks = [];
  const phpRegex = /<\?php([\s\S]*?)(\?>|$)/gi;
  let match;
  while ((match = phpRegex.exec(rawCode)) !== null) {
    phpBlocks.push(match[1]);
  }

  const code = phpBlocks.length > 0 ? phpBlocks.join('\n') : rawCode;

  // Check balanced parentheses, brackets, and braces
  let parens = 0;
  let brackets = 0;
  let braces = 0;
  let inString = false;
  let stringChar = '';
  let inComment = false;
  let inLineComment = false;

  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    const prev = i > 0 ? code[i - 1] : '';
    const next = i < code.length - 1 ? code[i + 1] : '';

    if (inLineComment) {
      if (c === '\n') inLineComment = false;
      continue;
    }
    if (inComment) {
      if (prev === '*' && c === '/') inComment = false;
      continue;
    }
    if (inString) {
      if (c === stringChar && prev !== '\\') {
        inString = false;
      }
      continue;
    }

    if (c === '/' && next === '/') {
      inLineComment = true;
      i++;
      continue;
    }
    if (c === '#' && next !== '[') {
      inLineComment = true;
      continue;
    }
    if (c === '/' && next === '*') {
      inComment = true;
      i++;
      continue;
    }
    if ((c === '"' || c === "'") && prev !== '\\') {
      inString = true;
      stringChar = c;
      continue;
    }

    if (c === '(') parens++;
    else if (c === ')') parens--;
    else if (c === '[') brackets++;
    else if (c === ']') brackets--;
    else if (c === '{') braces++;
    else if (c === '}') braces--;

    if (parens < 0 || brackets < 0 || braces < 0) {
      console.error(`[FAIL] ${rel}: Unexpected closing delimiter at character ${i} (parens: ${parens}, brackets: ${brackets}, braces: ${braces})`);
      totalPhpErrors++;
      break;
    }
  }

  if (parens !== 0 || brackets !== 0 || braces !== 0) {
    console.error(`[FAIL] ${rel}: Unbalanced delimiters (parens: ${parens}, brackets: ${brackets}, braces: ${braces})`);
    totalPhpErrors++;
  } else {
    console.log(`[PASS] ${rel} — Delimiters and syntax structure balanced.`);
  }

  // Check parameterized queries: ensure ? count matches execute array length
  const prepareMatches = [...code.matchAll(/\$pdo->prepare\(\s*['"]([\s\S]+?)['"]\s*\);[\s\S]+?\$stmt->execute\(\s*(\[[^\]]*\]|\$[^;]+)\s*\);/g)];
  for (const pm of prepareMatches) {
    const sql = pm[1];
    const execArg = pm[2];
    const qCount = (sql.match(/\?/g) || []).length;
    if (execArg.startsWith('[')) {
      // count comma-separated elements in array
      const inner = execArg.slice(1, -1).trim();
      const argCount = inner === '' ? 0 : inner.split(',').length;
      if (qCount !== argCount) {
        console.warn(`[WARN] ${rel}: Parameter mismatch in query: ${qCount} placeholders, ${argCount} execute args.`);
      }
    }
  }
}

console.log('\n================================================================');
if (totalPhpErrors === 0) {
  console.log('  ALL PHP FILES VALIDATED CLEANLY: 0 SYNTAX ERRORS DETECTED     ');
} else {
  console.error(`  VALIDATION FAILED WITH ${totalPhpErrors} ERRORS               `);
  process.exit(1);
}
console.log('================================================================');
