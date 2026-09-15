import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';

class ErrorBoundaryClass extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    // Automatically reset error boundary if the route/resetKey changes
    if (this.props.resetKey !== prevProps.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          background: '#faf8f4',
          color: '#12100e'
        }}>
          <div style={{
            maxWidth: 480,
            width: '100%',
            background: '#ffffff',
            borderRadius: 24,
            padding: '36px 28px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(18,16,14,0.06)',
            border: '1px solid rgba(18,16,14,0.08)'
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(240,80,53,0.1)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20
            }}>
              <AlertTriangle size={28} color="#f05035" />
            </div>

            <h2 style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 800,
              fontSize: '1.4rem',
              color: '#12100e',
              marginBottom: 10,
              letterSpacing: '-0.02em'
            }}>
              Something Went Wrong
            </h2>

            <p style={{
              fontSize: '0.875rem',
              color: '#6b6560',
              lineHeight: 1.6,
              marginBottom: 28
            }}>
              We encountered an unexpected issue rendering this page. You can return to the homepage or try again.
            </p>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              justifyContent: 'center'
            }}>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  background: 'rgba(91,33,182,0.08)',
                  color: '#5b21b6',
                  border: '1px solid rgba(91,33,182,0.2)',
                  borderRadius: 14,
                  padding: '12px 20px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.2s'
                }}
              >
                <RefreshCw size={15} /> Try Again
              </button>

              <Link
                to="/"
                onClick={this.handleReset}
                style={{
                  background: '#5b21b6',
                  color: '#ffffff',
                  textDecoration: 'none',
                  borderRadius: 14,
                  padding: '12px 20px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(91,33,182,0.3)',
                  transition: 'all 0.2s'
                }}
              >
                <Home size={15} /> Return to Homepage
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component to provide routing context and automatic reset on location change
export default function ErrorBoundary({ children }) {
  let locationKey = '';
  try {
    const location = useLocation();
    locationKey = location.pathname;
  } catch {
    locationKey = '';
  }

  return (
    <ErrorBoundaryClass resetKey={locationKey}>
      {children}
    </ErrorBoundaryClass>
  );
}
