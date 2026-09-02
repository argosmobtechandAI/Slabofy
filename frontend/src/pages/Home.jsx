"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import { 
  Search, SlidersHorizontal, RefreshCw, AlertTriangle, ArrowRight, Users, Zap, 
  TrendingUp, ShieldCheck, Star, Clock, Lock, Sparkles, Shirt, Smartphone, 
  Home as HomeIcon, ShoppingBag, Dumbbell, BookOpen, Gamepad2, LayoutGrid, Flame,
  CheckCircle2, ChevronRight, Tag, X, Filter
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

  const fetchProducts = async (overrides = {}) => {
    setLoading(true); 
    setError(null);
    try {
      const catId = overrides.category_id !== undefined ? overrides.category_id : selectedCategory;
      const search = overrides.search !== undefined ? overrides.search : searchQuery;
      const sort = overrides.sort_by !== undefined ? overrides.sort_by : sortBy;
      const p = overrides.page !== undefined ? overrides.page : page;

      const res = await api.get('/products', { 
        params: { 
          category_id: catId || undefined, 
          search: search || undefined, 
          sort_by: sort || undefined, 
          page: p, 
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
    fetchProducts({ search: searchQuery, page: 1 }); 
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setPage(1);
    fetchProducts({ search: '', page: 1 });
  };

  const clearAllFilters = () => {
    setSelectedCategory('');
    setSearchQuery('');
    setSortBy('');
    setPage(1);
    fetchProducts({ category_id: '', search: '', sort_by: '', page: 1 });
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

  const hasActiveFilters = Boolean(selectedCategory || searchQuery || sortBy);

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
                  <Zap size={10} fill="#5b21b6" /> Co-Buying
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
      <section style={{ maxWidth: 1320, margin: '0 auto', padding: '8px 16px 14px' }}>
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

          {/* Flipkart-style Horizontal Category Grid */}
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

      {/* ══ ACTIVE DEAL ROOMS STRIP (IF ACTIVE GROUPS EXIST) ══ */}
      {activeGlobalGroups.length > 0 && (
        <section style={{ maxWidth: 1320, margin: '0 auto', padding: '0 16px 16px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #fff 0%, #fff7ed 100%)',
            border: '1px solid rgba(240,80,53,0.18)',
            borderRadius: 20,
            padding: '16px 20px',
            boxShadow: '0 4px 20px rgba(240,80,53,0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f05035', animation: 'pulse-ring 2s infinite' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#12100e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Live Co-Buying Deal Rooms
                </span>
                <span style={{ fontSize: '0.65rem', background: 'rgba(240,80,53,0.1)', color: '#f05035', fontWeight: 800, padding: '2px 8px', borderRadius: 999 }}>
                  {activeGlobalGroups.length} Active Now
                </span>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#6b6560' }}>
                Join existing teams to lock in group savings before slots close!
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {activeGlobalGroups.slice(0, 4).map((group, idx) => (
                <a
                  href={`/product/${group.product_id}`}
                  key={`${group.id}-${idx}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: '#fff',
                    borderRadius: 14,
                    padding: '10px 12px',
                    border: '1px solid rgba(18,16,14,0.06)',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(18,16,14,0.03)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#5b21b6'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(18,16,14,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <img
                    src={group.product_image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=70'}
                    alt=""
                    style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', background: '#f2ede4', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#12100e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {group.product_name || 'Product'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669' }}>
                        {fmt(group.tier_price)}
                      </span>
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#f05035', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Zap size={9} fill="#f05035" /> {group.slots_remaining} left
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ PRODUCTS SECTION (CLEAN UNIFIED TOOLBAR + FULL-WIDTH 4-COLUMN GRID) ══ */}
      <section ref={revealRef1} id="products" style={{ maxWidth: 1320, margin: '0 auto', padding: '8px 16px 80px' }}>

        {/* Clean, Professional Unified Header & Controls Toolbar */}
        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: '14px 20px',
          border: '1px solid rgba(18,16,14,0.07)',
          boxShadow: '0 2px 12px rgba(18,16,14,0.02)',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16
        }}>
          {/* Left: Heading & Count Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div>
              <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#5b21b6', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block' }}>
                — Live Marketplace
              </span>
              <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 'clamp(1.25rem, 2.5vw, 1.7rem)', color: '#12100e', margin: 0, lineHeight: 1.2 }}>
                Trending Group Deals
              </h2>
            </div>
            <span style={{
              background: '#faf8f4',
              border: '1px solid rgba(18,16,14,0.08)',
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: '0.68rem',
              fontWeight: 700,
              color: '#6b6560'
            }}>
              {products.length} Deals
            </span>
          </div>

          {/* Right: Unified Search Bar + Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginLeft: 'auto' }}>
            {/* Integrated Search Input */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={15} style={{ position: 'absolute', left: 12, color: '#a09a94', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search products, brands..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    height: 40,
                    paddingLeft: 36,
                    paddingRight: searchQuery ? 32 : 12,
                    fontSize: '0.8rem',
                    borderRadius: '12px 0 0 12px',
                    border: '1.5px solid rgba(18,16,14,0.12)',
                    borderRight: 'none',
                    background: '#faf8f4',
                    color: '#12100e',
                    outline: 'none',
                    width: 'clamp(170px, 20vw, 240px)',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#5b21b6'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(18,16,14,0.12)'}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    style={{ position: 'absolute', right: 8, background: 'none', border: 'none', color: '#a09a94', cursor: 'pointer', padding: 2 }}
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                type="submit"
                style={{
                  height: 40,
                  padding: '0 16px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  borderRadius: '0 12px 12px 0',
                  background: '#5b21b6',
                  color: '#ffffff',
                  border: '1.5px solid #5b21b6',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#4c1d95'}
                onMouseLeave={e => e.currentTarget.style.background = '#5b21b6'}
              >
                Search
              </button>
            </form>

            {/* Sort Selector */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <SlidersHorizontal size={13} style={{ position: 'absolute', left: 12, color: '#a09a94', pointerEvents: 'none' }} />
              <select
                value={sortBy}
                onChange={e => { setSortBy(e.target.value); setPage(1); }}
                style={{
                  height: 40,
                  paddingLeft: 32,
                  paddingRight: 32,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  borderRadius: 12,
                  border: '1.5px solid rgba(18,16,14,0.12)',
                  background: '#faf8f4',
                  color: '#12100e',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="">Sort: Relevance</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>

            {/* Clear Filters Button (If active) */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                style={{
                  height: 40,
                  padding: '0 12px',
                  borderRadius: 12,
                  background: 'rgba(240,80,53,0.08)',
                  border: '1px solid rgba(240,80,53,0.2)',
                  color: '#f05035',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
                title="Clear all filters"
              >
                <X size={13} /> Reset
              </button>
            )}
          </div>
        </div>

        {/* FULL-WIDTH 4-COLUMN PRODUCT GRID */}
        <div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '80px 0' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(91,33,182,0.15)', borderTopColor: '#5b21b6', animation: 'spin-slow 0.7s linear infinite' }} />
              <p style={{ color: '#a09a94', fontWeight: 600, fontSize: '0.88rem' }}>Loading verified group deals...</p>
            </div>
          ) : error ? (
            <div style={{ background: '#fff', borderRadius: 24, padding: 40, textAlign: 'center', border: '1px solid rgba(240,80,53,0.15)', maxWidth: 420, margin: '40px auto' }}>
              <AlertTriangle size={40} color="#f05035" style={{ marginBottom: 12 }} />
              <h4 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1.1rem', marginBottom: 6 }}>Unable to load deals</h4>
              <p style={{ color: '#a09a94', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: 18 }}>{error}</p>
              <button onClick={fetchProducts} className="btn-violet" style={{ borderRadius: 12, padding: '9px 22px', fontSize: '0.82rem' }}>
                Retry
              </button>
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', border: '2px dashed rgba(18,16,14,0.1)', borderRadius: 24, background: '#fff', margin: '20px 0' }}>
              <Users size={40} style={{ marginBottom: 12, color: '#a09a94' }} />
              <h3 style={{ fontWeight: 800, color: '#12100e', fontSize: '1.1rem' }}>No products found</h3>
              <p style={{ fontSize: '0.82rem', color: '#a09a94', marginTop: 4, maxWidth: 360, marginInline: 'auto' }}>
                No active deals match your current category or search criteria.
              </p>
              <button onClick={clearAllFilters} className="btn-ink" style={{ marginTop: 16, fontSize: '0.8rem', padding: '10px 20px', borderRadius: 12 }}>
                Browse All Products
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
              gap: 24
            }}>
              {products.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, paddingTop: 48 }}>
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                style={{
                  padding: '9px 22px',
                  borderRadius: 100,
                  background: '#fff',
                  border: '1.5px solid rgba(18,16,14,0.12)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: page === 1 ? '#c8c3bd' : '#12100e',
                  cursor: page === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                ← Prev
              </button>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#6b6560', padding: '0 10px' }}>
                Page {page} of {pagination.totalPages}
              </span>
              <button
                disabled={page === pagination.totalPages}
                onClick={() => setPage(page + 1)}
                style={{
                  padding: '9px 22px',
                  borderRadius: 100,
                  background: page === pagination.totalPages ? '#f7f5f2' : '#12100e',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: page === pagination.totalPages ? '#c8c3bd' : '#faf8f4',
                  cursor: page === pagination.totalPages ? 'not-allowed' : 'pointer',
                  boxShadow: page === pagination.totalPages ? 'none' : '0 4px 16px rgba(18,16,14,0.25)'
                }}
              >
                Next →
              </button>
            </div>
          )}
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
