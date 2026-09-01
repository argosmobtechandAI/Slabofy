import re

with open('src/components/Navbar.jsx', 'r') as f:
    content = f.read()

# Add mobileMenuOpen state and useLocation
content = content.replace("import { Link } from 'react-router-dom';", "import { Link, useLocation } from 'react-router-dom';")
content = content.replace("const [loginModalOpen, setLoginModalOpen] = useState(false);", "const [loginModalOpen, setLoginModalOpen] = useState(false);\n  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);\n  const location = useLocation();")

# We want to add the hamburger menu and the drawer.
# The mobile hamburger goes inside the main flex container
# We find: `<div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="hidden md:flex">`
# And add the hamburger button after it. But actually we should just replace the whole navbar contents from `<nav...>` to `</nav>` to ensure we do it cleanly.

new_nav = """      <nav style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: scrolled ? 'rgba(250,248,244,0.92)' : 'rgba(250,248,244,0.7)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        borderBottom: `1px solid ${scrolled ? 'rgba(18,16,14,0.1)' : 'rgba(18,16,14,0.06)'}`,
        boxShadow: scrolled ? '0 2px 20px rgba(18,16,14,0.06)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>

          {/* Logo — Bold Editorial */}
          <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="tilt-card" style={{ width: 38, height: 38 }}>
              <div className="tilt-card-inner" style={{
                width: '100%', height: '100%', borderRadius: 12,
                background: '#12100e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(18,16,14,0.1)'
              }}>
                <span style={{ color: '#faf8f4', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1.1rem', zIndex: 1, position: 'relative' }}>S</span>
                <div style={{
                  position: 'absolute', inset: 0, opacity: 0,
                  background: 'linear-gradient(135deg, #5b21b6, #f05035)',
                  transition: 'opacity 0.3s',
                }} className="logo-hover-grad" />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#12100e', letterSpacing: '-0.03em' }}>
                Slab<span style={{ color: '#5b21b6' }}>ofy</span>
              </span>
              <span style={{ fontSize: '0.6rem', fontWeight: 600, color: '#a09a94', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Group Buying</span>
            </div>
          </Link>

          {/* Center Nav Pills (Desktop) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(18,16,14,0.05)', borderRadius: 100, padding: '4px', border: '1px solid rgba(18,16,14,0.08)' }} className="hidden md:flex">
            {[{ to: '/', label: 'Discover' }, { to: '/orders', label: 'My Orders' }].map(({ to, label }) => {
              const active = location.pathname === to;
              return (
              <Link
                key={to}
                to={to}
                style={{
                  padding: '8px 20px', borderRadius: 100,
                  fontSize: '0.82rem', fontWeight: 600,
                  color: active ? '#12100e' : '#2d2926', textDecoration: 'none',
                  transition: 'all 0.2s',
                  background: active ? '#fff' : 'transparent',
                  boxShadow: active ? '0 2px 8px rgba(18,16,14,0.1)' : 'none',
                }}
                onMouseEnter={e => { if(!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.5)'; } }}
                onMouseLeave={e => { if(!active) { e.currentTarget.style.background = 'transparent'; } }}
              >
                {label}
              </Link>
            )})}
            {isLoggedIn && user?.role === 'admin' && (
              <Link to="/admin" style={{ padding: '8px 20px', borderRadius: 100, fontSize: '0.82rem', fontWeight: 700, color: '#5b21b6', background: 'rgba(91,33,182,0.1)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldAlert size={13} /> Admin
              </Link>
            )}
            {isLoggedIn && user?.role === 'seller' && (
              <Link to="/seller" style={{ padding: '8px 20px', borderRadius: 100, fontSize: '0.82rem', fontWeight: 700, color: '#4338ca', background: 'rgba(67,56,202,0.08)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Store size={13} /> Seller Hub
              </Link>
            )}
          </div>

          {/* Right CTA (Desktop) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="hidden md:flex">
            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Avatar chip */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '6px 16px 6px 6px',
                  background: '#fff', borderRadius: 100,
                  border: '1px solid rgba(18,16,14,0.1)',
                  boxShadow: '0 2px 8px rgba(18,16,14,0.06)',
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #5b21b6, #f05035)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 800, fontSize: '0.8rem',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}>
                    {user.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2d2926' }}>{user.name}</span>
                </div>
                <button
                  onClick={logout}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '9px 18px', borderRadius: 100,
                    background: 'rgba(240,80,53,0.08)',
                    border: '1px solid rgba(240,80,53,0.2)',
                    color: '#f05035', fontSize: '0.8rem', fontWeight: 700,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(240,80,53,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(240,80,53,0.08)'}
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            ) : (
              <div style={{ position: 'relative', display: 'inline-flex' }}>
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="btn-ink hover-shine-sweep"
                  style={{ fontSize: '0.82rem', padding: '10px 22px' }}
                >
                  Get Started <ArrowUpRight size={15} />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button 
            className="md:hidden" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'rgba(18,16,14,0.05)',
              border: '1px solid rgba(18,16,14,0.1)',
              borderRadius: 12,
              width: 40, height: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#12100e', cursor: 'pointer'
            }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden animate-fade-in" style={{
            position: 'absolute', top: 64, left: 0, right: 0,
            background: '#faf8f4', borderBottom: '1px solid rgba(18,16,14,0.1)',
            boxShadow: '0 20px 40px rgba(18,16,14,0.1)', padding: '16px 24px 24px',
            display: 'flex', flexDirection: 'column', gap: 16
          }}>
            {[{ to: '/', label: 'Discover', icon: <Zap size={18} /> }, { to: '/orders', label: 'My Orders', icon: <ShoppingBag size={18} /> }].map(({ to, label, icon }) => {
              const active = location.pathname === to;
              return (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px', borderRadius: 16,
                  background: active ? '#fff' : 'rgba(18,16,14,0.03)',
                  border: `1px solid ${active ? 'rgba(18,16,14,0.1)' : 'transparent'}`,
                  color: active ? '#12100e' : '#6b6560',
                  fontSize: '0.95rem', fontWeight: 700, textDecoration: 'none',
                  boxShadow: active ? '0 4px 12px rgba(18,16,14,0.05)' : 'none'
                }}
              >
                {icon} {label}
              </Link>
            )})}
            
            {isLoggedIn && user?.role === 'admin' && (
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 16, background: 'rgba(91,33,182,0.08)', color: '#5b21b6', fontSize: '0.95rem', fontWeight: 700, textDecoration: 'none' }}>
                <ShieldAlert size={18} /> Admin Dashboard
              </Link>
            )}
            
            {isLoggedIn && user?.role === 'seller' && (
              <Link to="/seller" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 16, background: 'rgba(67,56,202,0.08)', color: '#4338ca', fontSize: '0.95rem', fontWeight: 700, textDecoration: 'none' }}>
                <Store size={18} /> Seller Hub
              </Link>
            )}

            <div style={{ height: 1, background: 'rgba(18,16,14,0.08)', margin: '8px 0' }} />

            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #5b21b6, #f05035)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>
                    {user.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#12100e' }}>{user.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#a09a94' }}>{user.email}</div>
                  </div>
                </div>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(240,80,53,0.1)', color: '#f05035', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setLoginModalOpen(true); setMobileMenuOpen(false); }}
                className="btn-ink" style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '0.95rem', borderRadius: 16 }}
              >
                Get Started <ArrowUpRight size={16} />
              </button>
            )}
          </div>
        )}
      </nav>"""

# Find old nav and replace
nav_start = content.find("<nav ")
nav_end = content.find("</nav>") + 6

content = content[:nav_start] + new_nav + content[nav_end:]

with open('src/components/Navbar.jsx', 'w') as f:
    f.write(content)
