# Hostinger KVM 2 VPS Production Deployment & Operations Guide
## MGR IEI STUDENTS CHAPTER — TRAFFIC ENGINE & VIRTUAL WAITING ROOM
**Server Specifications:** Hostinger KVM 2 VPS (2 vCPU, 8 GB RAM, 100 GB NVMe Storage)  
**Operating System:** Ubuntu 24.04 LTS (or Ubuntu 22.04 LTS)  
**Scale Target:** ~1,500 Registered Chapter Members  

---

## 1. Initial VPS Server Provisioning

Connect to your Hostinger VPS via SSH:
```bash
ssh root@YOUR_VPS_IP
```

Update system repositories and install essential packages:
```bash
apt update && apt upgrade -y
apt install -y curl wget git build-essential ufw nginx redis-server mysql-server certbot python3-certbot-nginx
```

---

## 2. Install Node.js 20 LTS (NodeSource)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v # Should display v20.x.x
npm -v  # Should display 10.x.x
```

---

## 3. Configure Redis 7 for High-Performance Sliding Window

Open Redis configuration:
```bash
nano /etc/redis/redis.conf
```
Verify and set:
```conf
supervised systemd
maxmemory 512mb
maxmemory-policy volatile-lru
bind 127.0.0.1 ::1
```
Restart Redis and enable on boot:
```bash
systemctl restart redis-server
systemctl enable redis-server
redis-cli ping # Should reply PONG
```

---

## 4. Configure MySQL 8.0 & Import Chapter Schema

Secure the MySQL installation:
```bash
mysql_secure_installation
```

Log into MySQL console:
```bash
mysql -u root -p
```
Create the database, production user, and grant privileges:
```sql
CREATE DATABASE iei_mgr_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'iei_db_user'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON iei_mgr_platform.* TO 'iei_db_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Import the institutional schema and seed data:
```bash
cd /var/www/mgr-iei-platform
mysql -u iei_db_user -p iei_mgr_platform < database/schema.sql
mysql -u iei_db_user -p iei_mgr_platform < database/seed.sql
mysql -u iei_db_user -p iei_mgr_platform < database/immutability_triggers.sql
```

---

## 5. Deploy Application & Configure Environment

Clone or upload the repository to `/var/www/mgr-iei-platform`:
```bash
git clone https://github.com/FallenAngel-666/mgr-iei-dashboard.git /var/www/mgr-iei-platform
cd /var/www/mgr-iei-platform
npm install --production=false
npm run build
```

Copy and edit the production environment configuration:
```bash
cp .env.vps.example .env
nano .env
```
Ensure `DB_PASSWORD`, `APP_SECRET`, and `WAITING_ROOM_SECRET` are securely populated.

Set permissions:
```bash
chown -R www-data:www-data /var/www/mgr-iei-platform
chmod -R 755 /var/www/mgr-iei-platform
```

---

## 6. Configure Systemd Service

Copy the systemd service file:
```bash
cp systemd/mgr-iei-backend.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable mgr-iei-backend
systemctl start mgr-iei-backend
systemctl status mgr-iei-backend
```

---

## 7. Configure Nginx & SSL (Let's Encrypt)

Copy Nginx configuration:
```bash
cp nginx/mgr-iei.conf /etc/nginx/sites-available/mgr-iei.conf
ln -s /etc/nginx/sites-available/mgr-iei.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

Obtain free SSL certificate via Certbot:
```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 8. Firewall Configuration (UFW)

Protect MySQL (3306) and Redis (6379) from public exposure:
```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw enable
```

---

## 9. Verification & Operational Troubleshooting

### Run Local Automated Test Suites
```bash
npm run test:traffic  # Runs all 15 rate limiting & waiting room tests
npm run test:load     # Runs progressive concurrency benchmark (50 -> 1500)
npm test              # Full verification of all 119 institutional tests
```

### Check Logs in Real Time
```bash
# Node.js Application & Traffic Engine logs
journalctl -u mgr-iei-backend -f

# Nginx Access & Error logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Redis latency monitor
redis-cli --latency
```

---

## 10. Upstream DDoS & CDN Protection (Cloudflare)

While the internal Node.js rate limiter and virtual waiting room protect the application from concurrency spikes and database saturation, we strongly recommend putting **Cloudflare Free or Pro** in front of your domain:
1. Set SSL mode to **Full (Strict)**.
2. Enable **Under Attack Mode** if massive volumetric HTTP floods target your domain.
3. Keep WebSockets enabled (supported by Cloudflare by default).
