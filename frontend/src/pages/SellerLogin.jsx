import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, Store, User, Phone, CheckCircle2, Upload, FileText, Landmark, CreditCard, MapPin, Building, ShieldCheck, Tag } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function SellerLogin() {
  const { loginWithEmail, isLoggedIn, role } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup Multi-step State
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const [signupData, setSignupData] = useState({
    // Step 1: Account
    name: '', email: '', phone: '', password: '',
    // Step 2: Business
    business_name: '', business_type: 'Proprietorship', gstin: '',
    // Step 3: KYC
    pan_number: '', aadhar_number: '', business_address: '',
    // Step 4: Shiprocket Pickup Address
    pickup_name: '', pickup_phone: '', pickup_address: '', pickup_city: '', pickup_state: 'Delhi', pickup_pincode: '', pickup_country: 'India',
    // Step 5: Banking
    bank_account: '', ifsc: ''
  });
  const [documentFile, setDocumentFile] = useState(null);

  if (isLoggedIn && role === 'seller') {
    return <Navigate to="/seller" replace />;
  }

  // --- Handlers ---

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await loginWithEmail(loginEmail, loginPassword);
      if (user.role !== 'seller') {
        toast.error('Logging in...');
        navigate('/seller');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be under 5MB');
        return;
      }
      setDocumentFile(file);
    }
  };

  const validateStep = () => {
    if (step === 1) {
      if (!signupData.name || !signupData.email || !signupData.phone || !signupData.password) {
        toast.error('Please fill all account details');
        return false;
      }
      if (signupData.phone.length < 10) {
        toast.error('Please enter a valid phone number');
        return false;
      }
    }
    if (step === 2) {
      if (!signupData.business_name || !signupData.business_type) {
        toast.error('Business Name and Type are required');
        return false;
      }
    }
    if (step === 3) {
      if (!signupData.pan_number || !signupData.aadhar_number || !signupData.business_address) {
        toast.error('All KYC fields are required');
        return false;
      }
      if (!documentFile) {
        toast.error('Please upload a KYC document (PAN/Aadhar/GST Certificate)');
        return false;
      }
    }
    if (step === 4) {
      if (!signupData.pickup_name || !signupData.pickup_phone || !signupData.pickup_address || !signupData.pickup_city || !signupData.pickup_state || !signupData.pickup_pincode) {
        toast.error('Please fill all pickup address fields for courier dispatch');
        return false;
      }
      if (signupData.pickup_pincode.trim().length !== 6) {
        toast.error('Pickup pincode must be exactly 6 digits');
        return false;
      }
    }
    if (step === 5) {
      if (!signupData.bank_account || !signupData.ifsc) {
        toast.error('Bank Account and IFSC are required');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) setStep(prev => prev + 1);
  };
  const prevStep = () => setStep(prev => prev - 1);

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    setLoading(true);
    try {
      // 1. Upload Document
      const formData = new FormData();
      formData.append('document', documentFile);

      const uploadRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.error || 'Failed to upload document');
      }

      const { url: kyc_document_url } = await uploadRes.json();

      // 2. Submit all data to /api/auth/seller/signup
      const finalData = {
        ...signupData,
        kyc_document_url
      };

      const res = await api.post('/auth/seller/signup', finalData);
      
      // Auto-login logic (storing token)
      localStorage.setItem('token', res.data.token);
      toast.success('Registration successful! Awaiting approval.');
      window.location.href = '/seller'; // force reload to initialize AuthContext properly

    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // --- Render Helpers ---

  const renderLogin = () => (
    <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-indigo-100 text-[#4338ca] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Store size={32} />
        </div>
        <h2 className="text-2xl font-bold font-display text-[#1e1b4b]">Seller Hub</h2>
        <p className="text-sm text-[#9490b8]">Sign in to manage your store and products</p>
      </div>

      <div className="relative">
        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9490b8]" size={18} />
        <input
          type="email"
          placeholder="Seller Email"
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

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#4338ca] text-white font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 hover:bg-[#3730a3] disabled:opacity-50 transition-colors active:scale-[0.98] cursor-pointer mt-4"
      >
        {loading ? 'Authenticating...' : 'Secure Login'}
        <ArrowRight size={18} />
      </button>

      <p className="text-center text-sm text-[#9490b8] mt-4">
        Don't have a seller account?{' '}
        <button type="button" onClick={() => setIsLogin(false)} className="text-[#4338ca] font-bold hover:underline cursor-pointer">
          Apply Now
        </button>
      </p>
    </form>
  );

  const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 
    'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Chandigarh'
  ];

  const renderSignupStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h3 className="font-bold text-[#1e1b4b] mb-4 flex items-center gap-2"><User size={18}/> Account Setup</h3>
            <input type="text" name="name" placeholder="Full Name" value={signupData.name} onChange={handleSignupChange} className="w-full bg-[#f8f7ff] border border-gray-200 rounded-xl py-3 px-4 text-sm focus:border-[#6366f1] outline-none" required />
            <input type="email" name="email" placeholder="Email Address" value={signupData.email} onChange={handleSignupChange} className="w-full bg-[#f8f7ff] border border-gray-200 rounded-xl py-3 px-4 text-sm focus:border-[#6366f1] outline-none" required />
            <input type="tel" name="phone" placeholder="Phone Number (e.g. 9876543210)" value={signupData.phone} onChange={handleSignupChange} className="w-full bg-[#f8f7ff] border border-gray-200 rounded-xl py-3 px-4 text-sm focus:border-[#6366f1] outline-none" required />
            <input type="password" name="password" placeholder="Create Password" value={signupData.password} onChange={handleSignupChange} className="w-full bg-[#f8f7ff] border border-gray-200 rounded-xl py-3 px-4 text-sm focus:border-[#6366f1] outline-none" required />
          </div>
        );
      case 2:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h3 className="font-bold text-[#1e1b4b] mb-4 flex items-center gap-2"><Building size={18}/> Business Details</h3>
            <input type="text" name="business_name" placeholder="Registered Business Name" value={signupData.business_name} onChange={handleSignupChange} className="w-full bg-[#f8f7ff] border border-gray-200 rounded-xl py-3 px-4 text-sm focus:border-[#6366f1] outline-none" required />
            <select name="business_type" value={signupData.business_type} onChange={handleSignupChange} className="w-full bg-[#f8f7ff] border border-gray-200 rounded-xl py-3 px-4 text-sm focus:border-[#6366f1] outline-none text-[#1e1b4b]">
              <option value="Proprietorship">Proprietorship</option>
              <option value="Partnership">Partnership</option>
              <option value="Private Limited">Private Limited</option>
              <option value="Public Limited">Public Limited</option>
              <option value="LLP">LLP</option>
            </select>
            <input type="text" name="gstin" placeholder="GSTIN (Optional but recommended)" value={signupData.gstin} onChange={handleSignupChange} className="w-full bg-[#f8f7ff] border border-gray-200 rounded-xl py-3 px-4 text-sm focus:border-[#6366f1] outline-none" />
          </div>
        );
      case 3:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h3 className="font-bold text-[#1e1b4b] mb-4 flex items-center gap-2"><ShieldCheck size={18}/> KYC Verification</h3>
            <input type="text" name="pan_number" placeholder="Business / Individual PAN Number" value={signupData.pan_number} onChange={handleSignupChange} className="w-full bg-[#f8f7ff] border border-gray-200 rounded-xl py-3 px-4 text-sm focus:border-[#6366f1] outline-none uppercase" maxLength={10} required />
            <input type="text" name="aadhar_number" placeholder="Aadhar Number" value={signupData.aadhar_number} onChange={handleSignupChange} className="w-full bg-[#f8f7ff] border border-gray-200 rounded-xl py-3 px-4 text-sm focus:border-[#6366f1] outline-none" maxLength={12} required />
            <textarea name="business_address" placeholder="Registered Legal Address" rows={2} value={signupData.business_address} onChange={handleSignupChange} className="w-full bg-[#f8f7ff] border border-gray-200 rounded-xl py-3 px-4 text-sm focus:border-[#6366f1] outline-none" required />
            
            <div className="mt-4">
              <label className="text-xs font-bold text-[#9490b8] block mb-2">Upload KYC Document (PDF/JPG/PNG)</label>
              <div className="border-2 border-dashed border-[#c7c2ea] rounded-xl p-4 text-center bg-[#f8f7ff] hover:bg-[#f0effa] transition-colors relative">
                <input type="file" accept=".pdf,image/jpeg,image/png,image/jpg" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                <Upload className="mx-auto text-[#6366f1] mb-2" size={24} />
                <span className="text-sm text-[#4c4775] font-medium">
                  {documentFile ? documentFile.name : 'Click or drag file here to upload'}
                </span>
                <p className="text-[10px] text-[#9490b8] mt-1">Max size 5MB.</p>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div>
              <h3 className="font-bold text-[#1e1b4b] flex items-center gap-2"><MapPin size={18} className="text-[#4338ca]"/> Courier Pickup Address</h3>
              <p className="text-[11px] text-[#9490b8] mt-1">Shiprocket couriers will collect orders directly from this location.</p>
            </div>
            
            <input type="text" name="pickup_name" placeholder="Pickup Contact Person Name" value={signupData.pickup_name} onChange={handleSignupChange} className="w-full bg-[#f8f7ff] border border-gray-200 rounded-xl py-3 px-4 text-sm focus:border-[#6366f1] outline-none" required />
            <input type="tel" name="pickup_phone" placeholder="Pickup Contact Phone (10 Digits)" value={signupData.pickup_phone} onChange={handleSignupChange} className="w-full bg-[#f8f7ff] border border-gray-200 rounded-xl py-3 px-4 text-sm focus:border-[#6366f1] outline-none" maxLength={10} required />
            <textarea name="pickup_address" placeholder="Complete Warehouse / Store Street Address" rows={2} value={signupData.pickup_address} onChange={handleSignupChange} className="w-full bg-[#f8f7ff] border border-gray-200 rounded-xl py-3 px-4 text-sm focus:border-[#6366f1] outline-none" required />
            
            <div className="grid grid-cols-2 gap-3">
              <input type="text" name="pickup_city" placeholder="City" value={signupData.pickup_city} onChange={handleSignupChange} className="w-full bg-[#f8f7ff] border border-gray-200 rounded-xl py-3 px-4 text-sm focus:border-[#6366f1] outline-none" required />
              <input type="text" name="pickup_pincode" placeholder="6-digit Pincode" value={signupData.pickup_pincode} onChange={handleSignupChange} className="w-full bg-[#f8f7ff] border border-gray-200 rounded-xl py-3 px-4 text-sm focus:border-[#6366f1] outline-none" maxLength={6} required />
            </div>

            <select name="pickup_state" value={signupData.pickup_state} onChange={handleSignupChange} className="w-full bg-[#f8f7ff] border border-gray-200 rounded-xl py-3 px-4 text-sm focus:border-[#6366f1] outline-none text-[#1e1b4b]">
              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h3 className="font-bold text-[#1e1b4b] mb-4 flex items-center gap-2"><Landmark size={18}/> Banking Details</h3>
            <input type="text" name="bank_account" placeholder="Bank Account Number" value={signupData.bank_account} onChange={handleSignupChange} className="w-full bg-[#f8f7ff] border border-gray-200 rounded-xl py-3 px-4 text-sm focus:border-[#6366f1] outline-none" required />
            <input type="text" name="ifsc" placeholder="IFSC Code" value={signupData.ifsc} onChange={handleSignupChange} className="w-full bg-[#f8f7ff] border border-gray-200 rounded-xl py-3 px-4 text-sm focus:border-[#6366f1] outline-none uppercase" required />
            
            <div className="bg-[#faf8f4] border border-[#e5e7eb] rounded-xl p-4 mt-6">
              <h4 className="text-xs font-bold text-[#1e1b4b] flex items-center gap-1.5 mb-2"><CheckCircle2 size={14} className="text-green-500"/> Verification Notice</h4>
              <p className="text-[10px] text-[#6b6560] leading-relaxed">
                By submitting this application, you agree to our Merchant Terms of Service. Your KYC documents, Shiprocket pickup address, and banking details will be reviewed for automatic courier onboarding.
              </p>
            </div>
          </div>
        );
      default: return null;
    }
  };

  const renderSignup = () => (
    <div className="animate-in fade-in duration-500">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold font-display text-[#1e1b4b]">Merchant Onboarding</h2>
        <p className="text-sm text-[#9490b8]">Step {step} of {totalSteps}</p>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
          <div className="bg-[#4338ca] h-full transition-all duration-300" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
        </div>
      </div>

      {renderSignupStep()}

      <div className="flex gap-3 mt-8">
        {step > 1 && (
          <button type="button" onClick={prevStep} className="flex-1 bg-white border border-gray-200 text-[#1e1b4b] font-semibold rounded-xl py-3 hover:bg-gray-50 transition-colors cursor-pointer">
            Back
          </button>
        )}
        {step < totalSteps ? (
          <button type="button" onClick={nextStep} className="flex-[2] bg-[#4338ca] text-white font-semibold rounded-xl py-3 hover:bg-[#3730a3] transition-colors cursor-pointer flex items-center justify-center gap-2">
            Continue <ArrowRight size={16} />
          </button>
        ) : (
          <button type="button" onClick={handleSignupSubmit} disabled={loading} className="flex-[2] bg-green-600 text-white font-bold rounded-xl py-3 hover:bg-green-700 disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-2">
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        )}
      </div>

      <p className="text-center text-sm text-[#9490b8] mt-6">
        Already have a seller account?{' '}
        <button type="button" onClick={() => setIsLogin(true)} className="text-[#4338ca] font-bold hover:underline cursor-pointer">
          Sign In
        </button>
      </p>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf8f4] px-4 py-8 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl p-5 sm:p-8 shadow-[0_8px_32px_rgba(18,16,14,0.06)] border border-gray-100">
        <div className="flex justify-center mb-6">
          <Link to="/">
            <img
              src="/slabofy-logo.png"
              alt="Slabofy — Buy Together. Save Together."
              style={{ height: 42, width: 'auto', objectFit: 'contain' }}
            />
          </Link>
        </div>
        {isLogin ? renderLogin() : renderSignup()}
        
        {isLogin && (
          <div className="mt-8 text-center space-y-3">
            <Link to="/" className="text-sm text-[#9490b8] hover:text-[#1e1b4b] transition-colors cursor-pointer block">
              &larr; Back to main website
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
