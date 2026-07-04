import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Database } from 'lucide-react';

export const Privacy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-cyan-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8">
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </button>

        <div className="bg-black/50 border border-cyan-400/20 rounded-2xl p-8">
          <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-gray-400 mb-8">Last updated: January 2025</p>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
              <p className="text-gray-300">
                Kepler432B ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Database className="w-6 h-6" /> 2. Information We Collect
              </h2>
              <h3 className="text-xl font-bold text-white mt-4 mb-2">Personal Information</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Name and email address</li>
                <li>• Phone number and address</li>
                <li>• CNIC number (for KYC verification)</li>
                <li>• Wallet addresses (for crypto transactions)</li>
                <li>• Transaction history</li>
              </ul>

              <h3 className="text-xl font-bold text-white mt-4 mb-2">Automatically Collected Information</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• IP address and device information</li>
                <li>• Browser type and version</li>
                <li>• Login timestamps</li>
                <li>• Transaction logs</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Lock className="w-6 h-6" /> 3. How We Use Your Information
              </h2>
              <ul className="space-y-2 text-gray-300">
                <li>• To provide and maintain our services</li>
                <li>• To process transactions and investments</li>
                <li>• To verify your identity (KYC)</li>
                <li>• To send important notifications</li>
                <li>• To improve our platform</li>
                <li>• To comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6" /> 4. Data Security
              </h2>
              <p className="text-gray-300 mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="space-y-2 text-gray-300">
                <li>• Encryption of sensitive data</li>
                <li>• Secure servers with firewall protection</li>
                <li>• Regular security audits</li>
                <li>• Access controls and authentication</li>
                <li>• Regular backups</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Eye className="w-6 h-6" /> 5. Information Sharing
              </h2>
              <p className="text-gray-300 mb-4">
                We do NOT sell, trade, or rent your personal information. We may share information only when:
              </p>
              <ul className="space-y-2 text-gray-300">
                <li>• Required by law or legal process</li>
                <li>• To prevent fraud or illegal activities</li>
                <li>• With your explicit consent</li>
                <li>• With service providers who assist us (under confidentiality agreements)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Your Rights</h2>
              <ul className="space-y-2 text-gray-300">
                <li>• Access your personal information</li>
                <li>• Correct inaccurate information</li>
                <li>• Request deletion of your data</li>
                <li>• Opt-out of marketing communications</li>
                <li>• Export your data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Cookies</h2>
              <p className="text-gray-300">
                We use cookies to enhance your experience. You can disable cookies in your browser settings, 
                but some features may not work properly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Contact Us</h2>
              <p className="text-gray-300">
                If you have questions about this Privacy Policy, please contact us at:
              </p>
              <ul className="space-y-2 text-gray-300">
                <li>• Email: privacy@kepler432b.com</li>
                <li>• Telegram: @kepler432b_support</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
