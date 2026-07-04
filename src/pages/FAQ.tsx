import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

export const FAQ: React.FC = () => {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: 'What is Kepler432B?',
      a: 'Kepler432B is a secure, automated investment platform that allows users to earn daily returns through our multi-level investment plans. We offer flexible investment options with daily ROI distribution.',
    },
    {
      q: 'How do I start investing?',
      a: '1. Create a free account\n2. Complete KYC verification\n3. Deposit funds using bank transfer or crypto\n4. Browse investment plans and choose one that suits you\n5. Click "Invest" and accept the terms\n6. Your investment will be activated after admin approval',
    },
    {
      q: 'What are the investment plans?',
      a: 'We offer Plans → Slots → Lots structure. You can invest at any level:\n• Plans: General investment categories\n• Slots: Specific plans within categories\n• Lots: Individual investment units within slots\nEach level has different ROI rates and investment amounts.',
    },
    {
      q: 'How are profits calculated?',
      a: 'Profits are calculated daily based on the admin-set daily ROI rate. The formula is:\nDaily Profit = Investment Amount × Daily ROI%\nProfits are automatically credited to your balance every day.',
    },
    {
      q: 'When can I withdraw?',
      a: 'You can withdraw after:\n1. Completing KYC verification\n2. Having a minimum balance of $10\n3. Waiting for withdrawal approval (24-48 hours)',
    },
    {
      q: 'What payment methods are accepted?',
      a: 'We accept:\n• Bank transfers (JazzCash, EasyPaisa)\n• Crypto wallets (MetaMask, Trust Wallet)\n• Binance Pay\n• OKX Pay',
    },
    {
      q: 'Is KYC mandatory?',
      a: 'Yes, KYC verification is mandatory before your first withdrawal. This is for security and regulatory compliance.',
    },
    {
      q: 'How long does KYC take?',
      a: 'KYC verification typically takes 24-48 hours. You will be notified once your KYC is approved.',
    },
    {
      q: 'What is the referral program?',
      a: 'Earn commissions by referring others:\n• Tier 1: 7% commission on direct referrals\' investments\n• Tier 2: 3% commission on referrals\' referrals\nCommissions are credited automatically.',
    },
    {
      q: 'How do I contact support?',
      a: 'You can contact us via:\n• Live Chat (in Contact page)\n• Telegram Support\n• Email support',
    },
    {
      q: 'Is my investment secure?',
      a: 'Yes! We use enterprise-grade security including encryption, secure servers, and regular audits. Your funds are protected with multiple security layers.',
    },
    {
      q: 'Can I cancel my investment?',
      a: 'You can request to cancel an active investment. Admin will review and approve/reject the request. Refunds are processed upon approval.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-cyan-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8">
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </button>

        <div className="bg-black/50 border border-cyan-400/20 rounded-2xl p-8">
          <h1 className="text-4xl font-bold text-white mb-2">Frequently Asked Questions</h1>
          <p className="text-gray-400 mb-8">Find answers to common questions about Kepler432B</p>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-cyan-900/20 border border-cyan-400/30 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full p-4 text-left flex justify-between items-center hover:bg-cyan-900/30 transition"
                >
                  <span className="text-white font-bold text-lg">{faq.q}</span>
                  {openIndex === i ? <ChevronUp className="w-5 h-5 text-cyan-400" /> : <ChevronDown className="w-5 h-5 text-cyan-400" />}
                </button>
                {openIndex === i && (
                  <div className="px-4 pb-4 text-gray-300 whitespace-pre-line">{faq.a}</div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 bg-purple-900/20 border border-purple-400/30 rounded-lg p-6 text-center">
            <p className="text-gray-300 mb-4">Still have questions?</p>
            <button onClick={() => navigate('/contact')} className="px-6 py-3 bg-cyan-400 text-black font-bold rounded hover:bg-cyan-300 transition">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
