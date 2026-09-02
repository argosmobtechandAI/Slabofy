"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import { 
  Search, SlidersHorizontal, RefreshCw, AlertTriangle, ArrowRight, Users, Zap, 
  TrendingUp, ShieldCheck, Star, Clock, Lock, Sparkles, Shirt, Smartphone, 
  Home as HomeIcon, ShoppingBag, Dumbbell, BookOpen, Gamepad2, LayoutGrid, Flame,
  CheckCircle2, ChevronRight, Tag
} from 'lucide-react';
import toast from 'react-hot-toast';
import useScrollReveal from '../hooks/useScrollReveal';

// Flipkart-style Category Definition Helper
const CATEGORY_MAP = {
  'electronics': {
    icon: Smartphone,
    shortName: 'Electronics',
    gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)',
    color: '#2563eb',
    bg: '#eff6ff',
    badge: 'Up to 50% Off'
  },
  'apparel & fashion': {
    icon: Shirt,
    shortName: 'Fashion',
    gradient: 'linear-gradient(135deg, #db2777, #ec4899)',
    color: '#db2777',
    bg: '#fdf2f8',
    badge: 'Trending'
  },
  'home & kitchen': {
    icon: HomeIcon,
    shortName: 'Home & Kitchen',
    gradient: 'linear-gradient(135deg, #d97706, #f59e0b)',
    color: '#d97706',
    bg: '#fffbeb',
    badge: 'Best Value'
  },
  'groceries': {
    icon: ShoppingBag,
    shortName: 'Groceries',
    gradient: 'linear-gradient(135deg, #059669, #10b981)',
    color: '#059669',
    bg: '#ecfdf5',
    badge: 'Fresh'
  },
  'beauty & personal care': {
    icon: Sparkles,
    shortName: 'Beauty & Care',
    gradient: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    color: '#7c3aed',
    bg: '#f3e8ff',
    badge: 'Popular'
  },
  'sports & fitness': {
    icon: Dumbbell,
    shortName: 'Sports & Fitness',
    gradient: 'linear-gradient(135deg, #dc2626, #ef4444)',
    color: '#dc2626',
    bg: '#fef2f2',
    badge: 'Active'
  },
  'books & stationery': {
    icon: BookOpen,
    shortName: 'Books & Office',
    gradient: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
    color: '#0284c7',
    bg: '#f0f9ff',
    badge: 'Top Picks'
  },
  'toys & games': {
    icon: Gamepad2,
    shortName: 'Toys & Games',
    gradient: 'linear-gradient(135deg, #ea580c, #f97316)',
    color: '#ea580c',
    bg: '#fff7ed',
    badge: 'New'
  }
};

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeGlobalGroups, setActiveGlobalGroups] = useState([]);

  const revealRef1 = useScrollReveal();
  const revealRef2 = useScrollReveal();
  const revealRef4 = useScrollReveal();

  useEffect(() => { 
    fetchCategories(); 
    fetchActiveGlobalGroups(); 
  }, []);

  useEffect(() => { 
    fetchProducts(); 
  }, [selectedCategory, sortBy, page]);

  const fetchCategories = async () => {
    try { 
      const res = await api.get('/categories'); 
      setCategories(res.data.categories || []); 
    } catch (err) { 
      console.error(err.message); 
    }
  };

  const fetchActiveGlobalGroups = async () => {
    try {
      const res = await api.get('/groups');
      setActiveGlobalGroups(res.data.groups || []);
    } catch (err) {
      console.error('Failed to fetch active global groups:', err.message);
    }
  };

  const fetchProducts = async () => {
    setLoading(true); 
    setError(null);
    try {
      const res = await api.get('/products', { 
        params: { 
          category_id: selectedCategory, 
          search: searchQuery, 
          sort_by: sortBy, 
          page, 
          limit: 12 
        } 
      });
      setProducts(res.data.products || []);
      setPagination(res.data.pagination || { totalPages: 1 });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect to backend server');
      toast.error('Error fetching products');
    } finally { 
      setLoading(false); 
    }
  };

  const handleSearchSubmit = (e) => { 
    e.preventDefault(); 
    setPage(1); 
    fetchProducts(); 
  };

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const getCategoryMeta = (cat) => {
    if (!cat || !cat.id) {
      return {
        icon: LayoutGrid,
        shortName: 'All Deals',
        gradient: 'linear-gradient(135deg, #5b21b6, #7c3aed)',
        color: '#5b21b6',
        bg: '#f5f3ff',
        badge: 'Explore'
      };
    }
    const key = (cat.name || '').toLowerCase().trim();
    return CATEGORY_MAP[key] || {
      icon: Tag,
      shortName: cat.name,
      gradient: 'linear-gradient(135deg, #4b5563, #6b7280)',
      color: '#4b5563',
      bg: '#f3f4f6',
      badge: 'Popular'
    };
  };

  return (
    <div style={{ background: '#faf8f4', minHeight: '100vh' }}>

      {/* ══ TICKER STRIP ══ */}
      <div style={{ background: 'rgba(91,33,182,0.06)', color: '#5b21b6', padding: '7px 0', overflow: 'hidden', borderBottom: '1px solid rgba(91,33,182,0.1)' }}>
        <div className="ticker-wrap">
          <div className="ticker-inner" style={{ gap: 0 }}>
            {[...Array(2)].map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                {['⚡ Group Buying Revolution', '🔥 Up to 60% Off', '👥 50,000+ Buyers', '✅ Verified Sellers Only', '🚀 New Deals Every Day', '💳 Secure Payments', '🌍 Nationwide Shipping'].map((t, j) => (
                  <span key={j} style={{ whiteSpace: 'nowrap', padding: '0 28px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: j % 3 === 1 ? '#f05035' : j % 3 === 2 ? '#f59e0b' : '#5b21b6' }}>
                    {t}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ COMPACT HERO BANNER ══ */}
      <section style={{ maxWidth: 1320, margin: '0 auto', padding: '16px 16px 8px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #faf8f4 60%, #f4effa 100%)',
          borderRadius: 20,
          border: '1px solid rgba(91,33,182,0.12)',
          boxShadow: '0 4px 20px rgba(18,16,14,0.04)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16
        }}>
          {/* Left: Punchy headline & Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{
                  background: 'rgba(91,33,182,0.08)',
                  color: '#5b21b6',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: 999,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <Zap size={10} fill="#5b21b6" /> Social Co-Buying
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#059669', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <ShieldCheck size={12} /> 100% Buyer Protected
                </span>
              </div>

              <h1 style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontWeight: 800,
                fontSize: 'clamp(1.4rem, 2.8vw, 2.1rem)',
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                color: '#12100e',
                margin: 0
              }}>
                Shop{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #5b21b6 0%, #f05035 50%, #f59e0b 100%)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  display: 'inline-block',
                  animation: 'shimmer-slide 5s linear infinite',
                }}>
                  Together,
                </span>{' '}
                Save More.
              </h1>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginLeft: 'auto' }}>
              <a href="#products" className="btn-ink" style={{ textDecoration: 'none', padding: '9px 18px', fontSize: '0.78rem', borderRadius: 12 }}>
                Explore Deals <ArrowRight size={14} />
              </a>
              <a href="#products" className="btn-outline-ink" style={{ textDecoration: 'none', padding: '9px 16px', fontSize: '0.78rem', borderRadius: 12 }}>
                <Users size={14} /> Join a Group
              </a>
            </div>
          </div>

          {/* Right: Compact Live Ticker Badges */}
          <div style={{ display: 'none', alignItems: 'center', gap: 12 }} className="lg:flex">
            {[
              { label: '50,000+', sub: 'Buyers', color: '#5b21b6' },
              { label: 'Up to 60%', sub: 'Savings', color: '#f05035' },
              { label: 'Verified', sub: 'Merchants', color: '#059669' }
            ].map(({ label, sub, color }) => (
              <div key={label} style={{
                background: '#fff',
                border: '1px solid rgba(18,16,14,0.06)',
                borderRadius: 12,
                padding: '6px 14px',
                textAlign: 'center',
                boxShadow: '0 2px 6px rgba(18,16,14,0.02)'
              }}>
                <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.95rem', fontWeight: 800, color, lineHeight: 1 }}>{label}</div>
                <div style={{ fontSize: '0.58rem', fontWeight: 700, color: '#a09a94', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FLIPKART-STYLE MAJOR CATEGORIES BAR ══ */}
      <section style={{ maxWidth: 1320, margin: '0 auto', padding: '8px 16px 16px' }}>
        <div style={{
          background: '#ffffff',
          borderRadius: 24,
          padding: '16px 20px',
          border: '1px solid rgba(18,16,14,0.07)',
          boxShadow: '0 4px 20px rgba(18,16,14,0.03)'
        }}>
          {/* Section Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#5b21b6', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Featured Categories
              </span>
              <span style={{ fontSize: '0.65rem', color: '#a09a94', fontWeight: 600 }}>
                • Click to filter group deals
              </span>
            </div>
            {selectedCategory && (
              <button
                onClick={() => { setSelectedCategory(''); setPage(1); }}
                style={{
                  background: 'none', border: 'none', color: '#5b21b6',
                  fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4
                }}
              >
                Reset Filter ✕
              </button>
            )}
          </div>

          {/* Flipkart-style Horizontal Category Grid / Carousel */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))',
            gap: 12,
            overflowX: 'auto',
            paddingBottom: 4
          }}>
            {/* "All Deals" Card */}
            {(() => {
              const allMeta = getCategoryMeta(null);
              const isSelected = selectedCategory === '';
              const AllIcon = allMeta.icon;
              return (
                <button
                  key="all-categories"
                  onClick={() => { setSelectedCategory(''); setPage(1); }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px 8px',
                    borderRadius: 18,
                    background: isSelected ? 'rgba(91,33,182,0.06)' : '#faf8f4',
                    border: isSelected ? '2px solid #5b21b6' : '1px solid rgba(18,16,14,0.06)',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                    boxShadow: isSelected ? '0 6px 20px rgba(91,33,182,0.12)' : 'none',
                    transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                  }}
                  onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.borderColor = 'rgba(91,33,182,0.25)'; } }}
                  onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background = '#faf8f4'; e.currentTarget.style.borderColor = 'rgba(18,16,14,0.06)'; } }}
                >
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    background: allMeta.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 8,
                    boxShadow: '0 4px 12px rgba(91,33,182,0.25)'
                  }}>
                    <AllIcon size={22} color="#ffffff" />
                  </div>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: isSelected ? 800 : 700,
                    color: isSelected ? '#5b21b6' : '#12100e',
                    textAlign: 'center',
                    lineHeight: 1.2
                  }}>
                    All Deals
                  </span>
                  <span style={{
                    fontSize: '0.58rem',
                    fontWeight: 700,
                    color: isSelected ? '#5b21b6' : '#a09a94',
                    marginTop: 2
                  }}>
                    {products.length}+ Items
                  </span>
                </button>
              );
            })()}

            {/* Dynamic Category Cards */}
            {categories.map(cat => {
              const meta = getCategoryMeta(cat);
              const isSelected = selectedCategory === cat.id;
              const IconComp = meta.icon;

              return (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.id); setPage(1); }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px 8px',
                    borderRadius: 18,
                    background: isSelected ? meta.bg : '#faf8f4',
                    border: isSelected ? `2px solid ${meta.color}` : '1px solid rgba(18,16,14,0.06)',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                    boxShadow: isSelected ? `0 6px 20px ${meta.color}25` : 'none',
                    transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                  }}
                  onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background = meta.bg; e.currentTarget.style.borderColor = `${meta.color}40`; } }}
                  onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background = '#faf8f4'; e.currentTarget.style.borderColor = 'rgba(18,16,14,0.06)'; } }}
                >
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    background: meta.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 8,
                    boxShadow: `0 4px 12px ${meta.color}35`
                  }}>
                    <IconComp size={22} color="#ffffff" />
                  </div>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: isSelected ? 800 : 700,
                    color: isSelected ? meta.color : '#12100e',
                    textAlign: 'center',
                    lineHeight: 1.2
                  }}>
                    {meta.shortName}
                  </span>
                  <span style={{
                    fontSize: '0.58rem',
                    fontWeight: 700,
                    color: isSelected ? meta.color : '#a09a94',
                    marginTop: 2
                  }}>
                    {meta.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ PRODUCTS SECTION (IMMEDIATELY VISIBLE ON TOP) ══ */}
      <section ref={revealRef1} id="products" style={{ maxWidth: 1320, margin: '0 auto', padding: '12px 16px 80px' }}>

        {/* Section label & Responsive Search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#5b21b6', textTransform: 'uppercase', letterSpacing: '0.14em', display: 'block', marginBottom: 4 }}>
              — Live Marketplace
            </span>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 'clamp(1.4rem, 3.2vw, 2.2rem)', color: '#12100e', margin: 0 }}>
              Trending Group Deals
            </h2>
          </div>

          {/* Search form with full mobile responsiveness */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 320 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#a09a94' }} />
                <input
                  type="text" placeholder="Search products, brands..."
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="input-premium"
                  style={{ paddingLeft: 38, paddingTop: 8, paddingBottom: 8, width: '100%', fontSize: '0.8rem', borderRadius: 12 }}
                />
              </div>
              <button type="submit" className="btn-violet" style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: 12, flexShrink: 0 }}>
                Search
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <SlidersHorizontal size={13} style={{ color: '#a09a94' }} />
              <select
                value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}
                className="input-premium"
                style={{ padding: '8px 32px 8px 14px', fontSize: '0.78rem', width: 'auto', minWidth: 150, borderRadius: 12, background: '#fff' }}
              >
                <option value="">Sort: Relevance</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          
          {/* LEFT: Products Grid & Pagination (75%) */}
          <div style={{ flex: '1 1 68%', minWidth: 0 }}>
            {/* Products grid */}
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '60px 0' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(91,33,182,0.15)', borderTopColor: '#5b21b6', animation: 'spin-slow 0.7s linear infinite' }} />
                <p style={{ color: '#a09a94', fontWeight: 600, fontSize: '0.85rem' }}>Loading group deals...</p>
              </div>
            ) : error ? (
              <div style={{ background: '#fff', borderRadius: 24, padding: 36, textAlign: 'center', border: '1px solid rgba(240,80,53,0.15)', maxWidth: 420, margin: '0 auto' }}>
                <AlertTriangle size={36} color="#f05035" style={{ marginBottom: 12 }} />
                <h4 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1.1rem', marginBottom: 6 }}>Backend Offline</h4>
                <p style={{ color: '#a09a94', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: 18 }}>{error}</p>
                <button onClick={fetchProducts} className="btn-violet" style={{ borderRadius: 12, padding: '8px 20px', fontSize: '0.82rem' }}>
                  Retry
                </button>
              </div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', border: '2px dashed rgba(18,16,14,0.1)', borderRadius: 24, background: '#fff' }}>
                <Users size={36} style={{ marginBottom: 12, color: '#a09a94' }} />
                <p style={{ fontWeight: 700, color: '#12100e', fontSize: '0.95rem' }}>No products found</p>
                <p style={{ fontSize: '0.8rem', color: '#a09a94', marginTop: 4 }}>Try selecting a different category or search term.</p>
                <button onClick={() => { setSelectedCategory(''); setSearchQuery(''); }} className="btn-ink" style={{ marginTop: 14, fontSize: '0.78rem', padding: '8px 16px', borderRadius: 10 }}>
                  View All Products
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 20 }}>
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, paddingTop: 40 }}>
                <button
                  disabled={page === 1} onClick={() => setPage(page - 1)}
                  style={{ padding: '8px 20px', borderRadius: 100, background: '#fff', border: '1px solid rgba(18,16,14,0.12)', fontSize: '0.8rem', fontWeight: 700, color: page === 1 ? '#c8c3bd' : '#12100e', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                >← Prev</button>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b6560', padding: '0 8px' }}>
                  {page} / {pagination.totalPages}
                </span>
                <button
                  disabled={page === pagination.totalPages} onClick={() => setPage(page + 1)}
                  style={{ padding: '8px 20px', borderRadius: 100, background: page === pagination.totalPages ? '#f7f5f2' : '#12100e', border: 'none', fontSize: '0.8rem', fontWeight: 700, color: page === pagination.totalPages ? '#c8c3bd' : '#faf8f4', cursor: page === pagination.totalPages ? 'not-allowed' : 'pointer', boxShadow: page === pagination.totalPages ? 'none' : '0 4px 16px rgba(18,16,14,0.3)' }}
                >Next →</button>
              </div>
            )}
          </div>

          {/* RIGHT: Active Global Groups Marquee (28%) */}
          <div className="active-teams-sidebar" style={{ flex: '0 0 290px', position: 'sticky', top: 88 }}>
            <div style={{ background: '#fff', borderRadius: 24, border: '1px solid rgba(18,16,14,0.08)', padding: '20px 18px', boxShadow: '0 4px 24px rgba(18,16,14,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, borderBottom: '1px solid rgba(18,16,14,0.08)', paddingBottom: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f05035', animation: 'pulse-ring 2s infinite' }} />
                <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#12100e', margin: 0 }}>Active Deal Rooms</h3>
              </div>
              
              <div className="marquee-container" style={{ maxHeight: 440, overflow: 'hidden', position: 'relative', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 5%, black 95%, transparent)' }}>
                <div className={activeGlobalGroups.length > 3 ? "marquee-content" : ""} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {activeGlobalGroups.length > 0 ? [...activeGlobalGroups, ...(activeGlobalGroups.length > 3 ? activeGlobalGroups : [])].map((group, idx) => (
                      <a href={`/product/${group.product_id}`} key={`${group.id}-${idx}`} style={{ display: 'block', textDecoration: 'none', background: '#faf8f4', borderRadius: 16, padding: 14, border: '1px solid rgba(18,16,14,0.05)', transition: 'all 0.2s', color: 'inherit' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#5b21b6'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(18,16,14,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <img src={group.product_image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=70'} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', background: '#f2ede4', border: '1px solid rgba(18,16,14,0.05)' }} />
                          <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#12100e', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{group.product_name || 'Product'}</div>
                            <div style={{ fontSize: '0.65rem', color: '#a09a94', marginTop: 1 }}>Started by <span style={{ fontWeight: 600, color: '#6b6560' }}>{group.creator_name}</span></div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', fontWeight: 700 }}>
                          <span style={{ color: '#059669', background: 'rgba(5,150,105,0.1)', padding: '2px 8px', borderRadius: 6 }}>{fmt(group.tier_price)}</span>
                          <span style={{ color: '#f05035', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Zap size={10} fill="#f05035" />
                            {group.slots_remaining} slot{group.slots_remaining !== 1 ? 's' : ''} left
                          </span>
                        </div>
                      </a>
                    )) : (
                      <div style={{ textAlign: 'center', color: '#a09a94', fontSize: '0.78rem', padding: '20px 0' }}>No active deal rooms right now.</div>
                    )}
                </div>
              </div>
              
              <a href="#products" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, width: '100%', padding: '10px', marginTop: 14, background: '#faf8f4', borderRadius: 12, textDecoration: 'none', color: '#5b21b6', fontSize: '0.75rem', fontWeight: 700, border: '1px dashed rgba(91,33,182,0.2)', transition: 'all 0.2s' }}
                 onMouseEnter={e => { e.currentTarget.style.background = 'rgba(91,33,182,0.05)'; e.currentTarget.style.borderColor = 'rgba(91,33,182,0.4)'; }}
                 onMouseLeave={e => { e.currentTarget.style.background = '#faf8f4'; e.currentTarget.style.borderColor = 'rgba(91,33,182,0.2)'; }}
              >
                Start a New Team
              </a>
            </div>
          </div>
          
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section ref={revealRef2} className="mesh-violet" style={{ padding: 'clamp(40px, 5vw, 64px) 16px', borderTop: '1px solid rgba(18,16,14,0.06)' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div className="animate-fade-in-up" style={{ textAlign: 'center', marginBottom: 36, animationDelay: '0ms' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#5b21b6', textTransform: 'uppercase', letterSpacing: '0.14em', display: 'block', marginBottom: 10 }}>&mdash; Simple &amp; Powerful</span>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 'clamp(1.5rem, 3.5vw, 2.3rem)', color: '#12100e', letterSpacing: '-0.03em' }}>
              How Group Buying Works
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
            {[
              { n: '01', title: 'Browse Deals', desc: 'Explore products with tiered pricing. The more team members, the lower the price.', color: '#5b21b6' },
              { n: '02', title: 'Start or Join a Team', desc: 'Create a co-buying group or join an existing active team. Share the invite link.', color: '#f05035' },
              { n: '03', title: 'Payment Hold Placed', desc: 'Your card is pre-authorized (not charged yet). Zero risk until the team fills.', color: '#f59e0b' },
              { n: '04', title: 'Group Completes → You Save', desc: 'Once the team fills, payments are captured and orders are dispatched. Everyone wins!', color: '#059669' },
            ].map(({ n, title, desc, color }, idx) => (
              <div key={n} className="animate-fade-in-up" style={{ background: '#fff', border: '1px solid rgba(18,16,14,0.08)', borderRadius: 20, padding: '22px 18px', transition: 'all 0.3s', boxShadow: '0 4px 20px rgba(18,16,14,0.03)', animationDelay: `${idx * 80}ms` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color + '44'; e.currentTarget.style.background = color + '10'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(18,16,14,0.08)'; e.currentTarget.style.background = '#fff'; }}
              >
                <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '2rem', color, lineHeight: 1, marginBottom: 12, opacity: 0.7 }}>{n}</div>
                <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#12100e', marginBottom: 6, letterSpacing: '-0.02em' }}>{title}</h3>
                <p style={{ fontSize: '0.78rem', color: '#6b6560', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ WHY GROUP BUYING ══ */}
      <section ref={revealRef4} style={{ padding: 'clamp(40px, 5vw, 64px) 16px', background: '#fff', borderTop: '1px solid rgba(18,16,14,0.06)' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#f05035', textTransform: 'uppercase', letterSpacing: '0.14em', display: 'block', marginBottom: 10 }}>— Why Us?</span>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 'clamp(1.5rem, 3.5vw, 2.3rem)', color: '#12100e', letterSpacing: '-0.03em' }}>
              Why Group Buying?<br />
              <span style={{ background: 'linear-gradient(135deg, #5b21b6, #f05035)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>The Smarter Way to Shop</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {[
              {
                icon: <TrendingUp size={26} color="#5b21b6" />,
                bg: 'rgba(91,33,182,0.07)',
                accent: '#5b21b6',
                title: 'Save Up to 60%',
                desc: 'The more buyers in your team, the steeper the discount. Wholesale prices, retail convenience.',
              },
              {
                icon: <Clock size={26} color="#f05035" />,
                bg: 'rgba(240,80,53,0.07)',
                accent: '#f05035',
                title: 'Zero Risk Model',
                desc: 'Your payment is only a pre-authorization hold. If the group doesn\'t fill, you pay absolutely nothing.',
              },
              {
                icon: <ShieldCheck size={26} color="#059669" />,
                bg: 'rgba(5,150,105,0.07)',
                accent: '#059669',
                title: 'Verified Sellers Only',
                desc: 'Every seller undergoes strict GST, PAN and bank verification to guarantee 100% authentic products.',
              },
              {
                icon: <Lock size={26} color="#0284c7" />,
                bg: 'rgba(2,132,199,0.07)',
                accent: '#0284c7',
                title: 'Escrow Security',
                desc: 'Funds are held in secure escrow and only released to sellers after confirmed door delivery.',
              },
            ].map(({ icon, bg, accent, title, desc }) => (
              <div key={title} style={{
                background: '#faf8f4',
                borderRadius: 20,
                padding: '24px 20px',
                border: '1px solid rgba(18,16,14,0.06)',
                transition: 'transform 0.25s, box-shadow 0.25s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(18,16,14,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  {icon}
                </div>
                <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#12100e', marginBottom: 6 }}>{title}</h3>
                <p style={{ fontSize: '0.78rem', color: '#6b6560', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
