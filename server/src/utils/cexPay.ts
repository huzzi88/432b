// ═══════════════════════════════════════════════
// CEX PAY — Binance Pay & OKX Pay API Clients
// Creates payment orders + verifies webhook signatures
// ═══════════════════════════════════════════════
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

// ─── BINANCE PAY ─────────────────────────────────

interface BinanceOrderResult {
  success: boolean;
  orderId?: string;
  checkoutUrl?: string;
  qrCode?: string;
  error?: string;
}

export async function createBinancePayOrder(
  amount: number,
  currency: string,
  orderId: string,
  description: string
): Promise<BinanceOrderResult> {
  const apiKey = process.env.BINANCE_PAY_API_KEY;
  const secret = process.env.BINANCE_PAY_SECRET;
  const merchantId = process.env.BINANCE_PAY_MERCHANT_ID;

  if (!apiKey || !secret || !merchantId) {
    return { success: false, error: 'Binance Pay not configured. Set BINANCE_PAY_API_KEY, BINANCE_PAY_SECRET, BINANCE_PAY_MERCHANT_ID in .env' };
  }

  try {
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(16).toString('hex');
    const body = {
      env: { terminalType: 'WEB' },
      merchantTradeNo: orderId,
      orderAmount: amount.toFixed(2),
      currency: currency.toUpperCase(),
      description,
      goodsType: '02', // virtual goods
    };

    const payload = `${timestamp}\n${nonce}\n${JSON.stringify(body)}\n`;
    const signature = crypto.createHmac('sha512', secret).update(payload).digest('hex').toUpperCase();

    const response = await fetch('https://bpay.binanceapi.com/binancepay/openapi/v2/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'BinancePay-Timestamp': String(timestamp),
        'BinancePay-Nonce': nonce,
        'BinancePay-Certificate-SN': apiKey,
        'BinancePay-Signature': signature,
      },
      body: JSON.stringify(body),
    });

    const data: any = await response.json();

    if (data.status === 'SUCCESS' && data.data) {
      return {
        success: true,
        orderId: data.data.prepayId || orderId,
        checkoutUrl: data.data.checkoutUrl || data.data.universalUrl,
        qrCode: data.data.qrcodeLink,
      };
    }

    return { success: false, error: data.errorMessage || 'Binance Pay order failed' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Binance Pay API error' };
  }
}

export function verifyBinanceWebhookSignature(
  timestamp: string,
  nonce: string,
  body: string,
  signature: string
): boolean {
  const secret = process.env.BINANCE_PAY_SECRET;
  if (!secret) return false;

  const payload = `${timestamp}\n${nonce}\n${body}\n`;
  const expected = crypto.createHmac('sha512', secret).update(payload).digest('hex').toUpperCase();
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// ─── OKX PAY ─────────────────────────────────────

interface OKXOrderResult {
  success: boolean;
  orderId?: string;
  checkoutUrl?: string;
  error?: string;
}

export async function createOKXPayOrder(
  amount: number,
  currency: string,
  orderId: string,
  description: string
): Promise<OKXOrderResult> {
  const apiKey = process.env.OKX_PAY_API_KEY;
  const secret = process.env.OKX_PAY_SECRET;
  const passphrase = process.env.OKX_PAY_PASSPHRASE;

  if (!apiKey || !secret || !passphrase) {
    return { success: false, error: 'OKX Pay not configured. Set OKX_PAY_API_KEY, OKX_PAY_SECRET, OKX_PAY_PASSPHRASE in .env' };
  }

  try {
    const timestamp = new Date().toISOString();
    const body = {
      merchantOrderNo: orderId,
      orderAmount: amount.toFixed(2),
      currency: currency.toUpperCase(),
      orderDescription: description,
      paymentType: 'WEB',
    };

    const preSign = `${timestamp}POST/api/v1/payment/create-order${JSON.stringify(body)}`;
    const signature = crypto.createHmac('sha256', secret).update(preSign).digest('base64');

    const response = await fetch('https://www.okx.com/api/v1/payment/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'OK-ACCESS-KEY': apiKey,
        'OK-ACCESS-SIGN': signature,
        'OK-ACCESS-TIMESTAMP': timestamp,
        'OK-ACCESS-PASSPHRASE': passphrase,
      },
      body: JSON.stringify(body),
    });

    const data: any = await response.json();

    if (data.code === '0' && data.data) {
      return {
        success: true,
        orderId: data.data.orderId || orderId,
        checkoutUrl: data.data.paymentUrl || data.data.checkoutUrl,
      };
    }

    return { success: false, error: data.msg || 'OKX Pay order failed' };
  } catch (err: any) {
    return { success: false, error: err.message || 'OKX Pay API error' };
  }
}

export function verifyOKXWebhookSignature(
  timestamp: string,
  body: string,
  signature: string
): boolean {
  const secret = process.env.OKX_PAY_SECRET;
  if (!secret) return false;

  const preSign = `${timestamp}${body}`;
  const expected = crypto.createHmac('sha256', secret).update(preSign).digest('base64');
  return expected === signature;
}
