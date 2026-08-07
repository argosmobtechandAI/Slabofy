"use client";

import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Store, Tag, Plus, PlusCircle, ShoppingCart, RefreshCw, AlertTriangle, ArrowRight, ShieldCheck, CheckCircle2, Truck, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SellerPanel() {
  const { isLoggedIn, user, updateProfile } = useAuth();
  
  // States
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'add-product'

  // Onboarding Form State
  const [businessName, setBusinessName] = useState('');
  const [gstin, setGstin] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifsc, setIfsc] = useState('');

  // Add Product Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState(100);
  const [imageUrl, setImageUrl] = useState('');
  const [tier1, setTier1] = useState('');
  const [tier2, setTier2] = useState('');
  const [tier3, setTier3] = useState('');
  const [tier5, setTier5] = useState('');
  const [tier10, setTier10] = useState('');

  // Shipment Form State
  const [shippingOrderId, setShippingOrderId] = useState(null);
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingSubmitting, setShippingSubmitting] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      fetchSellerData();
      fetchCategories();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSellerData = async () => {
    setLoading(true);
    try {
      // 1. Fetch profile to check if applicant is approved
      const profileRes = await api.get('/seller/profile');
      const myProfile = profileRes.data.profile;
      setProfile(myProfile);

      if (myProfile && myProfile.is_approved) {
        // 2. Fetch merchant stats
        const statsRes = await api.get('/seller/stats');
        setStats(statsRes.data.stats);

        // 3. Fetch merchant orders
        const ordersRes = await api.get('/seller/orders');
        setOrders(ordersRes.data.orders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Onboarding Application Submit
   */
  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    if (!businessName) return toast.error('Business name is required');

    setLoading(true);
    try {
      await api.post('/seller/register', {
        business_name: businessName,
        gstin,
        bank_account: bankAccount,
        ifsc
      });
      toast.success('Registration submitted! Awaiting administrator validation.');
      fetchSellerData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
      setLoading(false);
    }
  };

  /**
   * Product Registration Submit
   */
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!name || !category || !tier1 || !tier2 || !tier3 || !tier5 || !tier10) {
      return toast.error('Please fill in all product attributes and pricing tiers');
    }

    const t1 = parseFloat(tier1);
    const t2 = parseFloat(tier2);
    const t3 = parseFloat(tier3);
    const t5 = parseFloat(tier5);
    const t10 = parseFloat(tier10);

    // Strictly validate tier pricing is descending (sizes: 1 > 2 > 3 > 5 > 10)
    if (t2 >= t1 || t3 >= t2 || t5 >= t3 || t10 >= t5) {
      return toast.error('Validation Error: pricing must strictly decrease as co-buy group size increases. (e.g. Size 10 is cheapest, Size 1 is most expensive)');
    }

    try {
      const payload = {
        name,
        sku,
        description,
        category_id: category,
        stock: parseInt(stock),
        images: imageUrl ? [imageUrl] : [],
        tiers: [
          { group_size: 1, price: t1 },
          { group_size: 2, price: t2 },
          { group_size: 3, price: t3 },
          { group_size: 5, price: t5 },
          { group_size: 10, price: t10 }
        ]
      };

      await api.post('/products', payload);
      toast.success('Product submitted for administrator review!');
      
      // Reset Form
      setName('');
      setSku('');
      setDescription('');
      setStock(100);
      setImageUrl('');
      setTier1('');
      setTier2('');
      setTier3('');
      setTier5('');
      setTier10('');
      setActiveTab('orders');
      fetchSellerData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Product listing creation failed');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result);
      toast.success('Image uploaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  /**
   * Ship order submit handler
   */
  const handleShipOrder = async (e) => {
    e.preventDefault();
    if (!courierName || !trackingNumber) return toast.error('Courier name and tracking code are required');
    
    setShippingSubmitting(true);
    try {
      await api.put(`/seller/orders/${shippingOrderId}/ship`, {
        courier_name: courierName,
        tracking_number: trackingNumber
      });
      toast.success('Order status updated to Shipped!');
      setShippingOrderId(null);
      setCourierName('');
      setTrackingNumber('');
      fetchSellerData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update order shipment');
    } finally {
      setShippingSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-6">
        <Store className="text-gray-600 mx-auto" size={48} />
        <h3 className="text-xl font-bold font-display text-[#1e1b4b]">Merchant Center</h3>
        <p className="text-sm text-[#9490b8]">Please log in to manage your inventory and complete customer shipments.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <RefreshCw className="animate-spin text-[#6366f1]" size={32} />
        <p className="text-sm text-[#9490b8]">Opening merchant portal...</p>
      </div>
    );
  }

  // CASE 1: No Seller Profile -> Show Registration Application Onboarding
  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-3">
          <Store className="text-[#6366f1] mx-auto" size={48} />
          <h1 className="text-3xl font-bold font-display text-[#1e1b4b]">Seller Hub Onboarding</h1>
          <p className="text-sm text-[#9490b8] leading-relaxed">Register your business details to unlock product listings and participate in co-buying volume deals.</p>
        </div>

        <div className="glass-panel border-[rgba(99,102,241,0.1)] rounded-3xl p-6 md:p-10 shadow-2xl">
          <form onSubmit={handleOnboardSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-[#9490b8] font-semibold uppercase tracking-wider">Business Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Retailers Private Limited"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-3 px-4 text-xs text-[#1e1b4b]"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#9490b8] font-semibold uppercase tracking-wider">GSTIN Code</label>
                <input
                  type="text"
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-3 px-4 text-xs text-[#1e1b4b]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-[#9490b8] font-semibold uppercase tracking-wider">Bank Account Number</label>
                <input
                  type="text"
                  placeholder="e.g. 5010029302928"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-3 px-4 text-xs text-[#1e1b4b]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#9490b8] font-semibold uppercase tracking-wider">IFSC Routing Code</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC0000010"
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value)}
                  className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-3 px-4 text-xs text-[#1e1b4b]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-neon text-white font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
            >
              Submit Application
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // CASE 2: Seller Profile is pending approval
  if (profile && !profile.is_approved) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-6">
        <ShieldCheck className="text-brand-gold mx-auto animate-pulse" size={56} />
        <h2 className="text-2xl font-bold font-display text-[#1e1b4b]">Application Pending Approval</h2>
        <p className="text-sm text-[#9490b8] leading-relaxed">
          Your profile for <strong className="text-[#1e1b4b]">"{profile.business_name}"</strong> has been registered. Our administration team is validating bank account details and tax compliance.
        </p>
        <div className="bg-[#f8f7ff] border border-[rgba(99,102,241,0.1)] rounded-2xl p-4 text-xs text-[#9490b8] leading-relaxed">
          Validation is usually completed within 24 business hours. You'll receive a WhatsApp alert once active!
        </div>
      </div>
    );
  }

  // CASE 3: Active Seller Panel
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-10">
      
      {/* Header Profile Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] bg-brand-cyan/15 text-[#6366f1] px-2.5 py-1 rounded font-bold uppercase tracking-wider">
            Approved Seller Hub
          </span>
          <h1 className="text-2xl font-bold font-display text-[#1e1b4b] mt-1.5">{profile.business_name}</h1>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'orders'
                ? 'bg-gradient-neon text-white font-bold'
                : 'bg-white border border-[rgba(99,102,241,0.1)] text-[#9490b8] hover:text-[#1e1b4b]'
            }`}
          >
            Shipment Orders
          </button>
          <button
            onClick={() => setActiveTab('add-product')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'add-product'
                ? 'bg-gradient-neon text-white font-bold'
                : 'bg-white border border-[rgba(99,102,241,0.1)] text-[#9490b8] hover:text-[#1e1b4b]'
            }`}
          >
            Add New Product
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel border-[rgba(99,102,241,0.1)] rounded-2xl p-5 shadow-lg">
            <span className="text-[10px] text-[#b4b0d0] font-bold block uppercase tracking-wider">Sales Revenue</span>
            <span className="text-xl font-extrabold text-[#6366f1] font-display mt-1.5 block">{formatCurrency(stats.totalRevenue)}</span>
          </div>
          <div className="glass-panel border-[rgba(99,102,241,0.1)] rounded-2xl p-5 shadow-lg">
            <span className="text-[10px] text-[#b4b0d0] font-bold block uppercase tracking-wider">Active Deals</span>
            <span className="text-xl font-extrabold text-brand-gold font-display mt-1.5 block">{stats.activeGroups} open</span>
          </div>
          <div className="glass-panel border-[rgba(99,102,241,0.1)] rounded-2xl p-5 shadow-lg">
            <span className="text-[10px] text-[#b4b0d0] font-bold block uppercase tracking-wider">Orders Confirmed</span>
            <span className="text-xl font-extrabold text-[#1e1b4b] font-display mt-1.5 block">{stats.completedOrders} orders</span>
          </div>
          <div className="glass-panel border-[rgba(99,102,241,0.1)] rounded-2xl p-5 shadow-lg">
            <span className="text-[10px] text-[#b4b0d0] font-bold block uppercase tracking-wider">Pending Approvals</span>
            <span className="text-xl font-extrabold text-[#9490b8] font-display mt-1.5 block">{stats.pendingProducts} items</span>
          </div>
        </div>
      )}

      {/* TAB 1: SHIPMENT QUEUE */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold font-display text-[#1e1b4b]">Pending Dispatch Shipments</h2>
          
          {orders.length === 0 ? (
            <div className="glass-panel border border-dashed border-[rgba(99,102,241,0.15)] rounded-2xl py-16 text-center text-[#b4b0d0]">
              No orders received on your listings yet. Keep listing deals!
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
              <table className="w-full text-left border-collapse bg-white">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-bold text-[#6b6560] uppercase tracking-wider bg-[#faf8f4]">
                    <th className="py-4 px-6">Order ID</th>
                    <th className="py-4 px-6">Product details</th>
                    <th className="py-4 px-6">Buyer info</th>
                    <th className="py-4 px-6">Escrow total</th>
                    <th className="py-4 px-6">Fulfillment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 font-mono text-[10px] text-[#6b6560]">#{ord.id}</td>
                      <td className="py-4 px-6">
                        <strong className="text-[#12100e] block">{ord.product_name}</strong>
                        <span className="text-[10px] text-[#6b6560]">SKU: {ord.product_sku || 'N/A'}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-[#12100e] block font-medium">{ord.buyer_name}</span>
                        <span className="text-[10px] text-[#6b6560]">{ord.buyer_phone}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-[#5b21b6] font-bold block">{formatCurrency(ord.total_amount)}</span>
                        <span className="text-[10px] text-[#6b6560]">Qty: {ord.quantity}</span>
                      </td>
                      <td className="py-4 px-6">
                        {ord.status === 'confirmed' ? (
                          <button
                            onClick={() => setShippingOrderId(ord.id)}
                            className="bg-brand-blue text-white font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1 cursor-pointer hover:opacity-90 active:scale-95"
                          >
                            <Truck size={12} />
                            Dispatch Courier
                          </button>
                        ) : ord.status === 'shipped' ? (
                          <div className="space-y-0.5">
                            <span className="bg-blue-500/10 text-blue-600 border border-blue-500/20 text-[9px] font-bold px-2 py-0.5 rounded-full inline-block">SHIPPED</span>
                            <span className="text-[10px] text-[#6b6560] block">{ord.courier_name}</span>
                            <span className="text-[10px] text-[#5b21b6] block font-mono select-all font-bold">#{ord.tracking_number}</span>
                          </div>
                        ) : (
                          <span className="bg-gray-100 text-[#12100e] border border-gray-200 text-[9px] font-bold px-2 py-0.5 rounded-full inline-block uppercase">{ord.status}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ADD PRODUCT */}
      {activeTab === 'add-product' && (
        <div className="glass-panel border-[rgba(99,102,241,0.1)] rounded-3xl p-6 md:p-8 shadow-xl max-w-4xl mx-auto">
          <h2 className="text-lg font-bold font-display text-[#1e1b4b] mb-6 flex items-center gap-2">
            <PlusCircle className="text-[#6366f1]" size={20} />
            Register Product and Group Buying Tiers
          </h2>

          <form onSubmit={handleAddProduct} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-[#9490b8] font-semibold uppercase">Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. UltraFit Sports Bluetooth Earbuds"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-3 px-4 text-xs text-[#1e1b4b]"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#9490b8] font-semibold uppercase">SKU Reference</label>
                <input
                  type="text"
                  placeholder="e.g. ULTRAFIT-EB-01"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-3 px-4 text-xs text-[#1e1b4b]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-[#9490b8] font-semibold uppercase">Description</label>
              <textarea
                placeholder="List features, parameters, sizes, and compatibility specifications..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-3 px-4 text-xs text-[#1e1b4b]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-[#9490b8] font-semibold uppercase">Category Mapping</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-3 px-4 text-xs text-[#4c4775] focus:outline-none"
                  required
                >
                  <option value="">Choose category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-[#9490b8] font-semibold uppercase">Inventory Stock</label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-3 px-4 text-xs text-[#1e1b4b]"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-[#9490b8] font-semibold uppercase">Product Image</label>
                <div className="flex gap-4 items-center">
                  {imageUrl ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[rgba(99,102,241,0.15)] bg-[#f8f7ff] flex-shrink-0 group">
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] text-red-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl border border-dashed border-[rgba(99,102,241,0.2)] bg-[#f8f7ff] flex items-center justify-center flex-shrink-0">
                      <Store size={20} className="text-gray-600" />
                    </div>
                  )}
                  <div className="flex-grow">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="product-image-file"
                    />
                    <label
                      htmlFor="product-image-file"
                      className="inline-block bg-white/5 border border-[rgba(99,102,241,0.15)] text-[#1e1b4b] rounded-xl py-2.5 px-4 text-xs font-semibold hover:bg-white/10 cursor-pointer text-center"
                    >
                      Choose Image File
                    </label>
                    <p className="text-[10px] text-[#b4b0d0] mt-1">Accepts PNG, JPG (Max 2MB)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Tiers Inputs */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Tag size={16} className="text-[#5b21b6]" />
                <span className="text-xs font-bold text-[#12100e] uppercase">Co-Buying Pricing Discount Tiers</span>
              </div>

              <div className="bg-[#faf8f4] border border-gray-200 rounded-xl p-3 text-[10px] text-[#6b6560] leading-normal flex gap-2">
                <HelpCircle className="text-[#5b21b6] flex-shrink-0" size={16} />
                Pricing validation is strict: Tier prices must follow descending format as group size expands. e.g. Solo Price (₹100) &gt; Size 2 (₹90) &gt; Size 3 (₹80) &gt; Size 5 (₹70) &gt; Size 10 (₹50).
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#6b6560] font-semibold uppercase block">Solo Price (1 Client)</label>
                  <input
                    type="number"
                    placeholder="₹ Original"
                    value={tier1}
                    onChange={(e) => setTier1(e.target.value)}
                    className="w-full bg-[#faf8f4] border border-gray-200 rounded-xl py-2 px-3 text-xs text-[#12100e] font-semibold text-center focus:outline-none focus:border-[#5b21b6]"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#6b6560] font-semibold uppercase block">Size 2 Price</label>
                  <input
                    type="number"
                    placeholder="₹ Discount"
                    value={tier2}
                    onChange={(e) => setTier2(e.target.value)}
                    className="w-full bg-[#faf8f4] border border-gray-200 rounded-xl py-2 px-3 text-xs text-[#12100e] font-semibold text-center focus:outline-none focus:border-[#5b21b6]"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#6b6560] font-semibold uppercase block">Size 3 Price</label>
                  <input
                    type="number"
                    placeholder="₹ Discount"
                    value={tier3}
                    onChange={(e) => setTier3(e.target.value)}
                    className="w-full bg-[#faf8f4] border border-gray-200 rounded-xl py-2 px-3 text-xs text-[#12100e] font-semibold text-center focus:outline-none focus:border-[#5b21b6]"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#6b6560] font-semibold uppercase block">Size 5 Price</label>
                  <input
                    type="number"
                    placeholder="₹ Discount"
                    value={tier5}
                    onChange={(e) => setTier5(e.target.value)}
                    className="w-full bg-[#faf8f4] border border-gray-200 rounded-xl py-2 px-3 text-xs text-[#12100e] font-semibold text-center focus:outline-none focus:border-[#5b21b6]"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#6b6560] font-semibold uppercase block">Size 10 (Best Price)</label>
                  <input
                    type="number"
                    placeholder="₹ Lowest"
                    value={tier10}
                    onChange={(e) => setTier10(e.target.value)}
                    className="w-full bg-[#faf8f4] border border-gray-200 rounded-xl py-2 px-3 text-xs text-[#12100e] font-semibold text-center focus:outline-none focus:border-[#5b21b6]"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-neon text-white font-bold rounded-xl py-3.5 flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
            >
              Register Product & Tiers
              <Plus size={16} />
            </button>
          </form>
        </div>
      )}

      {/* DISPATCH COURIER MODAL */}
      {shippingOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 md:p-8 space-y-6 relative border border-[rgba(99,102,241,0.15)] glow-cyan">
            
            <h3 className="text-xl font-bold font-display text-[#1e1b4b]">Fulfill & Dispatch Order #{shippingOrderId}</h3>
            
            <form onSubmit={handleShipOrder} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-[#9490b8] font-bold uppercase">Courier Name / Shipping Provider</label>
                <input
                  type="text"
                  placeholder="e.g. Delhivery, BlueDart, DHL"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-2.5 px-3.5 text-xs text-[#1e1b4b]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#9490b8] font-bold uppercase">Tracking Code / AWB Number</label>
                <input
                  type="text"
                  placeholder="e.g. 192830293022"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-2.5 px-3.5 text-xs text-[#1e1b4b] font-mono"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShippingOrderId(null)}
                  className="flex-1 bg-white/5 border border-[rgba(99,102,241,0.15)] text-[#1e1b4b] rounded-xl py-2.5 text-xs font-semibold hover:bg-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={shippingSubmitting}
                  className="flex-1 bg-brand-cyan text-white rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer hover:opacity-90 disabled:opacity-50"
                >
                  {shippingSubmitting ? 'Submitting...' : 'Ship Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
