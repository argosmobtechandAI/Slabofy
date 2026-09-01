import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, ShieldAlert } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const { loginWithEmail, isLoggedIn, role } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (isLoggedIn && role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await loginWithEmail(email, password);
      if (user.role !== 'admin') {
        toast.error('Access Denied. Admin privileges required.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf8f4] p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-[0_8px_32px_rgba(18,16,14,0.06)] border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-100 text-[#5b21b6] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-bold font-display text-[#1e1b4b]">Admin Portal</h2>
          <p className="text-sm text-[#9490b8]">Sign in with your administrator credentials</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9490b8]" size={18} />
            <input
              type="email"
              placeholder="Admin Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-3 pl-12 pr-4 text-[#1e1b4b] placeholder-[#b4b0d0] focus:outline-none focus:border-[#6366f1] transition-colors"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9490b8]" size={18} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#f8f7ff] border border-[rgba(99,102,241,0.15)] rounded-xl py-3 pl-12 pr-4 text-[#1e1b4b] placeholder-[#b4b0d0] focus:outline-none focus:border-[#6366f1] transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5b21b6] text-white font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 hover:bg-[#4c1d95] disabled:opacity-50 transition-colors active:scale-[0.98] cursor-pointer mt-4"
          >
            {loading ? 'Authenticating...' : 'Secure Login'}
            <ArrowRight size={18} />
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-[#9490b8] hover:text-[#1e1b4b] transition-colors cursor-pointer">
            &larr; Back to main website
          </Link>
        </div>
      </div>
    </div>
  );
}
