"use client";

import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import { Search, SlidersHorizontal, RefreshCw, AlertTriangle, ArrowRight, Users, Zap, TrendingUp, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

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

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchProducts(); }, [selectedCategory, sortBy, page]);

  const fetchCategories = async () => {
    try { const res = await api.get('/categories'); setCategories(res.data.categories || []); }
    catch (err) { console.error(err.message); }
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
      <div style={{ background: '#12100e', color: '#faf8f4', padding: '10px 0', overflow: 'hidden' }}>
        <div className="ticker-wrap">
          <div className="ticker-inner" style={{ gap: 0 }}>
            {[...Array(2)].map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                {['⚡ Group Buying Revolution', '🔥 Up to 60% Off', '👥 50,000+ Buyers', '✅ Verified Sellers Only', '🚀 New Deals Every Day', '💳 Secure Payments', '🌍 Ship Nationwide', '⚡ Group Buying Revolution', '🔥 Up to 60% Off', '👥 50,000+ Buyers'].map((t, j) => (
                  <span key={j} style={{ whiteSpace: 'nowrap', padding: '0 32px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: j % 3 === 1 ? '#f05035' : j % 3 === 2 ? '#f59e0b' : '#faf8f4' }}>
                    {t}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ HERO ══ */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '80px 24px 60px' }} className="mesh-hero noise-overlay">

        {/* Background blobs */}
        <div className="blob blob-delay-2" style={{ position: 'absolute', top: '-10%', right: '-5%', width: 520, height: 520, background: 'radial-gradient(circle, rgba(91,33,182,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="blob blob-delay-4" style={{ position: 'absolute', bottom: '-15%', left: '-8%', width: 420, height: 420, background: 'radial-gradient(circle, rgba(240,80,53,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

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
                  <div key={l}>
                    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '2rem', fontWeight: 800, color: c, lineHeight: 1 }}>{n}</div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#a09a94', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating deal showcase card */}
            <div className="animate-float" style={{ flex: '0 0 auto', width: 300 }}>
              <div style={{
                background: '#fff',
                borderRadius: 28,
                overflow: 'hidden',
                boxShadow: '0 32px 80px rgba(18,16,14,0.14), 0 8px 24px rgba(91,33,182,0.08)',
                border: '1px solid rgba(18,16,14,0.08)',
              }}>
                {/* Card header */}
                <div style={{ background: '#12100e', padding: '20px 22px' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#a09a94', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Sample Deal Savings</div>
                  <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '1.3rem', fontWeight: 800, color: '#faf8f4' }}>Premium Headphones</div>
                </div>
                {/* Tiers */}
                <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Solo Buy',        price: '₹1,999', sub: '',          bg: '#f7f5f2',  color: '#a09a94', strike: true  },
                    { label: '3-Member Team',   price: '₹1,499', sub: '25% off',   bg: 'rgba(91,33,182,0.07)',  color: '#5b21b6', strike: false },
                    { label: '10-Member Team',  price: '₹999',   sub: '50% off 🔥', bg: '#12100e', color: '#faf8f4', strike: false },
                  ].map(({ label, price, sub, bg, color, strike }) => (
                    <div key={label} style={{ background: bg, borderRadius: 14, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: color === '#faf8f4' ? '#a09a94' : '#a09a94', opacity: color === '#faf8f4' ? 1 : 0.8 }}>{label}</div>
                        {sub && <div style={{ fontSize: '0.65rem', fontWeight: 800, color: bg === '#12100e' ? '#f59e0b' : '#f05035', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{sub}</div>}
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
      <section id="products" style={{ maxWidth: 1320, margin: '0 auto', padding: '64px 24px 80px' }}>

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
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section style={{ background: '#12100e', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#5b21b6', textTransform: 'uppercase', letterSpacing: '0.14em', display: 'block', marginBottom: 12 }}>— Simple &amp; Powerful</span>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#faf8f4', letterSpacing: '-0.03em' }}>
              How Group Buying Works
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {[
              { n: '01', title: 'Browse Deals', desc: 'Explore products with tiered pricing. The more team members, the lower the price.', color: '#5b21b6' },
              { n: '02', title: 'Start or Join a Team', desc: 'Create a co-buying group or join an existing active team. Share the invite link.', color: '#f05035' },
              { n: '03', title: 'Payment Hold Placed', desc: 'Your card is pre-authorized (not charged yet). Zero risk until the team fills.', color: '#f59e0b' },
              { n: '04', title: 'Group Completes → You Save', desc: 'Once the team fills, payments are captured and orders are dispatched. Everyone wins!', color: '#059669' },
            ].map(({ n, title, desc, color }) => (
              <div key={n} style={{ background: 'rgba(250,248,244,0.05)', border: '1px solid rgba(250,248,244,0.08)', borderRadius: 24, padding: '28px 24px', transition: 'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color + '44'; e.currentTarget.style.background = color + '10'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(250,248,244,0.08)'; e.currentTarget.style.background = 'rgba(250,248,244,0.05)'; }}
              >
                <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '2.5rem', color, lineHeight: 1, marginBottom: 16, opacity: 0.7 }}>{n}</div>
                <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: '#faf8f4', marginBottom: 10, letterSpacing: '-0.02em' }}>{title}</h3>
                <p style={{ fontSize: '0.82rem', color: '#6b6560', lineHeight: 1.75 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
