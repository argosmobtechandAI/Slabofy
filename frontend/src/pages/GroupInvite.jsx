"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Users, Clock, ShoppingBag, ArrowRight, AlertTriangle, ShieldCheck, RefreshCw, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import OTPLoginModal from '../components/OTPLoginModal';
import use3DTilt from '../hooks/use3DTilt';

export default function GroupInvite() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const tiltRef = use3DTilt({ maxTilt: 6, scale: 1.01 });

  useEffect(() => {
    fetchInviteDetails();
  }, [id]);

  useEffect(() => {
    let interval = null;
    if (timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timeLeft]);

  const fetchInviteDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/groups/${id}/status`);
      setGroup(res.data);
      setTimeLeft(res.data.timer_remaining_seconds || 0);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Invalid or inactive co-buying invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = () => {
    if (!isLoggedIn) {
      setLoginModalOpen(true);
      return;
    }
    navigate('/checkout', {
      state: {
        product_id: group.product_id,
        group_id: group.group_id,
        target_size: group.target_size
      }
    });
  };

  const formatTime = (totalSeconds) => {
    if (totalSeconds <= 0) return '00:00:00';
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const fmt = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(91,33,182,0.15)', borderTopColor: '#5b21b6', animation: 'spin-slow 0.7s linear infinite' }} />
        <p style={{ color: '#a09a94', fontWeight: 600 }}>Opening co-buying invite channel...</p>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div style={{ maxWidth: 420, margin: '80px auto', textAlign: 'center', padding: '0 24px' }}>
        <AlertTriangle size={40} color="#f05035" style={{ marginBottom: 16, marginLeft: 'auto', marginRight: 'auto' }} />
        <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1.3rem', marginBottom: 8 }}>Invite Code Expired</h3>
        <p style={{ color: '#a09a94', fontSize: '0.875rem', marginBottom: 24 }}>{error || 'This invitation has expired or was completed.'}</p>
        <Link to="/" className="btn-violet" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          Browse Platform Deals
        </Link>
      </div>
    );
  }

  const slotsRemaining = group.target_size - group.current_size;
  const progressPct = Math.round((group.current_size / group.target_size) * 100);

  return (
    <div className="mesh-violet" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', position: 'relative', overflow: 'hidden' }}>
      
      {/* Decorative background blobs */}
      <div className="blob" style={{ position: 'absolute', top: '-10%', left: '-10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(91,33,182,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div className="blob blob-delay-2" style={{ position: 'absolute', bottom: '-20%', right: '-5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(240,80,53,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div ref={tiltRef} className="tilt-card" style={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.5)',
        borderRadius: 28,
        padding: 'clamp(20px, 5vw, 36px)',
        maxWidth: 480, width: '100%',
        boxShadow: '0 32px 80px rgba(91,33,182,0.12), 0 2px 10px rgba(18,16,14,0.04)',
        textAlign: 'center',
        position: 'relative', zIndex: 10,
        display: 'flex', flexDirection: 'column', gap: 24,
      }}>
        <div className="tilt-card-inner">
        <div className="glare" />
        
        {/* Decorative elements */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translate(-50%, -50%)',
          background: 'linear-gradient(135deg, #f59e0b, #f05035)', color: '#fff',
          fontSize: '0.62rem', fontWeight: 800, padding: '4px 14px', borderRadius: 999,
          display: 'flex', alignItems: 'center', gap: 6,
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          <Users size={12} />
          Group Invitation Alert
        </div>

        {/* Header Invite text */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, pt: 12 }}>
          <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#12100e' }}>
            You've Been Invited by <span style={{ color: '#5b21b6' }}>{group.creator_name}</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#6b6560', lineHeight: 1.6 }}>
            Join their co-buying circle to purchase this item at wholesale pricing!
          </p>
        </div>

        {/* Product Card Details */}
        <div style={{
          background: '#faf8f4', border: '1px solid rgba(18,16,14,0.08)',
          borderRadius: 16, padding: 16, display: 'flex', gap: 16, textAlign: 'left', alignItems: 'center',
        }}>
          <img
            src={group.product_image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60'}
            alt=""
            style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 12, background: '#f2ede4', flexShrink: 0 }}
          />
          <div style={{ minWidth: 0 }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#12100e', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {group.product_name}
            </h4>
            <p style={{ fontSize: '0.78rem', color: '#6b6560' }}>
              Co-Buying price: <strong style={{ color: '#5b21b6', fontWeight: 800 }}>{fmt(group.tier_price)}</strong>
            </p>
          </div>
        </div>

        {/* Timer Block */}
        {group.status === 'active' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{
              background: '#faf8f4', border: '1.5px solid rgba(18,16,14,0.1)',
              borderRadius: 16, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left',
            }}>
              <div>
                <span style={{ fontSize: '0.58rem', fontWeight: 800, color: '#a09a94', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 2 }}>Time Remaining</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.3rem', fontWeight: 800, color: '#f05035' }}>{formatTime(timeLeft)}</span>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.58rem', fontWeight: 800, color: '#a09a94', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 2 }}>Slots Left</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#12100e' }}>{slotsRemaining} open slots</span>
              </div>
            </div>
            {group.original_price && (
              <p style={{ fontSize: '0.68rem', color: '#f05035', fontWeight: 700 }}>
                ⚠️ The price resets to {fmt(group.original_price)} when timer hits zero
              </p>
            )}
          </div>
        ) : (
          <div style={{ background: '#fdfaf6', borderRadius: 20, padding: 20, border: '1px solid rgba(18,16,14,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6b6560' }}>Group Price</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f05035', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{fmt(group.tier_price)}</span>
            </div>
            <div style={{ background: 'rgba(225,29,72,0.06)', border: '1px solid rgba(225,29,72,0.2)', color: '#e11d48', borderRadius: 12, padding: 14, fontSize: '0.78rem', fontWeight: 700 }}>
              Status: This co-buying team is no longer active ({group.status}).
            </div>
          </div>
        )}

        {/* Progress visualizer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: '#6b6560' }}>
            <span>Co-Buying Progress</span>
            <span>{group.current_size} / {group.target_size} slots filled</span>
          </div>
          <div style={{ width: '100%', background: '#faf8f4', height: 10, borderRadius: 999, border: '1px solid rgba(18,16,14,0.08)', overflow: 'hidden' }}>
            <div 
              style={{
                background: 'linear-gradient(90deg, #5b21b6, #f05035)', height: '100%', borderRadius: 999,
                width: `${progressPct}%`, transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>

        {/* Call to Actions */}
        {group.status === 'active' && (
          <button
            onClick={handleJoinTeam}
            className="btn-violet"
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.875rem', padding: '12px 24px', borderRadius: 14 }}
          >
            Accept Invite & Join Team
            <ArrowRight size={16} />
          </button>
        )}

        {/* Safety banner */}
        <div style={{ background: '#fff', border: '1px solid rgba(91,33,182,0.12)', borderRadius: 16, padding: '16px 18px', display: 'flex', gap: 12, alignItems: 'flex-start', textAlign: 'left' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(91,33,182,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShieldCheck size={16} color="#5b21b6" />
          </div>
          <div>
            <strong style={{ fontSize: '0.78rem', fontWeight: 700, color: '#12100e', display: 'block', marginBottom: 2 }}>Pre-Authorization Safety Escrow</strong>
            <p style={{ fontSize: '0.72rem', color: '#6b6560', lineHeight: 1.65 }}>
              Funds holds are only captured once the {group.target_size}-member co-buying team fills successfully. If the timer expires before filling, all holds are released.
            </p>
          </div>
        </div>
        </div>
      </div>

      <OTPLoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </div>
  );
}
