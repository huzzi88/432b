# 🚀 KEPLER432B — Dokploy Production Deployment

## Prerequisites

| Requirement | Minimum |
|-------------|---------|
| VPS | 2 CPU, 4GB RAM, 40GB SSD |
| OS | Ubuntu 22.04 LTS |
| Domain | `yourdomain.com` + `api.yourdomain.com` (A records → VPS IP) |

---

## Step 1: Install Dokploy

```bash
ssh root@YOUR_VPS_IP
curl -sSL https://dokploy.com/install.sh | sh
```

Open `http://YOUR_VPS_IP:3000` → Create Dokploy admin account.

---

## Step 2: Push Code to Git

```bash
git init
git add .
git commit -m "Production ready"
git remote add origin https://github.com/YOUR_USER/kepler432b.git
git push -u origin main
```

---

## Step 3: Create PostgreSQL Database

1. Dokploy → **Databases** → **Create Database**

| Field | Value |
|-------|-------|
| Name | `kepler432b-db` |
| Type | PostgreSQL |
| Version | 16 |
| Database Name | `kepler432b` |
| Username | `kepler432b_app` |
| Password | **Generate strong password — SAVE IT** |

2. Click **Deploy** → Wait for "Running"
3. Copy **Internal Host** (e.g., `kepler432b-db-xxxxx`)

---

## Step 4: Create Backend Service

1. **Projects** → **Create Project** → Name: `kepler432b`
2. Inside project → **Create Service** → **Application**

| Field | Value |
|-------|-------|
| Name | `kepler432b-backend` |
| Source | Git Repository |
| Repository | `https://github.com/YOUR_USER/kepler432b.git` |
| Branch | `main` |
| Build Path | `./server` |
| Dockerfile Path | `./server/Dockerfile` |

3. **Environment Variables:**

```env
PORT=5000
NODE_ENV=production
DB_HOST=kepler432b-db-xxxxx       ← Internal host from Step 3
DB_PORT=5432
DB_NAME=kepler432b
DB_USER=kepler432b_app
DB_PASSWORD=YOUR_DB_PASSWORD      ← From Step 3
DB_SSL=false                      ← Internal Docker = no SSL
JWT_SECRET=$(openssl rand -hex 64) ← Generate 64-char random string
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://yourdomain.com
ADMIN_EMAIL=admin@kepler432b.com
ADMIN_PASSWORD=YourStrongAdmin123!
ADMIN_PIN=5678
ADMIN_PIN1=secretpin1
ADMIN_PIN2=secretpin2
ADMIN_PIN3=secretpin3
```

4. **Ports:** Internal `5000` → Expose `5000`
5. **Domain:** `api.yourdomain.com` → Port `5000` → **Enable HTTPS**
6. Click **Deploy**

---

## Step 5: Run Migrations (Auto-Runs on Start)

Migrations run automatically when backend starts. Verify:

1. Backend service → **Logs**
2. Look for:
   ```
   ✅ Database connected
   🔄 Running auto-migrations...
   ✅ All 17 tables ready!
   🪐 KEPLER432B [PRODUCTION] on port 5000
   ```

If tables weren't created (first run may have race condition):

1. Backend → **Terminal**
2. Run: `npx ts-node src/database/migrate.ts`
3. Then: `npx ts-node src/database/seed.ts`

> **⚠️ EXISTING DEPLOYMENTS:** If you already have tables created, run this ALTER to fix wallet login:
> ```sql
> ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
> ALTER TABLE users ALTER COLUMN login_pin DROP NOT NULL;
> CREATE UNIQUE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address) WHERE wallet_address IS NOT NULL;
> ```

---

## Step 6: Create Frontend Service

1. Same project → **Create Service** → **Application**

| Field | Value |
|-------|-------|
| Name | `kepler432b-frontend` |
| Source | Git Repository |
| Repository | `https://github.com/YOUR_USER/kepler432b.git` |
| Branch | `main` |
| Build Path | `.` (root) |
| Dockerfile Path | `./Dockerfile` |

2. **Build-Time Env:**

```env
VITE_API_URL=https://api.yourdomain.com/api
```

3. **Domain:** `yourdomain.com` → Port `80` → **Enable HTTPS**
4. Also add: `www.yourdomain.com` → Port `80` → **Enable HTTPS**
5. Click **Deploy**

---

## Step 7: DNS Configuration

In your domain registrar:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | `YOUR_VPS_IP` | Auto |
| A | `www` | `YOUR_VPS_IP` | Auto |
| A | `api` | `YOUR_VPS_IP` | Auto |

Wait 5-10 minutes for propagation.

---

## Step 8: Verify Deployment

### Backend Health
```bash
curl https://api.yourdomain.com/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

### Frontend
Open `https://yourdomain.com` → Login page should appear.

### Admin Login
```
Email: admin@kepler432b.com
Password: (ADMIN_PASSWORD from .env)
PIN: (ADMIN_PIN from .env)
Admin PINs: ADMIN_PIN1, ADMIN_PIN2, ADMIN_PIN3
```

---

## Step 9: Post-Deployment Checklist

```
✅ HTTPS on frontend (yourdomain.com) and backend (api.yourdomain.com)
✅ CORS_ORIGIN matches exact frontend URL (no trailing slash)
✅ JWT_SECRET is 64+ random characters (use openssl rand -hex 64)
✅ ADMIN_PASSWORD is strong (12+ chars, mixed case, numbers, symbols)
✅ DB_PASSWORD is strong and different from ADMIN_PASSWORD
✅ NODE_ENV=production (enables secure cookies, HSTS, strict CSP)
✅ DB_SSL=false (internal Docker network — SSL not needed)
✅ Backend port 5000 not exposed publicly (only through Dokploy proxy)
✅ Database port 5432 not exposed publicly
✅ 17 tables created (check logs for "All 17 tables ready!")
✅ Default plans seeded (Starter, Growth, Premium)
✅ Default gateways seeded (JazzCash, EasyPaisa, Bank, USDT)
```

---

## Step 10: Updating After Code Changes

```bash
git add .
git commit -m "Update: description"
git push origin main
```

In Dokploy:
1. Go to backend service → Click **Redeploy**
2. Go to frontend service → Click **Redeploy**
3. Or enable **Auto Deploy** in service settings

---

## 📊 Architecture in Dokploy

```
┌──────────────────────────────────────────────┐
│              DOKPLOY SERVER                  │
│                                              │
│  ┌─────────────┐    ┌──────────────────┐    │
│  │  Frontend    │    │  Backend API     │    │
│  │  (Nginx)     │───▶│  (Node.js)      │    │
│  │  Port 80     │    │  Port 5000      │    │
│  │              │    │                  │    │
│  │ yourdomain   │    │ api.yourdomain   │    │
│  │ .com         │    │ .com             │    │
│  └─────────────┘    └────────┬─────────┘    │
│                              │               │
│                    ┌─────────▼─────────┐    │
│                    │  PostgreSQL       │    │
│                    │  Port 5432       │    │
│                    │  (internal only) │    │
│                    └──────────────────┘    │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  Traefik Reverse Proxy (auto-SSL)   │   │
│  │  Let's Encrypt certificates         │   │
│  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| **Tables not created** | Backend → Terminal: `npx ts-node src/database/migrate.ts` |
| **Backend can't connect to DB** | Check `DB_HOST` matches Dokploy internal hostname |
| **CORS errors in browser** | `CORS_ORIGIN` must exactly match frontend URL with `https://` |
| **Cookies not working** | Ensure `NODE_ENV=production`, frontend uses `https://` |
| **502 Bad Gateway** | Backend crashed — check Logs, redeploy |
| **White screen on refresh** | Backend `getProfile()` failing — check token/cookie flow |
| **Build fails** | Check Dockerfile paths are correct in service settings |
| **Admin login fails** | Run `npx ts-node src/database/seed.ts` to create admin user |
| **Rate limit crash** | `app.set('trust proxy', 1)` is set — verify it's in server.ts |
| **Helmet CSP error** | Ensure `CORS_ORIGIN` has no spaces — use comma separation only |

---

## 💰 Cost Estimate

| Service | Provider | Monthly Cost |
|---------|----------|-------------|
| VPS (2CPU/4GB) | Hetzner CX22 | ~$5 |
| VPS (2CPU/4GB) | DigitalOcean | ~$24 |
| VPS (2CPU/4GB) | Contabo VPS S | ~$7 |
| Domain (.com) | Namecheap | ~$10/year |
| **Total** | | **$5-24/month** |

---

## 📋 Database Tables (17)

| Table | Purpose |
|-------|---------|
| `users` | Auth, profile, balance, wallet, KYC |
| `investment_plans` | Investment plan configurations |
| `slots` | Plan subdivisions with custom ROI |
| `lots` | Slot subdivisions (investable units) |
| `investments` | User investment records (plan/slot/lot) |
| `transactions` | Financial records (chain, tx_hash) |
| `payment_gateways` | Payment methods (including crypto wallets) |
| `kyc_documents` | User identity verification |
| `notifications` | System announcements |
| `tasks` | Reward tasks |
| `referral_earnings` | Commission tracking |
| `activity_logs` | Audit trail |
| `profit_distribution_logs` | Cron profit records |
| `competitions` | Admin challenges |
| `competition_entries` | User competition participation |
| `blog_categories` | Blog organization |
| `blog_posts` | Blog content |

---

*Kepler432B — Production Deployment Guide v2.0*
