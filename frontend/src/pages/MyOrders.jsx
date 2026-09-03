"use client";

import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBag, Users, Truck, ShieldCheck, RefreshCw,
  Package, Clock, CheckCircle, ChevronRight, LogOut, FileText, Share2, Copy, Lock, Trash2, X, AlertTriangle, User
} from 'lucide-react';
import toast from 'react-hot-toast';
import useScrollReveal from '../hooks/useScrollReveal';
import { Link } from 'react-router-dom';
import OTPLoginModal from '../components/OTPLoginModal';
import InvoiceModal from '../components/InvoiceModal';

const ORDER_STEPS = [
  { key: ['pending', 'confirmed', 'shipped', 'delivered'], label: 'Placed', icon: <ShoppingBag size={16} /> },
  { key: ['confirmed', 'shipped', 'delivered'], label: 'Confirmed', icon: <ShieldCheck size={16} /> },
  { key: ['shipped', 'delivered'], label: 'Shipped', icon: <Truck size={16} /> },
  { key: ['delivered'], label: 'Delivered', icon: <CheckCircle size={16} /> },
];

function getStepState(stepKeys, status) {
  if (status === 'cancelled' || status === 'refunded') return 'cancelled';
  if (stepKeys.includes(status)) return 'done';
  // Check if this is the current step
  const currentIdx = ORDER_STEPS.findIndex(s => s.key[0] === status);
  const stepIdx = ORDER_STEPS.findIndex(s => s.key === stepKeys);
  return currentIdx >= 0 && stepIdx > currentIdx ? 'pending' : 'done';
}

function OrderTimeline({ status }) {
  if (status === 'cancelled') return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.2)', borderRadius: 999, padding: '5px 14px', fontSize: '0.72rem', fontWeight: 700, color: '#e11d48' }}>
      Order Cancelled
    </div>
  );
  if (status === 'refunded') return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 999, padding: '5px 14px', fontSize: '0.72rem', fontWeight: 700, color: '#7c3aed' }}>
      Refunded
    </div>
  );

  const statusOrder = ['pending', 'confirmed', 'shipped', 'delivered'];
  const currentIdx = statusOrder.indexOf(status);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {ORDER_STEPS.map((step, i) => {
        const isDone = i <= currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <React.Fragment key={step.label}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div className={`timeline-step-icon ${isCurrent ? 'current' : isDone ? 'done' : 'pending'}`}>
                {step.icon}
              </div>
              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: isDone ? '#5b21b6' : '#c8c3bd', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                {step.label}
              </span>
            </div>
            {i < ORDER_STEPS.length - 1 && (
              <div className={`timeline-connector ${isDone && i < currentIdx ? 'done' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function MyOrders() {
  const { isLoggedIn, user, updateProfile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loginModalOpen, setLoginModalOpen] = useState(!isLoggedIn);
  const [activeTab, setActiveTab] = useState('orders');

  // Live Tracking Modal State
  const [trackingModalOrder, setTrackingModalOrder] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Invoice Modal State
  const [invoiceModalOrder, setInvoiceModalOrder] = useState(null);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Profile Form State
  const [profileName, setProfileName] = useState('');
  const [profileData, setProfileData] = useState({ name: '', phone: '', address: '' });
  const revealRef = useScrollReveal();
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
    }
  }, [user]);

  useEffect(() => {
    if (isLoggedIn) {
      setLoginModalOpen(false);
      fetchOrders();
    } else {
      setLoading(false);
      setLoginModalOpen(true);
    }
  }, [isLoggedIn]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/orders');
      setOrders(res.data.orders || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) return toast.error('Name cannot be empty');
    setProfileSubmitting(true);
    try {
      await updateProfile({ name: profileName });
    } catch (err) {
      console.error(err);
    } finally {
      setProfileSubmitting(false);
    }
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

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  if (!isLoggedIn) return (
    <div style={{ background: '#faf8f4', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '0 24px', maxWidth: 420 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(91,33,182,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <ShoppingBag size={32} color="#5b21b6" />
        </div>
        <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1.5rem', marginBottom: 8 }}>View Your Orders</h2>
        <p style={{ color: '#6b6560', fontSize: '0.875rem', marginBottom: 28, lineHeight: 1.7 }}>
          Log in to view your full order history and co-buying team progress.
        </p>
        <button onClick={() => setLoginModalOpen(true)} className="btn-violet" style={{ margin: '0 auto', display: 'inline-flex' }}>
          Login with OTP
        </button>
        <OTPLoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
      </div>
    </div>
  );

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(91,33,182,0.15)', borderTopColor: '#5b21b6', animation: 'spin-slow 0.7s linear infinite' }} />
      <p style={{ color: '#a09a94', fontWeight: 600 }}>Loading order history...</p>
    </div>
  );

  return (
    <div className="mesh-violet" style={{ minHeight: '100vh', padding: '100px 24px 80px' }}>
      <div ref={revealRef} className="scroll-reveal-group" style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ marginBottom: 40 }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#5b21b6', textTransform: 'uppercase', letterSpacing: '0.14em', display: 'block', marginBottom: 10 }}>
            — Your Account
          </span>
          <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', color: '#12100e', marginBottom: 8, letterSpacing: '-0.03em' }}>
            My Account
          </h1>
          <p style={{ color: '#6b6560', fontSize: '0.875rem' }}>
            Track your group buying deals, order fulfillments, and manage your account security.
          </p>
        </div>

        {/* Custom Tabs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 30, borderBottom: '1px solid rgba(18,16,14,0.08)', paddingBottom: 16 }}>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              background: activeTab === 'orders' ? '#12100e' : 'transparent',
              color: activeTab === 'orders' ? '#fff' : '#6b6560',
              border: 'none', borderRadius: 999, padding: '8px 20px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            My Orders
          </button>
          <button
            onClick={() => setActiveTab('security')}
            style={{
              background: activeTab === 'security' ? '#12100e' : 'transparent',
              color: activeTab === 'security' ? '#fff' : '#6b6560',
              border: 'none', borderRadius: 999, padding: '8px 20px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            Profile & Security
          </button>
        </div>

        {activeTab === 'orders' && (
          orders.length === 0 ? (
          <div style={{ textAlign: 'center', background: '#fff', borderRadius: 28, border: '1px solid rgba(18,16,14,0.08)', padding: '60px 24px', boxShadow: '0 4px 20px rgba(18,16,14,0.04)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(91,33,182,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Package size={28} color="#5b21b6" />
            </div>
            <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1.2rem', marginBottom: 8 }}>No Orders Yet</h3>
            <p style={{ color: '#6b6560', fontSize: '0.875rem', marginBottom: 28, maxWidth: 320, margin: '0 auto 28px' }}>
              You haven't participated in any group buy deals yet. Discover active deals below!
            </p>
            <Link to="/" className="btn-violet" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Explore Deals <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="stagger-group" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {orders.map((order) => {
              let productImages = [];
              try { productImages = typeof order.product_images === 'string' ? JSON.parse(order.product_images) : (order.product_images || []); } catch { productImages = []; }
              const imgUrl = productImages?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=70';

              return (
                <div key={order.id} className="reveal-item" style={{
                  background: '#fff', borderRadius: 24,
                  border: '1px solid rgba(18,16,14,0.08)',
                  boxShadow: '0 2px 12px rgba(18,16,14,0.04)',
                  overflow: 'hidden', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(91,33,182,0.2)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(91,33,182,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(18,16,14,0.08)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(18,16,14,0.04)'; }}
                >
                  {/* Order card body */}
                  <div style={{ padding: '24px 28px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>

                    {/* Product image + info */}
                    <div style={{ display: 'flex', gap: 18, flex: '1 1 300px', minWidth: 0 }}>
                      <img
                        src={imgUrl}
                        alt={order.product_name}
                        style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 16, background: '#f2ede4', flexShrink: 0, border: '1px solid rgba(18,16,14,0.07)' }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#a09a94', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                          ORDER #{order.id}
                        </div>
                        <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#12100e', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}>
                          {order.product_name}
                        </h3>
                        <div style={{ fontSize: '0.8rem', color: '#6b6560', marginBottom: 8 }}>
                          Qty: {order.quantity} &nbsp;·&nbsp; Total: <span style={{ fontWeight: 700, color: '#5b21b6' }}>{fmt(order.total_amount)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {order.is_cod ? (
                            <span style={{ background: 'rgba(245,158,11,0.1)', color: '#b45309', border: '1px solid rgba(245,158,11,0.25)', fontSize: '0.62rem', fontWeight: 800, padding: '3px 10px', borderRadius: 999 }}>
                              Cash on Delivery
                            </span>
                          ) : (
                            <span style={{ background: 'rgba(91,33,182,0.08)', color: '#5b21b6', border: '1px solid rgba(91,33,182,0.2)', fontSize: '0.62rem', fontWeight: 800, padding: '3px 10px', borderRadius: 999 }}>
                              Pre-Auth Hold
                            </span>
                          )}
                          {order.group_id && (
                            <span style={{ background: 'rgba(5,150,105,0.08)', color: '#059669', border: '1px solid rgba(5,150,105,0.2)', fontSize: '0.62rem', fontWeight: 800, padding: '3px 10px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Users size={9} /> Group Buy
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{ width: 1, background: 'rgba(18,16,14,0.07)', alignSelf: 'stretch', flexShrink: 0 }} className="hidden md:block" />

                    {/* Right side: timeline + group + tracking */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: '0 0 auto', minWidth: 240 }}>
                      <OrderTimeline status={order.status} />

                      {/* Group deal link */}
                      {order.group_id && (
                        <Link to={`/group/${order.group_id}`} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          background: 'rgba(91,33,182,0.05)', border: '1px solid rgba(91,33,182,0.12)',
                          borderRadius: 12, padding: '10px 14px', textDecoration: 'none',
                          transition: 'all 0.2s',
                        }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(91,33,182,0.1)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(91,33,182,0.05)'; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(91,33,182,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Users size={13} color="#5b21b6" />
                            </div>
                            <div>
                              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#12100e' }}>Co-Buy Team</div>
                              <div style={{ fontSize: '0.6rem', color: order.group_status === 'complete' ? '#059669' : '#5b21b6', fontWeight: 700, textTransform: 'uppercase' }}>
                                {order.group_status}
                              </div>
                            </div>
                          </div>
                          <ChevronRight size={14} color="#5b21b6" />
                        </Link>
                      )}

                      {/* Shiprocket Tracking info */}
                      {(order.status === 'shipped' || order.status === 'delivered') && (
                        <div style={{ background: 'rgba(67,56,202,0.04)', border: '1px solid rgba(67,56,202,0.15)', borderRadius: 14, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Truck size={14} color="#4338ca" />
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#12100e' }}>
                                {order.courier_name_sr || order.courier_name || 'Courier Dispatched'}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.62rem', fontWeight: 800, color: order.status === 'delivered' ? '#059669' : '#4338ca', background: order.status === 'delivered' ? 'rgba(5,150,105,0.1)' : 'rgba(67,56,202,0.1)', padding: '2px 8px', borderRadius: 999, textTransform: 'uppercase' }}>
                              {order.shipment_status ? order.shipment_status.replace('_', ' ') : order.status}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', color: '#6b6560' }}>
                            AWB: <strong style={{ color: '#12100e' }}>{order.awb_code || order.tracking_number || 'Generated'}</strong>
                          </div>

                          <button
                            onClick={() => handleOpenTrackingModal(order)}
                            style={{
                              marginTop: 4,
                              background: '#4338ca',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 10,
                              padding: '8px 12px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6
                            }}
                          >
                            <RefreshCw size={12} /> Track Delivery Status
                          </button>
                        </div>
                      )}

                      {/* Official Tax Invoice Button */}
                      <button
                        type="button"
                        onClick={() => setInvoiceModalOrder(order)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          padding: '9px 14px',
                          borderRadius: 12,
                          border: '1.5px solid rgba(91, 33, 182, 0.25)',
                          background: '#ffffff',
                          color: '#5b21b6',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          marginTop: 2
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(91, 33, 182, 0.08)';
                          e.currentTarget.style.borderColor = '#5b21b6';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = '#ffffff';
                          e.currentTarget.style.borderColor = 'rgba(91, 33, 182, 0.25)';
                        }}
                        title="View and Print Official GST Tax Invoice"
                      >
                        <FileText size={13} /> View / Print Tax Invoice
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {activeTab === 'security' && (
          <div className="stagger-group" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            {/* Update Profile Card */}
            <div className="reveal-item" style={{ background: '#fff', borderRadius: 24, border: '1px solid rgba(18,16,14,0.08)', boxShadow: '0 2px 12px rgba(18,16,14,0.04)', padding: '32px' }}>
              <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#12100e', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={20} color="#5b21b6" /> Profile Information
              </h2>
              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  style={{ background: '#f8f7ff', border: '1px solid rgba(91,33,182,0.15)', borderRadius: 12, padding: '12px 16px', fontSize: '0.9rem', color: '#12100e' }}
                  required
                />
                <button
                  type="submit"
                  disabled={profileSubmitting}
                  style={{ background: '#12100e', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: '0.9rem', fontWeight: 800, cursor: profileSubmitting ? 'not-allowed' : 'pointer', opacity: profileSubmitting ? 0.7 : 1, marginTop: 8 }}
                >
                  {profileSubmitting ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
            </div>

            {/* Change Password Card */}
            <div className="reveal-item" style={{ background: '#fff', borderRadius: 24, border: '1px solid rgba(18,16,14,0.08)', boxShadow: '0 2px 12px rgba(18,16,14,0.04)', padding: '32px' }}>
              <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#12100e', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock size={20} color="#5b21b6" /> Change Password
              </h2>
              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
                <input
                  type="password"
                  placeholder="Current Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{ background: '#f8f7ff', border: '1px solid rgba(91,33,182,0.15)', borderRadius: 12, padding: '12px 16px', fontSize: '0.9rem', color: '#12100e' }}
                  required
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ background: '#f8f7ff', border: '1px solid rgba(91,33,182,0.15)', borderRadius: 12, padding: '12px 16px', fontSize: '0.9rem', color: '#12100e' }}
                  required
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ background: '#f8f7ff', border: '1px solid rgba(91,33,182,0.15)', borderRadius: 12, padding: '12px 16px', fontSize: '0.9rem', color: '#12100e' }}
                  required
                />
                <button
                  type="submit"
                  disabled={passwordSubmitting}
                  style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: '0.9rem', fontWeight: 800, cursor: passwordSubmitting ? 'not-allowed' : 'pointer', opacity: passwordSubmitting ? 0.7 : 1, marginTop: 8 }}
                >
                  {passwordSubmitting ? 'Updating...' : 'Change Password'}
                </button>
              </form>
            </div>

            {/* Danger Zone Card */}
            <div className="reveal-item" style={{ background: '#fff0f0', borderRadius: 24, border: '1px solid rgba(220,38,38,0.2)', padding: '32px' }}>
              <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#dc2626', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trash2 size={20} /> Danger Zone
              </h2>
              <p style={{ color: '#991b1b', fontSize: '0.85rem', marginBottom: 24, lineHeight: 1.6 }}>
                Deleting your account is permanent. This will anonymize your profile but retain past order data for compliance. You will immediately be logged out.
              </p>
              <button
                onClick={() => setDeleteConfirmOpen(true)}
                style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer' }}
              >
                Delete Account
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 24, padding: 32, position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <button onClick={() => setDeleteConfirmOpen(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#a09a94' }}><X size={20}/></button>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(220,38,38,0.1)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <AlertTriangle size={28} />
            </div>
            <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#12100e', marginBottom: 8 }}>Delete Account?</h3>
            <p style={{ fontSize: '0.875rem', color: '#6b6560', marginBottom: 24, lineHeight: 1.5 }}>Are you absolutely sure you want to delete your customer account? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setDeleteConfirmOpen(false)} style={{ flex: 1, background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 12, padding: '14px', fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDeleteAccount} disabled={deleteSubmitting} style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: '0.9rem', fontWeight: 800, cursor: deleteSubmitting ? 'not-allowed' : 'pointer', opacity: deleteSubmitting ? 0.7 : 1 }}>
                {deleteSubmitting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIVE SHIPROCKET TRACKING MODAL */}
      {trackingModalOrder && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: 28, padding: 32, position: 'relative', boxShadow: '0 24px 48px rgba(0,0,0,0.2)', border: '1px solid rgba(18,16,14,0.08)' }}>
            <button 
              onClick={() => { setTrackingModalOrder(null); setTrackingData(null); }} 
              style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#a09a94' }}
            >
              <X size={20}/>
            </button>

            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4338ca', background: 'rgba(67,56,202,0.08)', padding: '4px 10px', borderRadius: 999 }}>
                Shiprocket Live Tracking
              </span>
              <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: '#12100e', marginTop: 10, marginBottom: 4 }}>
                Order #{trackingModalOrder.id}
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#6b6560', fontFamily: 'JetBrains Mono, monospace' }}>
                AWB: <strong style={{ color: '#12100e' }}>{trackingModalOrder.awb_code || trackingModalOrder.tracking_number || 'N/A'}</strong> | Courier: {trackingModalOrder.courier_name_sr || trackingModalOrder.courier_name || 'Assigned Courier'}
              </p>
            </div>

            {trackingLoading ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#a09a94', fontSize: '0.85rem' }}>
                <RefreshCw size={24} style={{ animation: 'spin-slow 0.8s linear infinite', margin: '0 auto 12px' }} />
                Fetching live checkpoint status...
              </div>
            ) : trackingData?.events && trackingData.events.length > 0 ? (
              <div style={{ maxHeight: 300, overflowY: 'auto', margin: '20px 0', display: 'flex', flexDirection: 'column', gap: 16, paddingRight: 8 }}>
                {trackingData.events.map((ev, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, position: 'relative' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#4338ca', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, flexShrink: 0 }}>
                      ✓
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <strong style={{ fontSize: '0.8rem', color: '#12100e', textTransform: 'uppercase' }}>{ev.status}</strong>
                        <span style={{ fontSize: '0.68rem', color: '#a09a94' }}>{ev.activity_at ? new Date(ev.activity_at).toLocaleString() : 'Recent'}</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#6b6560', margin: '2px 0 0' }}>{ev.remark}</p>
                      {ev.location && <span style={{ fontSize: '0.68rem', color: '#a09a94', display: 'block', marginTop: 2 }}>📍 {ev.location}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: '#faf8f4', border: '1px solid rgba(18,16,14,0.08)', borderRadius: 20, padding: 24, textAlign: 'center', margin: '20px 0' }}>
                <Package size={32} color="#a09a94" style={{ margin: '0 auto 10px' }} />
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#12100e', marginBottom: 4 }}>Pickup Scheduled</h4>
                <p style={{ fontSize: '0.75rem', color: '#6b6560', margin: 0, lineHeight: 1.5 }}>
                  The seller has prepared the package and the courier partner has been assigned for pickup.
                </p>
              </div>
            )}

            <button
              onClick={() => { setTrackingModalOrder(null); setTrackingData(null); }}
              style={{ width: '100%', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 14, padding: '12px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Official GST Tax Invoice Modal */}
      {invoiceModalOrder && (
        <InvoiceModal 
          order={invoiceModalOrder} 
          onClose={() => setInvoiceModalOrder(null)} 
        />
      )}
    </div>
  );
}
