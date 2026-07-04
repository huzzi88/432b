// ═══════════════════════════════════════════════
// WEB3 ON-CHAIN VERIFICATION
// Verifies ERC-20 transfers via RPC node queries
// NEVER trusts frontend — independently checks blockchain
// ═══════════════════════════════════════════════
import dotenv from 'dotenv';
dotenv.config();

// RPC endpoints per chain
const RPC_URLS: Record<string, string> = {
  bsc: process.env.RPC_BSC || 'https://bsc-dataseed1.binance.org',
  eth: process.env.RPC_ETH || 'https://eth.llamarpc.com',
  polygon: process.env.RPC_POLYGON || 'https://polygon-rpc.com',
  arbitrum: process.env.RPC_ARBITRUM || 'https://arb1.arbitrum.io/rpc',
  base: process.env.RPC_BASE || 'https://mainnet.base.org',
};

// Known stablecoin contract addresses per chain
const TOKEN_CONTRACTS: Record<string, Record<string, string>> = {
  bsc: {
    USDT: (process.env.USDT_BSC || '0x55d398326f99059fF775485246999027B3197955').toLowerCase(),
    USDC: (process.env.USDC_BSC || '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d').toLowerCase(),
  },
  eth: {
    USDT: (process.env.USDT_ETH || '0xdAC17F958D2ee523a2206206994597C13D831ec7').toLowerCase(),
    USDC: (process.env.USDC_ETH || '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48').toLowerCase(),
  },
  polygon: {
    USDT: (process.env.USDT_POLYGON || '0xc2132D05D31c914a87C6611C10748AEb04B58e8F').toLowerCase(),
    USDC: (process.env.USDC_POLYGON || '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359').toLowerCase(),
  },
};

// ERC-20 Transfer event signature: Transfer(address,address,uint256)
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

// Master wallet address — deposits must go TO this address
const MASTER_WALLET = (process.env.MASTER_WALLET_ADDRESS || '').toLowerCase();

interface VerificationResult {
  success: boolean;
  error?: string;
  fromAddress?: string;
  toAddress?: string;
  amount?: number;
  tokenSymbol?: string;
  tokenAddress?: string;
  blockNumber?: number;
  confirmations?: number;
}

// JSON-RPC call helper
async function rpcCall(rpcUrl: string, method: string, params: any[]): Promise<any> {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const data: any = await response.json();
  if (data.error) throw new Error(data.error.message || 'RPC error');
  return data.result;
}

// Get current block number
async function getBlockNumber(chain: string): Promise<number> {
  const rpcUrl = RPC_URLS[chain];
  if (!rpcUrl) throw new Error(`Unsupported chain: ${chain}`);
  const hex = await rpcCall(rpcUrl, 'eth_blockNumber', []);
  return parseInt(hex, 16);
}

// Get transaction receipt
async function getTransactionReceipt(chain: string, txHash: string): Promise<any> {
  const rpcUrl = RPC_URLS[chain];
  if (!rpcUrl) throw new Error(`Unsupported chain: ${chain}`);
  return await rpcCall(rpcUrl, 'eth_getTransactionReceipt', [txHash]);
}

// Main verification function
export async function verifyWeb3Transaction(
  chain: string,
  txHash: string,
  expectedAmountUSD: number,
  expectedTokenSymbol: string
): Promise<VerificationResult> {
  try {
    if (!MASTER_WALLET) {
      return { success: false, error: 'MASTER_WALLET_ADDRESS not configured in .env' };
    }

    if (!RPC_URLS[chain]) {
      return { success: false, error: `Chain ${chain} not supported` };
    }

    // 1. Get transaction receipt from blockchain
    const receipt = await getTransactionReceipt(chain, txHash);
    if (!receipt) {
      return { success: false, error: 'Transaction not found on chain. It may still be pending.' };
    }

    // 2. Check transaction succeeded
    if (receipt.status !== '0x1') {
      return { success: false, error: 'Transaction failed on-chain (reverted)' };
    }

    // 3. Check block confirmations
    const currentBlock = await getBlockNumber(chain);
    const txBlock = parseInt(receipt.blockNumber, 16);
    const confirmations = currentBlock - txBlock;

    if (confirmations < 3) {
      return { success: false, error: `Only ${confirmations} confirmations. Need 3+.` };
    }

    // 4. Parse Transfer event logs to find the ERC-20 transfer
    let transferFound = false;
    let fromAddress = '';
    let toAddress = '';
    let transferAmount = 0;
    let tokenAddress = '';

    for (const log of receipt.logs || []) {
      if (log.topics?.[0] === TRANSFER_TOPIC && log.topics.length >= 3) {
        // Decode addresses from topics (padded to 32 bytes)
        const from = '0x' + log.topics[1].slice(26).toLowerCase();
        const to = '0x' + log.topics[2].slice(26).toLowerCase();
        const contractAddr = log.address.toLowerCase();

        // Check if transfer is TO our master wallet
        if (to === MASTER_WALLET) {
          fromAddress = from;
          toAddress = to;
          tokenAddress = contractAddr;

          // Decode amount from data (uint256)
          const rawAmount = BigInt(log.data);
          // Most stablecoins use 18 decimals (BSC USDT) or 6 decimals (ETH USDT)
          const knownTokens = TOKEN_CONTRACTS[chain] || {};
          let decimals = 18;
          
          // ETH USDT/USDC use 6 decimals
          if (chain === 'eth' || chain === 'polygon') {
            if (contractAddr === knownTokens.USDT || contractAddr === knownTokens.USDC) {
              decimals = 6;
            }
          }

          transferAmount = Number(rawAmount) / Math.pow(10, decimals);
          transferFound = true;
          break;
        }
      }
    }

    // 5. If no ERC-20 Transfer found, check if it's a native token transfer (BNB/ETH)
    if (!transferFound) {
      // Get the actual transaction (not just receipt)
      const tx = await rpcCall(RPC_URLS[chain], 'eth_getTransactionByHash', [txHash]);
      if (tx && tx.to?.toLowerCase() === MASTER_WALLET) {
        fromAddress = tx.from.toLowerCase();
        toAddress = tx.to.toLowerCase();
        transferAmount = parseInt(tx.value, 16) / 1e18;
        transferFound = true;
      }
    }

    if (!transferFound) {
      return { success: false, error: 'No transfer to master wallet found in this transaction' };
    }

    // 6. Verify token contract (if known)
    const knownTokens = TOKEN_CONTRACTS[chain] || {};
    let detectedSymbol = 'UNKNOWN';
    if (tokenAddress) {
      for (const [sym, addr] of Object.entries(knownTokens)) {
        if (addr === tokenAddress) { detectedSymbol = sym; break; }
      }
    } else {
      // Native token
      detectedSymbol = chain === 'bsc' ? 'BNB' : chain === 'polygon' ? 'MATIC' : 'ETH';
    }

    // 7. Amount tolerance check (allow 1% difference for gas/fees)
    const tolerance = expectedAmountUSD * 0.01;
    if (Math.abs(transferAmount - expectedAmountUSD) > tolerance) {
      return {
        success: false,
        error: `Amount mismatch: expected $${expectedAmountUSD}, received $${transferAmount.toFixed(6)}`,
        amount: transferAmount,
        fromAddress,
        toAddress,
        tokenSymbol: detectedSymbol,
        confirmations,
      };
    }

    return {
      success: true,
      fromAddress,
      toAddress,
      amount: transferAmount,
      tokenSymbol: detectedSymbol,
      tokenAddress: tokenAddress || undefined,
      blockNumber: txBlock,
      confirmations,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Verification failed' };
  }
}
