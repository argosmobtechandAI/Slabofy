"use client";

import React, { useState } from 'react';
import useScrollReveal from '../hooks/useScrollReveal';
import { Link } from 'react-router-dom';
import { Users, ArrowUpRight, Flame, Zap } from 'lucide-react';

export default function ProductCard({ product }) {
  const [hovered, setHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const revealRef = useScrollReveal({ persist: false });

  let images = [];
  try { images = typeof product.images === 'string' ? JSON.parse(product.images) : (product.images || []); }
  catch { images = []; }
  const img = images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=70';

  const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
  const solo = parseFloat(product.solo_price || 0);
  const best = parseFloat(product.best_price || 0);
  const disc = solo > 0 ? Math.round(((solo - best) / solo) * 100) : 0;
  const liveGroups = parseInt(product.active_groups_count || 0);

  const onMouseMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTilt({ x: ((e.clientX - r.left) / r.width - 0.5) * 8, y: ((e.clientY - r.top) / r.height - 0.5) * -8 });
  };

  return (
    <div ref={revealRef} className="scroll-reveal-group" style={{ height: '100%' }}>
    <Link
      to={`/product/${product.id}`}
      style={{ textDecoration: 'none', display: 'block', height: '100%' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setTilt({ x: 0, y: 0 }); }}
      onMouseMove={onMouseMove}
    >
      <div style={{
        borderRadius: 24, overflow: 'hidden', height: '100%',
        display: 'flex', flexDirection: 'column', background: '#fff',
        border: `1.5px solid ${hovered ? 'rgba(91,33,182,0.25)' : 'rgba(18,16,14,0.07)'}`,
        boxShadow: hovered
          ? '0 24px 60px rgba(91,33,182,0.14), 0 8px 24px rgba(18,16,14,0.08)'
          : '0 2px 10px rgba(18,16,14,0.04)',
        transform: hovered
          ? `perspective(900px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) translateY(-6px)`
          : 'perspective(900px) rotateX(0) rotateY(0) translateY(0)',
        transition: 'transform 0.18s ease, box-shadow 0.3s ease, border-color 0.25s ease',
        cursor: 'pointer', position: 'relative',
      }}>

        {/* Image area */}
        <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '4/3', background: '#f2ede4' }}>
          <img
            src={img} alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: hovered ? 'scale(1.08)' : 'scale(1)', transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)' }}
            loading="lazy"
          />

          {/* Gradient overlay on hover */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(18,16,14,0.6) 100%)', opacity: hovered ? 1 : 0, transition: 'opacity 0.35s ease' }} />

          {/* Top badges */}
          <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            {disc > 0 && (
              <span style={{
                background: '#f05035', color: '#fff', fontSize: '0.62rem', fontWeight: 800,
                padding: '4px 10px', borderRadius: 999, letterSpacing: '0.06em', textTransform: 'uppercase',
                boxShadow: '0 3px 10px rgba(240,80,53,0.5)', display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <Flame size={9} fill="#fff" /> SAVE {disc}%
              </span>
            )}
            {liveGroups > 0 && (
              <span style={{
                background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
                color: '#5b21b6', fontSize: '0.65rem', fontWeight: 700,
                padding: '4px 10px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 4,
                border: '1px solid rgba(91,33,182,0.15)', marginLeft: disc > 0 ? 0 : 'auto',
              }}>
                <Zap size={10} fill="#5b21b6" /> {liveGroups} Live
              </span>
            )}
          </div>

          {/* Hover CTA panel */}
          <div style={{
            position: 'absolute', bottom: 12, left: 12, right: 12,
            transform: hovered ? 'translateY(0)' : 'translateY(14px)',
            opacity: hovered ? 1 : 0,
            transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
          }}>
            <div style={{
              background: '#faf8f4', borderRadius: 14, padding: '10px 16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: '0.58rem', fontWeight: 800, color: '#a09a94', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Best Group Price</div>
                <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '1.1rem', fontWeight: 800, color: '#12100e' }}>{fmt(best)}</div>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#12100e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowUpRight size={16} color="#faf8f4" />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: 6 }}>
          {/* Category + dot accent */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#5b21b6', flexShrink: 0 }} />
            <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#5b21b6', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.9 }}>
              {product.category_name || 'General'}
            </span>
          </div>

          <h4 style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '0.95rem',
            color: hovered ? '#5b21b6' : '#12100e', lineHeight: 1.25, transition: 'color 0.2s',
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            letterSpacing: '-0.02em',
          }}>
            {product.name}
          </h4>

          <p style={{ fontSize: '0.76rem', color: '#a09a94', lineHeight: 1.55, flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {product.description || 'No description provided.'}
          </p>

          {/* Price row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid rgba(18,16,14,0.07)', marginTop: 4 }}>
            <div>
              <div style={{ fontSize: '0.58rem', fontWeight: 800, color: '#a09a94', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Group Buy</div>
              <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '1.1rem', fontWeight: 800, color: '#12100e' }}>{fmt(best)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.58rem', fontWeight: 800, color: '#a09a94', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Solo</div>
              <div style={{ fontSize: '0.8rem', color: '#c8c3bd', textDecoration: 'line-through', fontWeight: 600 }}>{fmt(solo)}</div>
            </div>
          </div>

          {/* Live team mini-bar */}
          {liveGroups > 0 && (
            <div style={{
              marginTop: 8, padding: '8px 12px', borderRadius: 10,
              background: 'rgba(91,33,182,0.05)', border: '1px solid rgba(91,33,182,0.1)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ display: 'flex', gap: -6 }}>
                {Array.from({ length: Math.min(liveGroups, 3) }).map((_, i) => (
                  <div key={i} style={{
                    width: 20, height: 20, borderRadius: '50%', border: '2px solid #fff',
                    background: ['#5b21b6', '#f05035', '#059669'][i % 3],
                    marginLeft: i > 0 ? -8 : 0,
                  }} />
                ))}
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5b21b6' }}>
                {liveGroups} active team{liveGroups !== 1 ? 's' : ''} — join now!
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
    </div>
  );
}
