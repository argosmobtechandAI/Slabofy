import React from 'react';

export default function RefundPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 animate-fade-in">
      <h1 className="text-4xl font-display font-extrabold text-[#1e1b4b] mb-8">Refund Policy</h1>
      <div className="prose prose-indigo max-w-none text-[#4c4775] space-y-6">
        <p className="font-medium text-[#1e1b4b]">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-2xl font-bold text-[#1e1b4b] mt-8 mb-4">1. Co-Buying Pre-Authorizations</h2>
        <p>For co-buying groups, we place a pre-authorization hold on your card. If the group expires without reaching its target member count, this hold is automatically released and no funds are captured. Depending on your bank, this may take 3-5 business days to reflect on your statement.</p>
        
        <h2 className="text-2xl font-bold text-[#1e1b4b] mt-8 mb-4">2. Standard Returns</h2>
        <p>Once a co-buying order is confirmed and shipped, returns are handled according to the individual seller's return policy. Typically, you have 7-14 days from the date of delivery to request a return for defective or damaged items.</p>
        
        <h2 className="text-2xl font-bold text-[#1e1b4b] mt-8 mb-4">3. Refund Processing</h2>
        <p>Approved refunds are processed back to the original method of payment. Please allow 5-10 business days for the refund to appear in your account after processing.</p>
        
        <h2 className="text-2xl font-bold text-[#1e1b4b] mt-8 mb-4">4. Contacting Support</h2>
        <p>If you have an issue with an order or need to request a refund, please contact our support team at support@slabofy.com with your order ID.</p>
      </div>
    </div>
  );
}
