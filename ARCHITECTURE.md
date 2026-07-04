# 🪐 KEPLER432B — Complete Architecture & Features Document

## 📋 Table of Contents

1. [Platform Overview](#platform-overview)
2. [Technology Stack](#technology-stack)
3. [Database Schema (18 Tables)](#database-schema)
4. [API Endpoints (70+ Routes)](#api-endpoints)
5. [Frontend Pages](#frontend-pages)
6. [User Features](#user-features)
7. [Admin Features](#admin-features)
8. [Security Architecture](#security-architecture)
9. [Cron Jobs](#cron-jobs)
10. [Deployment](#deployment)

---

## Platform Overview

Kepler432B is a comprehensive investment & crowdfunding platform with:
- Multi-level investment structure (Plan → Slot → Lot)
- Automated daily profit distribution
- Multiple payment methods (Bank, Crypto, Binance Pay, OKX Pay)
- Complete KYC verification system
- Admin approval workflows
- Referral commission system (7% Tier 1 + 3% Tier 2)
- Competition/Challenge system
- Blog/News system
- Full security protection (VPN blocking, dev tools blocking, anti-hacking)
- Complete informational pages (Landing, Guides, FAQ, About, Privacy, Terms, Contact)

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 5.9, Tailwind CSS 4, Vite 7, React Router 7, Recharts, Lucide Icons |
| Backend | Node.js 20, Express 4, TypeScript 5.3 |
| Database | PostgreSQL 16 |
| Auth | JWT (httpOnly cookies), bcrypt 12 rounds |
| Security | Helmet, CORS, rate limiting, input sanitization, CSRF, VPN detection, dev tools blocking |

---

## Database Schema (18 Tables)

### 1. `users`
User accounts, balances, KYC, wallet addresses, referral tracking

### 2. `investment_plans`
General investment plan categories

### 3. `slots`
Specific plans within categories

### 4. `lots`
Individual investment units within slots

### 5. `investments`
User investments with plan/slot/lot references, profit tracking

### 6. `transactions`
All financial transactions (deposit, withdrawal, investment, profit, referral)

### 7. `payment_gateways`
Payment methods (bank, crypto wallets, Binance Pay, OKX Pay)

### 8. `kyc_documents`
KYC submissions with CNIC images

### 9. `notifications`
System announcements

### 10. `tasks`
User tasks with rewards

### 11. `referral_earnings`
Referral commission tracking (Tier 1 & 2)

### 12. `activity_logs`
Audit trail with IP, user agent, metadata

### 13. `profit_distribution_logs`
Daily profit distribution records

### 14. `competitions`
Competition/challenge definitions

### 15. `competition_entries`
User competition participation

### 16. `blog_categories`
Blog post categories

### 17. `blog_posts`
Blog/news posts

### 18. `daily_roi_rates`
Admin-set daily ROI rates

### 19. `site_settings`
Site configuration (logo, favicon, name, gateway settings)

---

## API Endpoints (80+ Routes)

### Public Routes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Landing page |
| GET | `/kyc-guide` | KYC verification guide |
| GET | `/deposit-guide` | Deposit instructions |
| GET | `/withdrawal-guide` | Withdrawal instructions |
| GET | `/faq` | FAQ page |
| GET | `/about` | About Us page |
| GET | `/privacy` | Privacy Policy |
| GET | `/terms` | Terms & Conditions |
| GET | `/contact` | Contact page with live chat |

### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | No | Register with email/password/PIN |
| POST | `/login` | No | Login → sets httpOnly JWT cookie |
| POST | `/admin/verify-pins` | No | Admin 3-PIN verification |
| GET | `/profile` | ✅ | Get current user profile |
| POST | `/logout` | No | Clear auth cookie |

### Wallet (`/api/wallet`)
| GET | `/nonce?address=0x...` | No | Get nonce for wallet address |
| POST | `/login` | No | Sign nonce → login/register |
| POST | `/link` | ✅ | Link wallet to existing account |

### Users (`/api/users`)
| GET | `/all-users` | Admin | List all users |
| GET | `/wallet-users` | Admin | List wallet-only users |
| GET | `/referrals` | Admin | Referral tracking |
| PUT | `/users/:id/balance` | Admin | Adjust balance |
| PUT | `/users/:id/block` | Admin | Block/unblock |
| PUT | `/users/:id/update` | Admin | Update fields |
| PUT | `/profile` | ✅ | Update own profile |
| POST | `/forgot-password` | No | Reset password |
| POST | `/kyc/submit` | ✅ | Submit KYC |
| GET | `/kyc/pending` | Admin | Pending KYC |
| GET | `/kyc/all` | Admin | All KYC |
| PUT | `/kyc/review/:user_id` | Admin | Review KYC |

### Plans/Slots/Lots
| GET | `/investments/plans` | No | List plans |
| POST/PUT/DELETE | `/investments/plans/:id?` | Admin | CRUD |
| GET | `/slots?plan_id=` | No | List slots |
| POST/PUT/DELETE | `/slots/:id?` | Admin | CRUD |
| GET | `/lots?slot_id=` | No | List lots |
| POST/PUT/DELETE | `/lots/:id?` | Admin | CRUD |

### Investments
| POST | `/investments/invest` | ✅ | Invest |
| PUT | `/investments/investments/:id/review` | Admin | Approve/cancel |
| GET | `/investments/my-investments` | ✅ | User's investments |
| GET | `/investments/all-investments` | Admin | All investments |

### Transactions
| POST | `/transactions/deposit` | ✅ | Deposit |
| POST | `/transactions/withdraw` | ✅ | Withdraw |
| GET | `/transactions/my-transactions` | ✅ | User's transactions |
| GET | `/transactions/all-transactions` | Admin | All transactions |
| PUT | `/transactions/transactions/:id` | Admin | Approve/reject |
| GET | `/transactions/dashboard-stats` | Admin | Statistics |

### Crypto Deposits
| POST | `/crypto-deposit/web3/submit` | ✅ | Submit TxHash |
| POST | `/crypto-deposit/binance/create-order` | ✅ | Create Binance order |
| POST | `/crypto-deposit/binance/webhook` | No | Binance webhook |
| POST | `/crypto-deposit/okx/create-order` | ✅ | Create OKX order |
| POST | `/crypto-deposit/okx/webhook` | No | OKX webhook |
| GET | `/crypto-deposit/my-deposits` | ✅ | User's crypto deposits |
| GET | `/crypto-deposit/all-deposits` | Admin | All crypto deposits |

### ROI Rates
| GET | `/roi-rates/current` | No | Today's ROI |
| GET | `/roi-rates/history` | Admin | ROI history |
| POST | `/roi-rates/today` | Admin | Set daily ROI |

### Tasks
| POST | `/tasks` | Admin | Create tasks |
| GET | `/my-tasks` | ✅ | User's tasks |
| GET | `/all-tasks` | Admin | All tasks |
| PUT | `/tasks/:id/submit` | ✅ | Submit task |
| PUT | `/tasks/:id/review` | Admin | Review task |

### Competitions
| GET | `/competitions` | No | List competitions |
| POST/PUT/DELETE | `/competitions/:id?` | Admin | CRUD |
| POST | `/competitions/:id/join` | ✅ | Join competition |
| GET | `/competitions/my-entries` | ✅ | User's entries |

### Blogs
| GET/POST/PUT/DELETE | `/blogs/categories` | Admin | Category CRUD |
| GET/POST/PUT/DELETE | `/blogs/posts` | Admin | Post CRUD |

### CSV
| GET | `/csv/export/:table` | Admin | Export table |
| POST | `/csv/import/:table` | Admin | Import data |
| GET | `/csv/tables` | Admin | Table counts |

### Settings
| GET | `/settings` | No | Get site settings |
| PUT | `/settings/:key` | Admin | Update setting |

### Currency
| GET | `/currency/convert?from=&to=&amount=` | No | Currency conversion |

### Health
| GET | `/api/health` | No | Health check |

---

## Frontend Pages

### Public Pages
- **Landing Page** — Hero, features, guides, resources, CTA, footer with Telegram/Live Chat
- **KYC Guide** — Step-by-step KYC verification process
- **Deposit Guide** — How to deposit (bank, crypto, Binance Pay, OKX Pay)
- **Withdrawal Guide** — Withdrawal process and requirements
- **FAQ** — Frequently asked questions (expandable)
- **About Us** — Company mission, vision, values
- **Privacy Policy** — Data collection, usage, security, rights
- **Terms & Conditions** — Investment terms, prohibited activities, liability
- **Contact** — Contact form, contact info, live chat (Telegram)

### User Dashboard
- Dashboard with stats (Balance, Capital, Active, Earned, Withdrawn)
- Daily earnings calculator
- Invest tab (Plans → Slots → Lots)
- Deposit tab (Bank/Mobile + Crypto with Binance/OKX)
- Withdraw tab (KYC + PIN required)
- History tab (all transactions with receipts)
- Tasks tab
- Competitions tab
- Blog tab
- Profile tab (KYC submission with image upload)
- Referral section (copy link, WhatsApp share)

### Admin Dashboard
- Overview with financial charts
- Users management
- Transactions approval
- Investments management
- Plans/Slots/Lots CRUD
- KYC review with image viewing
- ROI management (set daily rate)
- Tasks management
- Competitions management
- Blog management
- CSV export/import
- Notifications
- Gateways management
- Crypto deposits monitoring
- Referrals tracking
- Site settings (logo, favicon, name, gateway toggles)

---

## User Features

| Feature | Description |
|---------|------------|
| **Landing Page** | Hero, features, guides, FAQ, About, Privacy, Terms, Contact, Telegram/Live Chat |
| **Dashboard** | Balance, Capital, Active, Earned, Withdrawn + daily earnings |
| **Invest** | Browse Plans → Slots → Lots, T&C modal |
| **Deposit** | Bank/Mobile (screenshot required) + Crypto (Web3, Binance Pay, OKX Pay) |
| **Withdraw** | KYC + PIN required, bank + crypto |
| **History** | Full transaction history with images, TRX IDs |
| **Tasks** | View/submit tasks with proof |
| **Competitions** | Join and track progress |
| **Blog** | Read posts by category |
| **Profile** | Update info, KYC with CNIC image |
| **Referral** | Copy link, WhatsApp share, 7% Tier 1 + 3% Tier 2 |
| **Wallet Login** | MetaMask/Trust Wallet nonce-based auth |

---

## Admin Features

| Feature | Description |
|---------|------------|
| **Dashboard** | Financial charts, summary stats |
| **Users** | Search, block, edit balance, wallet linking |
| **Transactions** | Approve/reject with receipt viewing |
| **Investments** | View all (pooled, active, completed) |
| **Plans** | CRUD Plans → Slots → Lots with pool targets |
| **KYC** | Review with CNIC image viewing |
| **ROI** | Set daily ROI % |
| **Tasks** | Create, review, approve rewards |
| **Competitions** | Create/manage with targets |
| **Blog** | Categories and posts CRUD |
| **CSV** | Export/import all 19 tables |
| **Notifications** | System announcements |
| **Gateways** | Payment methods CRUD |
| **Crypto** | Monitor all crypto deposits |
| **Referrals** | Track relationships and commissions |
| **Site Settings** | Logo, favicon, name, Binance/OKX toggles |

---

## Security Architecture

### Frontend Security
| Layer | Protection |
|-------|-----------|
| Dev Tools Blocking | F12, Ctrl+Shift+I/J/C, right-click disabled |
| Size Detection | Monitors window size, hides page if DevTools detected |
| Console Watermark | Warns users about scams |
| Input Sanitization | Strip HTML/JS from all inputs |

### Backend Security
| Layer | Protection |
|-------|-----------|
| Transport | HTTPS, Helmet (CSP, HSTS, X-Frame-Options) |
| Auth | httpOnly + secure + sameSite:strict JWT cookies |
| CSRF | X-CSRF-Token header validation |
| Rate Limiting | Global: 200/15min, Login: 10/15min, Register: 5/hour |
| Input Sanitization | Strip `<script>`, event handlers, `javascript:`, `eval()` |
| SQL Injection | Parameterized queries + runtime pattern detection |
| Path Traversal | Block `../` and encoded variants |
| Honeypot | Hidden field traps for bots |
| VPN Detection | Proxy header analysis, blocks VPN connections |
| Error Masking | Global handler hides DB details |
| Body Limits | Per-route size limits |
| Password Hashing | Bcrypt 12 rounds |

### Database Security
| Layer | Protection |
|-------|-----------|
| Queries | Parameterized only ($1, $2, $3) |
| User | Restricted (no superuser) |
| SSL | Optional (DB_SSL env var) |
| Timeout | 30s statement timeout |
| Constraints | CHECK constraints on all tables |

---

## Cron Jobs

| Schedule | Job | Description |
|----------|-----|-------------|
| Every hour | `distributeProfits()` | Credits daily ROI to all active investments |
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
# Backend auto-migrates all 19 tables on startup
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

*Kepler432B — Complete Architecture & Features Document v3.0*
