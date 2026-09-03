"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Users, Share2, AlertTriangle, CheckCircle, RefreshCw, Calendar, Ban, Zap, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import OTPLoginModal from '../components/OTPLoginModal';
import useScrollReveal from '../hooks/useScrollReveal';

const TOTAL_DURATION = 24 * 3600; // 24h in seconds — used for ring calc

const AVATAR_COLORS = [
  ['#5b21b6', '#fff'], ['#f05035', '#fff'], ['#f59e0b', '#12100e'],
  ['#059669', '#fff'], ['#4338ca', '#fff'], ['#e11d48', '#fff'],
  ['#0ea5e9', '#fff'], ['#7c3aed', '#fff'],
];

function CircularTimer({ remaining, total }) {
  const R = 70;
  const C = 2 * Math.PI * R;
  const pct = Math.max(0, Math.min(1, remaining / Math.max(total, 1)));
  const offset = C * (1 - pct);

  const h = Math.floor(remaining / 3600).toString().padStart(2, '0');
  const m = Math.floor((remaining % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(remaining % 60).toString().padStart(2, '0');

  const stroke = remaining < 3600 ? '#f05035' : remaining < 7200 ? '#f59e0b' : '#5b21b6';

  return (
    <div style={{ position: 'relative', width: 180, height: 180, flexShrink: 0 }}>
      <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="90" cy="90" r={R} fill="none" stroke="rgba(18,16,14,0.07)" strokeWidth="8" />
        <circle
          cx="90" cy="90" r={R}
          fill="none"
          stroke={stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: '#12100e', letterSpacing: '-0.04em', lineHeight: 1 }}>
          {h}:{m}:{s}
        </div>
        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#a09a94', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>
          remaining
        </div>
      </div>
    </div>
  );
}

export default function GroupRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const revealRef = useScrollReveal();
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const pollingInterval = useRef(null);
  const timerInterval = useRef(null);

  useEffect(() => {
    fetchGroupStatus();
    pollingInterval.current = setInterval(() => fetchGroupStatus(false), 5000);
    return () => {
      clearInterval(pollingInterval.current);
      clearInterval(timerInterval.current);
    };
  }, [id]);

  useEffect(() => {
    clearInterval(timerInterval.current);
    if (timeLeft > 0) {
      timerInterval.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { clearInterval(timerInterval.current); fetchGroupStatus(false); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerInterval.current);
  }, [timeLeft]);

  const fetchGroupStatus = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await api.get(`/groups/${id}/status`);
      setGroup(res.data);
      setTimeLeft(res.data.timer_remaining_seconds || 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch group status');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const copyInviteLink = () => {
    const url = `${window.location.origin}/join/${id}`;
    navigator.clipboard.writeText(url);
    toast.success('Invite link copied!');
  };

  const shareWhatsApp = () => {
    const url = `${window.location.origin}/join/${id}`;
    const text = encodeURIComponent(`🛒 Join my co-buying team on SocialGroup! We're ${group?.current_size}/${group?.target_size} members — help us unlock the group discount!\n\n👉 ${url}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleExtendTimer = async () => {
    try {
      const res = await api.post(`/groups/${id}/extend-timer`);
      toast.success(res.data.message || 'Timer extended by 12 hours!');
      fetchGroupStatus();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Extension failed');
    }
  };

  const handleCancelGroup = async () => {
    if (!window.confirm('Cancel this group buy? All payment holds will be released.')) return;
    try {
      const res = await api.post(`/groups/${id}/cancel`);
      toast.success(res.data.message || 'Group cancelled.');
      fetchGroupStatus();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cancellation failed');
    }
  };

  const handleJoinDirectly = () => {
    if (!isLoggedIn) { setLoginModalOpen(true); return; }
    navigate('/checkout', { state: { product_id: group.product_id, group_id: group.group_id, target_size: group.target_size } });
  };

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(91,33,182,0.15)', borderTopColor: '#5b21b6', animation: 'spin-slow 0.7s linear infinite' }} />
      <p style={{ color: '#a09a94', fontWeight: 600 }}>Loading deal room...</p>
    </div>
  );

  if (error || !group) return (
    <div style={{ maxWidth: 420, margin: '80px auto', textAlign: 'center', padding: '0 24px' }}>
      <AlertTriangle size={40} color="#f05035" style={{ marginBottom: 16 }} />
      <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1.3rem', marginBottom: 8 }}>Deal Room Unavailable</h3>
      <p style={{ color: '#a09a94', fontSize: '0.875rem', marginBottom: 24 }}>{error || 'This group room is not accessible.'}</p>
      <Link to="/" className="btn-violet" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <ChevronLeft size={16} /> Back to Deals
      </Link>
    </div>
  );

  const isCreator = user?.id === group.creator_id;
  const isMember = group.members?.some(m => m.id === user?.id);
  const slotsRemaining = group.target_size - group.current_size;
  const progressPct = Math.round((group.current_size / group.target_size) * 100);
  const STATUS_TOTAL = group.timer_remaining_seconds > 0 ? TOTAL_DURATION : 1;
  const statusColor = group.timer_remaining_seconds < 3600 ? '#f05035' : '#5b21b6';

  return (
    <div className="mesh-violet" style={{ minHeight: '100vh', padding: '0 0 60px', position: 'relative' }}>
      <OTPLoginModal 
        isOpen={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)}
        onSuccess={() => {
          setLoginModalOpen(false);
          handleJoinDirectly();
        }}
      />

      {/* Breadcrumb */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 24px 0' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#a09a94', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600, transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#5b21b6'}
          onMouseLeave={e => e.currentTarget.style.color = '#a09a94'}>
          <ChevronLeft size={14} /> Back to Deals
        </Link>
      </div>

      <div ref={revealRef} className="scroll-reveal-group" style={{ maxWidth: 680, margin: '0 auto', padding: '16px 16px 64px' }}>

        {/* Status Banner */}
        {group.status === 'complete' && (
          <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(5,150,105,0.2)', borderRadius: 20, padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(5,150,105,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle size={20} color="#059669" />
            </div>
            <div>
              <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '0.95rem', color: '#12100e', marginBottom: 4 }}>Co-Buying Team Completed! 🎉</div>
              <div style={{ fontSize: '0.78rem', color: '#6b6560', lineHeight: 1.6 }}>All pre-authorized payments have been captured and orders are confirmed for merchant shipment.</div>
              <Link to="/orders" style={{ display: 'inline-block', marginTop: 8, fontSize: '0.75rem', fontWeight: 700, color: '#5b21b6', textDecoration: 'none' }}>View My Orders →</Link>
            </div>
          </div>
        )}

        {group.status === 'expired' && (
          <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(240,80,53,0.2)', borderRadius: 20, padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(240,80,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle size={20} color="#f05035" />
            </div>
            <div>
              <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '0.95rem', color: '#12100e', marginBottom: 4 }}>Co-Buying Period Expired</div>
              <div style={{ fontSize: '0.78rem', color: '#6b6560' }}>This deal didn't fill within 24 hours. All card pre-authorization holds have been safely voided.</div>
            </div>
          </div>
        )}

        {group.status === 'cancelled' && (
          <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(225,29,72,0.2)', borderRadius: 20, padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(225,29,72,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ban size={20} color="#e11d48" />
            </div>
            <div>
              <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '0.95rem', color: '#12100e', marginBottom: 4 }}>Group Cancelled</div>
              <div style={{ fontSize: '0.78rem', color: '#6b6560' }}>This co-buying group was cancelled by the creator. All authorization holds have been released.</div>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div style={{
          background: '#fff', borderRadius: 28, border: '1px solid rgba(18,16,14,0.08)',
          boxShadow: '0 8px 40px rgba(18,16,14,0.08)', overflow: 'hidden',
        }}>

          {/* Product header bar */}
          <div style={{ background: 'linear-gradient(135deg, #f7f5fd, #fff)', borderBottom: '1px solid rgba(18,16,14,0.06)', padding: '20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 4 }}>
                CO-BUY DEAL ROOM
              </div>
              <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 'clamp(1.15rem, 2.5vw, 1.5rem)', color: '#12100e', letterSpacing: '-0.03em', margin: 0 }}>
                {group.product_name}
              </h1>
              {group.tier_price && (
                <div style={{ marginTop: 6, fontSize: '0.8rem', color: '#6b6560', fontWeight: 600 }}>
                  Group Price: <span style={{ color: '#f59e0b', fontWeight: 800 }}>{fmt(group.tier_price)}</span>
                  {group.original_price && (
                    <span style={{ color: '#a09a94', textDecoration: 'line-through', marginLeft: 10, fontWeight: 500 }}>{fmt(group.original_price)}</span>
                  )}
                </div>
              )}
            </div>

            {/* Circular Timer (active only) */}
            {group.status === 'active' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ position: 'relative', width: 60, height: 60, borderRadius: '50%', background: '#fff', boxShadow: '0 4px 16px rgba(18,16,14,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CircularTimer remaining={timeLeft} total={STATUS_TOTAL} />
                  <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '1px solid rgba(91,33,182,0.1)', animation: 'pulse-ring 2s infinite' }} />
                </div>
              </div>
            )}
          </div>

          {/* Progress + Members body */}
          <div style={{ padding: '24px 20px' }}>

            {/* Progress bar */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b6560' }}>Team Fill Progress</span>
                <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '0.9rem', color: '#12100e' }}>
                  {group.current_size} <span style={{ color: '#a09a94', fontWeight: 400 }}>/ {group.target_size} slots</span>
                </span>
              </div>
              <div style={{ background: '#f2ede4', borderRadius: 99, height: 12, overflow: 'hidden', position: 'relative' }}>
                <div className="progress-bar-animated" style={{
                  height: '100%', borderRadius: 99,
                  background: group.status === 'complete' ? 'linear-gradient(90deg, #059669, #0ea5e9)' : 'linear-gradient(90deg, #5b21b6, #f05035)',
                  '--progress-pct': `${progressPct}%`,
                }} />
              </div>
              {group.status === 'active' && slotsRemaining > 0 && (
                <div style={{ marginTop: 8, fontSize: '0.72rem', color: '#5b21b6', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Zap size={12} fill="#5b21b6" /> Need {slotsRemaining} more co-buyer{slotsRemaining !== 1 ? 's' : ''} to complete the group!
                </div>
              )}
            </div>

            {/* Avatar member row */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#a09a94', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>
                Team Members
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {group.members?.map((member, idx) => {
                  const [bg, fg] = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                  return (
                    <div key={member.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div className="avatar-chip" style={{ background: `linear-gradient(135deg, ${bg}, ${bg}cc)`, color: fg, animation: idx === group.members.length - 1 ? 'scale-pop 0.4s ease' : 'none' }}>
                        {member.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div style={{ fontSize: '0.6rem', fontWeight: 600, color: '#6b6560', maxWidth: 44, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {member.id === user?.id ? 'You' : member.name?.split(' ')[0]}
                      </div>
                    </div>
                  );
                })}
                {/* Empty slot chips */}
                {group.status === 'active' && Array.from({ length: slotsRemaining }).map((_, idx) => (
                  <div key={`empty-${idx}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div className="avatar-chip-empty" style={{ border: '2px dashed rgba(18,16,14,0.1)' }}>
                      <span style={{ fontSize: '1rem', color: '#c8c3bd' }}>+</span>
                    </div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 600, color: '#c8c3bd' }}>Open</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            {group.status === 'active' && (
              <div style={{ borderTop: '1px solid rgba(18,16,14,0.07)', paddingTop: 24 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                  <button onClick={shareWhatsApp} className="hover-shine-sweep" style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: '#25d366', color: '#fff',
                    padding: '12px 20px', borderRadius: 12,
                    fontSize: '0.8rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(37,211,102,0.35)', transition: 'all 0.2s', position: 'relative', overflow: 'hidden'
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Share via WhatsApp
                  </button>

                  <button onClick={copyInviteLink} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: '#fff', color: '#12100e',
                    padding: '10px 20px', borderRadius: 12,
                    fontSize: '0.8rem', fontWeight: 700,
                    border: '1.5px solid rgba(18,16,14,0.15)', cursor: 'pointer', transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#12100e'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(18,16,14,0.15)'}
                  >
                    <Share2 size={14} /> Copy Invite Link
                  </button>

                  {/* Creator Controls */}
                  {isCreator && (
                    <>
                      <button
                        disabled={group.extension_used}
                        onClick={handleExtendTimer}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          background: group.extension_used ? 'rgba(18,16,14,0.04)' : 'rgba(91,33,182,0.08)',
                          color: group.extension_used ? '#c8c3bd' : '#5b21b6',
                          padding: '10px 18px', borderRadius: 12,
                          fontSize: '0.8rem', fontWeight: 700,
                          border: `1.5px solid ${group.extension_used ? 'rgba(18,16,14,0.08)' : 'rgba(91,33,182,0.2)'}`,
                          cursor: group.extension_used ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                        }}
                      >
                        <Calendar size={14} />
                        {group.extension_used ? 'Extension Used' : '+12 Hrs'}
                      </button>

                      <button
                        onClick={handleCancelGroup}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          background: 'rgba(225,29,72,0.06)',
                          color: '#e11d48', padding: '10px 18px', borderRadius: 12,
                          fontSize: '0.8rem', fontWeight: 700,
                          border: '1.5px solid rgba(225,29,72,0.2)', cursor: 'pointer', transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(225,29,72,0.12)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(225,29,72,0.06)'}
                      >
                        <Ban size={14} /> Cancel Group
                      </button>
                    </>
                  )}

                  {/* Join CTA for non-members */}
                  {!isMember && (
                    <button
                      onClick={handleJoinDirectly}
                      className="btn-ink"
                      style={{ marginLeft: 'auto', fontSize: '0.8rem', padding: '10px 22px' }}
                    >
                      Join This Team <Users size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
