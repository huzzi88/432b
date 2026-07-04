// ═══════════════════════════════════════════════
// WALLET CONNECT — Login / Register / Link
//
// FLOW:
// 1. Connect wallet → get nonce
// 2. If wallet exists → sign → login (no form needed)
// 3. If wallet new → show email + PIN form:
//    a. New email → creates new account
//    b. Existing email → LINKS wallet to that account (verifies PIN)
// ═══════════════════════════════════════════════
import React, { useState } from 'react';
import { getWalletAddress, signMessage, isWalletAvailable, SUPPORTED_CHAINS } from '../utils/wallet';
import { api, setToken } from '../utils/api';

interface Props {
  onSuccess: () => void;
  onSwitchToEmail: () => void;
}

export const WalletConnect: React.FC<Props> = ({ onSuccess, onSwitchToEmail }) => {
  const [step, setStep] = useState<'idle'|'register'|'signing'|'done'>('idle');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [nonce, setNonce] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const handleConnect = async () => {
    setError(''); setSuccess('');
    if (!isWalletAvailable()) {
      setError('No wallet found. Install MetaMask or Trust Wallet.');
      return;
    }

    try {
      const address = await getWalletAddress();
      setWalletAddress(address);

      const { nonce: n, exists } = await api.getWalletNonce(address);
      setNonce(n);

      if (exists) {
        // Wallet already linked → sign and login directly
        setStep('signing');
        const signature = await signMessage(address, `Kepler432B login nonce: ${n}`);
        const result = await api.walletLogin(address, signature, n);
        if (result.token) {
          setToken(result.token);
          setStep('done');
          setSuccess('✅ Wallet login successful!');
          setTimeout(onSuccess, 1000);
        }
      } else {
        // New wallet → show registration/linking form
        setStep('register');
      }
    } catch (err: any) {
      setError(err.message || 'Connection failed');
      setStep('idle');
    }
  };

  const handleRegister = async () => {
    setError('');
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Valid email address required');
      return;
    }
    if (!pin || !/^\d{4}$/.test(pin)) {
      setError('4-digit PIN required');
      return;
    }

    try {
      setStep('signing');
      const signature = await signMessage(walletAddress, `Kepler432B register nonce: ${nonce}`);
      const result = await api.walletLogin(walletAddress, signature, nonce, email, name || undefined, pin, referralCode || undefined);

      if (result.token) {
        setToken(result.token);
        setStep('done');
        setSuccess(result.linked ? '✅ Wallet linked to your existing account!' : '✅ Account created & logged in!');
        setTimeout(onSuccess, 1000);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      setStep('register');
    }
  };

  return (
    <div className="bg-black border border-purple-400/40 rounded-lg p-4 space-y-3">
      <h3 className="text-purple-400 font-bold text-center">🔗 Connect Wallet</h3>

      {step === 'idle' && (
        <>
          <p className="text-gray-400 text-xs text-center">MetaMask, Trust Wallet, or any Web3 wallet</p>
          <div className="grid grid-cols-3 gap-1">
            {SUPPORTED_CHAINS.filter(c=>c.chainId).map(c => (
              <span key={c.id} className="bg-gray-900 border border-gray-700 rounded px-1 py-0.5 text-center text-xs text-gray-500 truncate">{c.symbol}</span>
            ))}
          </div>
          {error && <div className="bg-red-500/20 border border-red-400 rounded text-red-400 p-2 text-sm">{error}</div>}
          <button onClick={handleConnect} className="w-full font-bold border border-purple-400 rounded py-2.5 uppercase tracking-wide bg-purple-400 text-black hover:bg-purple-300 cursor-pointer">
            🔗 Connect Wallet
          </button>
          {!isWalletAvailable() && (
            <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 text-xs underline block text-center">Install MetaMask →</a>
          )}
        </>
      )}

      {step === 'register' && (
        <div className="space-y-2">
          <div className="bg-gray-900 border border-cyan-400/40 rounded p-2 text-center">
            <p className="text-gray-400 text-xs">Connected:</p>
            <p className="text-white font-mono text-xs break-all">{walletAddress}</p>
          </div>
          <p className="text-yellow-400 text-xs font-bold text-center">Enter your email & PIN</p>
          <p className="text-gray-500 text-xs text-center">Already have an account? Enter your existing email & PIN to link this wallet.</p>
          {error && <div className="bg-red-500/20 border border-red-400 rounded text-red-400 p-2 text-sm">{error}</div>}
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address *" className="w-full bg-black border border-cyan-400/60 rounded text-white px-3 py-2 font-mono text-sm"/>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Display name (optional)" className="w-full bg-black border border-gray-600 rounded text-white px-3 py-2 font-mono text-sm"/>
          <input value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="4-digit PIN *" maxLength={4} className="w-full bg-black border border-yellow-400/60 rounded text-white px-3 py-2 font-mono text-sm"/>
          <input value={referralCode} onChange={e=>setReferralCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,10))} placeholder="Referral code (optional)" className="w-full bg-black border border-gray-600 rounded text-white px-3 py-2 font-mono text-sm"/>
          <button onClick={handleRegister} className="w-full font-bold border border-green-400 rounded py-2.5 uppercase tracking-wide bg-green-400 text-black hover:bg-green-300 cursor-pointer">
            ✅ Continue
          </button>
        </div>
      )}

      {step === 'signing' && (
        <div className="text-center py-4">
          <p className="text-purple-400 text-lg animate-pulse">✍️ Sign in your wallet...</p>
          <p className="text-gray-500 text-xs mt-2">Check your wallet for the signature request</p>
        </div>
      )}

      {step === 'done' && (
        <div className="text-center py-4">
          <p className="text-green-400 text-lg font-bold">{success}</p>
        </div>
      )}

      <button onClick={onSwitchToEmail} className="text-pink-400 text-xs underline hover:text-cyan-400 w-full text-center cursor-pointer">
        Use email/password instead
      </button>
    </div>
  );
};
