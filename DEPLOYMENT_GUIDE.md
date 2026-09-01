# 🚀 Slabofy VPS Deployment Guide

Complete step-by-step production deployment guide for **Slabofy** on an Ubuntu/Debian VPS running **Supabase (Docker)**, **Node.js (PM2)**, and **Nginx**.

---

## 🏗️ Architecture Overview

```
                          Internet (HTTPS / Cloudflare)
                                       │
                                       ▼
                             Nginx Reverse Proxy
                                       │
              ┌────────────────────────┼────────────────────────┐
              ▼                        ▼                        ▼
     https://slabofy.com      https://api.slabofy.com     https://db.slabofy.com
    (React Static Build)     (Express API on :5001)        (Supabase Docker)
       /var/www/Slabofy/       Managed via PM2             Port 5432 / 8000
         frontend/dist
```

---

## 📋 Prerequisites on VPS

Ensure the following tools are installed on your VPS:

```bash
# 1. Update package list
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 20 LTS & npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx certbot python3-certbot-nginx

# 3. Install PM2 process manager globally
sudo npm install -g pm2
```

---

## 📥 Step 1: Clone the Repository

Navigate to your web directory and clone the repository:

```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/argosmobtechandAI/Slabofy.git
sudo chown -R $USER:$USER /var/www/Slabofy
cd /var/www/Slabofy
```

---

## ⚙️ Step 2: Configure & Start Backend API

### 1. Install dependencies
```bash
cd /var/www/Slabofy/backend
npm install --production
```

### 2. Create uploads directory with write permissions
```bash
mkdir -p /var/www/Slabofy/backend/uploads
chmod -R 755 /var/www/Slabofy/backend/uploads
```

### 3. Configure production environment (`.env`)
```bash
cp .envexample .env
nano .env
```

Paste your production configuration:
```ini
# Server Config
PORT=5001
NODE_ENV=production

# Database Config (Local Supabase on VPS)
DATABASE_URL=postgresql://postgres.your-tenant-id:your-super-secret-and-long-postgres-password@127.0.0.1:5432/postgres

# Redis Config (uses internal in-memory fallback if redis is not running)
REDIS_URL=redis://127.0.0.1:6379

# JWT Secret (Generate a strong 64-char random string)
JWT_SECRET=super_secret_production_jwt_key_slabofy_2026_change_this!

# Razorpay Keys
RAZORPAY_KEY_ID=rzp_live_your_key_here
RAZORPAY_KEY_SECRET=your_razorpay_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# WhatsApp Meta API Keys
WHATSAPP_TOKEN=your_whatsapp_meta_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here

# Push Notifications (Firebase FCM)
FCM_SERVER_KEY=your_fcm_server_key_here

# Email Gateway (SendGrid)
SENDGRID_API_KEY=your_sendgrid_key_here
EMAIL_FROM=noreply@slabofy.com
```

### 4. Start backend with PM2
```bash
pm2 start src/index.js --name "slabofy-api"
pm2 save
pm2 startup
```

Verify backend is healthy:
```bash
curl http://127.0.0.1:5001/health
```

---

## 🌐 Step 3: Build Frontend for Production

### 1. Configure Frontend Environment (`.env`)
```bash
cd /var/www/Slabofy/frontend
nano .env
```

Add your production API URL:
```ini
VITE_API_URL=https://api.slabofy.com
```

### 2. Install dependencies & build production bundle
```bash
npm install
npm run build
```

This compiles your React application into `/var/www/Slabofy/frontend/dist`.

---

## 🔀 Step 4: Configure Nginx (Separate Frontend & Backend Configs)

### 1. Frontend Configuration (`/etc/nginx/sites-available/slabofy-frontend`)
```bash
sudo nano /etc/nginx/sites-available/slabofy-frontend
```

```nginx
server {
    listen 80;
    server_name slabofy.com www.slabofy.com;

    # Path to Vite React production build
    root /var/www/Slabofy/frontend/dist;
    index index.html;

    # Handle React Router (SPA) client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static build assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, no-transform, immutable";
    }

    # Uploaded media files proxy from backend
    location /uploads/ {
        proxy_pass http://127.0.0.1:5001/uploads/;
        proxy_set_header Host $host;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
}
```

### 2. Backend API Configuration (`/etc/nginx/sites-available/slabofy-backend`)
```bash
sudo nano /etc/nginx/sites-available/slabofy-backend
```

```nginx
server {
    listen 80;
    server_name api.slabofy.com;

    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }
}
```

### 3. Enable Both Sites & Reload Nginx
```bash
sudo ln -sf /etc/nginx/sites-available/slabofy-frontend /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/slabofy-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 Step 5: Setup Free SSL Certificates (Certbot)

```bash
sudo certbot --nginx -d slabofy.com -d www.slabofy.com -d api.slabofy.com
```

---

## 🔄 Step 6: 1-Minute Update / Redeploy Command

Whenever you push new changes to GitHub, run this on your VPS:

```bash
cd /var/www/Slabofy && git pull origin main && cd frontend && npm install && npm run build && cd ../backend && npm install --production && pm2 restart slabofy-api
```
