"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import { Search, SlidersHorizontal, RefreshCw, AlertTriangle, ArrowRight, Users, Zap, TrendingUp, ShieldCheck, Star, Clock, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import useScrollReveal from '../hooks/useScrollReveal';

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
  const revealRef3 = useScrollReveal();
  const revealRef4 = useScrollReveal();

  // Parallax blob refs
  const blob1Ref = useRef(null);
  const blob2Ref = useRef(null);
  const heroRef = useRef(null);

  const handleHeroMouseMove = useCallback((e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const cx = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const cy = (e.clientY - rect.top - rect.height / 2) / rect.height;
    if (blob1Ref.current) {
      blob1Ref.current.style.transform = `translate(${cx * 30}px, ${cy * 20}px)`;
    }
    if (blob2Ref.current) {
      blob2Ref.current.style.transform = `translate(${-cx * 20}px, ${-cy * 15}px)`;
    }
  }, []);

  useEffect(() => { fetchCategories(); fetchActiveGlobalGroups(); }, []);
  useEffect(() => { fetchProducts(); }, [selectedCategory, sortBy, page]);

  const fetchCategories = async () => {
    try { const res = await api.get('/categories'); setCategories(res.data.categories || []); }
    catch (err) { console.error(err.message); }
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
    setLoading(true); setError(null);
    try {
      const res = await api.get('/products', { params: { category_id: selectedCategory, search: searchQuery, sort_by: sortBy, page, limit: 12 } });
      setProducts(res.data.products || []);
      setPagination(res.data.pagination || { totalPages: 1 });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect to backend server');
      toast.error('Error fetching products');
    } finally { setLoading(false); }
  };

  const handleSearchSubmit = (e) => { e.preventDefault(); setPage(1); fetchProducts(); };

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <div style={{ background: '#faf8f4', minHeight: '100vh' }}>

      {/* ══ TICKER STRIP ══ */}
      <div style={{ background: 'rgba(91,33,182,0.06)', color: '#5b21b6', padding: '10px 0', overflow: 'hidden', borderBottom: '1px solid rgba(91,33,182,0.1)' }}>
        <div className="ticker-wrap">
          <div className="ticker-inner" style={{ gap: 0 }}>
            {[...Array(2)].map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                {['⚡ Group Buying Revolution', '🔥 Up to 60% Off', '👥 50,000+ Buyers', '✅ Verified Sellers Only', '🚀 New Deals Every Day', '💳 Secure Payments', '🌍 Ship Nationwide', '⚡ Group Buying Revolution', '🔥 Up to 60% Off', '👥 50,000+ Buyers'].map((t, j) => (
                  <span key={j} style={{ whiteSpace: 'nowrap', padding: '0 32px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: j % 3 === 1 ? '#f05035' : j % 3 === 2 ? '#f59e0b' : '#5b21b6' }}>
                    {t}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ HERO ══ */}
      <section ref={heroRef} onMouseMove={handleHeroMouseMove} style={{ position: 'relative', overflow: 'hidden', padding: '80px 24px 60px' }} className="mesh-hero noise-overlay">

        {/* Parallax background blobs */}
        <div ref={blob1Ref} style={{ position: 'absolute', top: '-10%', right: '-5%', width: 520, height: 520, background: 'radial-gradient(circle, rgba(91,33,182,0.14) 0%, transparent 70%)', pointerEvents: 'none', transition: 'transform 0.15s ease-out', willChange: 'transform' }} />
        <div ref={blob2Ref} style={{ position: 'absolute', bottom: '-15%', left: '-8%', width: 420, height: 420, background: 'radial-gradient(circle, rgba(240,80,53,0.1) 0%, transparent 70%)', pointerEvents: 'none', transition: 'transform 0.15s ease-out', willChange: 'transform' }} />

        {/* Spinning rings */}
        <div className="animate-spin-slow" style={{ position: 'absolute', top: '8%', right: '6%', width: 220, height: 220, border: '1.5px dashed rgba(91,33,182,0.18)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div className="animate-spin-reverse" style={{ position: 'absolute', top: '8%', right: '6%', width: 160, height: 160, margin: 30, border: '1px solid rgba(240,80,53,0.12)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1320, margin: '0 auto', position: 'relative', zIndex: 2 }}>

          {/* Top badge */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
            <span className="badge-pill badge-ink" style={{ marginBottom: 28, display: 'inline-flex' }}>
              <Zap size={11} fill="#2d2926" /> New Way To Shop Together
            </span>
          </div>

          {/* Giant headline — editorial split */}
          <div className="animate-fade-in-up" style={{ animationDelay: '60ms' }}>
            <h1 style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(3.2rem, 8vw, 7rem)',
              lineHeight: 0.95,
              letterSpacing: '-0.04em',
              color: '#12100e',
              marginBottom: 32,
              maxWidth: 900,
            }}>
              Shop<br />
              <span style={{
                background: 'linear-gradient(135deg, #5b21b6 0%, #f05035 50%, #f59e0b 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                display: 'inline-block',
                animation: 'shimmer-slide 5s linear infinite',
              }}>Together,</span><br />
              Save More.
            </h1>
          </div>

          {/* Two-column layout: copy + floating card */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 48, flexWrap: 'wrap' }}>

            <div className="animate-fade-in-up" style={{ animationDelay: '120ms', flex: '1 1 420px', maxWidth: 560 }}>
              <p style={{ fontSize: '1.1rem', color: '#6b6560', lineHeight: 1.75, marginBottom: 36, maxWidth: 440, fontWeight: 400 }}>
                Form group buying teams with friends or global shoppers to unlock wholesale tier discounts. Higher team size = bigger savings.
              </p>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a href="#products" className="btn-ink" style={{ textDecoration: 'none', padding: '14px 30px', fontSize: '0.92rem' }}>
                  Explore Deals <ArrowRight size={16} />
                </a>
                <a href="#products" className="btn-outline-ink" style={{ textDecoration: 'none', padding: '14px 28px', fontSize: '0.92rem' }}>
                  <Users size={16} /> Join a Group
                </a>
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 40, marginTop: 56, paddingTop: 32, borderTop: '1px solid rgba(18,16,14,0.08)', flexWrap: 'wrap' }}>
                {[
                  { n: '50K+', l: 'Group Buyers', c: '#5b21b6' },
                  { n: '2.5K+', l: 'Live Deals', c: '#f05035' },
                  { n: '60%',   l: 'Avg. Savings', c: '#059669' },
                  { n: '100%', l: 'Verified', c: '#b45309' },
                ].map(({ n, l, c }) => (
                  <div key={l} style={{ animation: 'count-up-pulse 0.8s cubic-bezier(0.22,1,0.36,1) both' }}>
                    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '2rem', fontWeight: 800, color: c, lineHeight: 1 }}>{n}</div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#a09a94', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating deal showcase card */}
            <div className="animate-float-bob" style={{ flex: '0 0 auto', width: 300 }}>
              <div style={{
                background: '#fff',
                borderRadius: 28,
                overflow: 'hidden',
                boxShadow: '0 32px 80px rgba(18,16,14,0.14), 0 8px 24px rgba(91,33,182,0.08)',
                border: '1px solid rgba(18,16,14,0.08)',
              }}>
                {/* Card header */}
                <div style={{ background: 'linear-gradient(135deg, #f7f5fd, #fff)', padding: '20px 22px', borderBottom: '1px solid rgba(18,16,14,0.06)' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#a09a94', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Sample Deal Savings</div>
                  <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '1.3rem', fontWeight: 800, color: '#12100e' }}>Premium Headphones</div>
                </div>
                {/* Tiers */}
                <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Solo Buy',        price: '₹1,999', sub: '',          bg: '#f7f5f2',  color: '#a09a94', strike: true  },
                    { label: '3-Member Team',   price: '₹1,499', sub: '25% off',   bg: 'rgba(91,33,182,0.07)',  color: '#5b21b6', strike: false },
                    { label: '10-Member Team',  price: '₹999',   sub: '50% off 🔥', bg: 'linear-gradient(135deg, #5b21b6, #4338ca)', color: '#fff', strike: false },
                  ].map(({ label, price, sub, bg, color, strike }) => (
                    <div key={label} style={{ background: bg, borderRadius: 14, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: color === '#fff' ? 'rgba(255,255,255,0.7)' : '#a09a94', opacity: 0.9 }}>{label}</div>
                        {sub && <div style={{ fontSize: '0.65rem', fontWeight: 800, color: color === '#fff' ? '#f59e0b' : '#f05035', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{sub}</div>}
                      </div>
                      <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '1.1rem', fontWeight: 800, color, textDecoration: strike ? 'line-through' : 'none', opacity: strike ? 0.5 : 1 }}>{price}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Small floating badge below card */}
              <div className="animate-float-x" style={{
                marginTop: 16, marginLeft: 24,
                background: '#fff',
                borderRadius: 16, padding: '10px 16px',
                boxShadow: '0 8px 24px rgba(18,16,14,0.1)',
                border: '1px solid rgba(18,16,14,0.07)',
                display: 'flex', alignItems: 'center', gap: 10,
                width: 'fit-content',
              }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={16} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#12100e' }}>Buyer Protected</div>
                  <div style={{ fontSize: '0.65rem', color: '#a09a94', fontWeight: 500 }}>100% money back guarantee</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ PRODUCTS SECTION ══ */}
      <section ref={revealRef1} id="products" style={{ maxWidth: 1320, margin: '0 auto', padding: '64px 24px 80px' }}>

        {/* Section label */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 36, flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#5b21b6', textTransform: 'uppercase', letterSpacing: '0.14em', display: 'block', marginBottom: 8 }}>— Live Marketplace</span>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#12100e', margin: 0 }}>
              Trending<br />Group Deals
            </h2>
          </div>

          {/* Search */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8, flex: '0 0 auto' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#a09a94' }} />
              <input
                type="text" placeholder="Search deals..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="input-premium"
                style={{ paddingLeft: 44, paddingTop: 12, paddingBottom: 12, minWidth: 240, fontSize: '0.85rem' }}
              />
            </div>
            <button type="submit" className="btn-violet" style={{ padding: '12px 22px', fontSize: '0.85rem', borderRadius: 14 }}>
              Search
            </button>
          </form>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 40, paddingBottom: 24, borderBottom: '1px solid rgba(18,16,14,0.07)' }}>
          {[{ id: '', name: 'All' }, ...categories].map(cat => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); setPage(1); }}
              style={{
                padding: '8px 20px', borderRadius: 100,
                fontSize: '0.78rem', fontWeight: 700,
                border: 'none', cursor: 'pointer',
                transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
                background: selectedCategory === cat.id ? '#12100e' : '#fff',
                color: selectedCategory === cat.id ? '#faf8f4' : '#6b6560',
                boxShadow: selectedCategory === cat.id
                  ? '0 4px 16px rgba(18,16,14,0.3)'
                  : '0 1px 4px rgba(18,16,14,0.06)',
                transform: selectedCategory === cat.id ? 'scale(1.04)' : 'scale(1)',
              }}
            >
              {cat.name || 'All'}
            </button>
          ))}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <SlidersHorizontal size={13} style={{ color: '#a09a94' }} />
            <select
              value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}
              className="input-premium"
              style={{ padding: '9px 40px 9px 16px', fontSize: '0.78rem', width: 'auto', minWidth: 170, borderRadius: 100, background: '#fff' }}
            >
              <option value="">Relevance</option>
              <option value="price_asc">Price ↑</option>
              <option value="price_desc">Price ↓</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          
          {/* LEFT: Products Grid & Pagination (75%) */}
          <div style={{ flex: '1 1 65%', minWidth: 0 }}>
            {/* Products grid */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '80px 0' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(91,33,182,0.15)', borderTopColor: '#5b21b6', animation: 'spin-slow 0.7s linear infinite' }} />
            <p style={{ color: '#a09a94', fontWeight: 600, fontSize: '0.875rem' }}>Loading deals...</p>
          </div>
        ) : error ? (
          <div style={{ background: '#fff', borderRadius: 24, padding: 40, textAlign: 'center', border: '1px solid rgba(240,80,53,0.15)', maxWidth: 420, margin: '0 auto' }}>
            <AlertTriangle size={36} color="#f05035" style={{ marginBottom: 14 }} />
            <h4 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1.1rem', marginBottom: 8 }}>Backend Offline</h4>
            <p style={{ color: '#a09a94', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: 20 }}>{error}</p>
            <button onClick={fetchProducts} className="btn-violet" style={{ borderRadius: 14, padding: '10px 24px', fontSize: '0.82rem' }}>
              Retry
            </button>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', border: '2px dashed rgba(18,16,14,0.1)', borderRadius: 24 }}>
            <Users size={40} style={{ marginBottom: 12, color: '#a09a94' }} />
            <p style={{ fontWeight: 600, color: '#6b6560' }}>No products found matching your search.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, paddingTop: 48 }}>
            <button
              disabled={page === 1} onClick={() => setPage(page - 1)}
              style={{ padding: '10px 24px', borderRadius: 100, background: '#fff', border: '1px solid rgba(18,16,14,0.12)', fontSize: '0.82rem', fontWeight: 700, color: page === 1 ? '#c8c3bd' : '#12100e', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
            >← Prev</button>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6b6560', padding: '0 8px' }}>
              {page} / {pagination.totalPages}
            </span>
            <button
              disabled={page === pagination.totalPages} onClick={() => setPage(page + 1)}
              style={{ padding: '10px 24px', borderRadius: 100, background: page === pagination.totalPages ? '#f7f5f2' : '#12100e', border: 'none', fontSize: '0.82rem', fontWeight: 700, color: page === pagination.totalPages ? '#c8c3bd' : '#faf8f4', cursor: page === pagination.totalPages ? 'not-allowed' : 'pointer', boxShadow: page === pagination.totalPages ? 'none' : '0 4px 16px rgba(18,16,14,0.3)' }}
            >Next →</button>
          </div>
        )}
        </div>

        {/* RIGHT: Active Global Groups Marquee (25%) */}
        <div className="active-teams-sidebar" style={{ flex: '0 0 300px', position: 'sticky', top: 88 }}>
          <div style={{ background: '#fff', borderRadius: 24, border: '1px solid rgba(18,16,14,0.08)', padding: '24px 20px', boxShadow: '0 4px 24px rgba(18,16,14,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, borderBottom: '1px solid rgba(18,16,14,0.08)', paddingBottom: 16 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f05035', animation: 'pulse-ring 2s infinite' }} />
              <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#12100e', margin: 0 }}>Active Teams</h3>
            </div>
            
            <div className="marquee-container" style={{ maxHeight: 500, overflow: 'hidden', position: 'relative', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 5%, black 95%, transparent)' }}>
              <div className={activeGlobalGroups.length > 3 ? "marquee-content" : ""} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {activeGlobalGroups.length > 0 ? [...activeGlobalGroups, ...(activeGlobalGroups.length > 3 ? activeGlobalGroups : [])].map((group, idx) => (
                    <a href={`/product/${group.product_id}`} key={`${group.id}-${idx}`} style={{ display: 'block', textDecoration: 'none', background: '#faf8f4', borderRadius: 16, padding: 16, border: '1px solid rgba(18,16,14,0.05)', transition: 'all 0.2s', color: 'inherit' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#5b21b6'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(18,16,14,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                        <img src={group.product_image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=70'} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', background: '#f2ede4', border: '1px solid rgba(18,16,14,0.05)' }} />
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#12100e', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{group.product_name || 'Product'}</div>
                          <div style={{ fontSize: '0.68rem', color: '#a09a94', marginTop: 2 }}>Started by <span style={{ fontWeight: 600, color: '#6b6560' }}>{group.creator_name}</span></div>
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
                    <div style={{ textAlign: 'center', color: '#a09a94', fontSize: '0.8rem', padding: '20px 0' }}>No active teams right now.</div>
                  )}
              </div>
            </div>
            
            <a href="#products" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, width: '100%', padding: '12px', marginTop: 16, background: '#faf8f4', borderRadius: 12, textDecoration: 'none', color: '#5b21b6', fontSize: '0.78rem', fontWeight: 700, border: '1px dashed rgba(91,33,182,0.2)', transition: 'all 0.2s' }}
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
      <section ref={revealRef2} className="mesh-violet" style={{ padding: '80px 24px', borderTop: '1px solid rgba(18,16,14,0.06)' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div className="animate-fade-in-up" style={{ textAlign: 'center', marginBottom: 56, animationDelay: '0ms' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#5b21b6', textTransform: 'uppercase', letterSpacing: '0.14em', display: 'block', marginBottom: 12 }}>&mdash; Simple &amp; Powerful</span>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#12100e', letterSpacing: '-0.03em' }}>
              How Group Buying Works
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {[
              { n: '01', title: 'Browse Deals', desc: 'Explore products with tiered pricing. The more team members, the lower the price.', color: '#5b21b6' },
              { n: '02', title: 'Start or Join a Team', desc: 'Create a co-buying group or join an existing active team. Share the invite link.', color: '#f05035' },
              { n: '03', title: 'Payment Hold Placed', desc: 'Your card is pre-authorized (not charged yet). Zero risk until the team fills.', color: '#f59e0b' },
              { n: '04', title: 'Group Completes → You Save', desc: 'Once the team fills, payments are captured and orders are dispatched. Everyone wins!', color: '#059669' },
            ].map(({ n, title, desc, color }, idx) => (
              <div key={n} className="animate-fade-in-up" style={{ background: '#fff', border: '1px solid rgba(18,16,14,0.08)', borderRadius: 24, padding: '28px 24px', transition: 'all 0.3s', boxShadow: '0 4px 20px rgba(18,16,14,0.03)', animationDelay: `${idx * 100}ms` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color + '44'; e.currentTarget.style.background = color + '10'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(18,16,14,0.08)'; e.currentTarget.style.background = '#fff'; }}
              >
                <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '2.5rem', color, lineHeight: 1, marginBottom: 16, opacity: 0.7 }}>{n}</div>
                <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: '#12100e', marginBottom: 10, letterSpacing: '-0.02em' }}>{title}</h3>
                <p style={{ fontSize: '0.82rem', color: '#6b6560', lineHeight: 1.75 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ WHY GROUP BUYING ══ */}
      <section ref={revealRef4} style={{ padding: '80px 24px', background: '#fff', borderTop: '1px solid rgba(18,16,14,0.06)' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#f05035', textTransform: 'uppercase', letterSpacing: '0.14em', display: 'block', marginBottom: 12 }}>— Why Us?</span>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#12100e', letterSpacing: '-0.03em' }}>
              Why Group Buying?<br />
              <span style={{ background: 'linear-gradient(135deg, #5b21b6, #f05035)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>The Smarter Way to Shop</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {[
              {
                icon: <TrendingUp size={28} color="#5b21b6" />,
                bg: 'rgba(91,33,182,0.07)',
                accent: '#5b21b6',
                title: 'Save Up to 60%',
                desc: 'The more buyers in your team, the steeper the discount. Wholesale prices, retail convenience.',
              },
              {
                icon: <Clock size={28} color="#f05035" />,
                bg: 'rgba(240,80,53,0.07)',
                accent: '#f05035',
                title: 'Zero Risk Model',
                desc: 'Your payment is only a pre-authorization hold. If the group doesn\'t fill, you pay absolutely nothing.',
              },
              {
                icon: <Users size={28} color="#059669" />,
                bg: 'rgba(5,150,105,0.07)',
                accent: '#059669',
                title: 'Shop With Anyone',
                desc: 'Invite friends or join existing public groups with strangers. The more the merrier — and cheaper!',
              },
              {
                icon: <Lock size={28} color="#b45309" />,
                bg: 'rgba(180,83,9,0.07)',
                accent: '#b45309',
                title: 'Fully Secured',
                desc: 'Every transaction is encrypted. Sellers are verified. Your money is protected by our buyer guarantee.',
              },
              {
                icon: <Star size={28} color="#4338ca" />,
                bg: 'rgba(67,56,202,0.07)',
                accent: '#4338ca',
                title: 'Premium Products',
                desc: 'Curated catalogue of high-quality products from verified sellers. No counterfeits, ever.',
              },
              {
                icon: <Zap size={28} color="#f59e0b" />,
                bg: 'rgba(245,158,11,0.07)',
                accent: '#f59e0b',
                title: 'Fast Delivery',
                desc: 'Once a group fills, orders are instantly confirmed and dispatched. Tracked nationwide shipping.',
              },
            ].map(({ icon, bg, accent, title, desc }, idx) => (
              <div
                key={title}
                className="animate-fade-in-up"
                style={{
                  background: '#fdfaf6',
                  borderRadius: 24,
                  padding: '28px 24px',
                  border: '1px solid rgba(18,16,14,0.06)',
                  transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
                  position: 'relative', overflow: 'hidden',
                  animationDelay: `${idx * 80}ms`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = `0 20px 50px ${accent}18`;
                  e.currentTarget.style.borderColor = `${accent}30`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'rgba(18,16,14,0.06)';
                }}
              >
                <div style={{ width: 56, height: 56, borderRadius: 16, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  {icon}
                </div>
                <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#12100e', marginBottom: 10, letterSpacing: '-0.01em' }}>{title}</h3>
                <p style={{ fontSize: '0.82rem', color: '#6b6560', lineHeight: 1.75, margin: 0 }}>{desc}</p>
                {/* Accent bottom border line */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(to right, ${accent}, transparent)`, borderRadius: '0 0 24px 24px', opacity: 0, transition: 'opacity 0.3s' }} className="card-accent-line" />
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div style={{ textAlign: 'center', marginTop: 56 }}>
            <a href="#products" className="btn-violet hover-shine-sweep" style={{ textDecoration: 'none', fontSize: '0.95rem', padding: '16px 36px' }}>
              Start Saving Today <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
