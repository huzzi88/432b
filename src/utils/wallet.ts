// ═══════════════════════════════════════════════
// KEPLER432B — Wallet Utilities (ethers.js minimal)
// ═══════════════════════════════════════════════

export const SUPPORTED_CHAINS = [
  { id: 'bsc', name: 'BSC (BNB Chain)', symbol: 'BNB', chainId: 56, explorer: 'https://bscscan.com/tx/' },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', chainId: 1, explorer: 'https://etherscan.io/tx/' },
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC', chainId: 137, explorer: 'https://polygonscan.com/tx/' },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB', chainId: 42161, explorer: 'https://arbiscan.io/tx/' },
  { id: 'tron', name: 'Tron (TRC20)', symbol: 'TRX', chainId: null, explorer: 'https://tronscan.org/#/transaction/' },
  { id: 'base', name: 'Base', symbol: 'ETH', chainId: 8453, explorer: 'https://basescan.org/tx/' },
];

export type ChainId = typeof SUPPORTED_CHAINS[number]['id'];

export const getChainById = (id: string) => SUPPORTED_CHAINS.find(c => c.id === id) || SUPPORTED_CHAINS[0];

// Check if browser wallet (MetaMask/Trust/WalletConnect) is available
export const isWalletAvailable = (): boolean =>
  typeof window !== 'undefined' && !!(window as any).ethereum;

// Get wallet address from browser extension
export const getWalletAddress = async (): Promise<string> => {
  if (!isWalletAvailable()) throw new Error('No crypto wallet found. Install MetaMask or Trust Wallet.');
  const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
  if (!accounts?.length) throw new Error('No accounts found');
  return accounts[0];
};

// Get current chain ID from wallet
export const getChainId = async (): Promise<number | null> => {
  if (!isWalletAvailable()) return null;
  try {
    const hex = await (window as any).ethereum.request({ method: 'eth_chainId' });
    return parseInt(hex, 16);
  } catch { return null; }
};

// Sign a message for wallet-based authentication
export const signMessage = async (address: string, message: string): Promise<string> => {
  if (!isWalletAvailable()) throw new Error('Wallet not available');
  return await (window as any).ethereum.request({
    method: 'personal_sign',
    params: [message, address],
  });
};

// Generate a random nonce for wallet auth
export const generateNonce = (): string =>
  Math.random().toString(36).substring(2) + Date.now().toString(36);
