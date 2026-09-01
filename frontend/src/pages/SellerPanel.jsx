"use client";

import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Store, Tag, Plus, PlusCircle, ShoppingCart, RefreshCw, AlertTriangle, ArrowRight, ShieldCheck, CheckCircle2, Truck, HelpCircle, User, Lock, Trash2, X, UploadCloud, Video, Users, Menu, TrendingUp, Clock, Package } from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const PREDEFINED_COLORS = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Black', hex: '#12100e' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Gray', hex: '#6b7280' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Orange', hex: '#f97316' },
];

export default function SellerPanel() {
  const { isLoggedIn, user, updateProfile } = useAuth();
  
  // States
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'add-product'
  const [sidebarOpen, setSidebarOpen] = useState(false);


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
  const [imageUrls, setImageUrls] = useState([]);
  const [videoUrls, setVideoUrls] = useState([]);

  // Shiprocket Package Dimensions
  const [weightKg, setWeightKg] = useState('0.50');
  const [lengthCm, setLengthCm] = useState('10.0');
  const [breadthCm, setBreadthCm] = useState('10.0');
  const [heightCm, setHeightCm] = useState('5.0');
  
  // Dynamic Tiers State
  const [tiers, setTiers] = useState([
    { group_size: 1, price: '' },
    { group_size: '', price: '' }
  ]);

  // Group Buying Config
  const [maxGroupSize, setMaxGroupSize] = useState(10);
  const [groupWindowHours, setGroupWindowHours] = useState(24);

  // Helper functions for dynamic tiers
  const handleAddTier = () => {
    if (tiers.length >= 10) return toast.error('Maximum 10 tiers allowed');
    setTiers(prev => [...prev, { group_size: '', price: '' }]);
  };

  const handleRemoveTier = (idx) => {
    if (idx === 0) return; // solo tier is always required
    setTiers(prev => prev.filter((_, i) => i !== idx));
  };

  const handleTierChange = (idx, field, value) => {
    setTiers(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  // Variants State
  const [selectedColors, setSelectedColors] = useState([]);
  const [sizesInput, setSizesInput] = useState('');
  const [variantsMatrix, setVariantsMatrix] = useState([]);

  // Shiprocket 2-Step Dispatch Modal State
  const [shipModalOrder, setShipModalOrder] = useState(null);
  const [shipStep, setShipStep] = useState(1); // 1 = Review & Create Shipment, 2 = Pick Courier
  const [availableCouriers, setAvailableCouriers] = useState([]);
  const [selectedCourier, setSelectedCourier] = useState(null);
  const [shipLoading, setShipLoading] = useState(false);

  // Live Tracking Modal State
  const [trackingModalOrder, setTrackingModalOrder] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

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
    if (!name || !category) {
      return toast.error('Please fill in all product attributes');
    }

    // Validate max_group_size
    const parsedMax = parseInt(maxGroupSize);
    if (!parsedMax || parsedMax < 2 || parsedMax > 100) {
      return toast.error('Max Group Size must be between 2 and 100');
    }

    // Parse and validate tiers
    const parsedTiers = tiers.map(t => ({
      group_size: parseInt(t.group_size),
      price: parseFloat(t.price)
    }));

    if (parsedTiers.some(t => isNaN(t.group_size) || isNaN(t.price) || t.price <= 0)) {
      return toast.error('All tiers must have valid group size and price values');
    }

    const sizes = parsedTiers.map(t => t.group_size);
    if (new Set(sizes).size !== sizes.length) {
      return toast.error('Duplicate tier group sizes are not allowed');
    }

    if (!sizes.includes(1)) {
      return toast.error('A solo tier (group size = 1) is required');
    }

    if (parsedTiers.some(t => t.group_size > parsedMax)) {
      return toast.error(`All tier sizes must be ≤ Max Group Size (${parsedMax})`);
    }

    const maxTierSize = Math.max(...sizes);
    if (maxTierSize !== parsedMax) {
      return toast.error(`Your largest tier (size ${maxTierSize}) must equal Max Group Size (${parsedMax}). Add a tier for size ${parsedMax}.`);
    }

    // Validate descending prices
    const sorted = [...parsedTiers].sort((a, b) => a.group_size - b.group_size);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].price >= sorted[i - 1].price) {
        return toast.error(`Tier size ${sorted[i].group_size} price must be less than tier size ${sorted[i-1].group_size} price`);
      }
    }

    try {
      const payload = {
        name, sku, description,
        category_id: category,
        stock: parseInt(stock),
        images: imageUrls,
        videos: videoUrls,
        max_group_size: parsedMax,
        group_window_hours: parseInt(groupWindowHours),
        weight_kg: parseFloat(weightKg) || 0.50,
        length_cm: parseFloat(lengthCm) || 10.00,
        breadth_cm: parseFloat(breadthCm) || 10.00,
        height_cm: parseFloat(heightCm) || 5.00,
        tiers: parsedTiers,
        variants: variantsMatrix
      };

      await api.post('/products', payload);
      toast.success('Product submitted for administrator review!');

      // Reset all form state including new fields
      setName(''); setSku(''); setDescription(''); setStock(100);
      setImageUrls([]); setVideoUrls([]);
      setWeightKg('0.50'); setLengthCm('10.0'); setBreadthCm('10.0'); setHeightCm('5.0');
      setTiers([{ group_size: 1, price: '' }, { group_size: '', price: '' }]);
      setMaxGroupSize(10);
      setGroupWindowHours(24);
      setSelectedColors([]); setSizesInput(''); setVariantsMatrix([]);
      setActiveTab('orders');
      fetchSellerData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Product listing creation failed');
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + imageUrls.length > 10) {
      toast.error('You can upload a maximum of 10 images');
      return;
    }

    files.forEach(file => {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 2MB`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrls(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + videoUrls.length > 2) {
      toast.error('You can upload a maximum of 2 videos');
      return;
    }

    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 10MB`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoUrls(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleColorToggle = (colorName) => {
    let next;
    if (selectedColors.includes(colorName)) {
      next = selectedColors.filter(c => c !== colorName);
    } else {
      next = [...selectedColors, colorName];
    }
    setSelectedColors(next);
    regenerateVariants(next, sizesInput);
  };

  const handleSizesChange = (e) => {
    const val = e.target.value;
    setSizesInput(val);
    regenerateVariants(selectedColors, val);
  };

  const regenerateVariants = (colors, rawSizes) => {
    const sizes = rawSizes.split(',').map(s => s.trim()).filter(Boolean);
    if (colors.length === 0 && sizes.length === 0) {
      setVariantsMatrix([]);
      return;
    }
    const colorList = colors.length > 0 ? colors : [null];
    const sizeList = sizes.length > 0 ? sizes : [null];

    const newMatrix = [];
    colorList.forEach(color => {
      sizeList.forEach(size => {
        const existing = variantsMatrix.find(v => v.color === color && v.size === size);
        newMatrix.push({
          color,
          size,
          stock: existing ? existing.stock : 10,
          image_url: existing ? existing.image_url : null
        });
      });
    });
    setVariantsMatrix(newMatrix);
  };

  const handleVariantStockChange = (idx, value) => {
    const updated = [...variantsMatrix];
    updated[idx].stock = parseInt(value) || 0;
    setVariantsMatrix(updated);
  };

  // ==========================================
  // SHIPROCKET 2-STEP DISPATCH HANDLERS
  // ==========================================

  const handleOpenShipModal = async (order) => {
    setShipModalOrder(order);
    setSelectedCourier(null);

    // If shipment was already created and is awaiting courier selection
    if (order.shipment_status === 'courier_pending' && order.shiprocket_order_id) {
      setShipStep(2);
      setShipLoading(true);
      try {
        const res = await api.get(`/shiprocket/orders/${order.id}/couriers`);
        setAvailableCouriers(res.data.couriers || []);
      } catch (err) {
        toast.error('Failed to load couriers. You can regenerate shipment.');
        setShipStep(1);
      } finally {
        setShipLoading(false);
      }
    } else {
      setShipStep(1);
      setAvailableCouriers([]);
    }
  };

  /**
   * Step 1: Create Shipment & Fetch Real-Time Courier Rates
   */
  const handleCreateShipmentStep1 = async () => {
    if (!shipModalOrder) return;
    setShipLoading(true);
    try {
      const res = await api.post(`/shiprocket/orders/${shipModalOrder.id}/create-shipment`);
      setAvailableCouriers(res.data.couriers || []);
      setShipStep(2);
      toast.success('Shipment created on Shiprocket! Choose your courier partner.');
      fetchSellerData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create shipment on Shiprocket');
    } finally {
      setShipLoading(false);
    }
  };

  /**
   * Step 2: Assign Selected Courier & Generate AWB
   */
  const handleAssignCourierStep2 = async () => {
    if (!shipModalOrder || !selectedCourier) {
      return toast.error('Please select a courier partner');
    }
    setShipLoading(true);
    try {
      const res = await api.post(`/shiprocket/orders/${shipModalOrder.id}/assign-courier`, {
        courier_id: selectedCourier.courier_company_id,
        courier_name: selectedCourier.courier_name,
        rate: selectedCourier.rate,
        estimated_delivery_days: selectedCourier.estimated_delivery_days
      });
      toast.success(`Dispatched via ${selectedCourier.courier_name}! AWB: ${res.data.awb_code}`);
      setShipModalOrder(null);
      setSelectedCourier(null);
      fetchSellerData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign courier');
    } finally {
      setShipLoading(false);
    }
  };

  /**
   * Live Order Tracking Modal
   */
  const handleOpenTrackingModal = async (order) => {
    setTrackingModalOrder(order);
    setTrackingLoading(true);
    setTrackingData(null);
    try {
      const res = await api.get(`/shiprocket/orders/${order.id}/tracking`);
      setTrackingData(res.data);
    } catch (err) {
      toast.error('Unable to fetch live tracking at the moment');
    } finally {
      setTrackingLoading(false);
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
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteSubmitting(true);
    try {
      await api.delete('/auth/delete-account');
      toast.success('Account deleted successfully');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete account');
      setDeleteSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return <Navigate to="/seller/login" replace />;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <RefreshCw className="animate-spin text-[#6366f1]" size={32} />
        <p className="text-sm text-[#9490b8]">Opening merchant portal...</p>
      </div>
    );
  }

  // CASE 1: No Seller Profile
  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 text-center">
        <Store className="text-[#6366f1] mx-auto" size={48} />
        <h1 className="text-3xl font-bold font-display text-[#1e1b4b]">Merchant Center</h1>
        <p className="text-sm text-[#9490b8] leading-relaxed">You do not have a merchant profile registered.</p>
        <button 
          onClick={() => window.location.href = '/seller/login'} 
          className="bg-gradient-neon text-white font-bold rounded-xl py-3 px-6 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer inline-flex items-center gap-2"
        >
          Sign up as a Seller <ArrowRight size={18} />
        </button>
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

  const renderTabTitle = () => {
    switch (activeTab) {
      case 'orders': return 'Shipment Orders';
      case 'add-product': return 'Add New Product';
      case 'profile': return 'Profile Settings';
      default: return 'Merchant Center';
    }
  };

  // CASE 3: Active Seller Panel
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
            
            {stats && (
              <div className="mx-3 mt-4 mb-2 p-3 rounded-2xl bg-gradient-to-br from-[rgba(91,33,182,0.06)] to-[rgba(67,56,202,0.04)] border border-[rgba(91,33,182,0.1)]">
                <div className="text-[9px] uppercase font-black text-[#9490b8] tracking-wider mb-2">Quick Stats</div>
                <div className="flex justify-between">
                  <div className="text-center">
                    <div className="text-sm font-black text-[#5b21b6]">{stats.activeGroups}</div>
                    <div className="text-[8px] text-[#b4b0d0] font-semibold">Active</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-black text-[#059669]">{stats.completedOrders}</div>
                    <div className="text-[8px] text-[#b4b0d0] font-semibold">Orders</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-black text-[#f59e0b]">{stats.pendingProducts}</div>
                    <div className="text-[8px] text-[#b4b0d0] font-semibold">Pending</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              <div className="text-[9px] font-black uppercase text-[#c4c0d8] tracking-[0.15em] px-3 py-3">Merchant Tools</div>
              {[
                { tab: 'orders', icon: ShoppingCart, label: 'Shipment Orders' },
                { tab: 'add-product', icon: PlusCircle, label: 'Add New Product' },
                { tab: 'profile', icon: User, label: 'Profile Settings' },
              ].map((item, i) => (
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

          <div className="h-16 flex items-center px-5 border-b border-[rgba(91,33,182,0.08)] relative z-10">
            <Link to="/" className="flex items-center">
              <img src="/slabofy-logo.png" alt="Slabofy — Buy Together. Save Together." style={{ height: 38, width: 'auto', objectFit: 'contain' }} />
            </Link>
          </div>

          {stats && (
            <div className="mx-3 mt-4 mb-2 p-3 rounded-2xl bg-gradient-to-br from-[rgba(91,33,182,0.06)] to-[rgba(67,56,202,0.04)] border border-[rgba(91,33,182,0.1)] relative z-10">
              <div className="text-[9px] uppercase font-black text-[#9490b8] tracking-wider mb-2">Quick Stats</div>
              <div className="flex justify-between">
                <div className="text-center">
                  <div className="text-sm font-black text-[#5b21b6]">{stats.activeGroups}</div>
                  <div className="text-[8px] text-[#b4b0d0] font-semibold">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-black text-[#059669]">{stats.completedOrders}</div>
                  <div className="text-[8px] text-[#b4b0d0] font-semibold">Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-black text-[#f59e0b]">{stats.pendingProducts}</div>
                  <div className="text-[8px] text-[#b4b0d0] font-semibold">Pending</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 p-3 space-y-0.5 overflow-y-auto relative z-10">
            <div className="text-[9px] font-black uppercase text-[#c4c0d8] tracking-[0.15em] px-3 py-3">Merchant Tools</div>
            {[
              { tab: 'orders', icon: ShoppingCart, label: 'Shipment Orders' },
              { tab: 'add-product', icon: PlusCircle, label: 'Add New Product' },
              { tab: 'profile', icon: User, label: 'Profile Settings' },
            ].map((item, i) => (
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

          <div className="p-3 border-t border-[rgba(91,33,182,0.08)] relative z-10">
            <Link to="/" className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-[#9490b8] hover:text-[#5b21b6] transition-colors cursor-pointer">
              Exit to Store
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden pt-14 lg:pt-0">
          <header className="hidden lg:flex panel-header-light h-16 items-center justify-between px-6 xl:px-8 flex-shrink-0 z-10">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <h1 className="text-base font-display font-black text-[#12100e] leading-none">{renderTabTitle()}</h1>
                <p className="text-[10px] text-[#9490b8] font-medium mt-0.5">Slabofy Merchant Center</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5 bg-[rgba(91,33,182,0.04)] border border-[rgba(91,33,182,0.1)] rounded-2xl px-3 py-2">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#5b21b6] to-[#4338ca] flex items-center justify-center text-white text-xs font-black">
                  {profile?.business_name?.charAt(0).toUpperCase() || 'M'}
                </div>
                <span className="text-xs font-bold text-[#12100e]">{profile?.business_name || 'Merchant'}</span>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-24 lg:pb-8 w-full max-w-[1400px] mx-auto">
            <div className="w-full space-y-6">

      {/* Stats Cards Row */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Sales Revenue', value: formatCurrency(stats.totalRevenue), icon: '₹', gradient: 'from-[#5b21b6] to-[#4338ca]', shadow: 'rgba(91,33,182,0.25)' },
            { label: 'Active Deals',  value: `${stats.activeGroups} open`,      icon: '⚡', gradient: 'from-[#f59e0b] to-[#f05035]', shadow: 'rgba(245,158,11,0.25)' },
            { label: 'Orders Confirmed', value: `${stats.completedOrders}`,    icon: '✓',  gradient: 'from-[#059669] to-[#0d9488]', shadow: 'rgba(5,150,105,0.25)' },
            { label: 'Pending Approvals', value: `${stats.pendingProducts}`,   icon: '⏳', gradient: 'from-[#a855f7] to-[#5b21b6]', shadow: 'rgba(168,85,247,0.2)' },
          ].map((s, i) => (
            <div
              key={i}
              className={`stat-card-v2 animate-spring-up stagger-${i+1} card-3d`}
              onMouseMove={handleCardTilt}
              onMouseLeave={handleCardReset}
            >
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-[#9490b8] mb-2">{s.label}</div>
                  <div className="text-xl font-black font-display text-[#12100e] animate-stat-reveal">{s.value}</div>
                </div>
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white font-black text-sm`}
                     style={{ boxShadow: `0 8px 20px ${s.shadow}` }}>
                  {s.icon}
                </div>
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${s.gradient} opacity-40`} />
              <div className="card-3d-shine" />
            </div>
          ))}
        </div>
      )}

      {/* TAB 1: SHIPMENT QUEUE */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold font-display text-[#1e1b4b]">Pending Dispatch Shipments</h2>
          
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 animate-spring-up bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-[rgba(91,33,182,0.08)] flex items-center justify-center">
                <Package size={28} className="text-[#9490b8]" />
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-[#12100e] mb-1">No orders yet</div>
                <div className="text-xs text-[#9490b8]">Orders will appear here once buyers purchase your products.</div>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile: cards */}
              <div className="md:hidden space-y-3">
                {orders.map(order => (
                  <div key={order.id} className="bg-white rounded-2xl border border-[rgba(91,33,182,0.08)] p-4 shadow-sm animate-spring-up">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-xs font-black text-[#12100e]">#{order.id}</div>
                        <div className="text-[10px] text-[#9490b8]">{new Date(order.created_at).toLocaleDateString()}</div>
                      </div>
                      <span className={`badge-pill ${order.status === 'shipped' ? 'badge-emerald' : 'badge-amber'}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-[#12100e] mb-1">{order.product_name}</div>
                    <div className="text-xs text-[#6b6560]">Buyer: {order.buyer_name}</div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <div className="text-sm font-black text-[#5b21b6]">{formatCurrency(order.total_amount)}</div>
                      {order.status === 'confirmed' ? (
                        <button 
                          onClick={() => handleOpenShipModal(order)} 
                          className="text-xs font-bold bg-[#4338ca] text-white px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                        >
                          <Truck size={13} />
                          Dispatch Shiprocket
                        </button>
                      ) : order.status === 'shipped' ? (
                        <button 
                          onClick={() => handleOpenTrackingModal(order)}
                          className="text-xs font-bold bg-indigo-50 text-[#4338ca] border border-indigo-200 px-3 py-1.5 rounded-xl cursor-pointer"
                        >
                          Track #{order.awb_code || order.tracking_number || order.id}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-left border-collapse bg-white">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-bold text-[#6b6560] uppercase tracking-wider bg-[#faf8f4]">
                    <th className="py-4 px-6">Order ID & Date</th>
                    <th className="py-4 px-6">Product details</th>
                    <th className="py-4 px-6">Buyer info</th>
                    <th className="py-4 px-6">Buy Type</th>
                    <th className="py-4 px-6">Financials</th>
                    <th className="py-4 px-6">Shiprocket Fulfillment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="table-row-v2 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <span className="font-mono text-[10px] text-[#6b6560] block">#{ord.id}</span>
                        <span className="text-[10px] text-[#9490b8]">{new Date(ord.created_at).toLocaleDateString()}</span>
                      </td>
                      <td className="py-4 px-6">
                        <strong className="text-[#12100e] block">{ord.product_name}</strong>
                        <span className="text-[10px] text-[#6b6560]">SKU: {ord.product_sku || 'N/A'}</span>
                        <span className="text-[9px] text-[#9490b8] block">Weight: {ord.product_weight_kg || 0.5}kg | Dim: {ord.product_length_cm || 10}x{ord.product_breadth_cm || 10}x{ord.product_height_cm || 5}cm</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-[#12100e] block font-medium">{ord.buyer_name}</span>
                        <span className="text-[10px] text-[#6b6560]">{ord.buyer_phone}</span>
                        <span className="text-[9px] text-[#9490b8] block truncate max-w-[150px]">{ord.shipping_address}</span>
                      </td>
                      <td className="py-4 px-6">
                        {!ord.group_id ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 uppercase">
                            Solo Order
                          </span>
                        ) : (
                          <div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-brand-gold/20 text-brand-gold uppercase">
                              Group ({ord.group_target_size})
                            </span>
                            <span className="block text-[10px] text-[#9490b8] mt-1 font-semibold uppercase">
                              Status: {ord.group_status}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-[#5b21b6] font-bold block">{formatCurrency(ord.total_amount)}</span>
                        <span className="text-[10px] text-[#6b6560] block mb-1">Total Paid (Qty: {ord.quantity})</span>
                        <div className="pt-1 border-t border-gray-100">
                          <span className="text-[#10b981] font-bold block">{formatCurrency(ord.total_amount * (1 - ord.commission_pct / 100))}</span>
                          <span className="text-[9px] text-[#9490b8] font-bold uppercase">Net Payout (After {ord.commission_pct}% Cut)</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {ord.group_id && ord.group_status === 'active' ? (
                          <span className="bg-amber-100 text-amber-700 border border-amber-200 text-[9px] font-bold px-2 py-0.5 rounded-full inline-block uppercase">Waiting for Group</span>
                        ) : ord.status === 'confirmed' ? (
                          <button
                            onClick={() => handleOpenShipModal(ord)}
                            className="bg-[#4338ca] text-white font-bold px-3 py-2 rounded-xl text-[11px] flex items-center gap-1.5 cursor-pointer hover:bg-[#3730a3] active:scale-95 shadow-sm"
                          >
                            <Truck size={14} />
                            Dispatch Courier
                          </button>
                        ) : ord.status === 'shipped' ? (
                          <div className="space-y-1.5">
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold px-2 py-0.5 rounded-full inline-block">
                              {ord.shipment_status ? ord.shipment_status.replace('_', ' ').toUpperCase() : 'SHIPPED'}
                            </span>
                            <span className="text-[10px] text-[#12100e] font-semibold block">{ord.courier_name_sr || ord.courier_name}</span>
                            <button
                              onClick={() => handleOpenTrackingModal(ord)}
                              className="text-[10px] text-[#4338ca] font-mono font-bold hover:underline block cursor-pointer"
                            >
                              AWB: {ord.awb_code || ord.tracking_number || 'View'} &rarr;
                            </button>
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
            </>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>

            {/* Package Dimensions for Shiprocket Shipping */}
            <div className="bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck size={16} className="text-[#4338ca]" />
                  <span className="text-xs font-bold text-[#1e1b4b]">Shipping & Package Dimensions (Shiprocket)</span>
                </div>
                <span className="text-[10px] text-[#9490b8]">Required for live courier rates & dispatch</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#9490b8] font-bold uppercase">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.5"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl py-2 px-3 text-xs text-[#1e1b4b]"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-[#9490b8] font-bold uppercase">Length (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    placeholder="10"
                    value={lengthCm}
                    onChange={(e) => setLengthCm(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl py-2 px-3 text-xs text-[#1e1b4b]"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-[#9490b8] font-bold uppercase">Breadth (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    placeholder="10"
                    value={breadthCm}
                    onChange={(e) => setBreadthCm(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl py-2 px-3 text-xs text-[#1e1b4b]"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-[#9490b8] font-bold uppercase">Height (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    placeholder="5"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl py-2 px-3 text-xs text-[#1e1b4b]"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Media Uploads Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-[#9490b8] font-semibold uppercase">Product Images (Up to 10)</label>
                <div className="flex flex-wrap gap-4 items-center">
                  {imageUrls.map((url, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-[rgba(99,102,241,0.15)] bg-[#f8f7ff] flex-shrink-0 group">
                      <img src={url} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImageUrls(prev => prev.filter((_, index) => index !== i))}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] text-red-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {imageUrls.length < 10 && (
                    <div className="flex-grow">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        id="product-image-file"
                      />
                      <label
                        htmlFor="product-image-file"
                        className="inline-flex items-center gap-2 bg-white/5 border border-[rgba(99,102,241,0.15)] text-[#1e1b4b] rounded-xl py-2.5 px-4 text-xs font-semibold hover:bg-white/10 cursor-pointer text-center"
                      >
                        <UploadCloud size={14} /> Choose Images
                      </label>
                      <p className="text-[10px] text-[#b4b0d0] mt-1">Accepts PNG, JPG (Max 2MB/ea)</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-[#9490b8] font-semibold uppercase">Product Videos (Up to 2)</label>
                <div className="flex flex-wrap gap-4 items-center">
                  {videoUrls.map((url, i) => (
                    <div key={i} className="relative w-24 h-16 rounded-xl overflow-hidden border border-[rgba(99,102,241,0.15)] bg-[#f8f7ff] flex-shrink-0 group flex items-center justify-center">
                      <Video size={24} className="text-[#5b21b6]" />
                      <button
                        type="button"
                        onClick={() => setVideoUrls(prev => prev.filter((_, index) => index !== i))}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] text-red-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {videoUrls.length < 2 && (
                    <div className="flex-grow">
                      <input
                        type="file"
                        accept="video/*"
                        multiple
                        onChange={handleVideoUpload}
                        className="hidden"
                        id="product-video-file"
                      />
                      <label
                        htmlFor="product-video-file"
                        className="inline-flex items-center gap-2 bg-white/5 border border-[rgba(99,102,241,0.15)] text-[#1e1b4b] rounded-xl py-2.5 px-4 text-xs font-semibold hover:bg-white/10 cursor-pointer text-center"
                      >
                        <Video size={14} /> Choose Videos
                      </label>
                      <p className="text-[10px] text-[#b4b0d0] mt-1">Accepts MP4 (Max 10MB/ea)</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Product Variants Section */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Tag size={16} className="text-[#5b21b6]" />
                <span className="text-xs font-bold text-[#12100e] uppercase">Product Variants (Optional)</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3 md:col-span-2">
                  <label className="text-xs text-[#9490b8] font-semibold uppercase">Colors</label>
                  <div className="flex flex-wrap gap-2">
                    {PREDEFINED_COLORS.map(color => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => toggleColor(color.name)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${selectedColors.includes(color.name) ? 'border-[#5b21b6] bg-[rgba(91,33,182,0.1)] text-[#5b21b6]' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
                      >
                        <span className="w-3 h-3 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: color.hex }}></span>
                        {color.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-[#9490b8] font-semibold uppercase">Sizes (Comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. S, M, L, XL"
                    value={sizesInput}
                    onChange={(e) => setSizesInput(e.target.value)}
                    className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-3 px-4 text-xs text-[#1e1b4b]"
                  />
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleGenerateVariants}
                className="bg-[rgba(91,33,182,0.1)] text-[#5b21b6] font-bold text-xs py-2 px-4 rounded-xl border border-[rgba(91,33,182,0.2)] hover:bg-[rgba(91,33,182,0.15)] transition-colors"
              >
                Generate Variant Combinations
              </button>

              {variantsMatrix.length > 0 && (
                <div className="mt-4">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="py-2 text-xs font-bold text-[#6b6560]">Color</th>
                        <th className="py-2 text-xs font-bold text-[#6b6560]">Size</th>
                        <th className="py-2 text-xs font-bold text-[#6b6560]">Stock Quantity</th>
                        <th className="py-2 text-xs font-bold text-[#6b6560]">Variant Image</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variantsMatrix.map((variant, idx) => (
                        <tr key={idx} className="border-b border-gray-50 last:border-none">
                          <td className="py-3 text-xs text-[#12100e] font-semibold">
                            <span className="flex items-center gap-1.5">
                              {PREDEFINED_COLORS.find(c => c.name === variant.color) && (
                                <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: PREDEFINED_COLORS.find(c => c.name === variant.color).hex }}></span>
                              )}
                              {variant.color}
                            </span>
                          </td>
                          <td className="py-3 text-xs text-[#12100e] font-semibold">{variant.size}</td>
                          <td className="py-3">
                            <input
                              type="number"
                              min="0"
                              value={variant.stock}
                              onChange={(e) => handleVariantStockChange(idx, e.target.value)}
                              className="w-24 bg-[#faf8f4] border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-[#12100e] focus:outline-none focus:border-[#5b21b6]"
                            />
                          </td>
                          <td className="py-3">
                            {variant.image_url ? (
                              <div className="relative w-10 h-10 rounded overflow-hidden group">
                                <img src={variant.image_url} className="w-full h-full object-cover" />
                                <button type="button" onClick={() => {
                                  const updated = [...variantsMatrix];
                                  updated[idx].image_url = null;
                                  setVariantsMatrix(updated);
                                }} className="absolute inset-0 bg-black/50 text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100">Clear</button>
                              </div>
                            ) : (
                              <div>
                                <input type="file" accept="image/*" id={`var-img-${idx}`} className="hidden" onChange={(e) => handleVariantImageUpload(idx, e)} />
                                <label htmlFor={`var-img-${idx}`} className="cursor-pointer text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200 hover:bg-gray-200">
                                  Upload
                                </label>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Group Buying Configuration */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Users size={16} className="text-[#5b21b6]" />
                <span className="text-xs font-bold text-[#12100e] uppercase">Group Buying Configuration</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs text-[#9490b8] font-semibold uppercase">Max Group Size</label>
                  <p className="text-[10px] text-[#b4b0d0] leading-relaxed">
                    The maximum number of buyers in one group. Your largest pricing tier must match this number.
                  </p>
                  <input
                    type="number"
                    min={2}
                    max={100}
                    value={maxGroupSize}
                    onChange={(e) => setMaxGroupSize(e.target.value)}
                    className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-3 px-4 text-xs text-[#1e1b4b] font-semibold focus:outline-none focus:border-[#5b21b6]"
                    required
                  />
                  <p className="text-[10px] text-[#9490b8]">Range: 2 - 100 members</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-[#9490b8] font-semibold uppercase">Group Fill Time Window</label>
                  <p className="text-[10px] text-[#b4b0d0] leading-relaxed">
                    How long a group stays open for new buyers before it expires.
                  </p>
                  <select
                    value={groupWindowHours}
                    onChange={(e) => setGroupWindowHours(e.target.value)}
                    className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-3 px-4 text-xs text-[#4c4775] focus:outline-none focus:border-[#5b21b6]"
                    required
                  >
                    <option value={6}>6 Hours</option>
                    <option value={12}>12 Hours</option>
                    <option value={24}>24 Hours (1 Day)</option>
                    <option value={48}>48 Hours (2 Days)</option>
                    <option value={72}>72 Hours (3 Days)</option>
                    <option value={120}>5 Days</option>
                    <option value={168}>7 Days (Maximum)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dynamic Co-Buying Pricing Tiers */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Tag size={16} className="text-[#5b21b6]" />
                  <span className="text-xs font-bold text-[#12100e] uppercase">Co-Buying Pricing Tiers</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddTier}
                  className="flex items-center gap-1 text-[10px] font-bold text-[#5b21b6] bg-[rgba(91,33,182,0.08)] border border-[rgba(91,33,182,0.2)] px-3 py-1.5 rounded-lg hover:bg-[rgba(91,33,182,0.15)] transition-colors cursor-pointer"
                >
                  <Plus size={12} /> Add Tier
                </button>
              </div>

              <div className="bg-[#faf8f4] border border-gray-200 rounded-xl p-3 text-[10px] text-[#6b6560] leading-relaxed flex gap-2">
                <HelpCircle className="text-[#5b21b6] flex-shrink-0 mt-0.5" size={14} />
                <span>
                  Define any tier sizes you want. You must have a <strong>Solo tier (size 1)</strong> and your 
                  <strong> largest tier must equal your Max Group Size ({maxGroupSize})</strong>. 
                  Prices must strictly decrease as group size grows.
                </span>
              </div>

              <div className="space-y-3">
                {tiers.map((tier, idx) => (
                  <div key={idx} className="flex items-center gap-3 animate-spring-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                    <div className="flex-1 space-y-1">
                      {idx === 0 && <label className="text-[9px] text-[#9490b8] font-bold uppercase">Group Size</label>}
                      <input
                        type="number"
                        min={1}
                        max={maxGroupSize}
                        placeholder={idx === 0 ? '1 (Solo)' : `e.g. ${idx === 1 ? '5' : '10'}`}
                        value={idx === 0 ? 1 : tier.group_size}
                        readOnly={idx === 0}
                        onChange={(e) => handleTierChange(idx, 'group_size', e.target.value)}
                        className={`w-full bg-[#faf8f4] border rounded-xl py-2.5 px-3 text-xs text-[#12100e] font-semibold text-center focus:outline-none ${idx === 0 ? 'border-gray-100 text-[#9490b8] cursor-not-allowed' : 'border-gray-200 focus:border-[#5b21b6]'}`}
                      />
                    </div>

                    <span className="text-[#9490b8] text-xs mt-4">→</span>

                    <div className="flex-1 space-y-1">
                      {idx === 0 && <label className="text-[9px] text-[#9490b8] font-bold uppercase">Price (₹)</label>}
                      <input
                        type="number"
                        min={0}
                        placeholder="₹ Price"
                        value={tier.price}
                        onChange={(e) => handleTierChange(idx, 'price', e.target.value)}
                        className="w-full bg-[#faf8f4] border border-gray-200 rounded-xl py-2.5 px-3 text-xs text-[#12100e] font-semibold text-center focus:outline-none focus:border-[#5b21b6]"
                        required
                      />
                    </div>

                    <div className="mt-4 flex-shrink-0">
                      {idx === 0 ? (
                        <span className="text-[9px] font-bold text-[#9490b8] bg-gray-100 px-2 py-1 rounded-lg">SOLO</span>
                      ) : parseInt(tier.group_size) === parseInt(maxGroupSize) ? (
                        <span className="text-[9px] font-bold text-[#f59e0b] bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">BEST</span>
                      ) : (
                        <span className="text-[9px] font-bold text-[#5b21b6] bg-[rgba(91,33,182,0.08)] px-2 py-1 rounded-lg">GRP</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveTier(idx)}
                      disabled={idx === 0}
                      className={`mt-4 flex-shrink-0 p-1.5 rounded-lg transition-colors ${idx === 0 ? 'opacity-0 cursor-default' : 'text-red-400 hover:bg-red-50 hover:text-red-500 cursor-pointer'}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {tiers.length > 0 && parseInt(maxGroupSize) > 0 && (
                (() => {
                  const maxTierSize = Math.max(...tiers.map(t => parseInt(t.group_size) || 0));
                  return maxTierSize !== parseInt(maxGroupSize) ? (
                    <div className="flex items-center gap-2 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <AlertTriangle size={12} className="flex-shrink-0" />
                      Add a tier with group size <strong>{maxGroupSize}</strong> to match your Max Group Size.
                    </div>
                  ) : null;
                })()
              )}
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

      {/* TAB 3: PROFILE SETTINGS */}
      {activeTab === 'profile' && profile && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="glass-panel border-[rgba(99,102,241,0.1)] rounded-3xl p-6 md:p-8 shadow-xl">
            <h2 className="text-lg font-bold font-display text-[#1e1b4b] mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
              <User className="text-[#6366f1]" size={20} />
              Merchant Onboarding Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#b4b0d0] uppercase tracking-wider">Full Name</span>
                <p className="text-[#12100e] font-semibold">{profile.name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#b4b0d0] uppercase tracking-wider">Email Address</span>
                <p className="text-[#12100e] font-semibold">{profile.email}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#b4b0d0] uppercase tracking-wider">Phone Number</span>
                <p className="text-[#12100e] font-semibold">{profile.phone}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#b4b0d0] uppercase tracking-wider">Business Name</span>
                <p className="text-[#12100e] font-semibold">{profile.business_name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#b4b0d0] uppercase tracking-wider">Business Type</span>
                <p className="text-[#12100e] font-semibold">{profile.business_type}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#b4b0d0] uppercase tracking-wider">GSTIN</span>
                <p className="text-[#12100e] font-semibold">{profile.gstin || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#b4b0d0] uppercase tracking-wider">PAN Number</span>
                <p className="text-[#12100e] font-semibold">{profile.pan_number}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#b4b0d0] uppercase tracking-wider">Aadhar Number</span>
                <p className="text-[#12100e] font-semibold">{profile.aadhar_number}</p>
              </div>
              <div className="col-span-1 md:col-span-2 space-y-1">
                <span className="text-[10px] font-bold text-[#b4b0d0] uppercase tracking-wider">Business Address</span>
                <p className="text-[#12100e] font-semibold">{profile.business_address}</p>
              </div>
              <div className="col-span-1 md:col-span-2 space-y-1">
                <span className="text-[10px] font-bold text-[#b4b0d0] uppercase tracking-wider">KYC Document</span>
                {profile.kyc_document_url ? (
                  <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${profile.kyc_document_url}`} target="_blank" rel="noreferrer" className="text-brand-blue font-semibold hover:underline block">
                    View Uploaded Document
                  </a>
                ) : (
                  <p className="text-[#9490b8]">Not uploaded</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel border-[rgba(99,102,241,0.1)] rounded-3xl p-6 md:p-8 shadow-xl">
              <h2 className="text-lg font-bold font-display text-[#1e1b4b] mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                <Lock className="text-[#6366f1]" size={20} />
                Security Settings
              </h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <input
                  type="password"
                  placeholder="Current Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-2.5 px-3.5 text-sm text-[#1e1b4b]"
                  required
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-2.5 px-3.5 text-sm text-[#1e1b4b]"
                  required
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-2.5 px-3.5 text-sm text-[#1e1b4b]"
                  required
                />
                <button
                  type="submit"
                  disabled={passwordSubmitting}
                  className="w-full bg-[#6366f1] text-white font-bold rounded-xl py-3 mt-2 hover:bg-[#4f46e5] disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {passwordSubmitting ? 'Updating...' : 'Change Password'}
                </button>
              </form>
            </div>

            <div className="glass-panel border-red-100 rounded-3xl p-6 md:p-8 shadow-xl bg-red-50/50">
              <h2 className="text-lg font-bold font-display text-red-600 mb-2 flex items-center gap-2">
                <Trash2 size={20} />
                Danger Zone
              </h2>
              <p className="text-xs text-red-800 mb-6 leading-relaxed">
                Deleting your account is permanent. Your business profile will be anonymized, and all active product listings will be removed. Past orders will be retained for historical compliance.
              </p>
              <button
                onClick={() => setDeleteConfirmOpen(true)}
                className="bg-red-600 text-white font-bold rounded-xl py-3 px-6 hover:bg-red-700 transition-colors cursor-pointer"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 relative shadow-2xl">
            <button onClick={() => setDeleteConfirmOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20}/></button>
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold font-display text-[#1e1b4b] mb-2">Delete Account?</h3>
            <p className="text-sm text-[#6b6560] mb-6">Are you absolutely sure you want to delete your merchant account? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmOpen(false)} className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-3 text-sm font-bold cursor-pointer hover:bg-gray-200">Cancel</button>
              <button onClick={handleDeleteAccount} disabled={deleteSubmitting} className="flex-1 bg-red-600 text-white rounded-xl py-3 text-sm font-bold cursor-pointer hover:bg-red-700 disabled:opacity-50">
                {deleteSubmitting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHIPROCKET 2-STEP MANUAL DISPATCH MODAL */}
      {shipModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white rounded-3xl p-6 md:p-8 space-y-6 relative border border-gray-200 shadow-2xl">
            <button 
              onClick={() => setShipModalOrder(null)} 
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={20}/>
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#4338ca] flex items-center justify-center">
                <Truck size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold font-display text-[#1e1b4b]">
                  Shiprocket Dispatch — Order #{shipModalOrder.id}
                </h3>
                <p className="text-xs text-[#9490b8]">
                  {shipStep === 1 ? 'Step 1: Order & Dimensions Verification' : 'Step 2: Select Courier Partner'}
                </p>
              </div>
            </div>

            {/* Step 1: Verification & Generate Couriers */}
            {shipStep === 1 && (
              <div className="space-y-4">
                <div className="bg-[#faf8f4] border border-gray-200 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6b6560]">Product:</span>
                    <strong className="text-[#12100e] text-right">{shipModalOrder.product_name}</strong>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6b6560]">Buyer Destination:</span>
                    <strong className="text-[#12100e] text-right">{shipModalOrder.shipping_address}</strong>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6b6560]">Payment Type:</span>
                    <strong className={`uppercase ${shipModalOrder.is_cod ? 'text-amber-600' : 'text-green-600'}`}>
                      {shipModalOrder.is_cod ? 'Cash on Delivery (COD)' : 'Prepaid (Online)'}
                    </strong>
                  </div>
                  <div className="flex justify-between text-xs pt-2 border-t border-gray-200">
                    <span className="text-[#6b6560]">Package Dimensions:</span>
                    <span className="text-[#12100e] font-mono font-semibold">
                      {shipModalOrder.product_weight_kg || 0.5}kg | {shipModalOrder.product_length_cm || 10}x{shipModalOrder.product_breadth_cm || 10}x{shipModalOrder.product_height_cm || 5}cm
                    </span>
                  </div>
                </div>

                <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-3.5 flex items-start gap-2.5">
                  <ShieldCheck size={18} className="text-[#4338ca] flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#4c4775] leading-relaxed">
                    Clicking below will register this shipment on your Shiprocket account and fetch live courier rates, estimated delivery times, and coverage for the buyer's destination.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShipModalOrder(null)}
                    className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-3 text-xs font-bold hover:bg-gray-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateShipmentStep1}
                    disabled={shipLoading}
                    className="flex-[2] bg-[#4338ca] text-white rounded-xl py-3 text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#3730a3] disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-500/20"
                  >
                    {shipLoading ? 'Connecting to Shiprocket...' : 'Find Available Couriers & Rates →'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Courier Selection */}
            {shipStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#1e1b4b] uppercase tracking-wider">
                    Available Courier Partners ({availableCouriers.length})
                  </label>
                  <button 
                    onClick={handleCreateShipmentStep1}
                    className="text-[11px] text-[#4338ca] font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw size={12}/> Refresh Rates
                  </button>
                </div>

                {availableCouriers.length === 0 ? (
                  <div className="p-6 text-center bg-gray-50 rounded-2xl border border-gray-200">
                    <p className="text-xs text-[#6b6560]">No couriers found for this route or pincode.</p>
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
                    {availableCouriers.map((c) => {
                      const isSelected = selectedCourier?.courier_company_id === c.courier_company_id;
                      return (
                        <div
                          key={c.courier_company_id}
                          onClick={() => setSelectedCourier(c)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-[#4338ca] bg-indigo-50/60 shadow-sm ring-2 ring-[#4338ca]/20'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-[#4338ca] bg-[#4338ca]' : 'border-gray-300'
                            }`}>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                            <div>
                              <strong className="text-xs font-bold text-[#1e1b4b] block">{c.courier_name}</strong>
                              <span className="text-[10px] text-[#9490b8]">Est. Delivery: {c.estimated_delivery_days}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-sm font-black text-[#5b21b6] block">₹{c.rate}</span>
                            {c.cod_available ? (
                              <span className="text-[9px] font-bold text-green-600 uppercase">COD Supported</span>
                            ) : (
                              <span className="text-[9px] font-bold text-gray-400 uppercase">Prepaid Only</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShipStep(1)}
                    className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-3 text-xs font-bold hover:bg-gray-200 cursor-pointer"
                  >
                    &larr; Back
                  </button>
                  <button
                    type="button"
                    onClick={handleAssignCourierStep2}
                    disabled={!selectedCourier || shipLoading}
                    className="flex-[2] bg-green-600 text-white rounded-xl py-3 text-xs font-bold flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50 cursor-pointer shadow-md shadow-green-600/20"
                  >
                    {shipLoading ? 'Generating AWB & Scheduling...' : `Confirm & Dispatch (${selectedCourier ? selectedCourier.courier_name : 'Select Courier'})`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LIVE TRACKING MODAL */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 md:p-8 space-y-6 relative border border-gray-200 shadow-2xl">
            <button 
              onClick={() => { setTrackingModalOrder(null); setTrackingData(null); }} 
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={20}/>
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#4338ca] bg-indigo-50 px-2.5 py-1 rounded-full">
                Shiprocket Tracking
              </span>
              <h3 className="text-xl font-bold font-display text-[#1e1b4b] mt-2">
                Order #{trackingModalOrder.id}
              </h3>
              <p className="text-xs text-[#6b6560] font-mono mt-0.5">
                AWB: <strong className="text-[#1e1b4b]">{trackingModalOrder.awb_code || trackingModalOrder.tracking_number || 'N/A'}</strong> | Courier: {trackingModalOrder.courier_name_sr || trackingModalOrder.courier_name || 'Assigned Courier'}
              </p>
            </div>

            {trackingLoading ? (
              <div className="py-12 text-center text-xs text-[#9490b8] animate-pulse">
                Fetching latest shipment status from Shiprocket...
              </div>
            ) : trackingData?.events && trackingData.events.length > 0 ? (
              <div className="max-h-72 overflow-y-auto space-y-4 pr-2">
                {trackingData.events.map((ev, idx) => (
                  <div key={idx} className="flex items-start gap-3 relative">
                    {idx < trackingData.events.length - 1 && (
                      <div className="absolute left-2.5 top-6 bottom-0 w-0.5 bg-indigo-100" />
                    )}
                    <div className="w-5 h-5 rounded-full bg-[#4338ca] text-white flex items-center justify-center flex-shrink-0 z-10 text-[10px]">
                      ✓
                    </div>
                    <div className="flex-1 pb-3">
                      <div className="flex items-center justify-between">
                        <strong className="text-xs font-bold text-[#1e1b4b] uppercase">{ev.status}</strong>
                        <span className="text-[10px] text-[#9490b8]">{ev.activity_at ? new Date(ev.activity_at).toLocaleString() : 'Recent'}</span>
                      </div>
                      <p className="text-xs text-[#6b6560] mt-0.5">{ev.remark}</p>
                      {ev.location && <span className="text-[10px] text-[#9490b8] font-medium mt-0.5 block">📍 {ev.location}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#faf8f4] border border-gray-200 rounded-2xl p-6 text-center space-y-2">
                <Package size={28} className="mx-auto text-[#9490b8]" />
                <h4 className="text-xs font-bold text-[#1e1b4b]">Pickup Scheduled</h4>
                <p className="text-[11px] text-[#6b6560]">
                  Courier partner has been assigned and pickup is scheduled. Live checkpoint scans will appear once the parcel is scanned at the hub.
                </p>
              </div>
            )}

            <button
              onClick={() => { setTrackingModalOrder(null); setTrackingData(null); }}
              className="w-full bg-gray-100 text-gray-700 font-bold rounded-xl py-3 text-xs hover:bg-gray-200 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

          </div>
        </div>
        </div>
      </div>
        <div className="mobile-bottom-nav lg:hidden">
          {[
            { tab: 'orders', icon: ShoppingCart, label: 'Orders' },
            { tab: 'add-product', icon: PlusCircle, label: 'Add' },
            { tab: 'profile', icon: User, label: 'Profile' },
          ].map((item) => (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className={`mobile-nav-btn ${activeTab === item.tab ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
              <div className="mobile-nav-dot" />
            </button>
          ))}
        </div>
    </>
  );
}