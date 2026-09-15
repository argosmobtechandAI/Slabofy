"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBag, Users, Clock, Tag, RefreshCw, AlertTriangle,
  ArrowRight, ShieldCheck, Zap, RotateCcw, Truck, ChevronLeft, ChevronRight,
  Flame, Send, Heart, Play, Maximize2, X, ZoomIn, ZoomOut, CheckCircle2, Sparkles, Share2
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

  // Variant selections
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  // Media Gallery & Lightbox States
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(false);

  // Group Buying Card States
  const [selectedTierSize, setSelectedTierSize] = useState(null);
  const [countdown, setCountdown] = useState({ hours: 23, minutes: 59, seconds: 53 });
  const [timerExtended, setTimerExtended] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const tiltRef = use3DTilt({ maxTilt: 6, scale: 1.01 });

  // Reset states and fetch product when route param ID changes
  useEffect(() => { 
    window.scrollTo(0, 0);
    setSelectedMediaIndex(0);
    setSelectedColor('');
    setSelectedSize('');
    setSelectedTierSize(null);
    setLightboxOpen(false);
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

  // Live countdown timer for the group buying deal lock window
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else {
          hours = 23;
          minutes = 59;
          seconds = 59;
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard navigation for Lightbox modal (Esc to close, Left/Right arrows to cycle)
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') setSelectedMediaIndex(prev => (prev + 1) % Math.max(1, mediaList.length));
      if (e.key === 'ArrowLeft') setSelectedMediaIndex(prev => (prev - 1 + mediaList.length) % Math.max(1, mediaList.length));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, product]);

  // Load user's wishlist status from localStorage
  useEffect(() => {
    if (!product?.id) return;
    try {
      const saved = JSON.parse(localStorage.getItem('slabofy_wishlist') || '[]');
      setIsWishlisted(saved.includes(product.id));
    } catch {}
  }, [product?.id]);

  // Safe variant parsing
  const isValidVariantValue = (val) => {
    if (!val || typeof val !== 'string') return false;
    const trimmed = val.trim();
    if (!trimmed) return false;
    const lower = trimmed.toLowerCase();
    return !['default', 'standard', 'none', 'null', 'undefined'].includes(lower);
  };

  const variants = Array.isArray(product?.variants) ? product.variants : [];

  const availableColors = useMemo(() => {
    return [...new Set(variants.map(v => v?.color).filter(isValidVariantValue))];
  }, [variants]);

  const availableSizes = useMemo(() => {
    return [...new Set(variants.map(v => v?.size).filter(isValidVariantValue))];
  }, [variants]);

  const hasVariants = variants.length > 0 && (availableColors.length > 0 || availableSizes.length > 0);

  // Auto-select initial color and size when product variants load
  useEffect(() => {
    if (!product) return;
    if (availableColors.length > 0) {
      setSelectedColor(prev => (prev && availableColors.includes(prev) ? prev : availableColors[0]));
    } else {
      setSelectedColor('');
    }

    if (availableSizes.length > 0) {
      setSelectedSize(prev => (prev && availableSizes.includes(prev) ? prev : availableSizes[0]));
    } else {
      setSelectedSize('');
    }
  }, [product?.id, availableColors, availableSizes]);

  const currentVariant = useMemo(() => {
    if (!hasVariants || variants.length === 0) return null;

    // 1. Try exact match on both selectedColor and selectedSize
    const exactMatch = variants.find(v => {
      const colorMatch = availableColors.length === 0 || (v?.color && v.color === selectedColor);
      const sizeMatch = availableSizes.length === 0 || (v?.size && v.size === selectedSize);
      return colorMatch && sizeMatch;
    });
    if (exactMatch) return exactMatch;

    // 2. Partial match if user has only selected color or size
    if (selectedColor && availableColors.length > 0) {
      const colorMatch = variants.find(v => v?.color === selectedColor);
      if (colorMatch) return colorMatch;
    }
    if (selectedSize && availableSizes.length > 0) {
      const sizeMatch = variants.find(v => v?.size === selectedSize);
      if (sizeMatch) return sizeMatch;
    }

    return variants[0] || null;
  }, [hasVariants, variants, availableColors, availableSizes, selectedColor, selectedSize]);

  const currentStock = hasVariants 
    ? (currentVariant ? (parseInt(currentVariant.stock, 10) || 0) : 0)
    : (parseInt(product?.stock, 10) || 0);

  // Parse Media: Images and Videos
  let images = [];
  try { images = typeof product?.images === 'string' ? JSON.parse(product.images) : (product?.images || []); } catch { images = []; }
  if (!Array.isArray(images)) images = [];
  if (images.length === 0) {
    images = ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=70'];
  }

  let videos = [];
  try { videos = typeof product?.videos === 'string' ? JSON.parse(product.videos) : (product?.videos || []); } catch { videos = []; }
  if (!Array.isArray(videos)) videos = [];

  // Unified list of images and videos
  const mediaList = useMemo(() => {
    const list = [];
    images.forEach((img, idx) => {
      list.push({ type: 'image', url: img, id: `img-${idx}`, label: `Image ${idx + 1}` });
    });
    videos.forEach((vid, idx) => {
      list.push({ type: 'video', url: vid, id: `vid-${idx}`, label: `Video ${idx + 1}` });
    });
    return list;
  }, [images, videos]);

  // Active media item: if user has selected a specific thumbnail, show that.
  // If variant has an image and index is 0, show variant image.
  const activeMedia = useMemo(() => {
    if (selectedMediaIndex === 0 && currentVariant?.image_url) {
      return { type: 'image', url: currentVariant.image_url, id: 'variant-img' };
    }
    return mediaList[selectedMediaIndex] || mediaList[0] || { type: 'image', url: images[0] };
  }, [selectedMediaIndex, currentVariant?.image_url, mediaList, images]);

  // Pricing Tiers & Discounts
  const tiers = Array.isArray(product?.tiers) && product.tiers.length > 0 
    ? [...product.tiers].sort((a, b) => a.group_size - b.group_size) 
    : [{ group_size: 1, price: product?.price || 0 }];

  const soloTier = tiers.find(t => t.group_size === 1);
  const soloPrice = soloTier ? parseFloat(soloTier.price) : parseFloat(tiers[0]?.price || 0);

  const maxDiscount = useMemo(() => {
    if (soloPrice <= 0) return 0;
    return tiers.reduce((max, t) => {
      const disc = Math.round(((soloPrice - parseFloat(t.price)) / soloPrice) * 100);
      return Math.max(max, disc);
    }, 0);
  }, [tiers, soloPrice]);

  // Auto-select initial group tier on product load
  useEffect(() => {
    if (tiers.length > 0 && selectedTierSize === null) {
      // Pick first group tier (>1) if available, else first tier
      const defaultTier = tiers.find(t => t.group_size > 1) || tiers[0];
      setSelectedTierSize(defaultTier.group_size);
    }
  }, [tiers, selectedTierSize]);

  const activeGroupForTier = activeGroups.find(g => g.target_size === selectedTierSize);
  const currentMembersCount = activeGroupForTier ? activeGroupForTier.current_size : 1;
  const targetMembersCount = selectedTierSize || 1;
  const progressPct = Math.min(100, Math.round((currentMembersCount / targetMembersCount) * 100));

  const teamCode = `GB-${(product?.sku || 'TEAM').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || '6JW'}${product?.id || 1}T${selectedTierSize || 1}`;
  const formattedTimer = `${String(countdown.hours).padStart(2, '0')}:${String(countdown.minutes).padStart(2, '0')}:${String(countdown.seconds).padStart(2, '0')}`;

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n) || 0);

  // Actions
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
        variant_id: currentVariant?.id || null,
        color: selectedColor || null,
        size: selectedSize || null
      } 
    });
  };

  const handleShareLink = async () => {
    const shareUrl = `${window.location.origin}/product/${product.id}${selectedTierSize > 1 ? `?tier=${selectedTierSize}` : ''}`;
    const shareText = `Join my co-buying team for "${product.name}" on Slabofy and unlock massive group discounts!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User cancelled native share, fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Team invite link copied to clipboard! Share with friends.', { icon: '🔗' });
    } catch {
      toast.success(`Share URL: ${shareUrl}`);
    }
  };

  const handleToggleWishlist = () => {
    if (!product?.id) return;
    try {
      const saved = JSON.parse(localStorage.getItem('slabofy_wishlist') || '[]');
      let updated;
      if (saved.includes(product.id)) {
        updated = saved.filter(i => i !== product.id);
        setIsWishlisted(false);
        toast('Removed from saved items', { icon: '🤍' });
      } else {
        updated = [...saved, product.id];
        setIsWishlisted(true);
        toast.success('Added to your wishlist!', { icon: '❤️' });
      }
      localStorage.setItem('slabofy_wishlist', JSON.stringify(updated));
    } catch {}
  };

  const handleExtendTimer = () => {
    if (timerExtended) {
      toast.error('Timer can only be extended once per session.');
      return;
    }
    setTimerExtended(true);
    setCountdown(prev => ({ ...prev, hours: Math.min(48, prev.hours + 12) }));
    toast.success('Timer extended by +12 hours! Share your team link now.', { icon: '⏱️' });
  };

  const handlePrevMedia = (e) => {
    e?.stopPropagation();
    setSelectedMediaIndex(prev => (prev - 1 + mediaList.length) % mediaList.length);
  };

  const handleNextMedia = (e) => {
    e?.stopPropagation();
    setSelectedMediaIndex(prev => (prev + 1) % mediaList.length);
  };

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

  return (
    <div style={{ background: '#faf8f4', minHeight: '100vh', color: '#12100e' }}>

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
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '24px 16px 64px' }}>
        <div className="grid-responsive-2col">

          {/* LEFT — Images & Video Gallery */}
          <div style={{ width: '100%' }}>
            {/* Main Media Player / Viewer */}
            <div ref={tiltRef} className="tilt-card" style={{
              background: '#f2ede4', borderRadius: 28, overflow: 'hidden', aspectRatio: '4/3', marginBottom: 16,
              boxShadow: '0 24px 60px rgba(18,16,14,0.06)', position: 'relative', width: '100%'
            }}>
              {activeMedia.type === 'video' ? (
                <div style={{ width: '100%', height: '100%', background: '#0b0c10', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <video
                    key={activeMedia.url}
                    src={activeMedia.url}
                    controls
                    autoPlay
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  >
                    <source src={activeMedia.url} type="video/mp4" />
                    Your browser does not support HTML5 video playback.
                  </video>
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    title="Fullscreen View"
                    style={{
                      position: 'absolute', top: 14, right: 14, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                      color: '#fff', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', zIndex: 10
                    }}
                  >
                    <Maximize2 size={16} />
                  </button>
                </div>
              ) : (
                <div
                  className="tilt-card-inner"
                  style={{ width: '100%', height: '100%', cursor: 'zoom-in', position: 'relative' }}
                  onClick={() => setLightboxOpen(true)}
                >
                  <img
                    src={activeMedia.url}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div className="glare" />

                  {/* Click to enlarge floating badge */}
                  <div style={{
                    position: 'absolute', bottom: 14, right: 14, background: 'rgba(18,16,14,0.7)',
                    backdropFilter: 'blur(8px)', color: '#fff', padding: '6px 12px', borderRadius: 20,
                    display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', fontWeight: 600, pointerEvents: 'none'
                  }}>
                    <Maximize2 size={13} /> Click to enlarge
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnails Grid (Clickable Images & Playable Videos) */}
            {mediaList.length > 1 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.min(mediaList.length, 5)}, 1fr)`,
                gap: 10
              }}>
                {mediaList.map((media, idx) => {
                  const isSelected = selectedMediaIndex === idx;
                  const isVid = media.type === 'video';

                  return (
                    <div
                      key={media.id || idx}
                      onClick={() => setSelectedMediaIndex(idx)}
                      style={{
                        aspectRatio: '1/1',
                        borderRadius: 14,
                        overflow: 'hidden',
                        border: `2px solid ${isSelected ? '#5b21b6' : 'rgba(18,16,14,0.1)'}`,
                        boxShadow: isSelected ? '0 0 0 2px rgba(91,33,182,0.25)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        position: 'relative',
                        background: '#f2ede4'
                      }}
                    >
                      {isVid ? (
                        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#12100e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <video src={media.url} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }} muted />
                          <div style={{
                            position: 'absolute', width: 28, height: 28, borderRadius: '50%', background: 'rgba(91,33,182,0.9)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                          }}>
                            <Play size={13} fill="#fff" style={{ marginLeft: 2 }} />
                          </div>
                          <span style={{
                            position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.7)',
                            color: '#fff', fontSize: '0.52rem', fontWeight: 800, padding: '1px 5px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.04em'
                          }}>
                            Video
                          </span>
                        </div>
                      ) : (
                        <img src={media.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT — Info + Group Buying Card */}
          <div style={{ width: '100%' }}>
            
            <div className="animate-fade-in-up" style={{ animationDelay: '50ms', marginBottom: 20 }}>
              <span className="badge-pill badge-ink" style={{ marginBottom: 14, display: 'inline-flex', background: 'rgba(91,33,182,0.08)', padding: '4px 12px', borderRadius: 999, color: '#5b21b6', fontSize: '0.65rem', fontWeight: 800 }}>
                <Tag size={11} /> Special Co-Buy Price
              </span>
              <h1 style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800,
                fontSize: 'clamp(1.7rem, 3vw, 2.3rem)',
                color: '#12100e', lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 10,
              }}>
                {product.name}
              </h1>
              <p style={{ fontSize: '0.88rem', color: '#6b6560', lineHeight: 1.7, borderLeft: '3px solid rgba(91,33,182,0.2)', paddingLeft: 14 }}>
                {product.description || 'No description available for this item.'}
              </p>
            </div>

            {/* VARIANT SELECTORS (Color & Size / Unit) */}
            {hasVariants && (
              <div style={{ background: '#fff', borderRadius: 20, padding: 18, border: '1px solid rgba(18,16,14,0.08)', marginBottom: 24 }}>
                {availableColors.length > 0 && (
                  <div style={{ marginBottom: availableSizes.length > 0 ? 16 : 0 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                      Select Color {selectedColor && <span style={{ color: '#5b21b6', fontWeight: 800 }}>({selectedColor})</span>}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {availableColors.map(c => {
                        const isSel = selectedColor === c;
                        const colObj = c ? PREDEFINED_COLORS.find(pc => pc.name && pc.name.toLowerCase() === String(c).trim().toLowerCase()) : null;
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setSelectedColor(c)}
                            style={{
                              padding: '6px 14px', borderRadius: 12,
                              border: isSel ? '2px solid #5b21b6' : '1px solid rgba(18,16,14,0.12)',
                              background: isSel ? 'rgba(91,33,182,0.08)' : '#faf8f4',
                              color: isSel ? '#5b21b6' : '#12100e',
                              fontSize: '0.82rem', fontWeight: isSel ? 700 : 500,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                              transition: 'all 0.15s'
                            }}
                          >
                            {colObj ? (
                              <span style={{ width: 10, height: 10, borderRadius: '50%', background: colObj.hex, border: '1px solid rgba(0,0,0,0.1)' }} />
                            ) : (
                              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#a09a94', border: '1px solid rgba(0,0,0,0.1)' }} />
                            )}
                            {c}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {availableSizes.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                      Select Size / Option {selectedSize && <span style={{ color: '#5b21b6', fontWeight: 800 }}>({selectedSize})</span>}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {availableSizes.map(s => {
                        const isSel = selectedSize === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSelectedSize(s)}
                            style={{
                              padding: '6px 16px', borderRadius: 12,
                              border: isSel ? '2px solid #5b21b6' : '1px solid rgba(18,16,14,0.12)',
                              background: isSel ? 'rgba(91,33,182,0.08)' : '#faf8f4',
                              color: isSel ? '#5b21b6' : '#12100e',
                              fontSize: '0.82rem', fontWeight: isSel ? 700 : 500,
                              cursor: 'pointer', transition: 'all 0.15s'
                            }}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Stock Indicator */}
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(18,16,14,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                  <span style={{ color: '#6b6560' }}>Availability:</span>
                  {currentStock > 0 ? (
                    <span style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }} /> In Stock ({currentStock} units left)
                    </span>
                  ) : (
                    <span style={{ color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} /> Currently Out of Stock
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* ── GROUP BUYING FEATURE CARD (Exact Client Reference Design) ── */}
            <div className="group-buy-card" style={{
              background: '#ffffff',
              borderRadius: 24,
              padding: '24px 22px',
              border: '1px solid rgba(18,16,14,0.08)',
              boxShadow: '0 8px 30px rgba(18,16,14,0.03)',
              marginBottom: 32
            }}>
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, background: 'rgba(194,94,52,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c25e34'
                  }}>
                    <Users size={18} />
                  </div>
                  <h3 style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: '#12100e',
                    letterSpacing: '-0.02em',
                    margin: 0
                  }}>
                    Group Buying
                  </h3>
                </div>

                {maxDiscount > 0 && (
                  <span style={{
                    background: '#c25e34',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '4px 12px',
                    borderRadius: 999,
                    letterSpacing: '0.02em'
                  }}>
                    Save up to {maxDiscount}%
                  </span>
                )}
              </div>

              <p style={{ fontSize: '0.82rem', color: '#6b6560', lineHeight: 1.5, marginBottom: 20 }}>
                Start a team or join existing teams to unlock group discounts. The larger your team, the bigger your savings!
              </p>

              {/* Selectable Tiers List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {tiers.map((t) => {
                  const isSelected = selectedTierSize === t.group_size;
                  const isSolo = t.group_size === 1;
                  const discount = soloPrice > 0 ? Math.max(0, Math.round(((soloPrice - parseFloat(t.price)) / soloPrice) * 100)) : 0;

                  return (
                    <div
                      key={t.group_size}
                      onClick={() => setSelectedTierSize(t.group_size)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '13px 18px',
                        borderRadius: 16,
                        border: isSelected ? '2px solid #c25e34' : '1px solid rgba(18,16,14,0.1)',
                        background: isSelected ? 'rgba(194,94,52,0.03)' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: isSelected ? '0 4px 16px rgba(194,94,52,0.08)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: isSelected ? '#c25e34' : '#f2ede4',
                          color: isSelected ? '#ffffff' : '#6b6560',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}>
                          {t.group_size}
                        </div>
                        <span style={{
                          fontSize: '0.92rem',
                          fontWeight: 700,
                          color: '#12100e',
                          fontFamily: 'Plus Jakarta Sans, sans-serif'
                        }}>
                          {isSolo ? 'Solo' : `${t.group_size} Members`}
                        </span>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: '1.05rem',
                          fontWeight: 800,
                          color: isSelected ? '#c25e34' : '#12100e',
                          fontFamily: 'Plus Jakarta Sans, sans-serif',
                          lineHeight: 1.1
                        }}>
                          {fmt(t.price)}
                        </div>
                        <div style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: isSolo ? '#a09a94' : '#c25e34',
                          marginTop: 2
                        }}>
                          {isSolo ? 'Solo' : `Save ${discount}%`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Team Progress Box (Shown when group tier is selected) */}
              {selectedTierSize > 1 && (
                <div style={{
                  background: '#faf8f4',
                  borderRadius: 16,
                  border: '1px solid rgba(18,16,14,0.06)',
                  padding: '16px 18px',
                  marginBottom: 20
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#a09a94', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Team Progress
                      </div>
                      <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '1.15rem', fontWeight: 800, color: '#12100e', marginTop: 3 }}>
                        {currentMembersCount} / {targetMembersCount} members
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#a09a94', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Time Left
                      </div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.15rem', fontWeight: 800, color: '#c25e34', marginTop: 3 }}>
                        {formattedTimer}
                      </div>
                    </div>
                  </div>

                  {/* Progress Track */}
                  <div style={{ width: '100%', height: 8, background: '#f0ece4', borderRadius: 99, overflow: 'hidden', margin: '14px 0 10px' }}>
                    <div style={{
                      height: '100%',
                      width: `${progressPct}%`,
                      background: 'linear-gradient(90deg, #c25e34, #ea580c)',
                      borderRadius: 99,
                      transition: 'width 0.4s ease'
                    }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#6b6560' }}>
                    <span>Your team: <strong style={{ fontFamily: 'JetBrains Mono, monospace', color: '#12100e' }}>{teamCode}</strong></span>
                    {activeGroupForTier && (
                      <span style={{ color: '#059669', fontWeight: 700 }}>⚡ Active Room Open!</span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons Row: [Start Team] [Share Link] [Wishlist] */}
              <div className="product-action-row" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => handleCheckout(selectedTierSize, activeGroupForTier?.id || null)}
                  disabled={currentStock <= 0}
                  className="btn-start-team"
                  style={{
                    flex: '1 1 180px',
                    background: '#c25e34',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 14,
                    padding: '14px 18px',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: '0.92rem',
                    fontWeight: 800,
                    cursor: currentStock <= 0 ? 'not-allowed' : 'pointer',
                    opacity: currentStock <= 0 ? 0.5 : 1,
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 16px rgba(194,94,52,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                >
                  {selectedTierSize === 1 ? 'Buy Solo Now' : (activeGroupForTier ? 'Join Team' : 'Start Team')}
                </button>

                <button
                  type="button"
                  onClick={handleShareLink}
                  className="btn-share-team"
                  style={{
                    flex: '1 1 140px',
                    background: '#22c55e',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 14,
                    padding: '14px 18px',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 16px rgba(34,197,94,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                >
                  <Send size={15} /> Share Link
                </button>

                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  className="btn-wishlist"
                  title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  style={{
                    flex: '0 0 auto',
                    background: isWishlisted ? 'rgba(239,68,68,0.08)' : '#ffffff',
                    border: isWishlisted ? '1.5px solid #ef4444' : '1px solid rgba(18,16,14,0.12)',
                    borderRadius: 14,
                    padding: '14px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    color: isWishlisted ? '#ef4444' : '#6b6560'
                  }}
                >
                  <Heart size={18} fill={isWishlisted ? '#ef4444' : 'none'} />
                </button>
              </div>

              {/* Extend Timer footer option */}
              {selectedTierSize > 1 && (
                <div style={{ textAlign: 'center', marginTop: 14 }}>
                  <button
                    type="button"
                    onClick={handleExtendTimer}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: timerExtended ? '#a09a94' : '#c25e34',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: timerExtended ? 'default' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.2s'
                    }}
                  >
                    <Clock size={13} /> {timerExtended ? 'Timer Extended (+12h)' : 'Extend Timer (1 time only)'}
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── OPEN GROUPS / ACTIVE DEAL ROOMS SECTION ── */}
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

      {/* ── FULLSCREEN LIGHTBOX MODAL ── */}
      {lightboxOpen && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 10, 14, 0.95)',
            backdropFilter: 'blur(12px)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 16px',
            animation: 'fade-in 0.2s ease-out'
          }}
        >
          {/* Top Controls Bar */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 1100,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#fff',
              paddingBottom: 12
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.85 }}>
              {product.name} &nbsp;·&nbsp; {selectedMediaIndex + 1} of {mediaList.length}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {activeMedia.type === 'image' && (
                <button
                  type="button"
                  onClick={() => setLightboxZoom(prev => !prev)}
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    border: 'none',
                    borderRadius: 10,
                    padding: '8px 14px',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.78rem',
                    fontWeight: 600
                  }}
                >
                  {lightboxZoom ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
                  {lightboxZoom ? 'Reset Zoom' : 'Zoom In'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: 'none',
                  borderRadius: 10,
                  padding: 8,
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Center Stage Media */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 1100,
              flexGrow: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
          >
            {/* Previous Media Arrow */}
            {mediaList.length > 1 && (
              <button
                type="button"
                onClick={handlePrevMedia}
                className="lightbox-arrow"
                title="Previous (Left Arrow)"
                style={{
                  position: 'absolute',
                  left: 12,
                  zIndex: 10,
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 46,
                  height: 46,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {activeMedia.type === 'video' ? (
              <video
                key={activeMedia.url}
                src={activeMedia.url}
                controls
                autoPlay
                playsInline
                style={{
                  maxWidth: '90vw',
                  maxHeight: '72vh',
                  borderRadius: 16,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
                }}
              >
                <source src={activeMedia.url} type="video/mp4" />
                Your browser does not support HTML5 video playback.
              </video>
            ) : (
              <img
                src={activeMedia.url}
                alt={product.name}
                onClick={() => setLightboxZoom(prev => !prev)}
                style={{
                  maxWidth: lightboxZoom ? 'none' : '90vw',
                  maxHeight: lightboxZoom ? 'none' : '72vh',
                  transform: lightboxZoom ? 'scale(1.75)' : 'none',
                  transition: 'transform 0.25s ease',
                  cursor: lightboxZoom ? 'zoom-out' : 'zoom-in',
                  borderRadius: 16,
                  objectFit: 'contain',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
                }}
              />
            )}

            {/* Next Media Arrow */}
            {mediaList.length > 1 && (
              <button
                type="button"
                onClick={handleNextMedia}
                className="lightbox-arrow"
                title="Next (Right Arrow)"
                style={{
                  position: 'absolute',
                  right: 12,
                  zIndex: 10,
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 46,
                  height: 46,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Strip */}
          {mediaList.length > 1 && (
            <div
              onClick={e => e.stopPropagation()}
              style={{
                display: 'flex',
                gap: 10,
                overflowX: 'auto',
                maxWidth: 900,
                padding: '14px 0 4px',
                scrollbarWidth: 'none'
              }}
            >
              {mediaList.map((media, idx) => (
                <div
                  key={`lightbox-strip-${idx}`}
                  onClick={() => setSelectedMediaIndex(idx)}
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 10,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: `2px solid ${selectedMediaIndex === idx ? '#c25e34' : 'rgba(255,255,255,0.25)'}`,
                    opacity: selectedMediaIndex === idx ? 1 : 0.55,
                    flexShrink: 0,
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  {media.type === 'video' ? (
                    <div style={{ width: '100%', height: '100%', background: '#12100e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Play size={14} fill="#fff" color="#fff" />
                    </div>
                  ) : (
                    <img src={media.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <OTPLoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </div>
  );
}
