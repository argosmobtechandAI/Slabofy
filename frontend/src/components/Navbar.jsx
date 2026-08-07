"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, LogOut, ShieldAlert, Store, User, Menu, X, Zap, ArrowUpRight } from 'lucide-react';
import OTPLoginModal from './OTPLoginModal';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const { isLoggedIn, user, logout } = useAuth();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: scrolled ? 'rgba(250,248,244,0.92)' : 'rgba(250,248,244,0.7)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        borderBottom: `1px solid ${scrolled ? 'rgba(18,16,14,0.1)' : 'rgba(18,16,14,0.06)'}`,
        boxShadow: scrolled ? '0 2px 20px rgba(18,16,14,0.06)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>

          {/* Logo — Bold Editorial */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: '#12100e',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden',
            }}>
              <span style={{ color: '#faf8f4', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1.1rem', zIndex: 1, position: 'relative' }}>S</span>
              <div style={{
                position: 'absolute', inset: 0, opacity: 0,
                background: 'linear-gradient(135deg, #5b21b6, #f05035)',
                transition: 'opacity 0.3s',
              }} className="logo-hover-grad" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#12100e', letterSpacing: '-0.03em' }}>
                Social<span style={{ color: '#5b21b6' }}>Group</span>
              </span>
              <span style={{ fontSize: '0.6rem', fontWeight: 600, color: '#a09a94', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Group Buying</span>
            </div>
          </Link>

          {/* Center Nav Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(18,16,14,0.05)', borderRadius: 100, padding: '4px', border: '1px solid rgba(18,16,14,0.08)' }} className="hidden md:flex">
            {[{ to: '/', label: 'Discover' }, { to: '/orders', label: 'My Orders' }].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                style={{
                  padding: '8px 20px', borderRadius: 100,
                  fontSize: '0.82rem', fontWeight: 600,
                  color: '#2d2926', textDecoration: 'none',
                  transition: 'all 0.2s',
                  background: 'transparent',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#12100e'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(18,16,14,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {label}
              </Link>
            ))}
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
            {isLoggedIn && user?.role === 'user' && (
              <Link to="/seller" style={{ padding: '8px 20px', borderRadius: 100, fontSize: '0.82rem', fontWeight: 700, color: '#2d2926', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Zap size={13} /> Sell Here
              </Link>
            )}
          </div>

          {/* Right CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="hidden md:flex">
            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Avatar chip */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '6px 16px 6px 6px',
                  background: '#fff', borderRadius: 100,
                  border: '1px solid rgba(18,16,14,0.1)',
                  boxShadow: '0 2px 8px rgba(18,16,14,0.06)',
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #5b21b6, #f05035)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 800, fontSize: '0.8rem',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}>
                    {user.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2d2926' }}>{user.name}</span>
                </div>
                <button
                  onClick={logout}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '9px 18px', borderRadius: 100,
                    background: 'rgba(240,80,53,0.08)',
                    border: '1px solid rgba(240,80,53,0.2)',
                    color: '#f05035', fontSize: '0.8rem', fontWeight: 700,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(240,80,53,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(240,80,53,0.08)'}
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            ) : (
              <div style={{ position: 'relative', display: 'inline-flex' }}>
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="btn-ink animate-orb-pulse"
                  style={{ fontSize: '0.82rem', padding: '10px 22px' }}
                >
                  Get Started <ArrowUpRight size={15} />
                </button>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden"
            style={{
              width: 38, height: 38, borderRadius: 10,
              background: mobileMenuOpen ? '#12100e' : 'rgba(18,16,14,0.07)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: mobileMenuOpen ? '#faf8f4' : '#12100e',
              transition: 'all 0.2s',
            }}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden animate-fade-in" style={{
            background: '#faf8f4', borderTop: '1px solid rgba(18,16,14,0.08)',
            padding: '20px 24px 28px', display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            {[{ to: '/', l: 'Discover' }, { to: '/orders', l: 'My Orders' }].map(({ to, l }) => (
              <Link key={to} to={to} onClick={() => setMobileMenuOpen(false)}
                style={{ padding: '12px 16px', borderRadius: 14, color: '#2d2926', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
                {l}
              </Link>
            ))}
            {isLoggedIn && user?.role === 'admin' && <Link to="/admin" onClick={() => setMobileMenuOpen(false)} style={{ padding: '12px 16px', borderRadius: 14, color: '#5b21b6', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none', background: 'rgba(91,33,182,0.07)' }}>Admin Portal</Link>}
            {isLoggedIn && user?.role === 'seller' && <Link to="/seller" onClick={() => setMobileMenuOpen(false)} style={{ padding: '12px 16px', borderRadius: 14, color: '#4338ca', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none', background: 'rgba(67,56,202,0.07)' }}>Seller Hub</Link>}
            <hr style={{ border: 'none', borderTop: '1px solid rgba(18,16,14,0.08)', margin: '4px 0' }} />
            {isLoggedIn ? (
              <button onClick={() => { logout(); setMobileMenuOpen(false); }}
                style={{ padding: '12px', borderRadius: 14, background: 'rgba(240,80,53,0.07)', border: '1px solid rgba(240,80,53,0.2)', color: '#f05035', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: 8 }}>
                <LogOut size={16} /> Sign out ({user?.name})
              </button>
            ) : (
              <button onClick={() => { setLoginModalOpen(true); setMobileMenuOpen(false); }}
                className="btn-ink" style={{ justifyContent: 'center', marginTop: 4 }}>
                Get Started <ArrowUpRight size={16} />
              </button>
            )}
          </div>
        )}
      </nav>

      <OTPLoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </>
  );
}
