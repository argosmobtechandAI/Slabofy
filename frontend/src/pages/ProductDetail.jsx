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
import useScrollReveal from '../hooks/useScrollReveal';
import use3DTilt from '../hooks/use3DTilt';

const AVATAR_COLORS = [
  ['#5b21b6', '#fff'], ['#f05035', '#fff'], ['#f59e0b', '#12100e'],
  ['#059669', '#fff'], ['#4338ca', '#fff'], ['#e11d48', '#fff'],
];

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
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  const revealRef1 = useScrollReveal();
  const revealRef2 = useScrollReveal();
  const tiltRef = use3DTilt({ maxTilt: 8, scale: 1.02 });

  useEffect(() => { 
    window.scrollTo(0, 0);
    fetchProductDetails(); 
  }, [id]);
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

  const variants = product?.variants || [];
  const hasVariants = variants.length > 0 && (variants[0].color !== 'Default' || variants[0].size !== 'Default');
  
  const availableColors = hasVariants ? [...new Set(variants.map(v => v.color))].filter(c => c !== 'Default') : [];
  const availableSizes = hasVariants ? [...new Set(variants.map(v => v.size))].filter(s => s !== 'Default') : [];

  const currentVariant = hasVariants ? variants.find(v => v.color === (selectedColor || (availableColors.length === 0 ? 'Default' : '')) && v.size === (selectedSize || (availableSizes.length === 0 ? 'Default' : ''))) : null;
  const currentStock = hasVariants ? (currentVariant ? currentVariant.stock : 0) : product?.stock;

  const handleCheckout = (targetSize, groupId = null) => {
    if (!isLoggedIn) { setLoginModalOpen(true); return; }
    if (hasVariants) {
      if (availableColors.length > 0 && !selectedColor) return toast.error('Please select a color first');
      if (availableSizes.length > 0 && !selectedSize) return toast.error('Please select a size first');
    }
    if (currentStock <= 0) return toast.error('Selected variant is out of stock');

    navigate('/checkout', { 
      state: { 
        product_id: product.id, 
        group_id: groupId, 
        target_size: targetSize,
        variant_id: currentVariant?.id,
        color: selectedColor,
        size: selectedSize
      } 
    });
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

  let videos = [];
  try { videos = typeof product.videos === 'string' ? JSON.parse(product.videos) : (product.videos || []); } catch { videos = []; }

  const displayImage = (currentVariant && currentVariant.image_url) ? currentVariant.image_url : images[selectedImage];

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
          <div ref={revealRef1} className="scroll-reveal-group" style={{ flex: '1 1 50%', minWidth: 320 }}>
            {/* Main Image */}
            <div ref={tiltRef} className="tilt-card" style={{
              background: '#f2ede4', borderRadius: 28, overflow: 'hidden', aspectRatio: '4/3', marginBottom: 16,
              boxShadow: '0 24px 60px rgba(18,16,14,0.06)', position: 'relative'
            }}>
              <div className="tilt-card-inner" style={{ width: '100%', height: '100%' }}>
                <img
                  src={images[selectedImage]} alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div className="glare" />
              </div>
            </div>
            {/* Thumbnails */}
            {(images.length > 1 || videos.length > 0) && (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(images.length + videos.length, 5)}, 1fr)`, gap: 10 }}>
                {images.map((img, idx) => (
                  <div
                    key={`img-${idx}`}
                    onClick={() => setSelectedImage(idx)}
                    style={{
                      aspectRatio: '1/1', borderRadius: 14, overflow: 'hidden',
                      border: `2px solid ${selectedImage === idx ? '#5b21b6' : 'rgba(18,16,14,0.08)'}`,
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
                {videos.map((vid, idx) => (
                  <div key={`vid-${idx}`} style={{ aspectRatio: '1/1', borderRadius: 14, overflow: 'hidden', border: `2px solid rgba(18,16,14,0.08)` }}>
                    <video src={vid} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls muted />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — Info + Buy Panel */}
          <div ref={revealRef2} className="scroll-reveal-group" style={{ flex: '1 1 40%', minWidth: 320, position: 'sticky', top: 96, maxHeight: 'calc(100vh - 96px)', overflowY: 'auto', paddingRight: 8 }}>
            
            <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <span className="badge-pill badge-ink" style={{ marginBottom: 16, display: 'inline-flex', background: 'rgba(91,33,182,0.08)', padding: '4px 12px', borderRadius: 999, color: '#5b21b6', fontSize: '0.65rem', fontWeight: 800 }}>
                <Tag size={11} /> Special Co-Buy Price
              </span>
              <h1 style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800,
                fontSize: 'clamp(1.7rem, 3vw, 2.4rem)',
                color: '#12100e', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 8,
              }}>
                {product.name}
              </h1>
              <p style={{ fontSize: '0.9rem', color: '#6b6560', lineHeight: 1.8, marginBottom: 28, borderLeft: '3px solid rgba(91,33,182,0.2)', paddingLeft: 16 }}>
                {product.description || 'No description available for this item.'}
              </p>
            </div>

            {/* Price Tiers (Interactive) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
              {tiers.map((t, idx) => {
                const isActive = activeGroups.some(g => g.target_size === t.group_size);
                const isBest = idx === tiers.length - 1;

                return (
                  <div key={idx} onClick={() => handleCheckout(t.group_size)} style={{
                    position: 'relative', overflow: 'hidden',
                    background: isActive ? 'linear-gradient(135deg, rgba(91,33,182,0.05), transparent)' : '#fff',
                    border: isActive ? '1.5px solid rgba(91,33,182,0.3)' : '1px solid rgba(18,16,14,0.08)',
                    borderRadius: 20, padding: '16px 20px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    boxShadow: isActive ? '0 12px 32px rgba(91,33,182,0.08)' : '0 2px 10px rgba(18,16,14,0.02)',
                    transition: 'all 0.3s ease', cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(4px)';
                    e.currentTarget.style.borderColor = 'rgba(91,33,182,0.3)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(91,33,182,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.borderColor = isActive ? 'rgba(91,33,182,0.3)' : 'rgba(18,16,14,0.08)';
                    e.currentTarget.style.boxShadow = isActive ? '0 12px 32px rgba(91,33,182,0.08)' : '0 2px 10px rgba(18,16,14,0.02)';
                  }}
                  >
                    {isActive && <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 4, background: '#5b21b6' }} />}
                    {isBest && !isActive && <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 4, background: '#f59e0b' }} />}
                    
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#12100e' }}>
                          {t.group_size === 1 ? 'Buy Solo' : `Team of ${t.group_size}`}
                        </span>
                        {isActive && (
                          <span style={{ background: '#5b21b6', color: '#fff', fontSize: '0.6rem', fontWeight: 800, padding: '2px 8px', borderRadius: 100, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Zap size={8} fill="#fff" /> Active Now
                          </span>
                        )}
                        {isBest && !isActive && (
                          <span style={{ background: '#f59e0b', color: '#12100e', fontSize: '0.6rem', fontWeight: 800, padding: '2px 8px', borderRadius: 100, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Flame size={8} fill="#12100e" /> Best Value
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b6560' }}>
                        {t.group_size === 1 ? 'Standard delivery' : 'Co-buy & save'}
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '1.25rem', fontWeight: 800, color: isActive ? '#5b21b6' : '#12100e', lineHeight: 1 }}>
                        {fmt(t.price)}
                      </div>
                      {t.group_size > 1 && (
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669', marginTop: 4 }}>
                          Save {Math.round(((soloPrice - t.price) / soloPrice) * 100)}%
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
                  }}>
                    {/* Creator avatar + name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                      <div className="avatar-chip" style={{ background: `linear-gradient(135deg, ${bg}, ${bg}cc)`, color: fg, width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                        {group.creator_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#a09a94', fontWeight: 600 }}>Team started by</div>
                        <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: '#12100e' }}>{group.creator_name}</div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700, color: '#6b6560', marginBottom: 8 }}>
                        <span>Team Fill Progress</span>
                        <span style={{ color: '#12100e' }}>{group.current_size} / {group.target_size} slots</span>
                      </div>
                      <div style={{ background: '#f2ede4', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                        <div className="progress-bar-animated" style={{
                          background: 'linear-gradient(90deg, #5b21b6, #f05035)', height: '100%', borderRadius: 999,
                          width: `${progressPct}%`,
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
                      disabled={currentStock <= 0}
                      className="btn-violet"
                      style={{ width: '100%', justifyContent: 'center', borderRadius: 14, padding: '11px 20px', fontSize: '0.82rem', cursor: currentStock <= 0 ? 'not-allowed' : 'pointer', opacity: currentStock <= 0 ? 0.5 : 1 }}
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
