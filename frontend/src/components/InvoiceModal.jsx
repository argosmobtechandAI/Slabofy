import React, { useState, useEffect } from 'react';
import { 
  Printer, X, Download, ShieldCheck, CheckCircle2, 
  FileText, Users, AlertCircle, Building2, Truck, Copy, Check
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function InvoiceModal({ order, onClose }) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!order?.id) return;
    fetchInvoiceData(order.id);
  }, [order?.id]);

  const fetchInvoiceData = async (orderId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/auth/orders/${orderId}/invoice`);
      setInvoice(res.data.invoice);
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError(err.response?.data?.error || 'Failed to load invoice details');
      toast.error('Unable to fetch official invoice');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyInvoiceNumber = () => {
    if (!invoice?.invoiceNumber) return;
    navigator.clipboard.writeText(invoice.invoiceNumber);
    setCopied(true);
    toast.success('Invoice number copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const fmt = (n) => new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  }).format(n || 0);

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  if (!order) return null;

  return (
    <>
      {/* Dynamic Print CSS */}
      <style>{`
        @media print {
          /* Hide everything in the page except the invoice document */
          body * {
            visibility: hidden !important;
          }
          #invoice-printable-area, #invoice-printable-area * {
            visibility: visible !important;
          }
          #invoice-printable-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 12mm 15mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            z-index: 9999999 !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
        }
      `}</style>

      {/* Modal Backdrop */}
      <div 
        className="no-print"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(18, 16, 14, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          overflowY: 'auto'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div style={{
          background: '#f8fafc',
          borderRadius: 24,
          maxWidth: 920,
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          overflow: 'hidden'
        }}>
          {/* Top Control Bar */}
          <div className="no-print" style={{
            padding: '16px 24px',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(91, 33, 182, 0.08)',
                color: '#5b21b6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FileText size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  Official GST Tax Invoice
                </h3>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Standard Indian GST Compliant Tax Invoice & Cash Memo
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {invoice?.invoiceNumber && (
                <button
                  type="button"
                  onClick={handleCopyInvoiceNumber}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                  title="Copy Invoice Number"
                >
                  {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                  {copied ? 'Copied' : invoice.invoiceNumber}
                </button>
              )}

              <button
                type="button"
                onClick={handlePrint}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 18px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#5b21b6',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(91, 33, 182, 0.25)',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#4c1d95'}
                onMouseLeave={e => e.currentTarget.style.background = '#5b21b6'}
              >
                <Printer size={15} />
                Print / Save as PDF
              </button>

              <button
                type="button"
                onClick={onClose}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Scrollable Document Container */}
          <div style={{
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            justifyContent: 'center',
            background: '#f1f5f9'
          }}>
            {loading ? (
              <div style={{ padding: '80px 0', textAlign: 'center' }}>
                <div style={{
                  width: 44,
                  height: 44,
                  border: '3px solid rgba(91,33,182,0.2)',
                  borderTopColor: '#5b21b6',
                  borderRadius: '50%',
                  animation: 'spin-slow 0.7s linear infinite',
                  margin: '0 auto 16px'
                }} />
                <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                  Generating formal tax invoice...
                </p>
              </div>
            ) : error ? (
              <div style={{
                background: '#ffffff',
                padding: '48px',
                borderRadius: 16,
                textAlign: 'center',
                maxWidth: 420
              }}>
                <AlertCircle size={36} color="#e11d48" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                  Unable to Generate Invoice
                </h4>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 20 }}>
                  {error}
                </p>
                <button
                  onClick={() => fetchInvoiceData(order.id)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 8,
                    background: '#5b21b6',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Retry
                </button>
              </div>
            ) : invoice ? (
              /* ═══════════════ PRINTABLE A4 FORMAL TAX INVOICE ═══════════════ */
              <div 
                id="invoice-printable-area"
                style={{
                  background: '#ffffff',
                  width: '100%',
                  maxWidth: 820,
                  padding: '36px 42px',
                  borderRadius: 12,
                  boxShadow: '0 4px 25px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  boxSizing: 'border-box'
                }}
              >
                {/* 1. Header Section */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  borderBottom: '2px solid #0f172a',
                  paddingBottom: 20,
                  marginBottom: 20
                }}>
                  <div>
                    {/* Brand Logo & Tagline */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{
                        background: '#5b21b6',
                        color: '#ffffff',
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        fontWeight: 900,
                        fontSize: '1.25rem',
                        letterSpacing: '-0.04em',
                        padding: '4px 10px',
                        borderRadius: 8,
                        display: 'inline-block'
                      }}>
                        SLABOFY
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Social E-Commerce Platform
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#334155', lineHeight: 1.45 }}>
                      <strong>{invoice.platform.companyName}</strong><br />
                      CIN: {invoice.platform.cin}<br />
                      Platform GSTIN: {invoice.platform.gstin}<br />
                      Web: {invoice.platform.website} | Support: {invoice.platform.supportEmail}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      display: 'inline-block',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: 6,
                      padding: '4px 12px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      color: '#0f172a',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      marginBottom: 8
                    }}>
                      Tax Invoice / Bill of Supply
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#0f172a', lineHeight: 1.5 }}>
                      <strong>Invoice No:</strong> <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{invoice.invoiceNumber}</span><br />
                      <strong>Invoice Date:</strong> {formatDate(invoice.invoiceDate)}<br />
                      <strong>Order ID:</strong> #{invoice.orderId}<br />
                      <strong>Order Date:</strong> {formatDate(invoice.orderDate)}
                    </div>
                  </div>
                </div>

                {/* 2. Sold By & Billed To Section (2 Equal Columns) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 24,
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: 18,
                  marginBottom: 20
                }}>
                  {/* Sold By */}
                  <div style={{ fontSize: '0.78rem', color: '#334155', lineHeight: 1.5 }}>
                    <div style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      color: '#5b21b6',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <Building2 size={13} /> Sold By (Merchant)
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', marginBottom: 2 }}>
                      {invoice.seller.businessName}
                    </div>
                    <div>{invoice.seller.address}</div>
                    <div>{invoice.seller.city}, {invoice.seller.state} — {invoice.seller.pincode}</div>
                    <div><strong>GSTIN:</strong> {invoice.seller.gstin}</div>
                    <div><strong>PAN:</strong> {invoice.seller.panNumber}</div>
                    <div><strong>State Code:</strong> {invoice.seller.state}</div>
                  </div>

                  {/* Billed & Shipped To */}
                  <div style={{ fontSize: '0.78rem', color: '#334155', lineHeight: 1.5 }}>
                    <div style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      color: '#5b21b6',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <Truck size={13} /> Billed To & Shipped To (Customer)
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', marginBottom: 2 }}>
                      {invoice.buyer.name}
                    </div>
                    <div style={{ whiteSpace: 'pre-line' }}>{invoice.buyer.shippingAddress}</div>
                    <div><strong>Phone:</strong> {invoice.buyer.phone || '—'}</div>
                    {invoice.buyer.email && <div><strong>Email:</strong> {invoice.buyer.email}</div>}
                    <div><strong>Place of Supply:</strong> {invoice.seller.state}</div>
                  </div>
                </div>

                {/* 3. Product & Itemized Tax Table */}
                <div style={{ marginBottom: 20, overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.76rem',
                    textAlign: 'left'
                  }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderTop: '1px solid #cbd5e1', borderBottom: '2px solid #cbd5e1' }}>
                        <th style={{ padding: '10px 8px', fontWeight: 800, color: '#334155', width: 28 }}>#</th>
                        <th style={{ padding: '10px 8px', fontWeight: 800, color: '#334155' }}>Product Description</th>
                        <th style={{ padding: '10px 8px', fontWeight: 800, color: '#334155', width: 68 }}>HSN</th>
                        <th style={{ padding: '10px 8px', fontWeight: 800, color: '#334155', textAlign: 'center', width: 38 }}>Qty</th>
                        <th style={{ padding: '10px 8px', fontWeight: 800, color: '#334155', textAlign: 'right', width: 75 }}>MRP</th>
                        <th style={{ padding: '10px 8px', fontWeight: 800, color: '#334155', textAlign: 'right', width: 85 }}>Unit Price</th>
                        <th style={{ padding: '10px 8px', fontWeight: 800, color: '#334155', textAlign: 'right', width: 85 }}>Taxable</th>
                        <th style={{ padding: '10px 8px', fontWeight: 800, color: '#334155', textAlign: 'right', width: 95 }}>GST Tax</th>
                        <th style={{ padding: '10px 8px', fontWeight: 800, color: '#334155', textAlign: 'right', width: 90 }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                        <td style={{ padding: '12px 8px', color: '#64748b' }}>1</td>
                        <td style={{ padding: '12px 8px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem', marginBottom: 2 }}>
                            {invoice.item.name}
                          </div>
                          <div style={{ color: '#64748b', fontSize: '0.7rem' }}>
                            SKU: {invoice.item.sku} | Category: {invoice.item.category}
                            {(invoice.item.variant?.color || invoice.item.variant?.size) && (
                              <span> | Variant: {[invoice.item.variant.color, invoice.item.variant.size].filter(Boolean).join(' / ')}</span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px 8px', fontFamily: 'JetBrains Mono, monospace', color: '#475569' }}>
                          {invoice.item.hsnCode}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 700 }}>
                          {invoice.item.quantity}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', color: '#64748b', textDecoration: invoice.item.totalMrp > invoice.item.totalAmount ? 'line-through' : 'none' }}>
                          {fmt(invoice.item.mrpUnitPrice)}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>
                          {fmt(invoice.item.unitPrice)}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>
                          {fmt(invoice.item.taxableValue)}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '0.72rem' }}>
                          {invoice.item.igstAmount > 0 ? (
                            <div>
                              <span>IGST ({invoice.item.igstRate}%)</span><br />
                              <strong style={{ fontFamily: 'JetBrains Mono, monospace' }}>{fmt(invoice.item.igstAmount)}</strong>
                            </div>
                          ) : (
                            <div>
                              <span>CGST ({invoice.item.cgstRate}%): {fmt(invoice.item.cgstAmount)}</span><br />
                              <span>SGST ({invoice.item.sgstRate}%): {fmt(invoice.item.sgstAmount)}</span>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 800, color: '#0f172a', fontFamily: 'JetBrains Mono, monospace' }}>
                          {fmt(invoice.item.totalAmount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 4. Calculation Summary & Amount in Words */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr',
                  gap: 24,
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: 20,
                  marginBottom: 20,
                  alignItems: 'flex-start'
                }}>
                  {/* Left: Amount In Words & Co-Buying Badge */}
                  <div>
                    <div style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      padding: '12px 14px',
                      marginBottom: 12
                    }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>
                        Total Amount in Words:
                      </div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>
                        {invoice.pricing.amountInWords}
                      </div>
                    </div>

                    {invoice.groupDeal && (
                      <div style={{
                        background: 'rgba(5, 150, 105, 0.06)',
                        border: '1px solid rgba(5, 150, 105, 0.25)',
                        borderRadius: 8,
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10
                      }}>
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: 'rgba(5, 150, 105, 0.15)',
                          color: '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Users size={14} />
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#065f46' }}>
                          <strong>Slabofy Co-Buying Savings:</strong> You saved <strong>{fmt(invoice.pricing.groupSavings)}</strong> on this order with team tier discount!
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Net Breakdown Box */}
                  <div style={{ fontSize: '0.76rem', color: '#334155', lineHeight: 1.7 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                      <span>Gross Subtotal (MRP):</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{fmt(invoice.pricing.totalMrp)}</span>
                    </div>

                    {invoice.pricing.groupSavings > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', color: '#059669', fontWeight: 600 }}>
                        <span>Co-Buying Tier Discount:</span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>- {fmt(invoice.pricing.groupSavings)}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                      <span>Net Taxable Base Value:</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{fmt(invoice.pricing.taxableValue)}</span>
                    </div>

                    {invoice.pricing.igstAmount > 0 ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                        <span>Integrated GST (IGST {invoice.item.igstRate}%):</span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{fmt(invoice.pricing.igstAmount)}</span>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                          <span>Central GST (CGST {invoice.item.cgstRate}%):</span>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{fmt(invoice.pricing.cgstAmount)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                          <span>State GST (SGST {invoice.item.sgstRate}%):</span>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{fmt(invoice.pricing.sgstAmount)}</span>
                        </div>
                      </>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                      <span>Shipping & Packaging Charges:</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', color: invoice.pricing.shippingCharges === 0 ? '#059669' : '#0f172a' }}>
                        {invoice.pricing.shippingCharges === 0 ? 'FREE' : fmt(invoice.pricing.shippingCharges)}
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0 0',
                      marginTop: 6,
                      borderTop: '2px solid #0f172a',
                      fontWeight: 800,
                      fontSize: '0.92rem',
                      color: '#0f172a'
                    }}>
                      <span>TOTAL AMOUNT PAID:</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#5b21b6' }}>
                        {fmt(invoice.pricing.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. Payment, Delivery & Verification Metadata */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '12px 16px',
                  fontSize: '0.74rem',
                  color: '#334155',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 16,
                  marginBottom: 24
                }}>
                  <div>
                    <div><strong>Payment Method:</strong> {invoice.payment.mode}</div>
                    {invoice.payment.razorpayPaymentId && (
                      <div style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        <strong>Payment Ref:</strong> {invoice.payment.razorpayPaymentId}
                      </div>
                    )}
                    <div><strong>Order Status:</strong> <span style={{ textTransform: 'capitalize', color: '#059669', fontWeight: 700 }}>{invoice.payment.status}</span></div>
                  </div>

                  <div>
                    <div><strong>Carrier:</strong> {invoice.logistics.courierName}</div>
                    {invoice.logistics.awbCode && (
                      <div style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        <strong>Air Waybill (AWB):</strong> {invoice.logistics.awbCode}
                      </div>
                    )}
                    <div><strong>Delivery Estimate:</strong> {formatDate(invoice.logistics.estimatedDelivery)}</div>
                  </div>
                </div>

                {/* 6. Terms, Return Notice & Digital Signature Seal */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: 16,
                  gap: 20
                }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', maxWidth: 440, lineHeight: 1.5 }}>
                    <strong>Declaration & Terms:</strong><br />
                    We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. Goods are covered under the standard 7-Day Slabofy Co-Buying Return & Replacement Policy. For questions or support, contact helpdesk at <strong>support@slabofy.com</strong>.
                    <br /><br />
                    <em>* This is a computer-generated tax invoice and requires no physical signature.</em>
                  </div>

                  {/* Authorized Signatory Stamp Box */}
                  <div style={{ textAlign: 'center', minWidth: 200 }}>
                    <div style={{
                      border: '1.5px dashed #5b21b6',
                      borderRadius: 10,
                      padding: '8px 16px',
                      background: 'rgba(91, 33, 182, 0.03)',
                      marginBottom: 6
                    }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        color: '#5b21b6',
                        fontWeight: 800,
                        fontSize: '0.68rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em'
                      }}>
                        <ShieldCheck size={14} /> Slabofy Certified
                      </div>
                      <div style={{ fontSize: '0.62rem', color: '#475569', marginTop: 2 }}>
                        Digital Authenticity Verified
                      </div>
                    </div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f172a' }}>
                      For {invoice.seller.businessName}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: '#64748b' }}>
                      Authorized Signatory
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
