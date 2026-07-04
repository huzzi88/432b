import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RetroCard } from '../components/RetroCard';
import { RetroInput } from '../components/RetroInput';
import { RetroButton } from '../components/RetroButton';
import { WalletConnect } from '../components/WalletConnect';

interface LoginProps { onRegisterClick: () => void; }

export const Login: React.FC<LoginProps> = ({ onRegisterClick }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showAdminPins, setShowAdminPins] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [adminPin1, setAdminPin1] = useState('');
  const [adminPin2, setAdminPin2] = useState('');
  const [adminPin3, setAdminPin3] = useState('');
  const [showAdminPin1, setShowAdminPin1] = useState(false);
  const [showAdminPin2, setShowAdminPin2] = useState(false);
  const [showAdminPin3, setShowAdminPin3] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotCnic, setForgotCnic] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [ld, setLd] = useState(false);
  const { login, verifyAdminPins, apiForgotPassword } = useApp();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLd(true);
    try {
      if (!email || !password || !loginPin) { setError('Fill all fields'); return; }
      const r = await login(email, password, loginPin);
      if (r.requireAdminPins) { setShowAdminPins(true); return; }
      if (!r.success) setError(r.error);
    } finally { setLd(false); }
  };

  const handleAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLd(true);
    try {
      if (!adminPin1 || !adminPin2 || !adminPin3) { setError('All 3 PINs required'); return; }
      const r = await verifyAdminPins(adminPin1, adminPin2, adminPin3);
      if (!r.success) { setError(r.error); setAdminPin1(''); setAdminPin2(''); setAdminPin3(''); }
    } finally { setLd(false); }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLd(true);
    try {
      const r = await apiForgotPassword(forgotEmail, forgotPhone || undefined, forgotCnic || undefined);
      if (r.success) {
        setSuccess(r.message || 'Password reset to 123456');
        setTimeout(() => { setShowForgot(false); setSuccess(''); }, 3000);
      } else setError(r.error || 'Failed');
    } catch (err: any) { setError(err.message); }
    finally { setLd(false); }
  };

  // Eye icon component
  const EyeIcon = ({ shown, onClick }: { shown: boolean; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 cursor-pointer z-10"
      tabIndex={-1}
    >
      {shown ? (
        // Eye open
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
        </svg>
      ) : (
        // Eye closed
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-cyan-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 mb-2 uppercase tracking-wider">Kepler432B</h1>
          <p className="text-cyan-400 text-lg font-bold uppercase tracking-wider">Investment Platform</p>
        </div>

        {showForgot ? (
          <RetroCard color="purple">
            <h2 className="text-2xl font-bold text-purple-400 mb-4 uppercase">Forgot Password</h2>
            <form onSubmit={handleForgot} className="space-y-3">
              <RetroInput label="Email *" type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="your@email.com" disabled={ld} />
              <p className="text-gray-400 text-xs">Enter phone OR CNIC (must match your profile):</p>
              <RetroInput label="Phone" value={forgotPhone} onChange={e => setForgotPhone(e.target.value)} placeholder="+92 3XX XXXXXXX" disabled={ld} />
              <RetroInput label="CNIC" value={forgotCnic} onChange={e => setForgotCnic(e.target.value)} placeholder="XXXXX-XXXXXXX-X" disabled={ld} />
              {error && <div className="bg-red-500 border-4 border-red-700 text-black p-2 font-bold text-sm">{error}</div>}
              {success && <div className="bg-green-500 border-4 border-green-700 text-black p-2 font-bold text-sm">{success}</div>}
              <RetroButton type="submit" variant="primary" size="lg" className="w-full" disabled={ld}>{ld ? '...' : 'Reset Password'}</RetroButton>
              <RetroButton type="button" variant="secondary" className="w-full" onClick={() => { setShowForgot(false); setError(''); setSuccess(''); }}>Back</RetroButton>
            </form>
          </RetroCard>
        ) : (
          <RetroCard color="cyan">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4 uppercase">
              {showAdminPins ? '🔐 Admin Verify' : 'Login'}
            </h2>

            {!showAdminPins ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <RetroInput label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" disabled={ld} />

                {/* Password with show/hide */}
                <div className="relative">
                  <RetroInput
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={ld}
                    className="!pr-10"
                  />
                  <EyeIcon shown={showPassword} onClick={() => setShowPassword(!showPassword)} />
                </div>

                {/* PIN with show/hide */}
                <div className="relative">
                  <RetroInput
                    label="Login PIN"
                    type={showPin ? 'text' : 'password'}
                    value={loginPin}
                    onChange={e => setLoginPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    maxLength={4}
                    disabled={ld}
                    className="!pr-10"
                  />
                  <EyeIcon shown={showPin} onClick={() => setShowPin(!showPin)} />
                </div>

                {error && <div className="bg-red-500 border-4 border-red-700 text-black p-2 font-bold text-sm">{error}</div>}

                <RetroButton type="submit" variant="primary" size="lg" className="w-full" disabled={ld}>
                  {ld ? '...' : 'Login'}
                </RetroButton>
                <RetroButton type="button" variant="secondary" className="w-full" onClick={onRegisterClick} disabled={ld}>
                  Create Account
                </RetroButton>

                <div className="text-center text-gray-500 text-xs my-2">— or —</div>
                <WalletConnect onSuccess={() => window.location.reload()} onSwitchToEmail={() => {}} />

                <button type="button" onClick={() => setShowForgot(true)} className="text-pink-400 text-sm underline hover:text-cyan-400 w-full text-center cursor-pointer mt-2">
                  Forgot Password?
                </button>
              </form>
            ) : (
              <form onSubmit={handleAdmin} className="space-y-4">
                <div className="bg-pink-400 border border-pink-600 rounded p-3">
                  <p className="text-black font-bold text-center text-sm">🔐 ADMIN 3-STEP VERIFICATION</p>
                  <p className="text-black text-xs text-center mt-1">Session expires in 5 minutes</p>
                </div>

                {/* Admin PIN 1 with show/hide */}
                <div className="relative">
                  <RetroInput
                    label="Admin PIN 1"
                    type={showAdminPin1 ? 'text' : 'password'}
                    value={adminPin1}
                    onChange={e => setAdminPin1(e.target.value)}
                    placeholder="••••••"
                    disabled={ld}
                    className="!pr-10"
                  />
                  <EyeIcon shown={showAdminPin1} onClick={() => setShowAdminPin1(!showAdminPin1)} />
                </div>

                {/* Admin PIN 2 with show/hide */}
                <div className="relative">
                  <RetroInput
                    label="Admin PIN 2"
                    type={showAdminPin2 ? 'text' : 'password'}
                    value={adminPin2}
                    onChange={e => setAdminPin2(e.target.value)}
                    placeholder="••••••"
                    disabled={ld}
                    className="!pr-10"
                  />
                  <EyeIcon shown={showAdminPin2} onClick={() => setShowAdminPin2(!showAdminPin2)} />
                </div>

                {/* Admin PIN 3 with show/hide */}
                <div className="relative">
                  <RetroInput
                    label="Admin PIN 3"
                    type={showAdminPin3 ? 'text' : 'password'}
                    value={adminPin3}
                    onChange={e => setAdminPin3(e.target.value)}
                    placeholder="••••••"
                    disabled={ld}
                    className="!pr-10"
                  />
                  <EyeIcon shown={showAdminPin3} onClick={() => setShowAdminPin3(!showAdminPin3)} />
                </div>

                {error && <div className="bg-red-500 border-4 border-red-700 text-black p-2 font-bold text-sm">{error}</div>}

                <RetroButton type="submit" variant="success" size="lg" className="w-full" disabled={ld}>
                  {ld ? '...' : '🔐 Verify & Login'}
                </RetroButton>
                <RetroButton type="button" variant="secondary" className="w-full" onClick={() => { setShowAdminPins(false); setError(''); }} disabled={ld}>
                  Back to Login
                </RetroButton>
              </form>
            )}

            <div className="mt-4 bg-black border border-gray-700 rounded p-3">
              <p className="text-gray-500 text-xs text-center">🔒 All data from database · No localStorage</p>
            </div>
          </RetroCard>
        )}
      </div>
    </div>
  );
};
