import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Shield, TrendingUp, Clock, Users, Award, MessageCircle, Send, ChevronRight, FileText, ShieldCheck, Phone, HelpCircle, Info, FileCheck } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    { icon: <TrendingUp className="w-8 h-8" />, title: 'Multi-Level Plans', desc: 'Invest in Plans → Slots → Lots with flexible options' },
    { icon: <Clock className="w-8 h-8" />, title: 'Daily ROI', desc: 'Automated daily profit distribution based on admin-set rates' },
    { icon: <Wallet className="w-8 h-8" />, title: 'Multiple Payments', desc: 'Bank transfer, Crypto wallets, Binance Pay, OKX Pay' },
    { icon: <Shield className="w-8 h-8" />, title: 'Secure Platform', desc: 'Enterprise-grade security with encryption & protection' },
    { icon: <Users className="w-8 h-8" />, title: 'Referral Program', desc: 'Earn 7% Tier 1 + 3% Tier 2 commissions' },
    { icon: <Award className="w-8 h-8" />, title: 'Competitions', desc: 'Participate in challenges and win prizes' },
  ];

  const guides = [
    { icon: <FileCheck className="w-6 h-6" />, title: 'KYC Guide', path: '/kyc-guide', desc: 'Step-by-step KYC verification process' },
    { icon: <Wallet className="w-6 h-6" />, title: 'Deposit Guide', path: '/deposit-guide', desc: 'How to deposit funds securely' },
    { icon: <TrendingUp className="w-6 h-6" />, title: 'Withdrawal Guide', path: '/withdrawal-guide', desc: 'Withdraw your earnings easily' },
  ];

  const infoPages = [
    { icon: <HelpCircle className="w-6 h-6" />, title: 'FAQ', path: '/faq' },
    { icon: <Info className="w-6 h-6" />, title: 'About Us', path: '/about' },
    { icon: <ShieldCheck className="w-6 h-6" />, title: 'Privacy Policy', path: '/privacy' },
    { icon: <FileText className="w-6 h-6" />, title: 'Terms & Conditions', path: '/terms' },
    { icon: <Phone className="w-6 h-6" />, title: 'Contact', path: '/contact' },
  ];

  return (
    <div className="min-h-screen bg-theme-primary transition-colors duration-400">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-theme-primary mb-6">
            Your Future Starts with <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400">Smart Investing</span>
          </h2>
          <p className="text-xl text-theme-secondary mb-8">Join thousands of investors earning daily returns with our secure, automated investment platform.</p>
          <div className="flex gap-4 justify-center">
          <button onClick={() => navigate('/dashboard')} className="px-8 py-4 bg-gradient-to-r from-cyan-400 to-pink-400 text-black font-bold text-lg rounded-lg hover:opacity-90 transition flex items-center gap-2 shadow-lg glow-theme">
            Get Started <ChevronRight className="w-5 h-5" />
          </button>
            <a href="#features" className="px-8 py-4 bg-theme-tertiary text-theme-primary font-bold text-lg rounded-lg hover:bg-theme-secondary transition backdrop-blur border border-theme">Learn More</a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-theme-secondary/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-theme-primary text-center mb-12">Why Choose Kepler432B?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="bg-theme-secondary/50 border border-theme rounded-lg p-6 hover:border-primary-500/40 transition shadow-theme">
                <div className="text-primary-500 mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold text-theme-primary mb-2">{f.title}</h3>
                <p className="text-theme-secondary">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guides */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-theme-primary text-center mb-12">Getting Started Guides</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {guides.map((g, i) => (
              <button key={i} onClick={() => navigate(g.path)} className="bg-theme-tertiary border border-theme rounded-lg p-6 hover:border-cyan-400 transition text-left">
                <div className="text-cyan-400 mb-3">{g.icon}</div>
                <h3 className="text-lg font-bold text-theme-primary mb-2">{g.title}</h3>
                <p className="text-theme-muted text-sm">{g.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Info Pages */}
      <section className="py-20 px-4 bg-theme-secondary/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-theme-primary text-center mb-12">Resources</h2>
          <div className="grid md:grid-cols-5 gap-4">
            {infoPages.map((p, i) => (
              <button key={i} onClick={() => navigate(p.path)} className="bg-theme-tertiary border border-theme rounded-lg p-4 hover:border-purple-400 transition text-center">
                <div className="text-purple-400 mb-2 flex justify-center">{p.icon}</div>
                <h3 className="text-sm font-bold text-theme-primary">{p.title}</h3>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center bg-theme-tertiary border border-theme rounded-2xl p-12">
          <h2 className="text-4xl font-bold text-theme-primary mb-6">Ready to Start Earning?</h2>
          <p className="text-xl text-theme-secondary mb-8">Join Kepler432B today and start your investment journey.</p>
          <button onClick={() => navigate('/dashboard')} className="px-10 py-4 bg-gradient-to-r from-cyan-400 to-pink-400 text-black font-bold text-lg rounded-lg hover:opacity-90 transition">
            Create Free Account
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-theme-secondary/50 border-t border-theme py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-3xl">🪐</span>
                <h3 className="text-xl font-bold text-theme-primary">Kepler432B</h3>
              </div>
              <p className="text-theme-muted text-sm">Your trusted investment platform for secure, automated returns.</p>
            </div>
            <div>
              <h4 className="text-theme-primary font-bold mb-4">Guides</h4>
              <ul className="space-y-2 text-theme-muted text-sm">
                <li><button onClick={() => navigate('/kyc-guide')} className="hover:text-cyan-400">KYC Guide</button></li>
                <li><button onClick={() => navigate('/deposit-guide')} className="hover:text-cyan-400">Deposit Guide</button></li>
                <li><button onClick={() => navigate('/withdrawal-guide')} className="hover:text-cyan-400">Withdrawal Guide</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-theme-primary font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-theme-muted text-sm">
                <li><button onClick={() => navigate('/faq')} className="hover:text-cyan-400">FAQ</button></li>
                <li><button onClick={() => navigate('/about')} className="hover:text-cyan-400">About Us</button></li>
                <li><button onClick={() => navigate('/contact')} className="hover:text-cyan-400">Contact</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-theme-primary font-bold mb-4">Support</h4>
              <a href="https://t.me/kepler432b" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-[#0088cc] text-white rounded hover:bg-[#0077b5] transition mb-3">
                <MessageCircle className="w-4 h-4" /> Telegram Support
              </a>
              <button onClick={() => navigate('/contact')} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-cyan-400 text-black rounded hover:bg-cyan-300 transition">
                <Send className="w-4 h-4" /> Live Chat
              </button>
            </div>
          </div>
          <div className="border-t border-theme pt-8 text-center text-theme-muted text-sm">
            <p>&copy; 2025 Kepler432B. All rights reserved.</p>
            <div className="flex gap-4 justify-center mt-4">
              <button onClick={() => navigate('/privacy')} className="hover:text-cyan-400">Privacy Policy</button>
              <button onClick={() => navigate('/terms')} className="hover:text-cyan-400">Terms & Conditions</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Telegram Button */}
      <a href="https://t.me/kepler432b" target="_blank" rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#0088cc] rounded-full flex items-center justify-center shadow-lg hover:bg-[#0077b5] transition z-50">
        <MessageCircle className="w-7 h-7 text-white" />
      </a>
    </div>
  );
};
