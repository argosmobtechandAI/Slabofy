"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, LogOut, ShieldAlert, Store, User, Zap, ArrowUpRight, Menu, X, ShoppingBag } from 'lucide-react';
import OTPLoginModal from './OTPLoginModal';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { isLoggedIn, user, logout } = useAuth();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: scrolled ? 'rgba(250,248,244,0.95)' : 'rgba(250,248,244,0.85)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        borderBottom: `1px solid ${scrolled ? 'rgba(18,16,14,0.1)' : 'rgba(18,16,14,0.06)'}`,
        boxShadow: scrolled ? '0 4px 24px rgba(18,16,14,0.06)' : 'none',
        transition: 'all 0.3s ease',
        width: '100%',
      }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>

          {/* Official Slabofy Brand Logo */}
          <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <img
              src="/slabofy-logo.png"
              alt="Slabofy — Buy Together. Save Together."
              style={{ height: 36, width: 'auto', maxWidth: 170, objectFit: 'contain' }}
            />
          </Link>

          {/* Center Nav Pills (Desktop Only) */}
          <div className="nav-desktop-pills" style={{ alignItems: 'center', gap: 4, background: 'rgba(18,16,14,0.05)', borderRadius: 100, padding: '4px', border: '1px solid rgba(18,16,14,0.08)' }}>
            {[{ to: '/', label: 'Discover' }, { to: '/orders', label: 'My Orders' }].map(({ to, label }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  style={{
                    padding: '8px 20px', borderRadius: 100,
                    fontSize: '0.82rem', fontWeight: 600,
                    color: active ? '#12100e' : '#2d2926', textDecoration: 'none',
                    transition: 'all 0.2s',
                    background: active ? '#fff' : 'transparent',
                    boxShadow: active ? '0 2px 8px rgba(18,16,14,0.1)' : 'none',
                  }}
                  onMouseEnter={e => { if(!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.5)'; } }}
                  onMouseLeave={e => { if(!active) { e.currentTarget.style.background = 'transparent'; } }}
                >
                  {label}
                </Link>
              );
            })}
            {isLoggedIn && user?.role === 'admin' && (
              <Link to="/admin" style={{ padding: '8px 20px', borderRadius: 100, fontSize: '0.82rem', fontWeight: 700, color: '#5b21b6', background: 'rgba(91,33,182,0.1)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldAlert size={13} /> Admin
              </Link>
            )}
            {isLoggedIn && user?.role === 'seller' && (
              <Link to="/seller" style={{ padding: '8px 20px', borderRadius: 100, fontSize: '0.82rem', fontWeight: 700, color: '#4338ca', background: 'rgba(67,56,202,0.08)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Store size={13} /> Seller Hub
              </Link>
            )}
          </div>

          {/* Right CTA (Desktop Only) */}
          <div className="nav-desktop-cta" style={{ alignItems: 'center', gap: 12 }}>
            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 14px 5px 6px',
                  background: '#fff', borderRadius: 100,
                  border: '1px solid rgba(18,16,14,0.1)',
                  boxShadow: '0 2px 8px rgba(18,16,14,0.06)',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #5b21b6, #f05035)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 800, fontSize: '0.75rem',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}>
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2d2926' }}>{user.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 100,
                    background: 'rgba(240,80,53,0.08)',
                    border: '1px solid rgba(240,80,53,0.2)',
                    color: '#f05035', fontSize: '0.78rem', fontWeight: 700,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(240,80,53,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(240,80,53,0.08)'}
                >
                  <LogOut size={13} /> Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setLoginModalOpen(true)}
                className="btn-ink hover-shine-sweep"
                style={{ fontSize: '0.82rem', padding: '9px 20px', borderRadius: 100 }}
              >
                Get Started <ArrowUpRight size={14} />
              </button>
            )}
          </div>

          {/* Mobile Right Bar: Login / Avatar + Hamburger */}
          <div className="nav-mobile-toggle" style={{ display: 'none', alignItems: 'center', gap: 8 }}>
            {!isLoggedIn && (
              <button
                onClick={() => setLoginModalOpen(true)}
                style={{
                  background: '#12100e', color: '#faf8f4',
                  border: 'none', borderRadius: 999,
                  padding: '7px 14px', fontSize: '0.75rem', fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                }}
              >
                Sign In
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label="Toggle navigation menu"
              style={{
                width: 38, height: 38, borderRadius: 12,
                background: mobileMenuOpen ? 'rgba(91,33,182,0.1)' : 'rgba(18,16,14,0.06)',
                border: '1px solid rgba(18,16,14,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: mobileMenuOpen ? '#5b21b6' : '#12100e',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer / Dropdown */}
        {mobileMenuOpen && (
          <div style={{
            background: 'rgba(250,248,244,0.98)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(18,16,14,0.1)',
            padding: '16px 20px 24px',
            display: 'flex', flexDirection: 'column', gap: 10,
            animation: 'fade-up 0.25s ease-out',
            boxShadow: '0 16px 32px rgba(18,16,14,0.08)'
          }}>
            {isLoggedIn && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#fff', borderRadius: 16, border: '1px solid rgba(18,16,14,0.08)', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #5b21b6, #f05035)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#12100e' }}>{user?.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#6b6560' }}>{user?.phone || user?.email}</div>
                  </div>
                </div>
                <button onClick={handleLogout} style={{ background: 'rgba(240,80,53,0.1)', border: 'none', borderRadius: 10, padding: '6px 12px', color: '#f05035', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                  Logout
                </button>
              </div>
            )}

            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', borderRadius: 14,
                background: location.pathname === '/' ? '#12100e' : '#fff',
                color: location.pathname === '/' ? '#fff' : '#12100e',
                textDecoration: 'none', fontSize: '0.88rem', fontWeight: 700,
                border: '1px solid rgba(18,16,14,0.08)'
              }}
            >
              <Zap size={16} color={location.pathname === '/' ? '#f59e0b' : '#5b21b6'} />
              Discover Deals
            </Link>

            <Link
              to="/orders"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', borderRadius: 14,
                background: location.pathname === '/orders' ? '#12100e' : '#fff',
                color: location.pathname === '/orders' ? '#fff' : '#12100e',
                textDecoration: 'none', fontSize: '0.88rem', fontWeight: 700,
                border: '1px solid rgba(18,16,14,0.08)'
              }}
            >
              <ShoppingBag size={16} color={location.pathname === '/orders' ? '#fff' : '#5b21b6'} />
              My Orders
            </Link>

            <Link
              to="/seller"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', borderRadius: 14,
                background: '#fff', color: '#4338ca',
                textDecoration: 'none', fontSize: '0.88rem', fontWeight: 700,
                border: '1px solid rgba(67,56,202,0.15)'
              }}
            >
              <Store size={16} />
              Merchant Portal
            </Link>

            {isLoggedIn && user?.role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 16px', borderRadius: 14,
                  background: '#fff', color: '#5b21b6',
                  textDecoration: 'none', fontSize: '0.88rem', fontWeight: 700,
                  border: '1px solid rgba(91,33,182,0.2)'
                }}
              >
                <ShieldAlert size={16} />
                Admin Dashboard
              </Link>
            )}

            {!isLoggedIn && (
              <button
                onClick={() => { setMobileMenuOpen(false); setLoginModalOpen(true); }}
                style={{
                  marginTop: 6,
                  width: '100%',
                  background: 'linear-gradient(135deg, #5b21b6, #4338ca)',
                  color: '#fff', border: 'none', borderRadius: 14,
                  padding: '14px', fontSize: '0.9rem', fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  cursor: 'pointer', boxShadow: '0 6px 20px rgba(91,33,182,0.25)'
                }}
              >
                Sign In / Get Started <ArrowUpRight size={16} />
              </button>
            )}
          </div>
        )}
      </nav>

      <OTPLoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </>
  );
}
