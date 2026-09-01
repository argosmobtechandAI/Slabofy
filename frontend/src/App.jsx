import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Layout components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Page components
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import GroupRoom from './pages/GroupRoom';
import GroupInvite from './pages/GroupInvite';
import MyOrders from './pages/MyOrders';
import SellerPanel from './pages/SellerPanel';
import AdminPanel from './pages/AdminPanel';
import SellerLogin from './pages/SellerLogin';
import AdminLogin from './pages/AdminLogin';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import RefundPolicy from './pages/RefundPolicy';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#faf8f4', color: '#12100e' }}>
          
          <Routes>
            {/* Main Website Layout */}
            <Route element={
              <>
                <Navbar />
                <main style={{ flexGrow: 1 }}>
                  <Outlet />
                </main>
                <Footer />
              </>
            }>
              <Route path="/"            element={<Home />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/checkout"    element={<Checkout />} />
              <Route path="/group/:id"   element={<GroupRoom />} />
              <Route path="/join/:id"    element={<GroupInvite />} />
              <Route path="/orders"      element={<MyOrders />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
            </Route>

            {/* Separate Admin & Seller URLs without Main Navbar/Footer */}
            <Route path="/seller/login" element={<SellerLogin />} />
            <Route path="/seller"       element={<SellerPanel />} />
            <Route path="/admin/login"  element={<AdminLogin />} />
            <Route path="/admin"        element={<AdminPanel />} />
          </Routes>

          <Toaster
            position="top-right"
            toastOptions={{
              className: 'app-toast',
              style: {
                background: '#fff',
                color: '#12100e',
                border: '1px solid rgba(18,16,14,0.1)',
                fontSize: '13px',
                fontFamily: 'Inter, sans-serif',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(18,16,14,0.12)',
                fontWeight: 500,
              },
              success: { iconTheme: { primary: '#059669', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#f05035', secondary: '#fff' } },
            }}
          />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
