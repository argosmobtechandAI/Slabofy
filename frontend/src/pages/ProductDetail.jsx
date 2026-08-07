"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBag, Users, Clock, Tag, RefreshCw, AlertTriangle,
  ArrowRight, ShieldCheck, Zap, RotateCcw, Truck, ChevronLeft, Flame
} from 'lucide-react';
import toast from 'react-hot-toast';
import OTPLoginModal from '../components/OTPLoginModal';

const AVATAR_COLORS = [
  ['#5b21b6', '#fff'], ['#f05035', '#fff'], ['#f59e0b', '#12100e'],
  ['#059669', '#fff'], ['#4338ca', '#fff'], ['#e11d48', '#fff'],
];

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [product, setProduct] = useState(null);
  const [activeGroups, setActiveGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => { fetchProductDetails(); }, [id]);

  const fetchProductDetails = async () => {
    setLoading(true); setError(null);
    try {
      const [detailRes, groupsRes] = await Promise.all([
        api.get(`/products/${id}`),
        api.get(`/groups?product_id=${id}`),
      ]);
      setProduct(detailRes.data.product);
      setActiveGroups(groupsRes.data.groups || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Product not found or database offline');
    } finally { setLoading(false); }
  };

  const handleCheckout = (targetSize, groupId = null) => {
    if (!isLoggedIn) { setLoginModalOpen(true); return; }
    navigate('/checkout', { state: { product_id: product.id, group_id: groupId, target_size: targetSize } });
  };

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(91,33,182,0.15)', borderTopColor: '#5b21b6', animation: 'spin-slow 0.7s linear infinite' }} />
      <p style={{ color: '#a09a94', fontWeight: 600, fontSize: '0.875rem' }}>Loading product details...</p>
    </div>
  );

  if (error || !product) return (
    <div style={{ maxWidth: 420, margin: '80px auto', textAlign: 'center', padding: '0 24px' }}>
      <AlertTriangle size={40} color="#f05035" style={{ marginBottom: 16 }} />
      <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1.3rem', marginBottom: 8 }}>Deal Not Found</h3>
      <p style={{ color: '#a09a94', fontSize: '0.875rem', marginBottom: 24 }}>{error || 'This product is no longer active.'}</p>
      <Link to="/" className="btn-violet" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <ChevronLeft size={16} /> Back to Deals
      </Link>
    </div>
  );

  let images = [];
  try { images = typeof product.images === 'string' ? JSON.parse(product.images) : (product.images || []); } catch { images = []; }
  if (images.length === 0) images = ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=70'];

  const soloTier = product.tiers?.find(t => t.group_size === 1);
  const soloPrice = soloTier ? parseFloat(soloTier.price) : 0;
  const groupTiers = product.tiers?.filter(t => t.group_size > 1) || [];
  const bestTier = groupTiers.reduce((a, b) => parseFloat(a.price) < parseFloat(b.price) ? a : b, groupTiers[0]);

  return (
    <div style={{ background: '#faf8f4', minHeight: '100vh' }}>

      {/* Breadcrumb */}
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '20px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: '#a09a94', fontWeight: 500 }}>
          <Link to="/" style={{ color: '#a09a94', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#5b21b6'}
            onMouseLeave={e => e.currentTarget.style.color = '#a09a94'}>
            Home
          </Link>
          <span>/</span>
          <span style={{ color: '#5b21b6', fontWeight: 700 }}>{product.name}</span>
        </div>
      </div>

      {/* Main Product Layout */}
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '32px 24px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'start' }}>

          {/* LEFT — Images */}
          <div style={{ position: 'sticky', top: 88 }}>
            {/* Main image */}
            <div className="img-zoom-wrap" style={{ aspectRatio: '1/1', background: '#f2ede4', marginBottom: 16, border: '1px solid rgba(18,16,14,0.07)', boxShadow: '0 24px 60px rgba(18,16,14,0.1)' }}>
              <img
                src={images[selectedImage]}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                loading="eager"
              />
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(images.length, 4)}, 1fr)`, gap: 10 }}>
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    style={{
                      aspectRatio: '1/1', borderRadius: 14, overflow: 'hidden',
                      border: `2px solid ${selectedImage === idx ? '#5b21b6' : 'rgba(18,16,14,0.08)'}`,
                      cursor: 'pointer', transition: 'all 0.2s',
                      boxShadow: selectedImage === idx ? '0 0 0 3px rgba(91,33,182,0.15)' : 'none',
                    }}
                  >
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — Info + Buy Panel */}
          <div>
            {/* Category + Title */}
            <div style={{ marginBottom: 20 }}>
              <span style={{
                fontSize: '0.65rem', fontWeight: 800, color: '#5b21b6',
                textTransform: 'uppercase', letterSpacing: '0.14em',
                background: 'rgba(91,33,182,0.08)', border: '1px solid rgba(91,33,182,0.15)',
                padding: '4px 12px', borderRadius: 999, display: 'inline-block', marginBottom: 14,
              }}>
                {product.category_name || 'General'}
              </span>
              <h1 style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800,
                fontSize: 'clamp(1.7rem, 3vw, 2.4rem)',
                color: '#12100e', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 8,
              }}>
                {product.name}
              </h1>
              <p style={{ fontSize: '0.78rem', color: '#a09a94', fontWeight: 500 }}>
                SKU: {product.sku || 'N/A'} &nbsp;·&nbsp; Stock: {product.stock > 0 ? `${product.stock} units available` : 'Out of Stock'}
              </p>
            </div>

            {/* Description */}
            <p style={{ fontSize: '0.9rem', color: '#6b6560', lineHeight: 1.8, marginBottom: 28, borderLeft: '3px solid rgba(91,33,182,0.2)', paddingLeft: 16 }}>
              {product.description || 'No description available for this item.'}
            </p>

            {/* Pre-Auth Banner */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(91,33,182,0.06), rgba(67,56,202,0.04))',
              border: '1px solid rgba(91,33,182,0.15)',
              borderRadius: 16, padding: '14px 18px',
              display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 32,
            }}>
              <ShieldCheck size={18} color="#5b21b6" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#12100e', marginBottom: 2 }}>Pre-Authorization Hold Active</div>
                <div style={{ fontSize: '0.72rem', color: '#6b6560', lineHeight: 1.6 }}>
                  Your card is only held — not charged. Funds are captured only when the group target is met. If it expires, your hold is automatically released.
                </div>
              </div>
            </div>

            {/* Tier Selection */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Tag size={16} color="#5b21b6" />
                <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#12100e' }}>
                  Choose Team Size
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>

                {/* Solo Tier */}
                <div className="tier-card" onClick={() => handleCheckout(1)} style={{ cursor: product.stock <= 0 ? 'not-allowed' : 'pointer', opacity: product.stock <= 0 ? 0.5 : 1 }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#a09a94', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Solo Buyer</div>
                  <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '1.4rem', fontWeight: 800, color: '#12100e', marginBottom: 4 }}>{fmt(soloPrice)}</div>
                  <div style={{ fontSize: '0.68rem', color: '#a09a94' }}>Standard price · 1 buyer</div>
                  <div style={{ marginTop: 14, fontSize: '0.72rem', fontWeight: 700, color: '#5b21b6', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Buy Solo <ArrowRight size={12} />
                  </div>
                </div>

                {/* Group Tiers */}
                {groupTiers.map((tier) => {
                  const tierPrice = parseFloat(tier.price);
                  const discount = Math.round(((soloPrice - tierPrice) / soloPrice) * 100);
                  const isBest = bestTier && tier.group_size === bestTier.group_size;
                  return (
                    <div
                      key={tier.group_size}
                      className={`tier-card${isBest ? ' best' : ''}`}
                      onClick={() => handleCheckout(tier.group_size)}
                      style={{ cursor: product.stock <= 0 ? 'not-allowed' : 'pointer', opacity: product.stock <= 0 ? 0.5 : 1 }}
                    >
                      {isBest && (
                        <div style={{
                          position: 'absolute', top: 12, right: 12,
                          background: 'linear-gradient(135deg, #f59e0b, #f05035)',
                          color: '#fff', fontSize: '0.6rem', fontWeight: 800,
                          padding: '3px 10px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          <Flame size={9} fill="#fff" /> BEST DEAL
                        </div>
                      )}
                      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: isBest ? 'rgba(250,248,244,0.5)' : '#a09a94', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                        {tier.group_size}-Member Team
                      </div>
                      <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '1.4rem', fontWeight: 800, color: isBest ? '#faf8f4' : '#12100e', marginBottom: 4 }}>
                        {fmt(tierPrice)}
                      </div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#f05035', background: isBest ? 'rgba(240,80,53,0.2)' : 'rgba(240,80,53,0.08)', borderRadius: 6, padding: '2px 8px', display: 'inline-block', marginBottom: 4 }}>
                        SAVE {discount}%
                      </div>
                      <div style={{ marginTop: 12, fontSize: '0.72rem', fontWeight: 700, color: isBest ? '#f59e0b' : '#5b21b6', display: 'flex', alignItems: 'center', gap: 4 }}>
                        Start {tier.group_size}-Team <ArrowRight size={12} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trust Strip */}
            <div className="trust-strip">
              {[
                { icon: <ShieldCheck size={15} color="#059669" />, text: 'Buyer Protected' },
                { icon: <Zap size={15} color="#5b21b6" />, text: 'Instant Hold Release' },
                { icon: <RotateCcw size={15} color="#f05035" />, text: '60-Day Returns' },
                { icon: <Truck size={15} color="#4338ca" />, text: 'Nationwide Delivery' },
              ].map(({ icon, text }) => (
                <div key={text} className="trust-item">
                  {icon} {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── OPEN GROUPS SECTION ── */}
        {activeGroups.length > 0 && (
          <div style={{ marginTop: 72, paddingTop: 56, borderTop: '1px solid rgba(18,16,14,0.08)' }}>
            <div style={{ marginBottom: 32 }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#5b21b6', textTransform: 'uppercase', letterSpacing: '0.14em', display: 'block', marginBottom: 8 }}>
                — Active Deal Rooms
              </span>
              <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: '#12100e', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Users size={24} color="#f59e0b" /> Join an Open Co-Buying Team
              </h2>
              <p style={{ color: '#6b6560', fontSize: '0.875rem', marginTop: 8, maxWidth: 480 }}>
                One of these teams only needs a few more members to unlock the group discount.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {activeGroups.map((group, gi) => {
                const timerRemaining = Math.max(0, Math.floor((new Date(group.timer_end).getTime() - Date.now()) / 1000));
                const hours = Math.floor(timerRemaining / 3600);
                const mins = Math.floor((timerRemaining % 3600) / 60);
                const progressPct = Math.round((group.current_size / group.target_size) * 100);
                const slotsLeft = group.target_size - group.current_size;
                const [bg, fg] = AVATAR_COLORS[gi % AVATAR_COLORS.length];

                return (
                  <div key={group.id} style={{
                    background: '#fff',
                    borderRadius: 24,
                    border: '1px solid rgba(18,16,14,0.08)',
                    padding: '22px 22px 18px',
                    boxShadow: '0 2px 12px rgba(18,16,14,0.04)',
                    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                    position: 'relative', overflow: 'hidden',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(91,33,182,0.25)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(91,33,182,0.1)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(18,16,14,0.08)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(18,16,14,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    {/* Urgency chip */}
                    {slotsLeft <= 2 && (
                      <div style={{ position: 'absolute', top: 14, right: 14, background: '#f05035', color: '#fff', fontSize: '0.6rem', fontWeight: 800, padding: '3px 10px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Flame size={9} fill="#fff" /> {slotsLeft} Slot{slotsLeft !== 1 ? 's' : ''} Left!
                      </div>
                    )}

                    {/* Creator avatar + name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                      <div className="avatar-chip" style={{ background: `linear-gradient(135deg, ${bg}, ${bg}cc)`, color: fg }}>
                        {group.creator_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#a09a94', fontWeight: 600 }}>Team started by</div>
                        <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: '#12100e' }}>{group.creator_name}</div>
                      </div>
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', fontWeight: 700, color: '#b45309', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 999, padding: '4px 10px' }}>
                        <Clock size={11} /> {hours}h {mins}m
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700, color: '#6b6560', marginBottom: 8 }}>
                        <span>Team Fill Progress</span>
                        <span style={{ color: '#12100e' }}>{group.current_size} / {group.target_size} slots</span>
                      </div>
                      <div style={{ background: '#f2ede4', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 99,
                          background: `linear-gradient(90deg, #5b21b6, #4338ca)`,
                          width: `${progressPct}%`,
                          transition: 'width 0.5s ease',
                          boxShadow: '0 2px 6px rgba(91,33,182,0.3)',
                        }} />
                      </div>
                      {slotsLeft > 0 && (
                        <div style={{ fontSize: '0.68rem', color: '#5b21b6', fontWeight: 600, marginTop: 6 }}>
                          ⚡ {slotsLeft} more co-buyer{slotsLeft !== 1 ? 's' : ''} needed to unlock discount!
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleCheckout(group.target_size, group.id)}
                      className="btn-violet"
                      style={{ width: '100%', justifyContent: 'center', borderRadius: 14, padding: '11px 20px', fontSize: '0.82rem' }}
                    >
                      Join This Team <ArrowRight size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeGroups.length === 0 && (
          <div style={{ marginTop: 72, paddingTop: 56, borderTop: '1px solid rgba(18,16,14,0.08)', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: 'rgba(91,33,182,0.08)', marginBottom: 16 }}>
              <Users size={28} color="#5b21b6" />
            </div>
            <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1.2rem', marginBottom: 8 }}>No Active Teams Yet</h3>
            <p style={{ color: '#6b6560', fontSize: '0.875rem', marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
              Be the first to start a co-buying team for this product and invite others to join!
            </p>
          </div>
        )}
      </div>

      <OTPLoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </div>
  );
}
