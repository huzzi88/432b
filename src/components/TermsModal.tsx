// ═══════════════════════════════════════════════
// TERMS & CONDITIONS MODAL
// Shows before any investment submission
// ═══════════════════════════════════════════════
import React from 'react';
import { RetroButton } from './RetroButton';

interface Props {
  planName: string;
  amount: number;
  onAccept: () => void;
  onDeny: () => void;
}

export const TermsModal: React.FC<Props> = ({ planName, amount, onAccept, onDeny }) => {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onDeny}>
      <div className="bg-gray-900 border border-cyan-400/40 rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 space-y-4">
          <h2 className="text-cyan-400 font-bold text-xl text-center uppercase">📋 Terms & Conditions</h2>

          <div className="bg-black border border-gray-700 rounded p-3 space-y-2 text-sm text-gray-300">
            <p><strong className="text-white">Investment Details:</strong></p>
            <p>Plan: <span className="text-cyan-400">{planName}</span></p>
            <p>Amount: <span className="text-green-400 font-bold">$ {amount.toLocaleString()}</span></p>

            <hr className="border-gray-700"/>

            <p className="text-yellow-400 font-bold">⚠️ Risk Disclosure:</p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>All investments carry inherent risk. Past returns do not guarantee future results.</li>
              <li>The platform calculates daily returns based on admin-set ROI rates, which may vary.</li>
              <li>If the plan uses a pool system, your funds will remain pooled until the target is reached.</li>
              <li>Referral commissions are calculated on the investment amount at the time of investment.</li>
              <li>The platform reserves the right to modify ROI rates as market conditions change.</li>
              <li>Withdrawals are subject to KYC verification and admin approval.</li>
            </ul>

            <p className="text-yellow-400 font-bold mt-2">📜 Agreement:</p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>You confirm you are of legal age and have the capacity to make investment decisions.</li>
              <li>You understand that your investment may lose value.</li>
              <li>You agree to the platform's terms of service and privacy policy.</li>
              <li>You acknowledge that this is not financial advice.</li>
              <li>You confirm the funds used are from legitimate sources.</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <RetroButton variant="success" size="lg" className="flex-1" onClick={onAccept}>
              ✅ Accept & Invest
            </RetroButton>
            <RetroButton variant="danger" size="lg" className="flex-1" onClick={onDeny}>
              ❌ Deny
            </RetroButton>
          </div>
        </div>
      </div>
    </div>
  );
};
