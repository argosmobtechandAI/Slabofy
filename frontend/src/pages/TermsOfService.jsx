import React from 'react';

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 animate-fade-in">
      <h1 className="text-4xl font-display font-extrabold text-[#1e1b4b] mb-8">Terms of Service</h1>
      <div className="prose prose-indigo max-w-none text-[#4c4775] space-y-6">
        <p className="font-medium text-[#1e1b4b]">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-2xl font-bold text-[#1e1b4b] mt-8 mb-4">1. Acceptance of Terms</h2>
        <p>By accessing or using the Slabofy platform, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
        
        <h2 className="text-2xl font-bold text-[#1e1b4b] mt-8 mb-4">2. Co-Buying Mechanics</h2>
        <p>Slabofy facilitates group buying. When you join a group, your payment method is pre-authorized. You are only charged when the group reaches its target size within the specified time limit. If the group fails to reach the target, the pre-authorization is cancelled and you are not charged.</p>
        
        <h2 className="text-2xl font-bold text-[#1e1b4b] mt-8 mb-4">3. User Conduct</h2>
        <p>You agree not to use the service for any unlawful purpose or to violate any laws in your jurisdiction. You must not transmit any worms, viruses, or any code of a destructive nature.</p>
        
        <h2 className="text-2xl font-bold text-[#1e1b4b] mt-8 mb-4">4. Modifications</h2>
        <p>We reserve the right to modify or terminate the service for any reason, without notice, at any time. We reserve the right to alter these Terms of Service at any time.</p>
      </div>
    </div>
  );
}
