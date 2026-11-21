#!/usr/bin/env python3
"""
Builds hostinger-deploy-package.zip with strictly forward-slash entries.
Guarantees 100% Linux extraction compatibility (zero backslashes in ZIP headers).
"""
import os
import sys
import zipfile
import shutil
import tempfile

if len(sys.argv) < 3:
    print("Usage: python build-hostinger-zip.py <dist_dir> <output_zip>")
    sys.exit(1)

dist_dir = os.path.abspath(sys.argv[1])
zip_path = os.path.abspath(sys.argv[2])

if not os.path.isdir(dist_dir):
    print(f"Error: Directory does not exist: {dist_dir}")
    sys.exit(1)

if os.path.exists(zip_path):
    os.remove(zip_path)

print(f"Building POSIX-compliant ZIP archive:\n  Source: {dist_dir}\n  Target: {zip_path}")

with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for root, dirs, files in os.walk(dist_dir):
        dirs.sort()
        files.sort()
        for f in files:
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, dist_dir).replace('\\', '/')
            z.write(full_path, arcname=rel_path)

# Verify all entries in the ZIP
with zipfile.ZipFile(zip_path, 'r') as z:
    infolist = z.infolist()
    for info in infolist:
        if '\\' in info.filename:
            raise ValueError(f"CRITICAL: Entry contains forbidden backslash: {info.filename}")

print(f"  [PASS] Verified {len(infolist)} entries in ZIP. Zero backslashes detected.")

# Test extraction into a temporary directory to simulate Linux extraction
temp_dir = tempfile.mkdtemp(prefix="iei_zip_verify_")
try:
    with zipfile.ZipFile(zip_path, 'r') as z:
        z.extractall(temp_dir)

    required_extracted = [
        os.path.join(temp_dir, 'api', 'auth.php'),
        os.path.join(temp_dir, 'api', 'bootstrap.php'),
        os.path.join(temp_dir, 'database', 'schema.sql'),
        os.path.join(temp_dir, 'uploads', '.htaccess'),
        os.path.join(temp_dir, 'index.html'),
        os.path.join(temp_dir, '.htaccess')
    ]
    for req in required_extracted:
        if not os.path.isfile(req):
            raise FileNotFoundError(f"Extraction verification failed for: {req}")

    print("  [PASS] Linux-compatible extraction test passed: All directories and files unpacked cleanly.")
finally:
    shutil.rmtree(temp_dir, ignore_errors=True)
