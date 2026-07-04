import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, FileCheck } from 'lucide-react';

export const KYCGuide: React.FC = () => {
  const navigate = useNavigate();

  const steps = [
    { num: 1, title: 'Go to Profile', desc: 'Navigate to your Profile section after logging in' },
    { num: 2, title: 'Enter CNIC Number', desc: 'Enter your CNIC number in the format XXXXX-XXXXXXX-X' },
    { num: 3, title: 'Upload CNIC Front Image', desc: 'Take a photo or upload a clear image of your CNIC front side' },
    { num: 4, title: 'Submit for Review', desc: 'Click "Submit KYC" button to submit for admin review' },
    { num: 5, title: 'Wait for Approval', desc: 'Admin will review your submission within 24-48 hours' },
    { num: 6, title: 'KYC Verified', desc: 'Once approved, you can withdraw funds from your account' },
  ];

  const tips = [
    'Ensure good lighting when taking photos',
    'Keep CNIC flat and all text clearly visible',
    'No glare or shadows on the card',
    'Image must be in JPG or PNG format',
    'Maximum file size: 5MB',
    'Blurry or unclear images will be rejected',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-cyan-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8">
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </button>

        <div className="bg-black/50 border border-cyan-400/20 rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <FileCheck className="w-10 h-10 text-cyan-400" />
            <h1 className="text-4xl font-bold text-white">KYC Verification Guide</h1>
          </div>

          <p className="text-gray-300 text-lg mb-8">
            Know Your Customer (KYC) verification is required before you can withdraw funds from your account. Follow these simple steps to complete your verification.
          </p>

          <h2 className="text-2xl font-bold text-white mb-6">Step-by-Step Process</h2>
          <div className="space-y-6 mb-12">
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

          <h2 className="text-2xl font-bold text-white mb-6">Photo Requirements</h2>
          <div className="bg-cyan-900/20 border border-cyan-400/30 rounded-lg p-6 mb-8">
            <div className="grid md:grid-cols-2 gap-4">
              {tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">{tip}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-purple-900/20 border border-purple-400/30 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Important Notes</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• KYC verification is mandatory for withdrawals</li>
              <li>• Processing time: 24-48 hours</li>
              <li>• You will be notified once your KYC is approved</li>
              <li>• Rejected KYC can be resubmitted with correct documents</li>
              <li>• Only CNIC front image is required (back side optional)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
