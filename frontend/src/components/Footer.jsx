"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Users, ShieldCheck, Zap, Heart } from 'lucide-react';

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function Footer() {
  return (
    <footer style={{ background: 'linear-gradient(to bottom, #faf8f4, #f0ece6)', color: '#12100e', marginTop: 80, borderTop: '1px solid rgba(18,16,14,0.06)', position: 'relative', overflow: 'hidden' }}>
      <div className="blob" style={{ position: 'absolute', bottom: '-20%', right: '-5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(91,33,182,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div className="blob blob-delay-2" style={{ position: 'absolute', top: '10%', left: '-10%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(240,80,53,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #5b21b6, #f05035, #f59e0b, transparent)' }} />
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '48px 16px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 36, marginBottom: 40 }}>
          <div>
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <img
                src="/slabofy-logo.png"
                alt="Slabofy — Buy Together. Save Together."
                style={{ height: 44, width: 'auto', objectFit: 'contain' }}
              />
            </Link>
            <p style={{ fontSize: '0.82rem', color: '#6b6560', lineHeight: 1.75, maxWidth: 240, marginBottom: 28 }}>
              Form buying teams. Unlock wholesale tier discounts. The smarter way to shop together.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {[{ icon: <WhatsAppIcon />, label: 'WhatsApp', color: '#25d366' }, { icon: <InstagramIcon />, label: 'Instagram', color: '#e1306c' }, { icon: <TwitterIcon />, label: 'Twitter', color: '#1da1f2' }].map(({ icon, label, color }) => (
                <a key={label} href="#" title={label} style={{ width: 38, height: 38, borderRadius: 10, background: '#fff', border: '1px solid rgba(18,16,14,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a09a94', textDecoration: 'none', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = color; e.currentTarget.style.borderColor = color + '44'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 4px 12px ' + color + '40'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#a09a94'; e.currentTarget.style.borderColor = 'rgba(18,16,14,0.1)'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = 'none'; }}>
                  {icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 20 }}>Discover</div>
            {[{ to: '/', label: 'Browse Deals' }, { to: '/orders', label: 'My Orders' }, { to: '/orders', label: 'Track Your Orders' }].map(({ to, label }) => (
              <Link key={label} to={to} style={{ display: 'block', color: '#a09a94', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, marginBottom: 12, transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#5b21b6'}
                onMouseLeave={e => e.currentTarget.style.color = '#a09a94'}>{label}</Link>
            ))}
          </div>

          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 20 }}>For Sellers</div>
            {[{ to: '/seller', label: 'Seller Dashboard' }, { to: '/seller', label: 'List a Product' }, { to: '/seller/login', label: 'Merchant Onboarding' }].map(({ to, label }) => (
              <Link key={label} to={to} style={{ display: 'block', color: '#a09a94', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, marginBottom: 12, transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#5b21b6'}
                onMouseLeave={e => e.currentTarget.style.color = '#a09a94'}>{label}</Link>
            ))}
          </div>

          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 20 }}>Why Slabofy</div>
            {[{ icon: <ShieldCheck size={14} />, text: 'Pre-Auth Payment Hold' }, { icon: <Users size={14} />, text: '50,000+ Active Buyers' }, { icon: <Zap size={14} />, text: 'Up to 60% Savings' }, { icon: <Heart size={14} />, text: '100% Verified Sellers' }].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ color: '#5b21b6', flexShrink: 0 }}>{icon}</div>
                <span style={{ fontSize: '0.82rem', color: '#a09a94', fontWeight: 500 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(18,16,14,0.08)', paddingTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <p style={{ fontSize: '0.75rem', color: '#4a4642', fontWeight: 500 }}>© {new Date().getFullYear()} Slabofy. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { label: 'Privacy Policy', path: '/privacy-policy' },
              { label: 'Terms of Service', path: '/terms-of-service' },
              { label: 'Refund Policy', path: '/refund-policy' }
            ].map(l => (
              <Link key={l.label} to={l.path} style={{ fontSize: '0.75rem', color: '#4a4642', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#a09a94'}
                onMouseLeave={e => e.currentTarget.style.color = '#4a4642'}>{l.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
