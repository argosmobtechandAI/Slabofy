"use client";

import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBag, Users, Truck, ShieldCheck, RefreshCw,
  CheckCircle, Package, ArrowRight, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import OTPLoginModal from '../components/OTPLoginModal';

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
  const { isLoggedIn } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    if (isLoggedIn) fetchOrders();
    else setLoading(false);
  }, [isLoggedIn]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/orders');
      setOrders(res.data.orders || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
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
    <div style={{ background: '#faf8f4', minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Page header */}
        <div style={{ marginBottom: 40 }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#5b21b6', textTransform: 'uppercase', letterSpacing: '0.14em', display: 'block', marginBottom: 10 }}>
            — Your Account
          </span>
          <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', color: '#12100e', marginBottom: 8, letterSpacing: '-0.03em' }}>
            My Orders
          </h1>
          <p style={{ color: '#6b6560', fontSize: '0.875rem' }}>
            Track your group buying deals and order fulfillments.
          </p>
        </div>

        {orders.length === 0 ? (
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {orders.map((order) => {
              let productImages = [];
              try { productImages = typeof order.product_images === 'string' ? JSON.parse(order.product_images) : (order.product_images || []); } catch { productImages = []; }
              const imgUrl = productImages?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=70';

              return (
                <div key={order.id} style={{
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

                      {/* Tracking info */}
                      {order.status === 'shipped' && order.courier_name && (
                        <div style={{ background: 'rgba(67,56,202,0.05)', border: '1px solid rgba(67,56,202,0.15)', borderRadius: 12, padding: '10px 14px' }}>
                          <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#a09a94', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                            Tracking
                          </div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#12100e' }}>{order.courier_name}</div>
                          <div style={{ fontSize: '0.72rem', fontFamily: 'Inter, monospace', fontWeight: 700, color: '#5b21b6', marginTop: 2, userSelect: 'all' }}>
                            {order.tracking_number}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
