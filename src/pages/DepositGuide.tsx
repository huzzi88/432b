import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, Smartphone, CreditCard, Check, AlertCircle } from 'lucide-react';

export const DepositGuide: React.FC = () => {
  const navigate = useNavigate();

  const methods = [
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: 'Bank / Mobile Transfer',
      steps: [
        'Go to Deposit section in your dashboard',
        'Select "Bank / Mobile" tab',
        'Choose your payment method (JazzCash, EasyPaisa, Bank)',
        'Enter deposit amount',
        'Take a screenshot of your payment receipt (REQUIRED)',
        'Enter transaction/reference ID (Optional)',
        'Upload receipt screenshot',
        'Click "Submit Deposit"',
      ],
    },
    {
      icon: <Wallet className="w-8 h-8" />,
      title: 'Crypto Wallet (Web3)',
      steps: [
        'Connect your MetaMask or Trust Wallet',
        'Select cryptocurrency (USDT, USDC, BNB, ETH)',
        'Select network (BSC, Ethereum, Polygon, etc.)',
        'Send exact amount to provided wallet address',
        'Enter transaction hash (TxID)',
        'Take screenshot of transaction (REQUIRED)',
        'Upload screenshot',
        'Click "Submit Deposit"',
      ],
    },
    {
      icon: <CreditCard className="w-8 h-8" />,
      title: 'Binance Pay / OKX Pay',
      steps: [
        'Select "Crypto" tab in Deposit section',
        'Click "Binance Pay" or "OKX Pay" button',
        'Scan QR code with your Binance/OKX app',
        'Enter amount and confirm payment',
        'Screenshot will be auto-generated',
        'Transaction will be verified automatically',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-cyan-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8">
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </button>

        <div className="bg-black/50 border border-cyan-400/20 rounded-2xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-white mb-6">Deposit Guide</h1>
          <p className="text-gray-300 text-lg mb-8">
            Learn how to deposit funds into your Kepler432B account using various payment methods.
          </p>

          <div className="bg-yellow-900/20 border border-yellow-400/30 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-bold text-yellow-400 mb-2">Important Requirements</h3>
                <ul className="space-y-1 text-gray-300">
                  <li>• <strong>Receipt screenshot is COMPULSORY</strong> for all deposit methods</li>
                  <li>• Transaction/Reference ID is OPTIONAL (but recommended for faster verification)</li>
                  <li>• Minimum deposit: $10 USD</li>
                  <li>• Processing time: 1-24 hours after admin approval</li>
                </ul>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-6">Deposit Methods</h2>
          <div className="space-y-8">
            {methods.map((method, i) => (
              <div key={i} className="bg-cyan-900/20 border border-cyan-400/30 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-cyan-400">{method.icon}</div>
                  <h3 className="text-xl font-bold text-white">{method.title}</h3>
                </div>
                <ol className="space-y-2">
                  {method.steps.map((step, j) => (
                    <li key={j} className="flex items-start gap-2 text-gray-300">
                      <span className="text-cyan-400 font-bold">{j + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-green-900/20 border border-green-400/30 rounded-lg p-6">
            <h3 className="text-lg font-bold text-green-400 mb-3">Tips for Fast Verification</h3>
            <ul className="space-y-2 text-gray-300">
              <li><Check className="w-4 h-4 inline text-green-400 mr-2" />Ensure screenshot is clear and readable</li>
              <li><Check className="w-4 h-4 inline text-green-400 mr-2" />Include transaction ID if available</li>
              <li><Check className="w-4 h-4 inline text-green-400 mr-2" />Make sure sender name matches your account name</li>
              <li><Check className="w-4 h-4 inline text-green-400 mr-2" />Submit during business hours for faster processing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
