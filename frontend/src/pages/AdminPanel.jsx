"use client";

import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Link, Navigate } from 'react-router-dom';
import { 
  ShieldAlert, BarChart3, FolderHeart, Users, ListFilter, Percent, 
  Trash2, Check, X, RefreshCw, Plus, Calendar, AlertTriangle, ShieldCheck, Tag, Info, Package, Lock, Menu, TrendingUp, Clock, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  const { isLoggedIn, role } = useAuth();

  // Navigation state
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'categories', 'sellers', 'products', 'coupons', 'customers'
  const [sidebarOpen, setSidebarOpen] = useState(false);


  // Data states
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
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

  // Security Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

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
      } else if (activeTab === 'orders') {
        const ordRes = await api.get('/admin/orders');
        setOrders(ordRes.data.orders || []);
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

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error('New passwords do not match');
    }
    setPasswordSubmitting(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      toast.success('Admin password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleCardTilt = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -12;
    card.style.transform = `perspective(800px) rotateX(${y}deg) rotateY(${x}deg) translateZ(8px)`;
  };
  const handleCardReset = (e) => {
    e.currentTarget.style.transform = '';
  };

  if (!isLoggedIn || role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  const renderTabTitle = () => {
    switch (activeTab) {
      case 'overview': return 'Dashboard Metrics';
      case 'categories': return 'Category Matrix';
      case 'sellers': return 'Seller Validation';
      case 'products': return 'Product Moderation';
      case 'coupons': return 'Escrow Coupons';
      case 'customers': return 'Customer Database';
      case 'orders': return 'Platform Orders';
      case 'security': return 'Security Settings';
      default: return 'Admin Portal';
    }
  };

  const NAV_ITEMS = [
    { tab: 'overview', icon: BarChart3, label: 'Dashboard Metrics' },
    { tab: 'categories', icon: FolderHeart, label: 'Category Matrix' },
    { tab: 'sellers', icon: Users, label: 'Seller Validation' },
    { tab: 'products', icon: ListFilter, label: 'Product Moderation' },
    { tab: 'coupons', icon: Percent, label: 'Escrow Coupons' },
    { tab: 'customers', icon: Users, label: 'Customer Database' },
    { tab: 'orders', icon: Package, label: 'Platform Orders' },
    { tab: 'security', icon: Lock, label: 'Security' },
  ];

  return (
    <>
      {/* Mobile Hamburger + Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 panel-header-light h-14 flex items-center px-4 gap-3">
        <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-[rgba(91,33,182,0.06)] transition-colors">
          <Menu size={20} className="text-[#5b21b6]" />
        </button>
        <Link to="/" className="flex items-center">
          <img src="/slabofy-logo.png" alt="Slabofy" style={{ height: 32, width: 'auto', objectFit: 'contain' }} />
        </Link>
      </div>

      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <>
          <div className="drawer-overlay lg:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="drawer-panel sidebar-light lg:hidden flex flex-col">
            <div className="h-14 flex items-center px-5 border-b border-[rgba(91,33,182,0.08)]">
              <Link to="/" onClick={() => setSidebarOpen(false)}>
                <img src="/slabofy-logo.png" alt="Slabofy" style={{ height: 34, width: 'auto', objectFit: 'contain' }} />
              </Link>
            </div>
            <div className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              <div className="text-[9px] font-black uppercase text-[#c4c0d8] tracking-[0.15em] px-3 py-3">System</div>
              {NAV_ITEMS.map((item, i) => (
                <button
                  key={item.tab}
                  onClick={() => { setActiveTab(item.tab); setSidebarOpen(false); }}
                  className={`nav-item-light stagger-${i+1} ${activeTab === item.tab ? 'active' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                    activeTab === item.tab
                      ? 'bg-[#5b21b6] text-white shadow-md shadow-violet-500/25'
                      : 'bg-[rgba(91,33,182,0.06)] text-[#9490b8]'
                  }`}>
                    <item.icon size={15} />
                  </div>
                  <span className="flex-1">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Desktop Layout */}
      <div className="flex h-screen overflow-hidden" style={{
        background: `
          radial-gradient(ellipse 60% 50% at 10% 10%, rgba(91,33,182,0.06) 0%, transparent 60%),
          radial-gradient(ellipse 50% 60% at 90% 90%, rgba(240,80,53,0.05) 0%, transparent 55%),
          radial-gradient(ellipse 70% 40% at 50% 50%, rgba(245,158,11,0.04) 0%, transparent 70%),
          #faf8f4
        `
      }}>
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex w-60 xl:w-64 flex-shrink-0 sidebar-light flex-col relative overflow-hidden">
          <div className="orb-ambient w-48 h-48 bg-violet-200/30 -top-12 -left-12" style={{ animationDelay: '-3s' }} />

          {/* Logo */}
          <div className="h-16 flex items-center px-5 border-b border-[rgba(91,33,182,0.08)] relative z-10">
            <Link to="/" className="flex items-center">
              <img src="/slabofy-logo.png" alt="Slabofy — Buy Together. Save Together." style={{ height: 38, width: 'auto', objectFit: 'contain' }} />
            </Link>
          </div>

          {/* Nav items */}
          <div className="flex-1 p-3 space-y-0.5 overflow-y-auto relative z-10">
            <div className="text-[9px] font-black uppercase text-[#c4c0d8] tracking-[0.15em] px-3 py-3">System</div>
            {NAV_ITEMS.map((item, i) => (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab)}
                className={`nav-item-light animate-nav-slide stagger-${i+1} ${activeTab === item.tab ? 'active' : ''}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                  activeTab === item.tab
                    ? 'bg-[#5b21b6] text-white shadow-md shadow-violet-500/25'
                    : 'bg-[rgba(91,33,182,0.06)] text-[#9490b8]'
                }`}>
                  <item.icon size={15} />
                </div>
                <span className="flex-1">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Bottom user strip */}
          <div className="p-3 border-t border-[rgba(91,33,182,0.08)] relative z-10">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[rgba(91,33,182,0.04)] border border-[rgba(91,33,182,0.08)]">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#5b21b6] to-[#4338ca] flex items-center justify-center text-white text-xs font-black">A</div>
              <div>
                <div className="text-xs font-bold text-[#12100e]">System Admin</div>
                <div className="text-[9px] text-[#9490b8]">Full Access</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden pt-14 lg:pt-0">
          {/* Desktop Header */}
          <header className="hidden lg:flex panel-header-light h-16 items-center justify-between px-6 xl:px-8 flex-shrink-0 z-10">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <h1 className="text-base font-display font-black text-[#12100e] leading-none">{renderTabTitle()}</h1>
                <p className="text-[10px] text-[#9490b8] font-medium mt-0.5">Slabofy Administration</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={fetchAdminData} className="p-2.5 rounded-xl bg-[rgba(91,33,182,0.06)] hover:bg-[rgba(91,33,182,0.12)] transition-colors text-[#5b21b6]">
                <RefreshCw size={15} />
              </button>
              <div className="flex items-center gap-2.5 bg-[rgba(91,33,182,0.04)] border border-[rgba(91,33,182,0.1)] rounded-2xl px-3 py-2">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#5b21b6] to-[#4338ca] flex items-center justify-center text-white text-xs font-black">A</div>
                <span className="text-xs font-bold text-[#12100e]">Admin</span>
              </div>
            </div>
          </header>

          {/* Scrollable Main Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-24 lg:pb-8 w-full max-w-[1400px] mx-auto">
            <div className="w-full space-y-6">
        
        {/* Loading Indicator */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 animate-fade-in">
            {[1,2,3,4].map(i => (
              <div key={i} className="skeleton h-32 rounded-2xl" />
            ))}
          </div>
        ) : (
          /* Dynamic Tabs Render */
          <>
            {/* OVERVIEW PANEL */}
            {activeTab === 'overview' && stats && (
              <div key={activeTab} className="space-y-6 animate-tab-morph">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold font-display text-[#1e1b4b]">Platform KPIs</h2>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {[
                    { label: 'GMV', value: formatCurrency(stats.totalRevenue), icon: TrendingUp, color: '#5b21b6', bg: 'rgba(91,33,182,0.1)', orbColor: 'rgba(91,33,182,0.15)' },
                    { label: 'Completed Deals', value: `${stats.completedDeals}`, icon: CheckCircle2, color: '#059669', bg: 'rgba(5,150,105,0.1)', orbColor: 'rgba(5,150,105,0.12)' },
                    { label: 'Active Groups', value: `${stats.activeGroups}`, icon: Users, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', orbColor: 'rgba(245,158,11,0.12)' },
                    { label: 'Pending Review', value: `${stats.pendingProducts}`, icon: Clock, color: '#f05035', bg: 'rgba(240,80,53,0.1)', orbColor: 'rgba(240,80,53,0.12)' },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={`stat-card-v2 animate-spring-up stagger-${i+1} card-3d`}
                      onMouseMove={handleCardTilt}
                      onMouseLeave={handleCardReset}
                    >
                      {/* Ambient corner orb */}
                      <div style={{
                        position: 'absolute', top: -30, right: -30,
                        width: 120, height: 120, borderRadius: '50%',
                        background: item.orbColor, filter: 'blur(30px)', pointerEvents: 'none'
                      }} />
                      {/* Shine overlay */}
                      <div className="card-3d-shine" />
                      {/* Content */}
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div style={{ background: item.bg, color: item.color, padding: '8px', borderRadius: '12px', display: 'inline-flex' }}>
                            <item.icon size={18} />
                          </div>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color, boxShadow: `0 0 8px ${item.color}` }} />
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#9490b8] mb-1">{item.label}</div>
                        <div className="text-2xl font-black font-display text-[#12100e] animate-stat-reveal">{item.value}</div>
                      </div>
                    </div>
                  ))}
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
              <div key={activeTab} className="space-y-6 animate-tab-morph">
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
                          <tr key={cat.id} className="table-row-v2 hover:bg-gray-50 transition-colors">
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
              <div key={activeTab} className="space-y-6 animate-tab-morph">
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
                          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-[#b4b0d0] mt-2 font-mono">
                            <span>Type: {sel.business_type || 'N/A'}</span>
                            <span>GSTIN: {sel.gstin || 'N/A'}</span>
                            <span>PAN: {sel.pan_number || 'N/A'}</span>
                            <span>AADHAR: {sel.aadhar_number || 'N/A'}</span>
                            <span className="w-full text-[#6b6560]">Legal Address: {sel.business_address || 'N/A'}</span>
                            
                            {/* Shiprocket Pickup Address */}
                            <div className="w-full bg-[#faf8f4] border border-[rgba(99,102,241,0.15)] rounded-xl p-2.5 my-1 text-[#1e1b4b]">
                              <span className="font-bold text-[#4338ca] block">📦 Shiprocket Pickup Location:</span>
                              <span>Contact: {sel.pickup_name || sel.name} ({sel.pickup_phone || sel.phone})</span> &nbsp;|&nbsp;
                              <span>PIN: {sel.pickup_pincode || 'N/A'}</span> &nbsp;|&nbsp;
                              <span>City/State: {sel.pickup_city || 'N/A'}, {sel.pickup_state || 'N/A'}</span>
                              <div className="text-[9px] text-[#6b6560] mt-0.5">Address: {sel.pickup_address || sel.business_address || 'N/A'}</div>
                              {sel.shiprocket_pickup_id && (
                                <div className="text-[9px] text-green-700 font-bold mt-1">
                                  ✓ Shiprocket Location ID: <span className="font-mono">{sel.shiprocket_pickup_id}</span>
                                </div>
                              )}
                            </div>

                            <span>Bank A/C: {sel.bank_account || 'N/A'}</span>
                            <span>IFSC: {sel.ifsc || 'N/A'}</span>
                            
                            {sel.kyc_document_url && (
                              <a 
                                href={`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${sel.kyc_document_url}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-[#4338ca] hover:underline font-bold flex items-center gap-1"
                              >
                                View KYC Document
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2.5">
                          {!sel.is_approved ? (
                            <button
                              onClick={() => handleApproveSeller(sel.id)}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                            >
                              <CheckCircle2 size={14} />
                              Approve & Register Shiprocket
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
              <div key={activeTab} className="space-y-6 animate-tab-morph">
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
                            <div className="flex gap-2 mt-2 pt-1">
                              <span className="text-[9px] font-bold text-[#5b21b6] bg-[rgba(91,33,182,0.08)] border border-[rgba(91,33,182,0.2)] px-2 py-1 rounded-lg">
                                Max {prod.max_group_size} members
                              </span>
                              <span className="text-[9px] font-bold text-[#b45309] bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] px-2 py-1 rounded-lg">
                                {prod.group_window_hours}h window
                              </span>
                            </div>
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
              <div key={activeTab} className="space-y-6 animate-tab-morph">
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
                          placeholder="e.g. SLABOFY50"
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
                          <tr key={c.id} className="table-row-v2 hover:bg-gray-50 transition-colors">
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
              <div key={activeTab} className="space-y-6 animate-tab-morph">
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
                          <tr key={c.id} className="table-row-v2 hover:bg-gray-50 transition-colors">
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

            {/* PLATFORM ORDERS */}
            {activeTab === 'orders' && (
              <div key={activeTab} className="space-y-6 animate-tab-morph">
                <h2 className="text-xl font-bold font-display text-[#1e1b4b]">Global Network Orders</h2>
                
                <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
                  <table className="w-full text-left border-collapse bg-white whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-gray-100 text-[10px] font-bold text-[#6b6560] uppercase tracking-wider bg-[#faf8f4]">
                        <th className="py-4 px-5">Order ID & Date</th>
                        <th className="py-4 px-5">Buyer</th>
                        <th className="py-4 px-5">Merchant</th>
                        <th className="py-4 px-5">Item / Qty</th>
                        <th className="py-4 px-5">Buy Type</th>
                        <th className="py-4 px-5">Financials</th>
                        <th className="py-4 px-5">Status</th>
                        <th className="py-4 px-5">Shipment / AWB</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="py-8 text-center text-gray-400">No platform orders found.</td>
                        </tr>
                      ) : (
                        orders.map((o) => (
                          <tr key={o.id} className="table-row-v2 hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-5">
                              <span className="block font-mono text-[10px] text-[#12100e] font-bold">#{o.id}</span>
                              <span className="block text-[#6b6560] text-[10px] mt-0.5">
                                {new Date(o.created_at).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="py-4 px-5">
                              <span className="block font-bold text-[#1e1b4b]">{o.buyer_name}</span>
                              <span className="block text-[#6b6560] text-[10px] mt-0.5 font-mono">{o.buyer_phone}</span>
                            </td>
                            <td className="py-4 px-5 font-semibold text-[#1e1b4b]">
                              {o.seller_business_name}
                            </td>
                            <td className="py-4 px-5">
                              <span className="block font-semibold text-[#5b21b6]">{o.product_name}</span>
                              <span className="block text-[#6b6560] text-[10px] mt-0.5 font-mono">Qty: {o.quantity} | {o.product_sku}</span>
                            </td>
                            <td className="py-4 px-5">
                              {!o.group_id ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 uppercase">
                                  Solo Order
                                </span>
                              ) : (
                                <div>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-brand-gold/20 text-brand-gold uppercase">
                                    Group ({o.group_target_size})
                                  </span>
                                  <span className="block text-[10px] text-[#9490b8] mt-1 font-semibold uppercase">
                                    Status: {o.group_status}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-5">
                              <span className="block font-bold text-[#f05035]">{formatCurrency(o.total_amount)}</span>
                              <span className="block text-[#6b6560] text-[10px] mt-0.5 font-bold uppercase">
                                Cut: {o.commission_pct}%
                              </span>
                            </td>
                            <td className="py-4 px-5">
                              <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                                o.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                o.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                o.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                                o.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {o.status}
                              </span>
                            </td>
                            {/* Shipment / AWB Column */}
                            <td className="py-4 px-5">
                              {o.awb_code || o.shiprocket_order_id ? (
                                <div>
                                  {o.awb_code && (
                                    <span className="block font-mono text-[10px] font-bold text-[#5b21b6]" title="AWB Code">
                                      AWB: {o.awb_code}
                                    </span>
                                  )}
                                  {o.courier_name_sr && (
                                    <span className="block text-[10px] text-[#6b6560] mt-0.5">{o.courier_name_sr}</span>
                                  )}
                                  {o.shipment_status && (
                                    <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                      o.shipment_status === 'delivered' ? 'bg-green-100 text-green-700' :
                                      o.shipment_status === 'in_transit' ? 'bg-blue-100 text-blue-700' :
                                      o.shipment_status === 'pickup_scheduled' ? 'bg-purple-100 text-purple-700' :
                                      o.shipment_status === 'courier_pending' ? 'bg-amber-100 text-amber-700' :
                                      o.shipment_status === 'cancelled' || o.shipment_status === 'rto' ? 'bg-red-100 text-red-700' :
                                      'bg-gray-100 text-gray-500'
                                    }`}>
                                      {o.shipment_status.replace(/_/g, ' ')}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] text-gray-400 italic">Not dispatched</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* SECURITY SETTINGS */}
            {activeTab === 'security' && (
              <div className="max-w-2xl animate-fade-in space-y-6">
                <h2 className="text-xl font-bold font-display text-[#1e1b4b]">Security Settings</h2>
                <div className="glass-panel border-[rgba(99,102,241,0.1)] rounded-3xl p-6 md:p-8 shadow-xl">
                  <h3 className="text-lg font-bold font-display text-[#1e1b4b] mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                    <Lock className="text-[#6366f1]" size={20} />
                    Change Admin Password
                  </h3>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <input
                      type="password"
                      placeholder="Current Password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-3 px-4 text-sm text-[#1e1b4b]"
                      required
                    />
                    <input
                      type="password"
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-3 px-4 text-sm text-[#1e1b4b]"
                      required
                    />
                    <input
                      type="password"
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-3 px-4 text-sm text-[#1e1b4b]"
                      required
                    />
                    <button
                      type="submit"
                      disabled={passwordSubmitting}
                      className="w-full bg-[#1e1b4b] text-white font-bold rounded-xl py-3.5 mt-4 hover:bg-[#2d2966] disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {passwordSubmitting ? 'Updating...' : 'Change Password'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </>
        )}

          </div>
        </div>
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
    </>
  );
}