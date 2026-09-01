"use client";

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, MapPin, CreditCard, ChevronLeft, Truck, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Extract checkout parameters from router navigation state
  const { product_id, group_id, target_size, variant_id, color, size } = location.state || {};

  const [product, setProduct] = useState(null);
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [addrLine1, setAddrLine1] = useState('');
  const [addrLine2, setAddrLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' or 'cod'
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Promo Coupon Code States
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    try {
      const res = await api.post('/coupons/apply', { code: couponCode });
      setAppliedCoupon(res.data.coupon);
      toast.success('Coupon applied successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid or expired coupon code');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const getDiscountedTotal = () => {
    if (!appliedCoupon) return selectedPrice;
    if (appliedCoupon.discount_type === 'flat') {
      return Math.max(1, selectedPrice - appliedCoupon.discount_value);
    } else if (appliedCoupon.discount_type === 'pct') {
      const discount = (selectedPrice * appliedCoupon.discount_value) / 100;
      return Math.max(1, selectedPrice - discount);
    }
    return selectedPrice;
  };

  useEffect(() => {
    if (!product_id || !target_size) {
      toast.error('Invalid checkout state');
      navigate('/');
      return;
    }
    fetchCheckoutProduct();
  }, [product_id]);

  const fetchCheckoutProduct = async () => {
    try {
      const res = await api.get(`/products/${product_id}`);
      setProduct(res.data.product);

      // Find the price for the chosen group size / tier
      const tier = res.data.product.tiers?.find((t) => t.group_size === target_size);
      if (tier) {
        setSelectedPrice(parseFloat(tier.price));
      } else {
        toast.error('Selected group pricing tier not found');
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load product checkout details');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!addrLine1.trim() || !city.trim() || !state.trim() || !zip.trim()) {
      return toast.error('Please fill in all required address fields');
    }
    if (zip.trim().length !== 6 || isNaN(zip.trim())) {
      return toast.error('Please enter a valid 6-digit postal ZIP code');
    }

    const fullAddress = `${addrLine1.trim()}${addrLine2.trim() ? ', ' + addrLine2.trim() : ''}, ${city.trim()}, ${state.trim()} - ${zip.trim()}`;

    setSubmitting(true);

    if (paymentMethod === 'cod') {
      await handleCodCheckout(fullAddress, zip.trim());
    } else {
      await handleOnlineCheckout(fullAddress);
    }
  };

  /**
   * Cash on Delivery Checkout Path
   */
  const handleCodCheckout = async (fullAddress, zipCode) => {
    try {
      const payload = {
        product_id,
        group_id,
        target_size,
        variant_id,
        color,
        size,
        shipping_address: fullAddress,
        pincode: zipCode,
        coupon_code: appliedCoupon ? appliedCoupon.code : undefined
      };
      
      const res = await api.post('/payments/cod', payload);
      toast.success(res.data.message || 'COD Order Placed Successfully!');
      
      // Redirect to Group Room
      navigate(`/group/${res.data.group_id}`);
    } catch (error) {
      const errMsg = error.response?.data?.error || 'COD order placement failed';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Online Payment Checkout (Pre-Auth hold mode)
   */
  const handleOnlineCheckout = async (fullAddress) => {
    try {
      const payload = {
        product_id,
        group_id,
        target_size,
        variant_id,
        color,
        size,
        shipping_address: fullAddress,
        coupon_code: appliedCoupon ? appliedCoupon.code : undefined
      };

      // 1. Create Pre-Auth Payment Order on backend
      const orderRes = await api.post('/payments/create-order', payload);
      const { razorpay_order_id, amount, key_id, order_id } = orderRes.data;

      // Handle Mock/Sandbox flow if backend returned a mock order
      if (razorpay_order_id && razorpay_order_id.startsWith('order_mock_')) {
        toast('Mock Mode: Bypassing Razorpay Gateway and verifying payment...', { icon: '🤖', duration: 3000 });
        setTimeout(async () => {
          try {
            const verifyPayload = {
              razorpay_order_id: razorpay_order_id,
              razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(2, 12)}`,
              razorpay_signature: 'mock_signature_bypass'
            };
            const verifyRes = await api.post('/payments/verify', verifyPayload);
            toast.success('Mock Payment Authorized!');
            navigate(`/group/${verifyRes.data.group_id}`);
          } catch (verifyErr) {
            console.error(verifyErr);
            toast.error(verifyErr.response?.data?.error || 'Mock payment verification failed');
          } finally {
            setSubmitting(false);
          }
        }, 1200);
        return;
      }

      // 2. Load Razorpay Checkout modal
      const options = {
        key: key_id,
        amount: Math.round(amount * 100),
        currency: 'INR',
        name: 'Slabofy',
        description: `Hold pre-authorization for ${target_size}-member co-buy`,
        order_id: razorpay_order_id,
        
        handler: async function (response) {
          setSubmitting(true);
          try {
            // Verify signature on backend
            const verifyPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            };
            
            const verifyRes = await api.post('/payments/verify', verifyPayload);
            toast.success('Payment Authorized and Group Joined!');
            
            // Redirect to Group Room
            navigate(`/group/${verifyRes.data.group_id}`);
          } catch (verifyErr) {
            console.error(verifyErr);
            toast.error(verifyErr.response?.data?.error || 'Payment signature verification failed');
          } finally {
            setSubmitting(false);
          }
        },
        prefill: {
          name: user?.name || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#00f2fe'
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
            toast.error('Payment checkout dismissed');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to initialize payment gateway');
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
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
        <p style={{ color: '#a09a94', fontWeight: 600, fontSize: '0.875rem' }}>Opening secure checkout...</p>
      </div>
    );
  }

  // ── Shared input style ──
  const inputStyle = {
    width: '100%',
    background: '#fff',
    border: '1.5px solid rgba(18,16,14,0.12)',
    borderRadius: 12,
    padding: '11px 16px',
    fontSize: '0.875rem',
    color: '#12100e',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };
  const labelStyle = {
    fontSize: '0.68rem', fontWeight: 700, color: '#6b6560',
    textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8,
  };

  return (
    <div className="mesh-violet" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 24px 80px' }}>

        {/* Back nav */}
        <Link to={`/product/${product_id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#a09a94', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600, marginBottom: 28, transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#5b21b6'}
          onMouseLeave={e => e.currentTarget.style.color = '#a09a94'}
        >
          <ChevronLeft size={16} /> Back to Product
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 32, alignItems: 'start' }}>

          {/* ── LEFT — Delivery + Payment ── */}
          <div style={{ background: '#fff', borderRadius: 24, border: '1px solid rgba(18,16,14,0.08)', padding: '32px 32px', boxShadow: '0 4px 24px rgba(18,16,14,0.06)' }}>

            <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: '#12100e', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #5b21b6, #4338ca)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>1</div>
              Delivery Information
            </h2>

            <form onSubmit={handlePlaceOrder}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                {/* Address Line 1 */}
                <div>
                  <label style={labelStyle}>Address Line 1 <span style={{ color: '#f05035' }}>*</span></label>
                  <input
                    type="text"
                    placeholder="Flat, House no., Building, Apartment, Street"
                    value={addrLine1}
                    onChange={e => setAddrLine1(e.target.value)}
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#5b21b6'; e.target.style.boxShadow = '0 0 0 3px rgba(91,33,182,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(18,16,14,0.12)'; e.target.style.boxShadow = 'none'; }}
                    required
                  />
                </div>

                {/* Address Line 2 */}
                <div>
                  <label style={labelStyle}>Address Line 2 <span style={{ color: '#a09a94', fontWeight: 500 }}>(Optional)</span></label>
                  <input
                    type="text"
                    placeholder="Area, Colony, Sector, Landmark"
                    value={addrLine2}
                    onChange={e => setAddrLine2(e.target.value)}
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#5b21b6'; e.target.style.boxShadow = '0 0 0 3px rgba(91,33,182,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(18,16,14,0.12)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>

                {/* City / State / ZIP */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                  {[
                    { label: 'City', placeholder: 'e.g. Mumbai', value: city, onChange: e => setCity(e.target.value), required: true },
                    { label: 'State', placeholder: 'e.g. Maharashtra', value: state, onChange: e => setState(e.target.value), required: true },
                    { label: 'ZIP / Pincode', placeholder: '6-digit ZIP', value: zip, onChange: e => setZip(e.target.value), required: true, maxLength: 6 },
                  ].map(({ label, ...props }) => (
                    <div key={label}>
                      <label style={labelStyle}>{label} <span style={{ color: '#f05035' }}>*</span></label>
                      <input
                        type="text"
                        style={inputStyle}
                        onFocus={e => { e.target.style.borderColor = '#5b21b6'; e.target.style.boxShadow = '0 0 0 3px rgba(91,33,182,0.1)'; }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(18,16,14,0.12)'; e.target.style.boxShadow = 'none'; }}
                        {...props}
                      />
                    </div>
                  ))}
                </div>

                {/* Payment Method */}
                <div style={{ paddingTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #f05035, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>2</div>
                    <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#12100e' }}>Payment Method</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {[
                      { value: 'online', title: 'Pre-Auth Card / UPI', desc: 'Card held, captured only when team fills.', accent: '#5b21b6' },
                      { value: 'cod', title: 'Cash on Delivery', desc: 'Pay in cash when your order arrives.', accent: '#f59e0b' },
                    ].map(({ value, title, desc, accent }) => (
                      <label
                        key={value}
                        onClick={() => setPaymentMethod(value)}
                        style={{
                          border: `2px solid ${paymentMethod === value ? accent : 'rgba(18,16,14,0.1)'}`,
                          borderRadius: 16, padding: '16px 18px',
                          display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer',
                          background: paymentMethod === value ? `${accent}08` : '#faf8f4',
                          transition: 'all 0.2s',
                          boxShadow: paymentMethod === value ? `0 0 0 3px ${accent}18` : 'none',
                        }}
                      >
                        <div style={{
                          width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                          border: `2px solid ${paymentMethod === value ? accent : '#c8c3bd'}`,
                          background: paymentMethod === value ? accent : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s',
                        }}>
                          {paymentMethod === value && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                        </div>
                        <div>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#12100e', display: 'block', marginBottom: 4 }}>{title}</span>
                          <span style={{ fontSize: '0.72rem', color: '#6b6560', lineHeight: 1.5 }}>{desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* COD Pincode Notice */}
                {paymentMethod === 'cod' && (
                  <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <Truck size={16} color="#b45309" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#12100e', marginBottom: 4 }}>COD Pincode Check</div>
                      <p style={{ fontSize: '0.72rem', color: '#6b6560', lineHeight: 1.6 }}>
                        COD is auto-verified via your ZIP. Test pincodes: <span style={{ color: '#5b21b6', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>110001, 400001, 560001, 600001, 700001, 500001</span>.
                      </p>
                    </div>
                  </div>
                )}

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-violet"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.9rem', padding: '14px 24px', borderRadius: 14, marginTop: 8, opacity: submitting ? 0.6 : 1 }}
                >
                  {submitting ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <RefreshCw size={16} style={{ animation: 'spin-slow 0.7s linear infinite' }} /> Processing...
                    </span>
                  ) : paymentMethod === 'online' ? (
                    <><ShieldCheck size={16} /> Authorize Pre-Auth Card Hold</>
                  ) : (
                    <><Truck size={16} /> Place Cash on Delivery Order</>
                  )}
                </button>

              </div>
            </form>
          </div>

          {/* ── RIGHT — Order Summary ── */}
          <div style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 24, border: '1px solid rgba(18,16,14,0.08)', padding: '28px 28px', boxShadow: '0 4px 24px rgba(18,16,14,0.06)' }}>

              <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#12100e', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid rgba(18,16,14,0.08)' }}>
                <ShoppingBag size={18} color="#5b21b6" /> Order Summary
              </h3>

              {/* Product info */}
              <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
                <img
                  src={product.images ? (typeof product.images === 'string' ? JSON.parse(product.images) : product.images)?.[0] : ''}
                  alt={product.name}
                  style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 14, background: '#f2ede4', flexShrink: 0, border: '1px solid rgba(18,16,14,0.07)' }}
                />
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#12100e', marginBottom: 4, lineHeight: 1.3, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    {product.name}
                  </h4>
                  <p style={{ fontSize: '0.68rem', color: '#a09a94', marginBottom: (color || size) ? 4 : 8, fontFamily: 'JetBrains Mono, monospace' }}>SKU: {product.sku || 'N/A'}</p>
                  {(color || size) && (
                    <p style={{ fontSize: '0.68rem', color: '#6b6560', marginBottom: 8, fontWeight: 600 }}>
                      {color && `Color: ${color}`}{color && size && ' · '}{size && `Size: ${size}`}
                    </p>
                  )}
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#5b21b6', background: 'rgba(91,33,182,0.08)', border: '1px solid rgba(91,33,182,0.15)', padding: '3px 10px', borderRadius: 999 }}>
                    {target_size === 1 ? 'Solo Buyer' : `${target_size}-Member Team`}
                  </span>
                </div>
              </div>

              {/* Coupon */}
              <div style={{ paddingTop: 20, borderTop: '1px solid rgba(18,16,14,0.07)', marginBottom: 20 }}>
                <label style={labelStyle}>Apply Promo Coupon</label>
                {!appliedCoupon ? (
                  <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      placeholder="e.g. SAVE20"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      style={{ ...inputStyle, flex: 1, padding: '10px 14px', fontSize: '0.8rem' }}
                      onFocus={e => { e.target.style.borderColor = '#5b21b6'; e.target.style.boxShadow = '0 0 0 3px rgba(91,33,182,0.1)'; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(18,16,14,0.12)'; e.target.style.boxShadow = 'none'; }}
                    />
                    <button
                      type="submit"
                      disabled={couponLoading || !couponCode.trim()}
                      style={{
                        padding: '10px 16px', borderRadius: 12, border: '1.5px solid rgba(91,33,182,0.25)',
                        background: 'rgba(91,33,182,0.07)', color: '#5b21b6',
                        fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                        opacity: couponLoading || !couponCode.trim() ? 0.5 : 1,
                        transition: 'all 0.2s',
                      }}
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </form>
                ) : (
                  <div style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.2)', borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#059669', display: 'block', fontFamily: 'JetBrains Mono, monospace' }}>{appliedCoupon.code}</span>
                      <span style={{ fontSize: '0.68rem', color: '#6b6560' }}>
                        {appliedCoupon.discount_type === 'flat'
                          ? `₹${appliedCoupon.discount_value} flat off`
                          : `${appliedCoupon.discount_value}% off`}
                      </span>
                    </div>
                    <button onClick={handleRemoveCoupon} style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f05035', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                  </div>
                )}
              </div>

              {/* Price breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 20, borderTop: '1px solid rgba(18,16,14,0.07)' }}>
                {[
                  { label: `Unit price (${target_size} size tier)`, value: formatCurrency(selectedPrice) },
                  { label: 'Quantity', value: '1 unit' },
                  { label: 'Shipping Fee', value: 'FREE', highlight: '#059669' },
                ].map(({ label, value, highlight }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#6b6560' }}>{label}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: highlight || '#12100e' }}>{value}</span>
                  </div>
                ))}

                {appliedCoupon && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8rem', color: '#059669' }}>Coupon Discount</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#059669' }}>
                      − {formatCurrency(
                        appliedCoupon.discount_type === 'flat'
                          ? appliedCoupon.discount_value
                          : (selectedPrice * appliedCoupon.discount_value) / 100
                      )}
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '2px solid rgba(18,16,14,0.08)', marginTop: 4 }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#12100e', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Payable Total</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#5b21b6', fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '-0.03em' }}>
                    {formatCurrency(getDiscountedTotal())}
                  </span>
                </div>
              </div>
            </div>

            {/* Security banner */}
            <div style={{ background: '#fff', borderRadius: 18, border: '1px solid rgba(91,33,182,0.12)', padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(91,33,182,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShieldCheck size={18} color="#5b21b6" />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#12100e', marginBottom: 4 }}>Secure Escrow Hold</div>
                <p style={{ fontSize: '0.72rem', color: '#6b6560', lineHeight: 1.65 }}>
                  Funds are held in pre-authorization only — not debited. Holds are voided instantly if your co-buying timer expires without filling.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
