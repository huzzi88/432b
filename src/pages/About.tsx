import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Shield, Users, Award } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

export const About: React.FC = () => {
  const navigate = useNavigate();
  
  const values = [
    { icon: <Shield className="w-8 h-8" />, title: 'Security First', desc: 'Your funds and data are protected with enterprise-grade security' },
    { icon: <TrendingUp className="w-8 h-8" />, title: 'Transparent Returns', desc: 'Clear, automated profit distribution with daily ROI' },
    { icon: <Users className="w-8 h-8" />, title: 'Community Focus', desc: 'Built for investors, by investors' },
    { icon: <Award className="w-8 h-8" />, title: 'Excellence', desc: 'Committed to providing the best investment experience' },
  ];
  
  return (
    <div className="min-h-screen bg-theme-primary py-12 px-4 transition-colors duration-400">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8">
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </button>

        <div className="bg-theme-secondary border border-theme rounded-2xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-theme-primary mb-6">About Kepler432B</h1>
          
          <div className="prose max-w-none">
            <p className="text-theme-secondary text-lg mb-6">
              Kepler432B is a cutting-edge investment platform designed to make investing accessible, secure, and profitable for everyone. 
              Founded with the vision of democratizing investment opportunities, we provide a platform where anyone can start earning 
              daily returns with minimal investment.
            </p>

            <h2 className="text-2xl font-bold text-theme-primary mb-4">Our Mission</h2>
            <p className="text-theme-secondary mb-6">
              To provide a secure, transparent, and automated investment platform that empowers individuals to grow their wealth 
              through smart investment strategies and daily profit distribution.
            </p>

            <h2 className="text-2xl font-bold text-theme-primary mb-4">Our Vision</h2>
            <p className="text-theme-secondary mb-6">
              To become the world's most trusted investment platform, making wealth creation accessible to everyone, 
              regardless of their financial background or investment experience.
            </p>

            <h2 className="text-2xl font-bold text-theme-primary mb-4">Our Values</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {values.map((v, i) => (
                <div key={i} className="bg-theme-tertiary border border-theme rounded-lg p-4">
                  <div className="text-cyan-400 mb-3">{v.icon}</div>
                  <h3 className="text-lg font-bold text-theme-primary mb-2">{v.title}</h3>
                  <p className="text-theme-muted">{v.desc}</p>
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-bold text-theme-primary mb-4">Why Choose Us?</h2>
            <ul className="space-y-2 text-theme-secondary mb-8">
              <li>• <strong>Automated Profits:</strong> Daily ROI distribution without manual intervention</li>
              <li>• <strong>Flexible Plans:</strong> Multiple investment options at different levels</li>
              <li>• <strong>Secure Platform:</strong> Enterprise-grade security and encryption</li>
              <li>• <strong>Transparent:</strong> Clear terms and real-time profit tracking</li>
              <li>• <strong>Multiple Payments:</strong> Bank transfer, crypto wallets, Binance Pay, OKX Pay</li>
              <li>• <strong>Referral Program:</strong> Earn 7% Tier 1 + 3% Tier 2 commissions</li>
              <li>• <strong>24/7 Support:</strong> Always available to help you</li>
            </ul>

            <div className="bg-theme-tertiary border border-theme rounded-lg p-6">
              <h3 className="text-lg font-bold text-cyan-400 mb-3">Get Started Today</h3>
              <p className="text-theme-secondary mb-4">
                Join thousands of investors who are already earning daily returns with Kepler432B. 
                Create your free account today and start your investment journey.
              </p>
              <button onClick={() => navigate('/register')} className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-pink-400 text-black font-bold rounded hover:opacity-90 transition">
                Create Free Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
