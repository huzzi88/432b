import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { UserDashboard } from './pages/UserDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Landing } from './pages/Landing';
import { KYCGuide } from './pages/KYCGuide';
import { DepositGuide } from './pages/DepositGuide';
import { WithdrawalGuide } from './pages/WithdrawalGuide';
import { FAQ } from './pages/FAQ';
import { About } from './pages/About';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { Contact } from './pages/Contact';

// Header Component for Landing Page
const LandingHeader: React.FC<{ onLogin: () => void; onRegister: () => void }> = ({ onLogin, onRegister }) => {
  const { currentUser, logout, isLoading } = useApp();

  if (isLoading) return null;

  if (currentUser) {
    return (
      <header className="bg-black/50 backdrop-blur border-b border-cyan-400/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🪐</span>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400">Kepler432B</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-cyan-400 font-bold hidden sm:inline">👤 {currentUser.name}</span>
            <button onClick={() => window.location.href = '/dashboard'} className="px-6 py-2 bg-cyan-400 text-black font-bold rounded hover:bg-cyan-300 transition">
              Dashboard
            </button>
            <button onClick={logout} className="px-6 py-2 bg-pink-400 text-black font-bold rounded hover:bg-pink-300 transition">
              Logout
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-black/50 backdrop-blur border-b border-cyan-400/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🪐</span>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400">Kepler432B</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={onLogin} className="px-6 py-2 bg-cyan-400 text-black font-bold rounded hover:bg-cyan-300 transition">Login</button>
          <button onClick={onRegister} className="px-6 py-2 bg-pink-400 text-black font-bold rounded hover:bg-pink-300 transition">Create Account</button>
        </div>
      </div>
    </header>
  );
};

const LandingWrapper: React.FC = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  if (showLogin) return <Login onRegisterClick={() => setShowRegister(true)} />;
  if (showRegister) return <Register onLoginClick={() => setShowLogin(false)} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-cyan-900">
      <LandingHeader onLogin={() => setShowLogin(true)} onRegister={() => setShowRegister(true)} />
      <Landing />
    </div>
  );
};

const DashboardWrapper: React.FC = () => {
  const { currentUser, isAdmin, isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-cyan-400 text-xl font-bold animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  return isAdmin ? <AdminDashboard /> : <UserDashboard />;
};

function App() {
  return (
    <HashRouter>
      <AppProvider>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<LandingWrapper />} />
          <Route path="/kyc-guide" element={<KYCGuide />} />
          <Route path="/deposit-guide" element={<DepositGuide />} />
          <Route path="/withdrawal-guide" element={<WithdrawalGuide />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/contact" element={<Contact />} />

          {/* Dashboard (requires login) */}
          <Route path="/dashboard" element={<DashboardWrapper />} />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppProvider>
    </HashRouter>
  );
}

export default App;
