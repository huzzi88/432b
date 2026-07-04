import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, AlertTriangle, Check } from 'lucide-react';

export const Terms: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-cyan-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8">
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </button>

        <div className="bg-black/50 border border-cyan-400/20 rounded-2xl p-8">
          <h1 className="text-4xl font-bold text-white mb-2">Terms & Conditions</h1>
          <p className="text-gray-400 mb-8">Last updated: January 2025</p>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6" /> 1. Acceptance of Terms
              </h2>
              <p className="text-gray-300">
                By accessing or using Kepler432B ("Platform"), you agree to be bound by these Terms and Conditions. 
                If you do not agree, please do not use this Platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Eligibility</h2>
              <ul className="space-y-2 text-gray-300">
                <li>• You must be at least 18 years old</li>
                <li>• You must have legal capacity to enter into contracts</li>
                <li>• You must provide accurate and complete information</li>
                <li>• You must complete KYC verification before withdrawals</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Investment Terms</h2>
              <h3 className="text-xl font-bold text-white mt-4 mb-2">Investment Plans</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Investments are made through Plans → Slots → Lots structure</li>
                <li>• ROI is calculated daily based on admin-set rates</li>
                <li>• Profits are automatically credited to your balance</li>
                <li>• Minimum investment: $10 USD</li>
              </ul>

              <h3 className="text-xl font-bold text-white mt-4 mb-2">Investment Risks</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• All investments carry inherent risk</li>
                <li>• Past performance does not guarantee future results</li>
                <li>• ROI rates may change based on market conditions</li>
                <li>• You may lose part or all of your investment</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Deposits & Withdrawals</h2>
              <h3 className="text-xl font-bold text-white mt-4 mb-2">Deposits</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Minimum deposit: $10 USD</li>
                <li>• Receipt screenshot is COMPULSORY</li>
                <li>• Processing time: 1-24 hours</li>
                <li>• Funds must come from your own account</li>
              </ul>

              <h3 className="text-xl font-bold text-white mt-4 mb-2">Withdrawals</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Minimum withdrawal: $10 USD</li>
                <li>• KYC verification is MANDATORY</li>
                <li>• Processing time: 24-48 hours</li>
                <li>• Withdrawals to third-party accounts are prohibited</li>
                <li>• Login PIN required for every withdrawal</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" /> 5. Prohibited Activities
              </h2>
              <ul className="space-y-2 text-gray-300">
                <li>• Using VPN or proxy to access the platform</li>
                <li>• Creating multiple accounts</li>
                <li>• Fraudulent or illegal activities</li>
                <li>• Money laundering or terrorism financing</li>
                <li>• Attempting to hack or exploit the platform</li>
                <li>• Sharing your account credentials</li>
                <li>• Using automated bots or scripts</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Referral Program</h2>
              <ul className="space-y-2 text-gray-300">
                <li>• Tier 1: 7% commission on direct referrals' investments</li>
                <li>• Tier 2: 3% commission on referrals' referrals</li>
                <li>• Commissions are credited automatically</li>
                <li>• We reserve the right to modify commission rates</li>
                <li>• Fraudulent referrals will result in commission reversal</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Account Security</h2>
              <ul className="space-y-2 text-gray-300">
                <li>• You are responsible for maintaining account security</li>
                <li>• Use strong passwords and keep them confidential</li>
                <li>• Enable two-factor authentication if available</li>
                <li>• Report suspicious activity immediately</li>
                <li>• We are not liable for unauthorized access due to your negligence</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-300">
                Kepler432B shall not be liable for any indirect, incidental, special, or consequential damages arising from 
                your use of the platform, including but not limited to loss of profits, data, or investment losses.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Modifications</h2>
              <p className="text-gray-300">
                We reserve the right to modify these Terms at any time. Continued use of the platform constitutes acceptance 
                of modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Termination</h2>
              <p className="text-gray-300">
                We may terminate or suspend your account for violation of these Terms, fraudulent activity, or at our sole discretion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Check className="w-6 h-6" /> 11. Governing Law
              </h2>
              <p className="text-gray-300">
                These Terms shall be governed by and construed in accordance with applicable laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">12. Contact</h2>
              <p className="text-gray-300">
                For questions about these Terms, contact us at:
              </p>
              <ul className="space-y-2 text-gray-300">
                <li>• Email: legal@kepler432b.com</li>
                <li>• Telegram: @kepler432b_support</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
