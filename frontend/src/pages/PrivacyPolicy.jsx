import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 animate-fade-in">
      <h1 className="text-4xl font-display font-extrabold text-[#1e1b4b] mb-8">Privacy Policy</h1>
      <div className="prose prose-indigo max-w-none text-[#4c4775] space-y-6">
        <p className="font-medium text-[#1e1b4b]">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-2xl font-bold text-[#1e1b4b] mt-8 mb-4">1. Information We Collect</h2>
        <p>At Slabofy, we collect information that you provide directly to us when you create an account, make a purchase, or communicate with us. This includes your name, email address, phone number, shipping address, and payment information.</p>
        
        <h2 className="text-2xl font-bold text-[#1e1b4b] mt-8 mb-4">2. How We Use Your Information</h2>
        <p>We use the information we collect to provide, maintain, and improve our services. This includes processing transactions, sending order confirmations, managing co-buying groups, and communicating with you about products, services, and promotions.</p>
        
        <h2 className="text-2xl font-bold text-[#1e1b4b] mt-8 mb-4">3. Data Security</h2>
        <p>We take reasonable measures to help protect information about you from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. Payment data is processed securely through our payment partners.</p>
        
        <h2 className="text-2xl font-bold text-[#1e1b4b] mt-8 mb-4">4. Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at support@slabofy.com.</p>
      </div>
    </div>
  );
}
