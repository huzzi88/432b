// ═══════════════════════════════════════════════
// CRYPTO DEPOSIT — CEX Pay + Web3 Wallet
// ═══════════════════════════════════════════════
import React, { useState } from 'react';
import { RetroButton } from './RetroButton';
import { RetroInput } from './RetroInput';
import { api } from '../utils/api';
import { isWalletAvailable, getWalletAddress, SUPPORTED_CHAINS } from '../utils/wallet';

interface CryptoDepositProps {
  masterWallet?: string;
  onSuccess: () => void;
}

export const CryptoDeposit: React.FC<CryptoDepositProps> = ({ masterWallet, onSuccess }) => {
  const [method, setMethod] = useState<'web3'|'binance'|'okx'|null>(null);
  const [amount, setAmount] = useState('');
  const [settings, setSettings] = useState<any>({});

  // Load settings to check if Binance/OKX are enabled
  React.useEffect(() => {
    (async () => {
      try { const r = await fetch('/api/settings', { credentials: 'include' }); const s = await r.json(); setSettings(s); } catch {}
    })();
  }, []);

  const binanceEnabled = settings.binance_pay_enabled === 'true';
  const okxEnabled = settings.okx_pay_enabled === 'true';
  const [chain, setChain] = useState('bsc');
  const [token, setToken] = useState('USDT');
  const [txHash, setTxHash] = useState('');
  const [msg, setMsg] = useState('');
  const [ld, setLd] = useState(false);
  const [walletAddr, setWalletAddr] = useState('');

  const connectWallet = async () => {
    try { const addr = await getWalletAddress(); setWalletAddr(addr); }
    catch (e: any) { setMsg(e.message); }
  };

  const submitWeb3 = async () => {
    if (!txHash.trim()) { setMsg('Enter the transaction hash from your wallet'); return; }
    const a = parseFloat(amount);
    if (isNaN(a) || a <= 0) { setMsg('Invalid amount'); return; }
    setLd(true); setMsg('');
    try {
      const r = await api.submitWeb3Deposit(txHash.trim(), chain, a, token);
      setMsg(`✅ ${r.message}`);
      if (r.status === 'credited') onSuccess();
      setTxHash(''); setAmount('');
    } catch (e: any) { setMsg(e.message); }
    finally { setLd(false); }
  };

  const submitBinancePay = async () => {
    const a = parseFloat(amount);
    if (isNaN(a) || a <= 0) { setMsg('Invalid amount'); return; }
    setLd(true); setMsg('');
    try {
      const r = await api.createBinancePayOrder(a, token);
      if (r.checkoutUrl) { window.open(r.checkoutUrl, '_blank'); setMsg('✅ Binance Pay opened. Complete payment in Binance app.'); }
      else setMsg(r.error || 'Failed to create order');
    } catch (e: any) { setMsg(e.message); }
    finally { setLd(false); }
  };

  const submitOKXPay = async () => {
    const a = parseFloat(amount);
    if (isNaN(a) || a <= 0) { setMsg('Invalid amount'); return; }
    setLd(true); setMsg('');
    try {
      const r = await api.createOKXPayOrder(a, token);
      if (r.checkoutUrl) { window.open(r.checkoutUrl, '_blank'); setMsg('✅ OKX Pay opened. Complete payment in OKX app.'); }
      else setMsg(r.error || 'Failed to create order');
    } catch (e: any) { setMsg(e.message); }
    finally { setLd(false); }
  };

  const chainInfo = SUPPORTED_CHAINS.find(c => c.id === chain);

  return (
    <div className="space-y-3">
      {msg && <div className={`p-2 font-bold border text-sm rounded ${msg.includes('✅')?'bg-green-500/20 border-green-400 text-green-400':'bg-red-500/20 border-red-400 text-red-400'}`}>{msg}</div>}

      {/* Method Selection */}
      <div className="grid grid-cols-3 gap-2">
        <button onClick={()=>setMethod('web3')} className={`p-3 border rounded text-center cursor-pointer ${method==='web3'?'border-cyan-400 bg-cyan-400/10':'border-gray-700 bg-black'}`}>
          <p className="text-lg">🦊</p><p className="text-white text-xs font-bold">Web3 Wallet</p><p className="text-gray-500 text-xs">MetaMask/Trust</p>
        </button>
        {binanceEnabled && (
          <button onClick={()=>setMethod('binance')} className={`p-3 border rounded text-center cursor-pointer ${method==='binance'?'border-yellow-400 bg-yellow-400/10':'border-gray-700 bg-black'}`}>
            <p className="text-lg">🟡</p><p className="text-white text-xs font-bold">Binance Pay</p><p className="text-gray-500 text-xs">Scan QR</p>
          </button>
        )}
        {okxEnabled && (
          <button onClick={()=>setMethod('okx')} className={`p-3 border rounded text-center cursor-pointer ${method==='okx'?'border-purple-400 bg-purple-400/10':'border-gray-700 bg-black'}`}>
            <p className="text-lg">⚫</p><p className="text-white text-xs font-bold">OKX Pay</p><p className="text-gray-500 text-xs">OKX App</p>
          </button>
        )}
      </div>

      {/* Amount + Token */}
      {method && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <RetroInput label="Amount ($)" type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="100"/>
            <div>
              <label className="block text-cyan-400 font-bold mb-1.5 uppercase tracking-wider text-xs">Token</label>
              <select value={token} onChange={e=>setToken(e.target.value)} className="w-full bg-black border border-cyan-400/60 rounded text-white px-3 py-1.5 font-mono text-sm">
                <option value="USDT">USDT</option><option value="USDC">USDC</option><option value="BNB">BNB</option><option value="ETH">ETH</option>
              </select>
            </div>
          </div>
        </>
      )}

      {/* Web3 Wallet Flow */}
      {method === 'web3' && (
        <div className="space-y-3">
          <div>
            <label className="block text-cyan-400 font-bold mb-1.5 uppercase tracking-wider text-xs">Network</label>
            <select value={chain} onChange={e=>setChain(e.target.value)} className="w-full bg-black border border-cyan-400/60 rounded text-white px-3 py-1.5 font-mono text-sm">
              {SUPPORTED_CHAINS.filter(c=>c.chainId).map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.symbol})</option>
              ))}
            </select>
          </div>

          {masterWallet && (
            <div className="bg-yellow-900/30 border border-yellow-400/40 p-3 rounded">
              <p className="text-yellow-400 font-bold text-xs mb-1">📤 Send {token} to this address on {chainInfo?.name}:</p>
              <p className="text-white font-mono text-xs break-all bg-black border border-yellow-400/40 p-2 rounded select-all">{masterWallet}</p>
              <p className="text-red-400 text-xs mt-1">⚠️ Send exact amount on correct network. Wrong network = lost funds.</p>
            </div>
          )}

          {isWalletAvailable() && !walletAddr && (
            <RetroButton variant="secondary" className="w-full" onClick={connectWallet}>🦊 Connect Wallet</RetroButton>
          )}
          {walletAddr && <p className="text-cyan-400 text-xs font-mono truncate">Connected: {walletAddr}</p>}

          <RetroInput label="Transaction Hash (TxID) *" value={txHash} onChange={e=>setTxHash(e.target.value)} placeholder="0x... paste your tx hash after sending"/>

          <RetroButton variant="success" size="lg" className="w-full" onClick={submitWeb3} disabled={ld}>
            {ld ? '⏳ Verifying on-chain...' : '✅ Submit & Verify Deposit'}
          </RetroButton>
          <p className="text-gray-500 text-xs">Backend independently verifies your transaction on the blockchain. If not instantly confirmed, it retries automatically every 2 minutes.</p>
        </div>
      )}

      {/* Binance Pay Flow */}
      {method === 'binance' && (
        <div className="space-y-3">
          <div className="bg-yellow-900/30 border border-yellow-400/40 p-3 rounded">
            <p className="text-yellow-400 text-xs font-bold">🟡 Binance Pay</p>
            <p className="text-gray-400 text-xs">You'll be redirected to Binance Pay. Scan QR code or pay in Binance app. Balance updates automatically via webhook.</p>
          </div>
          <RetroButton variant="warning" size="lg" className="w-full" onClick={submitBinancePay} disabled={ld}>
            {ld ? '⏳ Creating order...' : '🟡 Pay with Binance'}
          </RetroButton>
        </div>
      )}

      {/* OKX Pay Flow */}
      {method === 'okx' && (
        <div className="space-y-3">
          <div className="bg-purple-900/30 border border-purple-400/40 p-3 rounded">
            <p className="text-purple-400 text-xs font-bold">⚫ OKX Pay</p>
            <p className="text-gray-400 text-xs">You'll be redirected to OKX Pay. Complete payment in OKX app. Balance updates automatically.</p>
          </div>
          <RetroButton variant="secondary" size="lg" className="w-full" onClick={submitOKXPay} disabled={ld}>
            {ld ? '⏳ Creating order...' : '⚫ Pay with OKX'}
          </RetroButton>
        </div>
      )}
    </div>
  );
};
