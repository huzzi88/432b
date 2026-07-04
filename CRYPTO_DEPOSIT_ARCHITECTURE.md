# 🔐 KEPLER432B — Automated Crypto Deposit System Architecture

## Overview

Two deposit workflows:
1. **CEX Pay (Binance Pay / OKX Pay)** — User pays via exchange checkout, webhook confirms
2. **Web3 Wallet (MetaMask/Trust/WalletConnect)** — User sends on-chain, backend verifies via RPC

---

## 📊 Database Schema Addition

```sql
-- New table for tracking crypto deposit verification
CREATE TABLE IF NOT EXISTS crypto_deposits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Deposit method
  method VARCHAR(20) NOT NULL, -- 'binance_pay', 'okx_pay', 'web3_wallet'
  
  -- Order info (CEX)
  cex_order_id VARCHAR(255),       -- Binance/OKX order ID
  cex_checkout_url TEXT,           -- Payment URL for user
  cex_qr_code TEXT,               -- QR code data
  
  -- On-chain info (Web3)
  chain VARCHAR(50),               -- 'bsc', 'eth', 'polygon', 'tron'
  tx_hash VARCHAR(255),            -- Transaction hash
  from_address VARCHAR(255),       -- Sender wallet
  to_address VARCHAR(255),         -- Our master wallet (must match env)
  token_address VARCHAR(255),      -- USDT/USDC contract address
  token_symbol VARCHAR(20),        -- 'USDT', 'USDC', 'BNB'
  
  -- Amount
  amount_expected DECIMAL(18,6) NOT NULL,
  amount_received DECIMAL(18,6),
  amount_usd DECIMAL(18,2),
  
  -- Verification
  verification_status VARCHAR(20) DEFAULT 'pending',
  -- pending → verifying → confirmed → credited → failed → expired
  verification_attempts INT DEFAULT 0,
  verification_error TEXT,
  block_confirmations INT DEFAULT 0,
  required_confirmations INT DEFAULT 3,
  
  -- Webhook data (CEX)
  webhook_payload JSONB,
  webhook_signature TEXT,
  webhook_verified BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  credited_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_crypto_dep_user ON crypto_deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_dep_status ON crypto_deposits(verification_status);
CREATE INDEX IF NOT EXISTS idx_crypto_dep_txhash ON crypto_deposits(tx_hash);
CREATE INDEX IF NOT EXISTS idx_crypto_dep_order ON crypto_deposits(cex_order_id);
```

---

## 🔄 Flow Diagrams

### Flow 1: Binance Pay

```
User clicks "Deposit via Binance Pay"
  → Frontend sends POST /api/crypto-deposit/binance/create-order
    { amount: 100, currency: 'USDT' }
  → Backend:
    1. Creates order via Binance Pay API
    2. Stores in crypto_deposits (status: 'pending')
    3. Returns { checkoutUrl, qrCode, orderId }
  → Frontend redirects user to Binance Pay checkout
  → User pays in Binance app
  → Binance sends webhook POST /api/crypto-deposit/binance/webhook
    { orderId, status: 'PAID', signature: '...' }
  → Backend:
    1. Verifies HMAC-SHA512 signature using BINANCE_PAY_SECRET
    2. Matches orderId to crypto_deposits record
    3. Verifies amount matches
    4. Updates status: 'confirmed' → 'credited'
    5. Adds amount to user balance
    6. Creates approved transaction record
```

### Flow 2: OKX Pay

```
Same as Binance Pay but with OKX API:
  → POST /api/crypto-deposit/okx/create-order
  → OKX webhook: POST /api/crypto-deposit/okx/webhook
  → Signature verification: HMAC-SHA256 with OKX_PAY_SECRET
```

### Flow 3: Web3 Wallet (MetaMask/Trust)

```
User clicks "Deposit via Wallet"
  → Frontend connects MetaMask via window.ethereum
  → User selects chain (BSC/Polygon) and token (USDT/USDC)
  → Frontend shows master wallet address from gateway config
  → User sends ERC-20 transfer in MetaMask
  → User copies TxHash after confirmation
  → Frontend sends POST /api/crypto-deposit/web3/submit-tx
    { txHash: '0x...', chain: 'bsc', amount: 100, tokenSymbol: 'USDT' }
  → Backend:
    1. Stores in crypto_deposits (status: 'verifying')
    2. Queries RPC node to get transaction receipt
    3. Verifies:
       a. Transaction exists and is confirmed (3+ blocks)
       b. to_address matches our MASTER_WALLET from .env
       c. Transfer amount matches (decode ERC-20 Transfer event log)
       d. Token contract address matches known USDT/USDC
    4. If all pass → status: 'confirmed' → 'credited'
    5. Credits user balance
  → Cron job retries unverified transactions every 2 minutes
```

---

## 🔑 Environment Variables Required

```env
# Master wallet address (deposits must go TO this address)
MASTER_WALLET_ADDRESS=0xYOUR_WALLET_ADDRESS

# Binance Pay
BINANCE_PAY_API_KEY=your_binance_pay_api_key
BINANCE_PAY_SECRET=your_binance_pay_secret
BINANCE_PAY_MERCHANT_ID=your_merchant_id

# OKX Pay  
OKX_PAY_API_KEY=your_okx_api_key
OKX_PAY_SECRET=your_okx_secret
OKX_PAY_PASSPHRASE=your_okx_passphrase

# RPC Endpoints (for on-chain verification)
RPC_BSC=https://bsc-dataseed1.binance.org
RPC_ETH=https://eth.llamarpc.com
RPC_POLYGON=https://polygon-rpc.com
RPC_ARBITRUM=https://arb1.arbitrum.io/rpc
RPC_BASE=https://mainnet.base.org

# Known token contract addresses
USDT_BSC=0x55d398326f99059fF775485246999027B3197955
USDC_BSC=0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d
USDT_ETH=0xdAC17F958D2ee523a2206206994597C13D831ec7
USDC_ETH=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
USDT_POLYGON=0xc2132D05D31c914a87C6611C10748AEb04B58e8F
USDC_POLYGON=0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359
```

---

## 🔒 Security Measures

| Layer | Protection |
|-------|-----------|
| **CEX Webhooks** | HMAC signature verification — reject if signature doesn't match |
| **Web3 Verification** | Backend independently queries RPC — never trust frontend amount |
| **Double-spend** | Unique constraint on tx_hash — same txHash can't credit twice |
| **Amount tampering** | Backend compares on-chain amount vs user-claimed amount |
| **Address verification** | to_address must match MASTER_WALLET_ADDRESS from .env |
| **Token verification** | Contract address must match known USDT/USDC addresses |
| **Confirmation count** | Wait for 3+ block confirmations before crediting |
| **Timeout** | Orders expire after 30 minutes if unpaid |
| **Rate limiting** | Max 5 deposit requests per 15 minutes per user |
| **Idempotency** | Webhook handlers check if already processed before crediting |

---

## 📁 Files to Create

### Backend
- `server/src/routes/cryptoDeposit.ts` — Main route (create order, submit tx, webhooks)
- `server/src/utils/binancePay.ts` — Binance Pay API client
- `server/src/utils/okxPay.ts` — OKX Pay API client  
- `server/src/utils/web3Verify.ts` — On-chain transaction verification
- `server/src/jobs/verifyPendingDeposits.ts` — Cron job for retrying verification

### Frontend
- `src/components/CryptoDeposit.tsx` — Deposit UI with CEX + Web3 options
- Updated `src/pages/UserDashboard.tsx` — Integrate CryptoDeposit in deposit tab

### Database
- New `crypto_deposits` table (added to migration)

### Config
- Updated `.env.example` with all crypto keys

---

## 🚀 Implementation Priority

1. **Phase 1:** Web3 Wallet deposits (no API keys needed, just RPC)
2. **Phase 2:** Binance Pay integration (requires merchant account)
3. **Phase 3:** OKX Pay integration (requires merchant account)

*Each phase is independent and can be deployed separately.*
