import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, MessageCircle, Mail, Phone, Clock, Check } from 'lucide-react';

export const Contact: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would send to backend
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  const contactInfo = [
    { icon: <Mail className="w-6 h-6" />, title: 'Email', value: 'support@kepler432b.com', href: 'mailto:support@kepler432b.com' },
    { icon: <Phone className="w-6 h-6" />, title: 'Phone', value: '+92 3XX XXXXXXX', href: 'tel:+923XXXXXXXX' },
    { icon: <MessageCircle className="w-6 h-6" />, title: 'Telegram', value: '@kepler432b_support', href: 'https://t.me/kepler432b' },
    { icon: <Clock className="w-6 h-6" />, title: 'Support Hours', value: '24/7 Available', href: null },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-cyan-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8">
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-black/50 border border-cyan-400/20 rounded-2xl p-8">
            <h1 className="text-3xl font-bold text-white mb-2">Contact Us</h1>
            <p className="text-gray-400 mb-6">Send us a message and we'll get back to you</p>

            {submitted ? (
              <div className="bg-green-900/20 border border-green-400/30 rounded-lg p-6 text-center">
                <Check className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Message Sent!</h3>
                <p className="text-gray-400">We'll respond within 24 hours</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-cyan-400 font-bold mb-2">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-black border border-cyan-400/40 rounded text-white px-4 py-3 focus:border-cyan-400 focus:outline-none transition"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-cyan-400 font-bold mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-black border border-cyan-400/40 rounded text-white px-4 py-3 focus:border-cyan-400 focus:outline-none transition"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-cyan-400 font-bold mb-2">Subject *</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-black border border-cyan-400/40 rounded text-white px-4 py-3 focus:border-cyan-400 focus:outline-none transition"
                    placeholder="What is this about?"
                  />
                </div>
                <div>
                  <label className="block text-cyan-400 font-bold mb-2">Message *</label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    rows={5}
                    className="w-full bg-black border border-cyan-400/40 rounded text-white px-4 py-3 focus:border-cyan-400 focus:outline-none transition resize-none"
                    placeholder="Your message..."
                  />
                </div>
                <button type="submit" className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-cyan-400 to-pink-400 text-black font-bold rounded-lg hover:opacity-90 transition">
                  <Send className="w-5 h-5" /> Send Message
                </button>
              </form>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-black/50 border border-cyan-400/20 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Get in Touch</h2>
              <div className="space-y-4">
                {contactInfo.map((info, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="text-cyan-400 mt-1">{info.icon}</div>
                    <div>
                      <h3 className="text-white font-bold">{info.title}</h3>
                      {info.href ? (
                        <a href={info.href} className="text-gray-400 hover:text-cyan-400 transition">{info.value}</a>
                      ) : (
                        <p className="text-gray-400">{info.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Chat */}
            <div className="bg-gradient-to-br from-cyan-900/50 to-purple-900/50 border border-cyan-400/30 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Live Chat Support</h2>
              <p className="text-gray-300 mb-6">
                Chat with our support team in real-time. Average response time: 2-5 minutes.
              </p>
              <button 
                onClick={() => window.open('https://t.me/kepler432b', '_blank')}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#0088cc] text-white font-bold rounded-lg hover:bg-[#0077b5] transition"
              >
                <MessageCircle className="w-5 h-5" /> Start Live Chat
              </button>
              <p className="text-gray-500 text-sm mt-4 text-center">
                Opens Telegram in new window
              </p>
            </div>

            {/* Telegram Support */}
            <div className="bg-[#0088cc]/10 border border-[#0088cc]/30 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Telegram Support</h2>
              <p className="text-gray-300 mb-6">
                Get quick support via Telegram. Our team is available 24/7.
              </p>
              <a 
                href="https://t.me/kepler432b"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#0088cc] text-white font-bold rounded-lg hover:bg-[#0077b5] transition"
              >
                <MessageCircle className="w-5 h-5" /> Join Telegram Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
