"use client";

import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  ShieldAlert, BarChart3, FolderHeart, Users, ListFilter, Percent, 
  Trash2, Check, X, RefreshCw, Plus, Calendar, AlertTriangle, ShieldCheck, Tag, Info 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  const { isLoggedIn, role } = useAuth();

  // Navigation state
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'categories', 'sellers', 'products', 'coupons', 'customers'

  // Data states
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms states
  const [catName, setCatName] = useState('');
  const [catCommission, setCatCommission] = useState(5.0);

  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState('flat');
  const [couponValue, setCouponValue] = useState('');
  const [couponExpiry, setCouponExpiry] = useState('');
  const [couponMaxUses, setCouponMaxUses] = useState(100);

  const [rejectProductId, setRejectProductId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  useEffect(() => {
    if (isLoggedIn && role === 'admin') {
      fetchAdminData();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, role, activeTab]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const statsRes = await api.get('/admin/dashboard');
        setStats(statsRes.data.stats);
      } else if (activeTab === 'categories') {
        const catRes = await api.get('/admin/categories');
        setCategories(catRes.data.categories || []);
      } else if (activeTab === 'sellers') {
        const sellersRes = await api.get('/admin/sellers');
        setSellers(sellersRes.data.sellers || []);
      } else if (activeTab === 'products') {
        const prodRes = await api.get('/admin/products');
        setPendingProducts(prodRes.data.products || []);
      } else if (activeTab === 'coupons') {
        const coupRes = await api.get('/admin/coupons');
        setCoupons(coupRes.data.coupons || []);
      } else if (activeTab === 'customers') {
        const custRes = await api.get('/admin/customers');
        setCustomers(custRes.data.customers || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load admin dataset');
    } finally {
      setLoading(false);
    }
  };

  // CATEGORY OPERATIONS
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!catName) return;
    try {
      await api.post('/admin/categories', { name: catName, commission_pct: catCommission });
      toast.success('Category created successfully!');
      setCatName('');
      setCatCommission(5.0);
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create category');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      toast.success('Category deleted successfully');
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Deletion failed');
    }
  };

  // SELLER OPERATIONS
  const handleApproveSeller = async (id) => {
    try {
      await api.put(`/admin/sellers/${id}/approve`);
      toast.success('Seller approved & role updated successfully!');
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Approval failed');
    }
  };

  const handleSuspendSeller = async (id) => {
    if (!window.confirm('Suspend merchant and revoke seller role?')) return;
    try {
      await api.put(`/admin/sellers/${id}/suspend`);
      toast.success('Seller suspended successfully');
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Suspension failed');
    }
  };

  // PRODUCT OPERATIONS
  const handleApproveProduct = async (id) => {
    try {
      await api.put(`/admin/products/${id}/approve`);
      toast.success('Product listing approved and activated!');
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Approval failed');
    }
  };

  const handleRejectProduct = async (e) => {
    e.preventDefault();
    if (!rejectReason) return toast.error('Rejection reason is required');
    setRejectSubmitting(true);
    try {
      await api.put(`/admin/products/${rejectProductId}/reject`, { reason: rejectReason });
      toast.success('Product rejected successfully');
      setRejectProductId(null);
      setRejectReason('');
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Rejection failed');
    } finally {
      setRejectSubmitting(false);
    }
  };

  // COUPON OPERATIONS
  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode || !couponValue || !couponExpiry) return;
    try {
      await api.post('/admin/coupons', {
        code: couponCode,
        discount_type: couponType,
        discount_value: parseFloat(couponValue),
        expiry: couponExpiry,
        max_uses: parseInt(couponMaxUses)
      });
      toast.success('Coupon created successfully!');
      setCouponCode('');
      setCouponValue('');
      setCouponExpiry('');
      setCouponMaxUses(100);
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create coupon');
    }
  };

  const handleDeleteCoupon = async (id) => {
    try {
      await api.delete(`/admin/coupons/${id}`);
      toast.success('Coupon deactivated successfully');
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Deactivation failed');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (!isLoggedIn || role !== 'admin') {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-6">
        <ShieldAlert className="text-red-500 mx-auto" size={48} />
        <h3 className="text-xl font-bold font-display text-[#1e1b4b]">Access Denied</h3>
        <p className="text-sm text-[#9490b8]">Only platform system administrators have permission to access this page.</p>
        <Link to="/" className="inline-block bg-gradient-neon text-white font-semibold px-6 py-2.5 rounded-xl text-xs">
          Return to Homepage
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row gap-8 items-start">
      
      {/* Side Navigation panel */}
      <div className="w-full md:w-64 flex-shrink-0 glass-panel border-[rgba(99,102,241,0.1)] rounded-2xl p-4 space-y-2">
        <div className="p-3 border-b border-[rgba(99,102,241,0.1)] flex items-center gap-2 mb-4">
          <ShieldCheck className="text-[#6366f1]" size={20} />
          <span className="font-display font-bold text-[#1e1b4b] text-sm">System Admin</span>
        </div>

        <button
          onClick={() => setActiveTab('overview')}
          className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 cursor-pointer ${
            activeTab === 'overview' ? 'bg-gradient-neon text-white font-bold' : 'text-[#9490b8] hover:bg-white/5 hover:text-[#1e1b4b]'
          }`}
        >
          <BarChart3 size={16} />
          Dashboard Metrics
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 cursor-pointer ${
            activeTab === 'categories' ? 'bg-gradient-neon text-white font-bold' : 'text-[#9490b8] hover:bg-white/5 hover:text-[#1e1b4b]'
          }`}
        >
          <FolderHeart size={16} />
          Category Matrix
        </button>

        <button
          onClick={() => setActiveTab('sellers')}
          className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 cursor-pointer ${
            activeTab === 'sellers' ? 'bg-gradient-neon text-white font-bold' : 'text-[#9490b8] hover:bg-white/5 hover:text-[#1e1b4b]'
          }`}
        >
          <Users size={16} />
          Seller Validation
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 cursor-pointer ${
            activeTab === 'products' ? 'bg-gradient-neon text-white font-bold' : 'text-[#9490b8] hover:bg-white/5 hover:text-[#1e1b4b]'
          }`}
        >
          <ListFilter size={16} />
          Product Moderation
        </button>

        <button
          onClick={() => setActiveTab('coupons')}
          className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 cursor-pointer ${
            activeTab === 'coupons' ? 'bg-gradient-neon text-white font-bold' : 'text-[#9490b8] hover:bg-white/5 hover:text-[#1e1b4b]'
          }`}
        >
          <Percent size={16} />
          Escrow Coupons
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 cursor-pointer ${
            activeTab === 'customers' ? 'bg-gradient-neon text-white font-bold' : 'text-[#9490b8] hover:bg-white/5 hover:text-[#1e1b4b]'
          }`}
        >
          <Users size={16} />
          Customer Database
        </button>
      </div>

      {/* Main Contents Panel */}
      <div className="flex-grow w-full space-y-6">
        
        {/* Loading Indicator */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <RefreshCw className="animate-spin text-[#6366f1]" size={32} />
            <p className="text-sm text-[#9490b8]">Fetching administrative state...</p>
          </div>
        ) : (
          /* Dynamic Tabs Render */
          <>
            {/* OVERVIEW PANEL */}
            {activeTab === 'overview' && stats && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold font-display text-[#1e1b4b]">Platform KPIs</h2>
                  <button onClick={fetchAdminData} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-[#9490b8] hover:text-[#1e1b4b] cursor-pointer"><RefreshCw size={16} /></button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="glass-panel border-[rgba(99,102,241,0.1)] rounded-2xl p-6 shadow-xl">
                    <span className="text-[10px] text-[#b4b0d0] font-bold block uppercase tracking-wider">Gross Merchandise Volume (GMV)</span>
                    <span className="text-2xl font-extrabold text-[#6366f1] font-display mt-2 block">{formatCurrency(stats.totalRevenue)}</span>
                  </div>
                  <div className="glass-panel border-[rgba(99,102,241,0.1)] rounded-2xl p-6 shadow-xl">
                    <span className="text-[10px] text-[#b4b0d0] font-bold block uppercase tracking-wider">Completed Deals</span>
                    <span className="text-2xl font-extrabold text-emerald-400 font-display mt-2 block">{stats.completedDeals} deals</span>
                  </div>
                  <div className="glass-panel border-[rgba(99,102,241,0.1)] rounded-2xl p-6 shadow-xl">
                    <span className="text-[10px] text-[#b4b0d0] font-bold block uppercase tracking-wider">Active Deals Room</span>
                    <span className="text-2xl font-extrabold text-brand-gold font-display mt-2 block">{stats.activeGroups} active</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#faf8f4] border border-gray-200 rounded-2xl p-6">
                  <div className="text-center space-y-1">
                    <span className="text-[10px] text-[#6b6560] font-semibold block uppercase">New Registrations (7 Days)</span>
                    <strong className="text-lg text-[#12100e] font-display font-extrabold block">{stats.newUsers7Days} users</strong>
                  </div>
                  <div className="text-center space-y-1 border-t md:border-t-0 md:border-x border-gray-200 py-4 md:py-0">
                    <span className="text-[10px] text-[#6b6560] font-semibold block uppercase">Pending Seller Queue</span>
                    <strong className="text-lg text-[#5b21b6] font-display font-extrabold block">{stats.pendingSellers} profiles</strong>
                  </div>
                  <div className="text-center space-y-1">
                    <span className="text-[10px] text-[#6b6560] font-semibold block uppercase">Pending Products Queue</span>
                    <strong className="text-lg text-[#f59e0b] font-display font-extrabold block">{stats.pendingProducts} products</strong>
                  </div>
                </div>
              </div>
            )}

            {/* CATEGORIES MATRIX */}
            {activeTab === 'categories' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-xl font-bold font-display text-[#1e1b4b]">Categories Management</h2>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Create form */}
                  <div className="lg:col-span-4 glass-panel border-[rgba(99,102,241,0.1)] rounded-2xl p-5 shadow-lg space-y-4">
                    <h3 className="text-xs font-bold text-[#1e1b4b] uppercase tracking-wider">Add Category</h3>
                    <form onSubmit={handleCreateCategory} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-[#9490b8] font-semibold uppercase">Category Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Sports & Outdoors"
                          value={catName}
                          onChange={(e) => setCatName(e.target.value)}
                          className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-2.5 px-3 text-xs text-[#1e1b4b]"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-[#9490b8] font-semibold uppercase">Fee Commission (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="5.00"
                          value={catCommission}
                          onChange={(e) => setCatCommission(e.target.value)}
                          className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-2.5 px-3 text-xs text-[#1e1b4b]"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-gradient-neon text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus size={14} />
                        Create Category
                      </button>
                    </form>
                  </div>

                  {/* List categories */}
                  <div className="lg:col-span-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#faf8f4] border-b border-gray-100 text-[10px] font-bold text-[#6b6560] uppercase tracking-wider">
                          <th className="py-3 px-5">ID</th>
                          <th className="py-3 px-5">Name</th>
                          <th className="py-3 px-5">Escrow Fee</th>
                          <th className="py-3 px-5 text-right">Delete</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs">
                        {categories.map((cat) => (
                          <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3.5 px-5 font-mono text-[#6b6560]">{cat.id}</td>
                            <td className="py-3.5 px-5 font-semibold text-[#12100e]">{cat.name}</td>
                            <td className="py-3.5 px-5 text-[#5b21b6]">{cat.commission_pct}%</td>
                            <td className="py-3.5 px-5 text-right">
                              <button
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="text-red-400 hover:text-red-500 p-1.5 rounded bg-red-500/5 hover:bg-red-500/10 cursor-pointer transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
              </div>
            )}

            {/* SELLER APPROVALS QUEUE */}
            {activeTab === 'sellers' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-xl font-bold font-display text-[#1e1b4b]">Merchant Enrollment Queue</h2>

                {sellers.length === 0 ? (
                  <div className="glass-panel border border-dashed border-[rgba(99,102,241,0.15)] rounded-2xl py-16 text-center text-[#b4b0d0]">
                    No merchant enrollment profiles registered.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {sellers.map((sel) => (
                      <div key={sel.id} className="glass-panel border-[rgba(99,102,241,0.1)] rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-[rgba(99,102,241,0.15)] transition-all">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-[#1e1b4b] text-sm">{sel.business_name}</h4>
                            <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              sel.is_approved 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            }`}>
                              {sel.is_approved ? 'Approved' : 'Pending Verification'}
                            </span>
                          </div>
                          <p className="text-xs text-[#9490b8] font-medium">Owner: {sel.name} | Phone: {sel.phone} | Email: {sel.email || 'N/A'}</p>
                          <div className="flex flex-wrap gap-x-4 text-[10px] text-[#b4b0d0] mt-2 font-mono">
                            <span>GSTIN: {sel.gstin || 'N/A'}</span>
                            <span>Bank Account: {sel.bank_account || 'N/A'}</span>
                            <span>IFSC: {sel.ifsc || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="flex gap-2.5">
                          {!sel.is_approved ? (
                            <button
                              onClick={() => handleApproveSeller(sel.id)}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Check size={14} />
                              Approve merchant
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSuspendSeller(sel.id)}
                              className="border border-red-500/25 text-red-400 hover:bg-red-500/5 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <X size={14} />
                              Suspend Access
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PRODUCT APPROVALS QUEUE */}
            {activeTab === 'products' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-xl font-bold font-display text-[#1e1b4b]">Product Listing Queue</h2>

                {pendingProducts.length === 0 ? (
                  <div className="glass-panel border border-dashed border-[rgba(99,102,241,0.15)] rounded-2xl py-16 text-center text-[#b4b0d0]">
                    No co-buying products pending approval in queue.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {pendingProducts.map((prod) => (
                      <div key={prod.id} className="glass-panel border-[rgba(99,102,241,0.1)] rounded-2xl p-6 flex flex-col lg:flex-row gap-6 justify-between">
                        
                        {/* Left: Product Info */}
                        <div className="flex gap-4 items-start">
                          <img
                            src={prod.images ? (typeof prod.images === 'string' ? JSON.parse(prod.images) : prod.images)?.[0] : ''}
                            alt=""
                            className="w-20 h-20 object-cover rounded-xl bg-[#f8f7ff] flex-shrink-0"
                          />
                          <div className="space-y-1">
                            <span className="text-[10px] text-[#b4b0d0] font-bold uppercase tracking-wider">{prod.category_name} | Seller: {prod.business_name}</span>
                            <h3 className="text-base font-bold text-[#1e1b4b] leading-snug">{prod.name}</h3>
                            <p className="text-xs text-[#9490b8] line-clamp-2 leading-relaxed">{prod.description}</p>
                            <span className="text-[10px] text-[#b4b0d0] font-mono block">SKU: {prod.sku || 'N/A'} | Init Stock: {prod.stock}</span>
                          </div>
                        </div>

                        {/* Mid: Price Tiers list */}
                        <div className="bg-[#f8f7ff] border border-[rgba(99,102,241,0.1)] rounded-xl p-4 flex flex-col justify-center gap-1.5 w-full lg:w-64">
                          <span className="text-[9px] text-[#b4b0d0] font-bold uppercase tracking-wider block border-b border-[rgba(99,102,241,0.1)] pb-1">Co-Buying price tiers</span>
                          <div className="space-y-1 text-xs">
                            {prod.tiers?.map((t) => (
                              <div key={t.group_size} className="flex justify-between text-[#9490b8]">
                                <span>{t.group_size} member{t.group_size > 1 ? 's' : ''}:</span>
                                <strong className="text-[#1e1b4b]">{formatCurrency(t.price)}</strong>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex lg:flex-col justify-end gap-3 min-w-36">
                          <button
                            onClick={() => handleApproveProduct(prod.id)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <Check size={14} />
                            Approve Listing
                          </button>
                          <button
                            onClick={() => setRejectProductId(prod.id)}
                            className="border border-red-500/25 text-red-400 hover:bg-red-500/5 px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <X size={14} />
                            Reject Listing
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ESCROW COUPONS MANAGER */}
            {activeTab === 'coupons' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-xl font-bold font-display text-[#1e1b4b]">Escrow Promo Coupons</h2>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Create form */}
                  <div className="lg:col-span-4 glass-panel border-[rgba(99,102,241,0.1)] rounded-2xl p-5 shadow-lg space-y-4">
                    <h3 className="text-xs font-bold text-[#1e1b4b] uppercase tracking-wider">Generate Coupon</h3>
                    <form onSubmit={handleCreateCoupon} className="space-y-3.5 text-xs">
                      <div className="space-y-1">
                        <label className="text-[10px] text-[#9490b8] font-semibold uppercase">Coupon Code</label>
                        <input
                          type="text"
                          placeholder="e.g. SOCIAL50"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-2 px-3 text-[#1e1b4b] uppercase"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-[#9490b8] font-semibold uppercase">Type</label>
                          <select
                            value={couponType}
                            onChange={(e) => setCouponType(e.target.value)}
                            className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-2 px-3 text-[#4c4775] focus:outline-none"
                          >
                            <option value="flat">Flat ₹</option>
                            <option value="pct">Percentage %</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-[#9490b8] font-semibold uppercase">Discount Val</label>
                          <input
                            type="number"
                            placeholder="50"
                            value={couponValue}
                            onChange={(e) => setCouponValue(e.target.value)}
                            className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-2 px-3 text-[#1e1b4b]"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-[#9490b8] font-semibold uppercase">Expiry Date</label>
                          <input
                            type="date"
                            value={couponExpiry}
                            onChange={(e) => setCouponExpiry(e.target.value)}
                            className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-2 px-3 text-[#4c4775] focus:outline-none"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-[#9490b8] font-semibold uppercase">Max Uses Cap</label>
                          <input
                            type="number"
                            placeholder="100"
                            value={couponMaxUses}
                            onChange={(e) => setCouponMaxUses(e.target.value)}
                            className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-2 px-3 text-[#1e1b4b]"
                            required
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-gradient-neon text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer mt-2"
                      >
                        <Plus size={14} />
                        Generate Code
                      </button>
                    </form>
                  </div>

                  {/* List coupons */}
                  <div className="lg:col-span-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#faf8f4] border-b border-gray-100 text-[10px] font-bold text-[#6b6560] uppercase tracking-wider">
                          <th className="py-3 px-5">Promo Code</th>
                          <th className="py-3 px-5">Benefit</th>
                          <th className="py-3 px-5">Escrow Usage</th>
                          <th className="py-3 px-5">Status</th>
                          <th className="py-3 px-5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs">
                        {coupons.map((c) => (
                          <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3.5 px-5 font-mono font-bold text-[#12100e]">{c.code}</td>
                            <td className="py-3.5 px-5 text-[#5b21b6]">
                              {c.discount_type === 'flat' ? `${formatCurrency(c.discount_value)} Flat` : `${c.discount_value}% Discount`}
                            </td>
                            <td className="py-3.5 px-5 text-[#6b6560]">{c.uses_count} / {c.max_uses} uses</td>
                            <td className="py-3.5 px-5">
                              {c.is_active && new Date(c.expiry) > new Date() ? (
                                <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] font-bold px-2 py-0.5 rounded-full inline-block">Active</span>
                              ) : (
                                <span className="bg-gray-100 text-[#12100e] border border-gray-200 text-[9px] font-bold px-2 py-0.5 rounded-full inline-block">Deactive</span>
                              )}
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              {c.is_active && (
                                <button
                                  onClick={() => handleDeleteCoupon(c.id)}
                                  className="text-red-400 hover:text-red-500 p-1.5 rounded bg-red-500/5 hover:bg-red-500/10 cursor-pointer"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
              </div>
            )}

            {/* CUSTOMERS DATABASE VIEW */}
            {activeTab === 'customers' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold font-display text-[#1e1b4b]">Customer Database</h2>
                  <button onClick={fetchAdminData} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-[#9490b8] hover:text-[#1e1b4b] cursor-pointer"><RefreshCw size={16} /></button>
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#faf8f4] border-b border-gray-100 text-[10px] font-bold text-[#6b6560] uppercase tracking-wider">
                        <th className="py-3 px-5">ID</th>
                        <th className="py-3 px-5">Customer Info</th>
                        <th className="py-3 px-5">Contact Details</th>
                        <th className="py-3 px-5">Orders Placed</th>
                        <th className="py-3 px-5">Total Spent</th>
                        <th className="py-3 px-5">Joined Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {customers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-[#6b6560]">
                            No customers found in database.
                          </td>
                        </tr>
                      ) : (
                        customers.map((c) => (
                          <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-5 font-mono text-[#6b6560]">#{c.id}</td>
                            <td className="py-4 px-5">
                              <span className="font-bold text-[#12100e] block">{c.name}</span>
                              {c.is_verified && (
                                <span className="inline-flex items-center gap-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[8px] font-bold px-1.5 py-0.2 rounded mt-1">
                                  Verified Profile
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-5">
                              <span className="block text-[#6b6560]">{c.email || 'No email associated'}</span>
                              <span className="block text-[#6b6560] font-mono mt-0.5">{c.phone}</span>
                            </td>
                            <td className="py-4 px-5">
                              <span className="font-bold text-[#12100e]">{c.total_orders} orders</span>
                            </td>
                            <td className="py-4 px-5">
                              <span className="font-bold text-[#5b21b6]">{formatCurrency(c.total_spent)}</span>
                            </td>
                            <td className="py-4 px-5 text-[#6b6560]">
                              {new Date(c.created_at).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

      </div>

      {/* REJECT PRODUCT MODAL */}
      {rejectProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 md:p-8 space-y-6 relative border border-[rgba(99,102,241,0.15)] glow-cyan">
            
            <h3 className="text-xl font-bold font-display text-[#1e1b4b]">Reject Listing Application</h3>
            
            <form onSubmit={handleRejectProduct} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-[#9490b8] font-bold uppercase">Feedback Rejection Reason</label>
                <textarea
                  placeholder="e.g. Pricing tiers validation failed or image URL resolution is bad..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-2.5 px-3.5 text-xs text-[#1e1b4b] placeholder-[#b4b0d0] focus:outline-none"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setRejectProductId(null)}
                  className="flex-1 bg-white/5 border border-[rgba(99,102,241,0.15)] text-[#1e1b4b] rounded-xl py-2.5 text-xs font-semibold hover:bg-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejectSubmitting}
                  className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer hover:opacity-90 disabled:opacity-50"
                >
                  {rejectSubmitting ? 'Submitting...' : 'Reject Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
