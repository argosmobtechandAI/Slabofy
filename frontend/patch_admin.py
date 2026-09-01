import re

with open("src/pages/AdminPanel.jsx", "r") as f:
    content = f.read()

# Add imports
content = content.replace(
    "import { \n  ShieldAlert, BarChart3, FolderHeart, Users, ListFilter, Percent, \n  Trash2, Check, X, RefreshCw, Plus, Calendar, AlertTriangle, ShieldCheck, Tag, Info, Package, Lock\n} from 'lucide-react';",
    "import { \n  ShieldAlert, BarChart3, FolderHeart, Users, ListFilter, Percent, \n  Trash2, Check, X, RefreshCw, Plus, Calendar, AlertTriangle, ShieldCheck, Tag, Info, Package, Lock, Menu, TrendingUp, Clock, CheckCircle2\n} from 'lucide-react';"
)

# Add sidebarOpen state
content = content.replace(
    "const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'categories', 'sellers', 'products', 'coupons', 'customers'",
    "const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'categories', 'sellers', 'products', 'coupons', 'customers'\n  const [sidebarOpen, setSidebarOpen] = useState(false);\n"
)

# Add tilt handlers
handlers = """  const handleCardTilt = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -12;
    card.style.transform = `perspective(800px) rotateX(${y}deg) rotateY(${x}deg) translateZ(8px)`;
  };
  const handleCardReset = (e) => {
    e.currentTarget.style.transform = '';
  };

  if (!isLoggedIn || role !== 'admin') {"""
content = content.replace("  if (!isLoggedIn || role !== 'admin') {", handlers)

# Define NAV_ITEMS and Layout replacement
layout_start = """  return (
    <div className="flex h-screen bg-[#f8f9fa] overflow-hidden">
      
      {/* Fixed Sidebar */}
"""
layout_end = """        {/* Scrollable Main Area */}
        <div className="flex-1 overflow-y-auto p-8 w-full max-w-[1400px] mx-auto">
          <div className="w-full space-y-6">"""

layout_replacement = """  const NAV_ITEMS = [
    { tab: 'overview', icon: BarChart3, label: 'Dashboard Metrics' },
    { tab: 'categories', icon: FolderHeart, label: 'Category Matrix' },
    { tab: 'sellers', icon: Users, label: 'Seller Validation' },
    { tab: 'products', icon: ListFilter, label: 'Product Moderation' },
    { tab: 'coupons', icon: Percent, label: 'Escrow Coupons' },
    { tab: 'customers', icon: Users, label: 'Customer Database' },
    { tab: 'orders', icon: Package, label: 'Platform Orders' },
    { tab: 'security', icon: Lock, label: 'Security' },
  ];

  return (
    <>
      {/* Mobile Hamburger + Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 panel-header-light h-14 flex items-center px-4 gap-3">
        <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-[rgba(91,33,182,0.06)] transition-colors">
          <Menu size={20} className="text-[#5b21b6]" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#5b21b6] to-[#4338ca] flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-display font-bold text-base text-[#12100e]">Slab<span className="text-[#f05035]">ofy</span></span>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <>
          <div className="drawer-overlay lg:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="drawer-panel sidebar-light lg:hidden flex flex-col">
            <div className="h-14 flex items-center px-5 border-b border-[rgba(91,33,182,0.08)]">
              <span className="font-display font-bold text-base text-[#12100e]">Slab<span className="text-[#f05035]">ofy</span> Admin</span>
            </div>
            <div className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              <div className="text-[9px] font-black uppercase text-[#c4c0d8] tracking-[0.15em] px-3 py-3">System</div>
              {NAV_ITEMS.map((item, i) => (
                <button
                  key={item.tab}
                  onClick={() => { setActiveTab(item.tab); setSidebarOpen(false); }}
                  className={`nav-item-light stagger-${i+1} ${activeTab === item.tab ? 'active' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                    activeTab === item.tab
                      ? 'bg-[#5b21b6] text-white shadow-md shadow-violet-500/25'
                      : 'bg-[rgba(91,33,182,0.06)] text-[#9490b8]'
                  }`}>
                    <item.icon size={15} />
                  </div>
                  <span className="flex-1">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Desktop Layout */}
      <div className="flex h-screen overflow-hidden" style={{
        background: `
          radial-gradient(ellipse 60% 50% at 10% 10%, rgba(91,33,182,0.06) 0%, transparent 60%),
          radial-gradient(ellipse 50% 60% at 90% 90%, rgba(240,80,53,0.05) 0%, transparent 55%),
          radial-gradient(ellipse 70% 40% at 50% 50%, rgba(245,158,11,0.04) 0%, transparent 70%),
          #faf8f4
        `
      }}>
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex w-60 xl:w-64 flex-shrink-0 sidebar-light flex-col relative overflow-hidden">
          <div className="orb-ambient w-48 h-48 bg-violet-200/30 -top-12 -left-12" style={{ animationDelay: '-3s' }} />

          {/* Logo */}
          <div className="h-16 flex items-center px-5 border-b border-[rgba(91,33,182,0.08)] relative z-10">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#5b21b6] to-[#4338ca] flex items-center justify-center shadow-lg shadow-violet-500/20">
                <span className="text-white font-bold text-base">S</span>
              </div>
              <div>
                <div className="font-display font-black text-sm text-[#12100e]">Slab<span className="text-[#f05035]">ofy</span></div>
                <div className="text-[8px] font-bold uppercase text-[#9490b8] tracking-widest">Admin Portal</div>
              </div>
            </Link>
          </div>

          {/* Nav items */}
          <div className="flex-1 p-3 space-y-0.5 overflow-y-auto relative z-10">
            <div className="text-[9px] font-black uppercase text-[#c4c0d8] tracking-[0.15em] px-3 py-3">System</div>
            {NAV_ITEMS.map((item, i) => (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab)}
                className={`nav-item-light animate-nav-slide stagger-${i+1} ${activeTab === item.tab ? 'active' : ''}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                  activeTab === item.tab
                    ? 'bg-[#5b21b6] text-white shadow-md shadow-violet-500/25'
                    : 'bg-[rgba(91,33,182,0.06)] text-[#9490b8]'
                }`}>
                  <item.icon size={15} />
                </div>
                <span className="flex-1">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Bottom user strip */}
          <div className="p-3 border-t border-[rgba(91,33,182,0.08)] relative z-10">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[rgba(91,33,182,0.04)] border border-[rgba(91,33,182,0.08)]">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#5b21b6] to-[#4338ca] flex items-center justify-center text-white text-xs font-black">A</div>
              <div>
                <div className="text-xs font-bold text-[#12100e]">System Admin</div>
                <div className="text-[9px] text-[#9490b8]">Full Access</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden pt-14 lg:pt-0">
          {/* Desktop Header */}
          <header className="hidden lg:flex panel-header-light h-16 items-center justify-between px-6 xl:px-8 flex-shrink-0 z-10">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <h1 className="text-base font-display font-black text-[#12100e] leading-none">{renderTabTitle()}</h1>
                <p className="text-[10px] text-[#9490b8] font-medium mt-0.5">Slabofy Administration</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={fetchAdminData} className="p-2.5 rounded-xl bg-[rgba(91,33,182,0.06)] hover:bg-[rgba(91,33,182,0.12)] transition-colors text-[#5b21b6]">
                <RefreshCw size={15} />
              </button>
              <div className="flex items-center gap-2.5 bg-[rgba(91,33,182,0.04)] border border-[rgba(91,33,182,0.1)] rounded-2xl px-3 py-2">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#5b21b6] to-[#4338ca] flex items-center justify-center text-white text-xs font-black">A</div>
                <span className="text-xs font-bold text-[#12100e]">Admin</span>
              </div>
            </div>
          </header>

          {/* Scrollable Main Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-24 lg:pb-8 w-full max-w-[1400px] mx-auto">
            <div className="w-full space-y-6">"""

# Replace the layout block using regex or string splitting
start_idx = content.find(layout_start)
end_idx = content.find(layout_end) + len(layout_end)

if start_idx != -1 and content.find(layout_end) != -1:
    content = content[:start_idx] + layout_replacement + content[end_idx:]
else:
    print("Could not find layout boundaries")

# Also replace the bottom wrapper tags to match the new Fragment
content = content.replace(
    "          </div>\n        </div>\n      </div>\n    </div>\n  );\n}",
    "          </div>\n        </div>\n      </div>\n    </>\n  );\n}"
)

# Now, replace the loading state
loading_start = """        {/* Loading Indicator */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <RefreshCw className="animate-spin text-[#6366f1]" size={32} />
            <p className="text-sm text-[#9490b8]">Fetching administrative state...</p>
          </div>
        ) : ("""
loading_replacement = """        {/* Loading Indicator */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 animate-fade-in">
            {[1,2,3,4].map(i => (
              <div key={i} className="skeleton h-32 rounded-2xl" />
            ))}
          </div>
        ) : ("""
content = content.replace(loading_start, loading_replacement)

# Replace the overview stat cards
stats_start = """            {/* OVERVIEW PANEL */}
            {activeTab === 'overview' && stats && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold font-display text-[#1e1b4b]">Platform KPIs</h2>
                  <button onClick={fetchAdminData} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-[#9490b8] hover:text-[#1e1b4b] cursor-pointer"><RefreshCw size={16} /></button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="glass-panel border-[rgba(99,102,241,0.1)] rounded-2xl p-6 shadow-xl">
                    <span className="text-[10px] text-[#b4b0d0] font-bold block uppercase tracking-wider">Gross Merchandise Volume (GMV)</span>
                    <span className="text-2xl font-extrabold text-[#6366f1] font-display mt-2 block">{formatCurrency(stats.totalRevenue)}</span>
                  </div>
                  <div className="glass-panel border-[rgba(99,102,241,0.1)] rounded-2xl p-6 shadow-xl">
                    <span className="text-[10px] text-[#b4b0d0] font-bold block uppercase tracking-wider">Completed Deals</span>
                    <span className="text-2xl font-extrabold text-emerald-400 font-display mt-2 block">{stats.completedDeals} deals</span>
                  </div>
                  <div className="glass-panel border-[rgba(99,102,241,0.1)] rounded-2xl p-6 shadow-xl">
                    <span className="text-[10px] text-[#b4b0d0] font-bold block uppercase tracking-wider">Active Deals Room</span>
                    <span className="text-2xl font-extrabold text-brand-gold font-display mt-2 block">{stats.activeGroups} active</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#faf8f4] border border-gray-200 rounded-2xl p-6">
                  <div className="text-center space-y-1">
                    <span className="text-[10px] text-[#6b6560] font-semibold block uppercase">New Registrations (7 Days)</span>
                    <strong className="text-lg text-[#12100e] font-display font-extrabold block">{stats.newUsers7Days} users</strong>
                  </div>
                  <div className="text-center space-y-1 border-t md:border-t-0 md:border-x border-gray-200 py-4 md:py-0">
                    <span className="text-[10px] text-[#6b6560] font-semibold block uppercase">Pending Seller Queue</span>
                    <strong className="text-lg text-[#5b21b6] font-display font-extrabold block">{stats.pendingSellers} profiles</strong>
                  </div>
                  <div className="text-center space-y-1">
                    <span className="text-[10px] text-[#6b6560] font-semibold block uppercase">Pending Products Queue</span>
                    <strong className="text-lg text-[#f59e0b] font-display font-extrabold block">{stats.pendingProducts} products</strong>
                  </div>
                </div>
              </div>
            )}"""

stats_replacement = """            {/* OVERVIEW PANEL */}
            {activeTab === 'overview' && stats && (
              <div key={activeTab} className="space-y-6 animate-tab-morph">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold font-display text-[#1e1b4b]">Platform KPIs</h2>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {[
                    { label: 'GMV', value: formatCurrency(stats.totalRevenue), icon: TrendingUp, color: '#5b21b6', bg: 'rgba(91,33,182,0.1)', orbColor: 'rgba(91,33,182,0.15)' },
                    { label: 'Completed Deals', value: `${stats.completedDeals}`, icon: CheckCircle2, color: '#059669', bg: 'rgba(5,150,105,0.1)', orbColor: 'rgba(5,150,105,0.12)' },
                    { label: 'Active Groups', value: `${stats.activeGroups}`, icon: Users, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', orbColor: 'rgba(245,158,11,0.12)' },
                    { label: 'Pending Review', value: `${stats.pendingProducts}`, icon: Clock, color: '#f05035', bg: 'rgba(240,80,53,0.1)', orbColor: 'rgba(240,80,53,0.12)' },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={`stat-card-v2 animate-spring-up stagger-${i+1} card-3d`}
                      onMouseMove={handleCardTilt}
                      onMouseLeave={handleCardReset}
                    >
                      {/* Ambient corner orb */}
                      <div style={{
                        position: 'absolute', top: -30, right: -30,
                        width: 120, height: 120, borderRadius: '50%',
                        background: item.orbColor, filter: 'blur(30px)', pointerEvents: 'none'
                      }} />
                      {/* Shine overlay */}
                      <div className="card-3d-shine" />
                      {/* Content */}
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div style={{ background: item.bg, color: item.color, padding: '8px', borderRadius: '12px', display: 'inline-flex' }}>
                            <item.icon size={18} />
                          </div>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color, boxShadow: `0 0 8px ${item.color}` }} />
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#9490b8] mb-1">{item.label}</div>
                        <div className="text-2xl font-black font-display text-[#12100e] animate-stat-reveal">{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#faf8f4] border border-gray-200 rounded-2xl p-6">
                  <div className="text-center space-y-1">
                    <span className="text-[10px] text-[#6b6560] font-semibold block uppercase">New Registrations (7 Days)</span>
                    <strong className="text-lg text-[#12100e] font-display font-extrabold block">{stats.newUsers7Days} users</strong>
                  </div>
                  <div className="text-center space-y-1 border-t md:border-t-0 md:border-x border-gray-200 py-4 md:py-0">
                    <span className="text-[10px] text-[#6b6560] font-semibold block uppercase">Pending Seller Queue</span>
                    <strong className="text-lg text-[#5b21b6] font-display font-extrabold block">{stats.pendingSellers} profiles</strong>
                  </div>
                  <div className="text-center space-y-1">
                    <span className="text-[10px] text-[#6b6560] font-semibold block uppercase">Pending Products Queue</span>
                    <strong className="text-lg text-[#f59e0b] font-display font-extrabold block">{stats.pendingProducts} products</strong>
                  </div>
                </div>
              </div>
            )}"""
content = content.replace(stats_start, stats_replacement)

# Add key={activeTab} and animate-tab-morph to all other tab wrappers
content = content.replace(
    '<div className="space-y-6 animate-fade-in">',
    '<div key={activeTab} className="space-y-6 animate-tab-morph">'
)

with open("src/pages/AdminPanel.jsx", "w") as f:
    f.write(content)
