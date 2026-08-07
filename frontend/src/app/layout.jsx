import React from 'react';
import Navbar from '../components/Navbar';
import { AuthProvider } from '../context/AuthContext';
import { Toaster } from 'react-hot-toast';
import '../index.css';

export const metadata = {
  title: 'SocialGroup Buying | Premium Co-Buying E-Commerce Platform',
  description: 'Join co-buying teams to access tier-based wholesale discounts, pre-authorization security, and real-time social shopping.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="flex flex-col min-h-screen bg-bg-deep text-slate-100 selection:bg-brand-cyan selection:text-bg-deep">
            {/* Header Layout */}
            <Navbar />

            {/* Main App Page Viewport */}
            <main className="flex-grow pb-16">
              {children}
            </main>

            {/* Platform Toast Notifications */}
            <Toaster 
              position="top-right" 
              toastOptions={{
                style: {
                  background: '#131722',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  fontSize: '13px',
                  fontFamily: 'Inter, sans-serif',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)'
                },
                success: {
                  iconTheme: {
                    primary: '#00f2fe',
                    secondary: '#0b0c10'
                  }
                }
              }}
            />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
