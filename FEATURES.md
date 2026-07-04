# 🪐 KEPLER432B — Complete Features & Architecture Document

## 📋 Table of Contents

1. [Platform Overview](#platform-overview)
2. [Technology Stack](#technology-stack)
3. [Database Schema (18 Tables)](#database-schema)
4. [API Endpoints (70+ Routes)](#api-endpoints)
5. [User Features](#user-features)
6. [Admin Features](#admin-features)
7. [Security Architecture](#security-architecture)
8. [Cron Jobs](#cron-jobs)
9. [Deployment](#deployment)

---

## Platform Overview

Kepler432B is a full-stack investment & crowdfunding platform with:
- Multi-level investment plans (Plan → Slot → Lot)
- Automated daily profit distribution
- Crypto & traditional payment deposits
- Admin approval workflows
- Referral commission system
- Competition/Challenge system
- Blog/News system
- Full KYC verification

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 5.9, Tailwind CSS 4, Vite 7, Recharts, Lucide Icons |
| Backend | Node.js 20, Express 4, TypeScript 5.3 |
| Database | PostgreSQL 16 |
| Auth | JWT (httpOnly cookies), bcrypt 12 rounds |
| Security | Helmet, CORS, rate limiting, input sanitization, CSRF |

---

## Database Schema (18 Tables)

### 1. `users`
```
id, name, email, password (nullable), login_pin (nullable),
phone, address, city, country, date_of_birth, gender, occupation, profile_image,
balance, total_invested, total_earnings, total_withdrawn,
referral_code, referred_by, referral_count, referral_bonus_percentage,
referral_earnings, referral_level2_count,
joined_date, is_blocked, kyc_status, cnic_number,
is_admin, admin_pin1/2/3,
wallet_address, wallet_signature, wallet_nonce,
created_at, updated_at
```

### 2. `investment_plans`
```
id, name, description, image,
min_amount, max_amount, roi_percentage, duration_days,
is_active, created_at, updated_at
```

### 3. `slots` (inside plans)
```
id, plan_id → FK investment_plans,
name, description, roi_percentage, duration_days,
min_amount, max_amount, is_active,
created_at, updated_at
```

### 4. `lots` (inside slots)
```
id, slot_id → FK slots,
name, description, roi_percentage, duration_days,
lot_size, max_persons, current_persons, is_active,
created_at, updated_at
```

### 5. `investments`
```
id, user_id → FK users,
plan_id, slot_id, lot_id (nullable FKs),
invest_level ('plan'|'slot'|'lot'),
amount, start_date, end_date,
daily_profit, total_profit, earned_profit,
status ('pending'|'active'|'completed'|'cancelled'),
cancel_requested, admin_notes, last_profit_date,
created_at, updated_at
```

### 6. `transactions`
```
id, user_id → FK users,
type ('deposit'|'withdrawal'|'investment'|'profit'|'referral'),
amount, status ('pending'|'approved'|'rejected'),
payment_method, payment_details, proof_image, notes,
chain, tx_hash, wallet_from,
date, created_at, updated_at
```

### 7. `payment_gateways`
```
id, name, type, account_details, wallet_address, chain,
is_active, icon, created_at
```

### 8. `kyc_documents`
```
id, user_id → FK users,
cnic_number, cnic_front_image, cnic_back_image, selfie_image,
status, rejection_reason, reviewed_by, reviewed_at,
created_at
```

### 9. `notifications`
```
id, title, message, is_active, date, created_at
```

### 10. `tasks`
```
id, assigned_to → FK users,
title, description, reward_amount, screenshot_url,
status, rejection_reason, submitted_at, reviewed_at,
created_at
```

### 11. `referral_earnings`
```
id, referrer_id → FK users, referred_user_id → FK users,
investment_id → FK investments, tier (1 or 2),
commission_percentage, amount, created_at
```

### 12. `activity_logs`
```
id, user_id → FK users,
action, description, ip_address, user_agent, metadata (JSONB),
created_at
```

### 13. `profit_distribution_logs`
```
id, investment_id → FK investments, user_id → FK users,
amount, investment_status, created_at
```

### 14. `competitions`
```
id, title, description, type ('referral'|'deposit'|'investment'|'mixed'),
target_referrals, target_deposit_amount, target_invest_amount,
prize_description, prize_amount,
start_date, end_date, is_active, created_at
```

### 15. `competition_entries`
```
id, competition_id → FK competitions, user_id → FK users,
current_referrals, current_deposit, current_invest,
is_completed, completed_at, created_at
```

### 16. `blog_categories`
```
id, name, created_at
```

### 17. `blog_posts`
```
id, category_id → FK blog_categories,
title, content, image, is_published,
created_at, updated_at
```

### 18. `daily_roi_rates`
```
id, rate_date (UNIQUE), roi_percentage,
note, created_by → FK users, created_at
```

---

## API Endpoints (70+ Routes)

### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | No | Register with email/password/PIN |
| POST | `/login` | No | Login → sets httpOnly JWT cookie |
| POST | `/admin/verify-pins` | No | Admin 3-PIN verification |
| GET | `/profile` | ✅ | Get current user profile (session restore) |
| POST | `/logout` | No | Clear auth cookie |

### Wallet (`/api/wallet`)
| GET | `/nonce?address=0x...` | No | Get nonce for wallet address |
| POST | `/login` | No | Sign nonce → login (existing) or register (new, requires email+PIN) |
| POST | `/link` | ✅ | Link wallet to existing account |

### Users (`/api/users`)
| GET | `/all-users` | Admin | List all users |
| GET | `/wallet-users` | Admin | List wallet-only users |
| GET | `/referrals` | Admin | Referral tracking with deposits |
| PUT | `/users/:id/balance` | Admin | Adjust user balance |
| PUT | `/users/:id/block` | Admin | Block/unblock user |
| PUT | `/users/:id/update` | Admin | Update user fields |
| PUT | `/profile` | ✅ | Update own profile |
| POST | `/forgot-password` | No | Reset password via phone/CNIC |
| POST | `/kyc/submit` | ✅ | Submit CNIC + front image |
| GET | `/kyc/pending` | Admin | List pending KYC |
| GET | `/kyc/all` | Admin | All KYC documents |
| PUT | `/kyc/review/:user_id` | Admin | Approve/reject KYC |

### Plans/Slots/Lots
| GET | `/api/investments/plans` | No | List plans |
| POST/PUT/DELETE | `/api/investments/plans/:id?` | Admin | Plan CRUD |
| GET | `/api/slots?plan_id=` | No | List slots |
| POST/PUT/DELETE | `/api/slots/:id?` | Admin | Slot CRUD |
| GET | `/api/lots?slot_id=` | No | List lots |
| POST/PUT/DELETE | `/api/lots/:id?` | Admin | Lot CRUD |

### Investments
| POST | `/api/investments/invest` | ✅ | Invest at plan/slot/lot level |
| PUT | `/api/investments/investments/:id/review` | Admin | Approve/cancel investment |
| GET | `/api/investments/my-investments` | ✅ | User's investments |
| GET | `/api/investments/all-investments` | Admin | All investments |

### Transactions
| POST | `/api/transactions/deposit` | ✅ | Deposit (screenshot required, TRXID optional) |
| POST | `/api/transactions/withdraw` | ✅ | Withdraw (KYC + PIN required) |
| GET | `/api/transactions/my-transactions` | ✅ | User's transactions |
| GET | `/api/transactions/all-transactions` | Admin | All transactions |
| PUT | `/api/transactions/transactions/:id` | Admin | Approve/reject |
| GET | `/api/transactions/dashboard-stats` | Admin | Financial statistics |

### Gateways
| GET | `/api/gateways` | No | List payment gateways |
| POST/PUT/DELETE | `/api/gateways/:id?` | Admin | CRUD (wallet_address, chain, image) |

### Crypto Deposits
| POST | `/api/crypto-deposit/web3/submit` | ✅ | Submit TxHash for on-chain verification |
| POST | `/api/crypto-deposit/binance/create-order` | ✅ | Create Binance Pay order |
| POST | `/api/crypto-deposit/binance/webhook` | No | Binance webhook (HMAC verified) |
| POST | `/api/crypto-deposit/okx/create-order` | ✅ | Create OKX Pay order |
| POST | `/api/crypto-deposit/okx/webhook` | No | OKX webhook (HMAC verified) |
| GET | `/api/crypto-deposit/my-deposits` | ✅ | User's crypto deposits |
| GET | `/api/crypto-deposit/all-deposits` | Admin | All crypto deposits |

### ROI Rates
| GET | `/api/roi-rates/current` | No | Today's ROI rate |
| GET | `/api/roi-rates/history` | Admin | ROI history |
| POST | `/api/roi-rates/today` | Admin | Set today's ROI % |

### Tasks
| POST | `/api/tasks` | Admin | Create tasks |
| GET | `/api/my-tasks` | ✅ | User's tasks |
| GET | `/api/all-tasks` | Admin | All tasks |
| PUT | `/api/tasks/:id/submit` | ✅ | Submit task proof |
| PUT | `/api/tasks/:id/review` | Admin | Review task |

### Competitions
| GET | `/api/competitions` | No | List competitions |
| POST/PUT/DELETE | `/api/competitions/:id?` | Admin | CRUD |
| POST | `/api/competitions/:id/join` | ✅ | Join competition |
| GET | `/api/competitions/my-entries` | ✅ | User's entries |

### Blogs
| GET/POST/PUT/DELETE | `/api/blogs/categories` | Admin | Category CRUD |
| GET/POST/PUT/DELETE | `/api/blogs/posts` | Admin | Post CRUD |

### CSV
| GET | `/api/csv/export/:table` | Admin | Export table as JSON |
| POST | `/api/csv/import/:table` | Admin | Import data |
| GET | `/api/csv/tables` | Admin | Table row counts |

### Settings
| GET | `/api/settings` | No | Get site settings (logo, favicon, name) |
| PUT | `/api/settings/:key` | Admin | Update setting |

### Currency
| GET | `/api/currency/convert?from=USD&to=PKR&amount=100` | No | Live currency conversion |

### Health
| GET | `/api/health` | No | Health check |

---

## User Features

| Feature | Description |
|---------|------------|
| **Dashboard** | Balance, Capital, Active, Earned, Withdrawn stats + daily earnings |
| **Invest** | Browse Plans → Slots → Lots hierarchy, T&C modal before investing |
| **Deposit** | Bank/Mobile (screenshot required) + Crypto (Web3 wallet, Binance Pay, OKX Pay) |
| **Withdraw** | KYC + PIN required, supports bank + crypto |
| **History** | Full transaction history with chain, txHash, receipt images |
| **Tasks** | View assigned tasks, submit proof screenshots |
| **Competitions** | Join competitions, track progress |
| **Blog** | Read posts by category, search |
| **Profile** | Update phone/city/country, KYC submission with CNIC image |
| **Referral** | Copy referral link, share via WhatsApp, earn 7% Tier 1 + 3% Tier 2 |
| **Wallet Login** | MetaMask/Trust Wallet — nonce-based signature authentication |

---

## Admin Features

| Feature | Description |
|---------|------------|
| **Dashboard** | Financial charts (BarChart + PieChart), summary stats |
| **Users** | Search, block/unblock, edit balance, view wallet addresses, link wallets |
| **Transactions** | Approve/reject deposits/withdrawals, view receipt images, TRX IDs |
| **Investments** | View all investments (pooled, active, completed) |
| **Plans** | CRUD Plans → Slots → Lots with pool target amounts |
| **KYC** | Review CNIC submissions with image, approve/reject |
| **ROI** | Set daily ROI % (applies to all active investments) |
| **Tasks** | Create tasks, review submissions, approve rewards |
| **Competitions** | Create/manage competitions with referral/deposit/investment targets |
| **Blog** | Create categories and posts |
| **CSV** | Export/import all 18 tables |
| **Notifications** | Create/manage system announcements |
| **Gateways** | CRUD payment methods (including crypto wallet addresses) |
| **Crypto** | View all crypto deposit verification statuses |
| **Referrals** | Track referral relationships, commissions, deposit history |
| **Site Settings** | Upload logo, favicon, set site name, enable/disable Binance/OKX |

---

## Security Architecture

| Layer | Protection |
|-------|-----------|
| **Transport** | HTTPS, Helmet (CSP, HSTS, X-Frame-Options) |
| **Auth** | httpOnly + secure + sameSite:strict JWT cookies |
| **CSRF** | X-CSRF-Token header validation |
| **Rate Limiting** | Global: 200/15min, Login: 10/15min, Register: 5/hour |
| **Input Sanitization** | Strip `<script>`, event handlers, `javascript:`, `eval()`, `document.cookie` |
| **SQL Injection** | All queries parameterized ($1,$2,$3), runtime pattern detection |
| **Path Traversal** | Block `../` and encoded variants |
| **Honeypot** | Hidden field traps for bots |
| **Dev Tools Block** | F12, Ctrl+Shift+I/J/C, right-click disabled in frontend |
| **VPN Detection** | Proxy header analysis, blocks VPN connections |
| **Error Masking** | Global handler hides DB details, stack traces |
| **Password Hashing** | Bcrypt 12 rounds |
| **Rate Limit Headers** | X-RateLimit-* standard headers |

---

## Cron Jobs

| Schedule | Job | Description |
|----------|-----|-------------|
| Every hour | `distributeProfits()` | Credits daily ROI to all active investments (once per day per investment) |
| Every 2 min | `verifyPendingDeposits()` | Retries on-chain verification, expires old CEX orders |

---

## Deployment (Dokploy)

```bash
# 1. Push code to Git
# 2. Create PostgreSQL database in Dokploy
# 3. Create backend service (server/Dockerfile, build path ./server)
# 4. Create frontend service (Dockerfile, build path .)
# 5. Set environment variables
# 6. Configure DNS (A records for domain, www, api)
# 7. Enable HTTPS (auto Let's Encrypt)
# Backend auto-migrates all 18 tables on startup
```

---

## Environment Variables

```env
PORT=5000
NODE_ENV=production
DB_HOST=postgres
DB_PORT=5432
DB_NAME=kepler432b
DB_USER=kepler432b_app
DB_PASSWORD=STRONG_PASSWORD
DB_SSL=false
JWT_SECRET=RANDOM_64_CHAR_STRING
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://yourdomain.com
ADMIN_EMAIL=admin@kepler432b.com
ADMIN_PASSWORD=STRONG_ADMIN_PASSWORD
ADMIN_PIN=5678
ADMIN_PIN1=secret1
ADMIN_PIN2=secret2
ADMIN_PIN3=secret3
MASTER_WALLET_ADDRESS=0xYOUR_WALLET
```

---

*Kepler432B — Complete Features & Architecture Document v2.0*
