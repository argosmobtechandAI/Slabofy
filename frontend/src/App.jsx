import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#faf8f4', color: '#12100e' }}>

          <Navbar />

          <main style={{ flexGrow: 1 }}>
            <Routes>
              <Route path="/"            element={<Home />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/checkout"    element={<Checkout />} />
              <Route path="/group/:id"   element={<GroupRoom />} />
              <Route path="/join/:id"    element={<GroupInvite />} />
              <Route path="/orders"      element={<MyOrders />} />
              <Route path="/seller"      element={<SellerPanel />} />
              <Route path="/admin"       element={<AdminPanel />} />
            </Routes>
          </main>

          <Footer />

          <Toaster
            position="top-right"
            toastOptions={{
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
