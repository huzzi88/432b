import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, AlertCircle, Shield } from 'lucide-react';

export const WithdrawalGuide: React.FC = () => {
  const navigate = useNavigate();

  const requirements = [
    'Complete KYC verification (mandatory)',
    'Have verified login PIN',
    'Minimum withdrawal: $10 USD',
    'Account must be in good standing',
  ];

  const steps = [
    { num: 1, title: 'Complete KYC', desc: 'Submit your CNIC and wait for admin approval (24-48 hours)' },
    { num: 2, title: 'Go to Withdraw Section', desc: 'Navigate to Withdraw tab in your dashboard' },
    { num: 3, title: 'Enter Amount', desc: 'Enter the amount you want to withdraw (min $10)' },
    { num: 4, title: 'Select Method', desc: 'Choose bank transfer or crypto wallet' },
    { num: 5, title: 'Enter Account Details', desc: 'Provide your bank account or crypto wallet address' },
    { num: 6, title: 'Enter Login PIN', desc: 'Enter your 4-digit login PIN for security' },
    { num: 7, title: 'Submit Request', desc: 'Click "Submit Withdrawal" to submit for approval' },
    { num: 8, title: 'Wait for Processing', desc: 'Admin will review and approve within 24-48 hours' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-cyan-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8">
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </button>

        <div className="bg-black/50 border border-cyan-400/20 rounded-2xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-white mb-6">Withdrawal Guide</h1>
          <p className="text-gray-300 text-lg mb-8">
            Learn how to withdraw your earnings from Kepler432B safely and securely.
          </p>

          <div className="bg-red-900/20 border border-red-400/30 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-bold text-red-400 mb-2">Security Requirements</h3>
                <ul className="space-y-1 text-gray-300">
                  <li>• <strong>KYC verification is MANDATORY</strong> before first withdrawal</li>
                  <li>• Login PIN is required for every withdrawal</li>
                  <li>• Withdrawals to third-party accounts are not allowed</li>
                  <li>• Account name must match withdrawal account name</li>
                </ul>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-6">Requirements</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {requirements.map((req, i) => (
              <div key={i} className="flex items-start gap-2 bg-green-900/20 border border-green-400/30 rounded-lg p-4">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300">{req}</span>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-white mb-6">Step-by-Step Process</h2>
          <div className="space-y-6 mb-8">
            {steps.map((step) => (
              <div key={step.num} className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-cyan-400 text-black rounded-full flex items-center justify-center font-bold">
                  {step.num}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-gray-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-cyan-900/20 border border-cyan-400/30 rounded-lg p-6">
            <h3 className="text-lg font-bold text-cyan-400 mb-3">Processing Times</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• <strong>Bank Transfer:</strong> 24-48 hours</li>
              <li>• <strong>Crypto (USDT/USDT):</strong> 12-24 hours</li>
              <li>• <strong>Crypto (BTC/ETH):</strong> 24-48 hours</li>
              <li>• <strong>Weekend/Holiday:</strong> May take longer</li>
            </ul>
          </div>

          <div className="mt-8 bg-yellow-900/20 border border-yellow-400/30 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-bold text-yellow-400 mb-2">Important Notes</h3>
                <ul className="space-y-1 text-gray-300">
                  <li>• Double-check wallet/account details before submitting</li>
                  <li>• Wrong details may result in permanent loss of funds</li>
                  <li>• Contact support immediately if you made a mistake</li>
                  <li>• Minimum withdrawal amount may change based on network fees</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
