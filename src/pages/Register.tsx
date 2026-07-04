import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RetroCard } from '../components/RetroCard';
import { RetroInput } from '../components/RetroInput';
import { RetroButton } from '../components/RetroButton';

interface RegisterProps { onLoginClick: () => void; }

// Eye icon component (reused from Login)
const EyeIcon = ({ shown, onClick }: { shown: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 cursor-pointer z-10"
    tabIndex={-1}
  >
    {shown ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    )}
  </button>
);

export const Register: React.FC<RegisterProps> = ({ onLoginClick }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useApp();

  const getPasswordStrength = (pw: string) => {
    let score = 0;
    const tips: string[] = [];
    if (pw.length >= 6) score++; else tips.push('Min 6 characters');
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++; else tips.push('Add uppercase letter');
    if (/[0-9]/.test(pw)) score++; else tips.push('Add a number');
    if (/[^A-Za-z0-9]/.test(pw)) score++; else tips.push('Add special character');
    if (pw.length >= 14) score++;
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong', 'Excellent'];
    return { score, label: labels[Math.min(score, 6)], tips };
  };

  const isValidEmail = (e: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(e) && e.length <= 254;
  };

  const pwStrength = password ? getPasswordStrength(password) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!name.trim() || name.trim().length < 2) { setError('Name must be at least 2 characters'); return; }
      if (!email.trim() || !isValidEmail(email.trim())) { setError('Please enter a valid email address'); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
      if (/\s/.test(password)) { setError('Password cannot contain spaces'); return; }
      if (password !== confirmPassword) { setError('Passwords do not match'); return; }
      if (loginPin.length !== 4 || !/^\d{4}$/.test(loginPin)) { setError('PIN must be exactly 4 digits'); return; }
      if (loginPin !== confirmPin) { setError('PINs do not match'); return; }

      const result = await register(name.trim(), email.trim(), password, loginPin, referralCode || undefined);
      if (result.success) { setSuccess(true); setTimeout(onLoginClick, 2000); }
      else setError(result.error || 'Registration failed');
    } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-cyan-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 mb-2 uppercase tracking-wider">Kepler432B</h1>
          <p className="text-cyan-400 text-lg font-bold uppercase tracking-wider">Create Account</p>
        </div>

        <RetroCard color="purple">
          <h2 className="text-2xl font-bold text-purple-400 mb-6 uppercase tracking-wider">Register</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <RetroInput label="Full Name *" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" disabled={isLoading} />
            <RetroInput label="Email *" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" disabled={isLoading} />

            {/* Password with eye */}
            <div>
              <div className="relative">
                <RetroInput
                  label="Password *"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 6 chars, uppercase, number, special"
                  disabled={isLoading}
                  className="!pr-10"
                />
                <EyeIcon shown={showPassword} onClick={() => setShowPassword(!showPassword)} />
              </div>
              {pwStrength && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[0, 1, 2, 3, 4, 5].map(i => (
                      <div key={i} className={`h-1 flex-1 ${i < pwStrength.score ? (pwStrength.score >= 4 ? 'bg-green-400' : pwStrength.score >= 2 ? 'bg-yellow-400' : 'bg-red-400') : 'bg-gray-700'}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-bold ${pwStrength.score >= 4 ? 'text-green-400' : pwStrength.score >= 2 ? 'text-yellow-400' : 'text-red-400'}`}>
                    Strength: {pwStrength.label}
                  </p>
                  {pwStrength.tips.length > 0 && (
                    <ul className="text-gray-500 text-xs mt-1">
                      {pwStrength.tips.map((tip, i) => (<li key={i}>• {tip}</li>))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password with eye */}
            <div className="relative">
              <RetroInput
                label="Confirm Password *"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                disabled={isLoading}
                className="!pr-10"
              />
              <EyeIcon shown={showConfirmPassword} onClick={() => setShowConfirmPassword(!showConfirmPassword)} />
            </div>

            {/* PIN with eye */}
            <div className="relative">
              <RetroInput
                label="4-Digit Login PIN *"
                type={showPin ? 'text' : 'password'}
                value={loginPin}
                onChange={e => setLoginPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Enter 4-digit PIN"
                maxLength={4}
                disabled={isLoading}
                className="!pr-10"
              />
              <EyeIcon shown={showPin} onClick={() => setShowPin(!showPin)} />
            </div>

            {/* Confirm PIN with eye */}
            <div className="relative">
              <RetroInput
                label="Confirm PIN *"
                type={showConfirmPin ? 'text' : 'password'}
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Re-enter PIN"
                maxLength={4}
                disabled={isLoading}
                className="!pr-10"
              />
              <EyeIcon shown={showConfirmPin} onClick={() => setShowConfirmPin(!showConfirmPin)} />
            </div>

            <RetroInput
              label="Referral Code (Optional)"
              value={referralCode}
              onChange={e => setReferralCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
              placeholder="XXXXXX"
              disabled={isLoading}
            />

            {error && (
              <div className="bg-red-500 border border-red-700 rounded text-black p-3 font-bold text-sm">{error}</div>
            )}

            {success && (
              <div className="bg-green-500 border border-green-700 rounded text-black p-3 font-bold text-sm">
                ✓ Registration successful! Redirecting to login...
              </div>
            )}

            <div className="flex flex-col gap-3 mt-6">
              <RetroButton type="submit" variant="primary" size="lg" className="w-full" disabled={isLoading || success}>
                {isLoading ? 'Registering...' : 'Register Now'}
              </RetroButton>
              <RetroButton type="button" variant="secondary" size="md" className="w-full" onClick={onLoginClick} disabled={isLoading}>
                Back to Login
              </RetroButton>
            </div>
          </form>

          <p className="text-gray-500 text-xs text-center mt-4">
            By registering, you agree to our Terms & Conditions. Investment involves risk.
          </p>
        </RetroCard>
      </div>
    </div>
  );
};
