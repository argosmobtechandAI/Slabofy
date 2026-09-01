# 🌐 Slabofy Nginx & VPS Deployment Configuration

This document provides the separate Nginx configuration blocks for **Frontend (React/Vite static build)** and **Backend (Node.js/PM2 API)**, along with explanation and step-by-step setup commands.

---

## 💡 Why `dist/`? (Frontend Architecture)

- **The frontend is a React 19 Single Page Application (SPA) built using Vite.**
- When you run `npm run build` in `frontend/`, Vite compiles and bundles the React code into static HTML, JavaScript, and CSS in `frontend/dist`.
- **No Node.js or PM2 is needed for the frontend in production.** Nginx serves the static `dist/` folder directly, delivering blazing-fast page load times and minimal RAM usage.

---

## 1️⃣ Frontend Nginx Configuration

**File on VPS:** `/etc/nginx/sites-available/slabofy-frontend`

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

    # Handle React Router (SPA) client-side page routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache Vite static assets for high performance
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, no-transform, immutable";
    }

    # Proxy uploaded media/KYC files from backend
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

---

## 2️⃣ Backend API Nginx Configuration

**File on VPS:** `/etc/nginx/sites-available/slabofy-backend`

```bash
sudo nano /etc/nginx/sites-available/slabofy-backend
```

```nginx
server {
    listen 80;
    server_name api.slabofy.com;

    # Allow document/image uploads up to 25MB
    client_max_body_size 25M;

    # Reverse proxy to PM2 Express backend on port 5001
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

---

## 🚀 Activation & SSL Installation (Step-by-Step)

Run these commands on your VPS terminal:

### Step 1: Build the frontend
```bash
cd /var/www/Slabofy/frontend
npm install
npm run build
```
*(Confirms that `/var/www/Slabofy/frontend/dist` is generated)*

### Step 2: Enable both Nginx sites
```bash
sudo ln -sf /etc/nginx/sites-available/slabofy-frontend /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/slabofy-backend /etc/nginx/sites-enabled/
```

### Step 3: Test and reload Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Step 4: Issue Free SSL (HTTPS) with Certbot
```bash
sudo certbot --nginx -d slabofy.com -d www.slabofy.com -d api.slabofy.com
```

---

## 📊 Summary of Services on VPS

| Domain / Port | Service | Path / Process |
| :--- | :--- | :--- |
| `https://slabofy.com` | React Frontend (SPA) | Nginx -> `/var/www/Slabofy/frontend/dist` |
| `https://api.slabofy.com` | Express Backend API | Nginx -> `http://127.0.0.1:5001` (PM2: `slabofy-api`) |
| `https://db.slabofy.com` | PostgreSQL Database | Supabase (Docker) -> Port `5432` |
