"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { X, Phone, Lock, ArrowRight, RefreshCw, Plus, Mail, User } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function OTPLoginModal({ isOpen, onClose }) {
  const { requestOtp, login, loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  
  // View mode switcher: 'otp-phone' | 'otp-verify' | 'email-login' | 'email-signup' | 'forgot-send' | 'forgot-reset'
  const [mode, setMode] = useState('otp-phone');
  
  // OTP state
  const [phone, setPhone] = useState('');
  const [otpName, setOtpName] = useState('');
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Google SSO state
  const [googleChooserOpen, setGoogleChooserOpen] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Email login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Email signup state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // Reset resend timer when entering OTP step
  useEffect(() => {
    let interval = null;
    if (mode === 'otp-verify' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [mode, resendTimer]);

  if (!isOpen) return null;

  // OTP handlers
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone) return toast.error('Phone number is required');
    
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith('+91')) {
      if (formattedPhone.length === 10) {
        formattedPhone = `+91${formattedPhone}`;
      } else {
        return toast.error('Enter a valid 10-digit mobile number');
      }
    }

    setSending(true);
    try {
      const data = await requestOtp(formattedPhone);
      setPhone(formattedPhone);
      setMode('otp-verify');
      setResendTimer(30);
      
      if (data.otp) {
        setOtp(data.otp);
        toast(`[DEV DEV] Auto-filled OTP: ${data.otp}`, { icon: '🤖', duration: 6000 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Enter 6-digit OTP code');

    setVerifying(true);
    try {
      const user = await login(phone, otp, otpName);
      onClose();
      if (user.role === 'admin') {
        window.location.href = '/admin';
      } else if (user.role === 'seller') {
        window.location.href = '/seller';
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResendTimer(30);
    try {
      const data = await requestOtp(phone);
      if (data.otp) {
        setOtp(data.otp);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Google SSO handlers
  const handleGoogleSelect = async (email, name) => {
    try {
      const user = await loginWithGoogle(email, name);
      setGoogleChooserOpen(false);
      onClose();
      if (user.role === 'admin') {
        window.location.href = '/admin';
      } else if (user.role === 'seller') {
        window.location.href = '/seller';
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCustomGoogleSubmit = async (e) => {
    e.preventDefault();
    if (!customEmail) return;
    await handleGoogleSelect(customEmail, customName || customEmail.split('@')[0]);
  };

  // Email login handler
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return toast.error('All fields are required');

    setLoginLoading(true);
    try {
      const user = await loginWithEmail(loginEmail, loginPassword);
      onClose();
      if (user.role === 'admin') {
        window.location.href = '/admin';
      } else if (user.role === 'seller') {
        window.location.href = '/seller';
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoginLoading(false);
    }
  };

  // Email signup handler
  const handleEmailSignup = async (e) => {
    e.preventDefault();
    if (!signupName || !signupEmail || !signupPhone || !signupPassword) {
      return toast.error('All fields are required');
    }

    setSignupLoading(true);
    try {
      const user = await registerWithEmail(signupName, signupEmail, signupPhone, signupPassword);
      onClose();
      if (user.role === 'admin') {
        window.location.href = '/admin';
      } else if (user.role === 'seller') {
        window.location.href = '/seller';
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSignupLoading(false);
    }
  };

  // Forgot password request code
  const handleForgotSend = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return toast.error('Email is required');

    setForgotLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      toast.success(res.data.message || 'Verification code sent!');
      
      // Auto-fill code in dev mode for easy testing
      if (res.data.code) {
        setForgotCode(res.data.code);
        toast(`[DEV DEV] Auto-filled Reset Code: ${res.data.code}`, { icon: '🤖', duration: 6000 });
      }
      setMode('forgot-reset');
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to request reset';
      toast.error(errMsg);
    } finally {
      setForgotLoading(false);
    }
  };

  // Reset password handler
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail || !forgotCode || !newPassword) {
      return toast.error('All fields are required');
    }

    setForgotLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { 
        email: forgotEmail, 
        code: forgotCode, 
        newPassword 
      });
      toast.success(res.data.message || 'Password reset successful!');
      setMode('email-login');
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Password reset failed';
      toast.error(errMsg);
    } finally {
      setForgotLoading(false);
    }
  };

  const modalContent = (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(30,27,75,0.45)', backdropFilter: 'blur(12px)', animation: 'fadeIn 0.2s ease' }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '92%',
          maxWidth: 460,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#ffffff',
          borderRadius: 28,
          padding: 36,
          boxShadow: '0 32px 100px rgba(30,27,75,0.2), 0 8px 30px rgba(99,102,241,0.15)',
          border: '1px solid rgba(99,102,241,0.15)',
          zIndex: 10000,
          animation: 'scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 18, right: 18,
            background: 'rgba(99,102,241,0.08)',
            border: 'none',
            borderRadius: 10,
            width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#9490b8',
            cursor: 'pointer',
            transition: 'all 0.2s',
            zIndex: 10,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.1)'; e.currentTarget.style.color = '#f43f5e'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.color = '#9490b8'; }}
        >
          <X size={16} />
        </button>

        {/* Google SSO Chooser view */}
        {googleChooserOpen ? (
          <div className="space-y-6 animate-fade-in text-center">
            <div className="flex justify-center mb-1">
              <span className="text-2xl font-black tracking-tight select-none">
                <span className="text-blue-500">G</span>
                <span className="text-red-500">o</span>
                <span className="text-yellow-500">o</span>
                <span className="text-blue-500">g</span>
                <span className="text-green-500">l</span>
                <span className="text-red-500">e</span>
              </span>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#1e1b4b]">Choose a Google Account</h3>
              <p className="text-xs text-[#9490b8]">to continue to Slabofy</p>
            </div>

            <div className="space-y-3 mt-4 text-left">
              <button
                type="button"
                onClick={() => handleGoogleSelect('rishabh@gmail.com', 'Rishabh')}
                className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.1)] hover:border-[rgba(99,102,241,0.15)] rounded-xl p-3 flex items-center gap-3 transition-colors cursor-pointer text-left focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-brand-cyan/20 text-brand-cyan flex items-center justify-center font-bold text-xs uppercase">
                  R
                </div>
                <div>
                  <span className="text-xs font-bold text-[#1e1b4b] block">Rishabh</span>
                  <span className="text-[10px] text-[#9490b8] block">rishabh@gmail.com</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleGoogleSelect('testuser@gmail.com', 'Test User')}
                className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.1)] hover:border-[rgba(99,102,241,0.15)] rounded-xl p-3 flex items-center gap-3 transition-colors cursor-pointer text-left focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs uppercase">
                  T
                </div>
                <div>
                  <span className="text-xs font-bold text-[#1e1b4b] block">Test User</span>
                  <span className="text-[10px] text-[#9490b8] block">testuser@gmail.com</span>
                </div>
              </button>

              {!showCustomInput ? (
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className="w-full bg-transparent hover:bg-white/5 rounded-xl p-3 flex items-center gap-3 transition-colors cursor-pointer text-left text-brand-cyan text-xs font-semibold focus:outline-none"
                >
                  <Plus size={16} className="inline mr-1" />
                  Use another mock account
                </button>
              ) : (
                <form onSubmit={handleCustomGoogleSubmit} className="space-y-3 bg-[#f8f7ff]/50 p-4 rounded-xl border border-[rgba(99,102,241,0.1)]">
                  <input
                    type="email"
                    placeholder="Enter mock Gmail address"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full bg-[#f0eef8] border border-[rgba(99,102,241,0.15)] rounded-xl py-2 px-3 text-xs text-[#1e1b4b] placeholder-[#b4b0d0] focus:outline-none focus:border-[#6366f1]"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Display Name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-[#f0eef8] border border-[rgba(99,102,241,0.15)] rounded-xl py-2 px-3 text-xs text-[#1e1b4b] placeholder-[#b4b0d0] focus:outline-none focus:border-[#6366f1]"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(false)}
                      className="px-3 py-1.5 text-[10px] font-semibold text-[#9490b8] hover:text-[#1e1b4b] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-gradient-neon text-white px-3 py-1.5 text-[10px] font-bold rounded-lg cursor-pointer"
                    >
                      Proceed
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="border-t border-[rgba(99,102,241,0.1)] pt-4">
              <button
                type="button"
                onClick={() => setGoogleChooserOpen(false)}
                className="text-xs text-[#9490b8] hover:text-[#1e1b4b] transition-colors cursor-pointer"
              >
                Back to Authentication
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 1. OTP Phone Mode */}
            {mode === 'otp-phone' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold font-display text-gradient-cyan-blue mb-2">
                    Verify Your Phone
                  </h3>
                  <p className="text-sm text-[#9490b8]">
                    Login or Register in seconds using OTP
                  </p>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-6">
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9490b8]" size={18} />
                    <input
                      type="tel"
                      placeholder="Mobile number (10 digit)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      maxLength={13}
                      className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-3.5 pl-12 pr-4 text-[#1e1b4b] placeholder-[#b4b0d0] focus:outline-none focus:border-[#6366f1] transition-colors"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-gradient-neon text-white font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity active:scale-[0.98] cursor-pointer"
                  >
                    {sending ? 'Sending OTP...' : 'Send Verification OTP'}
                    <ArrowRight size={18} />
                  </button>
                </form>

                <div className="relative my-6 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[rgba(99,102,241,0.15)]"></div>
                  </div>
                  <span className="relative bg-white px-3 text-[10px] uppercase font-bold text-[#b4b0d0] tracking-wider">or</span>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setMode('email-login')}
                    className="flex-1 py-3 border border-[rgba(99,102,241,0.15)] rounded-xl font-bold text-xs text-[#1e1b4b] hover:bg-[#f8f7ff] transition-colors cursor-pointer"
                  >
                    Email Login
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('email-signup')}
                    className="flex-1 py-3 border border-[rgba(99,102,241,0.15)] rounded-xl font-bold text-xs text-[#1e1b4b] hover:bg-[#f8f7ff] transition-colors cursor-pointer"
                  >
                    Create Account
                  </button>
                </div>
              </div>
            )}

            {/* 2. OTP Verification Mode */}
            {mode === 'otp-verify' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold font-display text-gradient-cyan-blue mb-2">
                    Enter OTP Code
                  </h3>
                  <p className="text-sm text-[#9490b8]">
                    We sent a 6-digit verification code to {phone}
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9490b8]" size={18} />
                    <input
                      type="text"
                      placeholder="6-Digit OTP Code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-3.5 pl-12 pr-4 text-[#1e1b4b] text-center tracking-widest text-lg placeholder-[#b4b0d0] focus:outline-none focus:border-[#6366f1] transition-colors"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={verifying}
                    className="w-full bg-gradient-neon text-white font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity active:scale-[0.98] cursor-pointer"
                  >
                    {verifying ? 'Verifying...' : 'Verify & Login'}
                    <ArrowRight size={18} />
                  </button>

                  <div className="flex items-center justify-between text-xs text-[#9490b8] mt-4 px-1">
                    {resendTimer > 0 ? (
                      <span>Resend OTP code in <strong className="text-brand-cyan font-medium">{resendTimer}s</strong></span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend}
                        className="text-brand-cyan hover:underline flex items-center gap-1 font-medium transition-colors cursor-pointer"
                      >
                        <RefreshCw size={12} />
                        Resend OTP Code
                      </button>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => setMode('otp-phone')}
                      className="text-[#9490b8] hover:text-[#1e1b4b] transition-colors cursor-pointer"
                    >
                      Change Number
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 3. Email Login Mode */}
            {mode === 'email-login' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold font-display text-gradient-cyan-blue mb-2">
                    Customer Login
                  </h3>
                  <p className="text-sm text-[#9490b8]">
                    Sign in to your account using email
                  </p>
                </div>

                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9490b8]" size={18} />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-3 pl-12 pr-4 text-[#1e1b4b] placeholder-[#b4b0d0] focus:outline-none focus:border-[#6366f1] transition-colors"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9490b8]" size={18} />
                    <input
                      type="password"
                      placeholder="Password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-3 pl-12 pr-4 text-[#1e1b4b] placeholder-[#b4b0d0] focus:outline-none focus:border-[#6366f1] transition-colors"
                      required
                    />
                  </div>

                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setMode('forgot-send')}
                      className="text-xs text-brand-cyan hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full bg-gradient-neon text-white font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity active:scale-[0.98] cursor-pointer"
                  >
                    {loginLoading ? 'Logging in...' : 'Sign In'}
                    <ArrowRight size={18} />
                  </button>

                  <div className="text-center space-y-3 pt-2">
                    <p className="text-xs text-[#9490b8]">
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setMode('email-signup')}
                        className="text-brand-cyan font-semibold hover:underline cursor-pointer"
                      >
                        Create Account
                      </button>
                    </p>
                    <button
                      type="button"
                      onClick={() => setMode('otp-phone')}
                      className="text-xs text-[#9490b8] hover:text-[#1e1b4b] transition-colors cursor-pointer"
                    >
                      Use Phone OTP Login instead
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 4. Email Sign Up Mode */}
            {mode === 'email-signup' && (
              <div className="space-y-6 overflow-y-auto max-h-[80vh] pr-1">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold font-display text-gradient-cyan-blue mb-2">
                    Create Account
                  </h3>
                  <p className="text-sm text-[#9490b8]">
                    Sign up with email to start shopping
                  </p>
                </div>

                <form onSubmit={handleEmailSignup} className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9490b8]" size={18} />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-3 pl-12 pr-4 text-[#1e1b4b] placeholder-[#b4b0d0] focus:outline-none focus:border-[#6366f1] transition-colors"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9490b8]" size={18} />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-3 pl-12 pr-4 text-[#1e1b4b] placeholder-[#b4b0d0] focus:outline-none focus:border-[#6366f1] transition-colors"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9490b8]" size={18} />
                    <input
                      type="tel"
                      placeholder="Mobile Phone (e.g. 9876543210)"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-3 pl-12 pr-4 text-[#1e1b4b] placeholder-[#b4b0d0] focus:outline-none focus:border-[#6366f1] transition-colors"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9490b8]" size={18} />
                    <input
                      type="password"
                      placeholder="Password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-3 pl-12 pr-4 text-[#1e1b4b] placeholder-[#b4b0d0] focus:outline-none focus:border-[#6366f1] transition-colors"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={signupLoading}
                    className="w-full bg-gradient-neon text-white font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity active:scale-[0.98] cursor-pointer"
                  >
                    {signupLoading ? 'Registering...' : 'Sign Up'}
                    <ArrowRight size={18} />
                  </button>

                  <div className="text-center space-y-3 pt-2">
                    <p className="text-xs text-[#9490b8]">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setMode('email-login')}
                        className="text-brand-cyan font-semibold hover:underline cursor-pointer"
                      >
                        Log In
                      </button>
                    </p>
                    <button
                      type="button"
                      onClick={() => setMode('otp-phone')}
                      className="text-xs text-[#9490b8] hover:text-[#1e1b4b] transition-colors cursor-pointer"
                    >
                      Use Phone OTP Login instead
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 5. Forgot Password - Send Code Mode */}
            {mode === 'forgot-send' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold font-display text-gradient-cyan-blue mb-2">
                    Reset Password
                  </h3>
                  <p className="text-sm text-[#9490b8]">
                    Enter email to receive a password reset verification code
                  </p>
                </div>

                <form onSubmit={handleForgotSend} className="space-y-6">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9490b8]" size={18} />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-3.5 pl-12 pr-4 text-[#1e1b4b] placeholder-[#b4b0d0] focus:outline-none focus:border-[#6366f1] transition-colors"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full bg-gradient-neon text-white font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity active:scale-[0.98] cursor-pointer"
                  >
                    {forgotLoading ? 'Sending...' : 'Send Verification Code'}
                    <ArrowRight size={18} />
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setMode('email-login')}
                      className="text-xs text-[#9490b8] hover:text-[#1e1b4b] transition-colors cursor-pointer"
                    >
                      Back to Login
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 6. Forgot Password - Reset Password Mode */}
            {mode === 'forgot-reset' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold font-display text-gradient-cyan-blue mb-2">
                    Create New Password
                  </h3>
                  <p className="text-sm text-[#9490b8]">
                    Enter the code sent to {forgotEmail} and your new password
                  </p>
                </div>

                <form onSubmit={handleResetSubmit} className="space-y-4">
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9490b8]" size={18} />
                    <input
                      type="text"
                      placeholder="6-Digit Reset Code"
                      value={forgotCode}
                      onChange={(e) => setForgotCode(e.target.value)}
                      maxLength={6}
                      className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-3 pl-12 pr-4 text-[#1e1b4b] text-center tracking-widest text-lg placeholder-[#b4b0d0] focus:outline-none focus:border-[#6366f1] transition-colors"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9490b8]" size={18} />
                    <input
                      type="password"
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-3 pl-12 pr-4 text-[#1e1b4b] placeholder-[#b4b0d0] focus:outline-none focus:border-[#6366f1] transition-colors"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full bg-gradient-neon text-white font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity active:scale-[0.98] cursor-pointer"
                  >
                    {forgotLoading ? 'Updating Password...' : 'Save New Password'}
                    <ArrowRight size={18} />
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setMode('forgot-send')}
                      className="text-xs text-[#9490b8] hover:text-[#1e1b4b] transition-colors cursor-pointer"
                    >
                      Resend Code
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
