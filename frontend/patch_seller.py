with open("src/pages/SellerPanel.jsx", "r") as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    "import { Store, Tag, Plus, PlusCircle, ShoppingCart, RefreshCw, AlertTriangle, ArrowRight, ShieldCheck, CheckCircle2, Truck, HelpCircle, User, Lock, Trash2, X, UploadCloud, Video, Users } from 'lucide-react';",
    "import { Store, Tag, Plus, PlusCircle, ShoppingCart, RefreshCw, AlertTriangle, ArrowRight, ShieldCheck, CheckCircle2, Truck, HelpCircle, User, Lock, Trash2, X, UploadCloud, Video, Users, Menu, TrendingUp, Clock, Package } from 'lucide-react';"
)

# 2. Add sidebarOpen state
content = content.replace(
    "const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'add-product'",
    "const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'add-product'\n  const [sidebarOpen, setSidebarOpen] = useState(false);\n"
)

# 3. Add tilt handlers and loading skeleton (Wait, the loading indicator is in the main body, let's just patch the main body later)
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

  const renderTabTitle = () => {"""
content = content.replace("  const renderTabTitle = () => {", handlers)


# 4. Replace layout block
layout_start = """  // CASE 3: Active Seller Panel
  return (
    <div className="flex h-screen bg-[#f8f9fa] overflow-hidden">
      
      {/* Fixed Sidebar */}
"""
layout_end = """        {/* Scrollable Main Area */}
        <div className="flex-1 overflow-y-auto p-8 w-full max-w-[1400px] mx-auto">
          <div className="w-full space-y-6">"""

layout_replacement = """  // CASE 3: Active Seller Panel
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
              <span className="font-display font-bold text-base text-[#12100e]">Slab<span className="text-[#f05035]">ofy</span> Merchant</span>
            </div>
            
            {stats && (
              <div className="mx-3 mt-4 mb-2 p-3 rounded-2xl bg-gradient-to-br from-[rgba(91,33,182,0.06)] to-[rgba(67,56,202,0.04)] border border-[rgba(91,33,182,0.1)]">
                <div className="text-[9px] uppercase font-black text-[#9490b8] tracking-wider mb-2">Quick Stats</div>
                <div className="flex justify-between">
                  <div className="text-center">
                    <div className="text-sm font-black text-[#5b21b6]">{stats.activeGroups}</div>
                    <div className="text-[8px] text-[#b4b0d0] font-semibold">Active</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-black text-[#059669]">{stats.completedOrders}</div>
                    <div className="text-[8px] text-[#b4b0d0] font-semibold">Orders</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-black text-[#f59e0b]">{stats.pendingProducts}</div>
                    <div className="text-[8px] text-[#b4b0d0] font-semibold">Pending</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              <div className="text-[9px] font-black uppercase text-[#c4c0d8] tracking-[0.15em] px-3 py-3">Merchant Tools</div>
              {[
                { tab: 'orders', icon: ShoppingCart, label: 'Shipment Orders' },
                { tab: 'add-product', icon: PlusCircle, label: 'Add New Product' },
                { tab: 'profile', icon: User, label: 'Profile Settings' },
              ].map((item, i) => (
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

          <div className="h-16 flex items-center px-5 border-b border-[rgba(91,33,182,0.08)] relative z-10">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#5b21b6] to-[#4338ca] flex items-center justify-center shadow-lg shadow-violet-500/20">
                <span className="text-white font-bold text-base">S</span>
              </div>
              <div>
                <div className="font-display font-black text-sm text-[#12100e]">Slab<span className="text-[#f05035]">ofy</span></div>
                <div className="text-[8px] font-bold uppercase text-[#9490b8] tracking-widest">Merchant Portal</div>
              </div>
            </Link>
          </div>

          {stats && (
            <div className="mx-3 mt-4 mb-2 p-3 rounded-2xl bg-gradient-to-br from-[rgba(91,33,182,0.06)] to-[rgba(67,56,202,0.04)] border border-[rgba(91,33,182,0.1)] relative z-10">
              <div className="text-[9px] uppercase font-black text-[#9490b8] tracking-wider mb-2">Quick Stats</div>
              <div className="flex justify-between">
                <div className="text-center">
                  <div className="text-sm font-black text-[#5b21b6]">{stats.activeGroups}</div>
                  <div className="text-[8px] text-[#b4b0d0] font-semibold">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-black text-[#059669]">{stats.completedOrders}</div>
                  <div className="text-[8px] text-[#b4b0d0] font-semibold">Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-black text-[#f59e0b]">{stats.pendingProducts}</div>
                  <div className="text-[8px] text-[#b4b0d0] font-semibold">Pending</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 p-3 space-y-0.5 overflow-y-auto relative z-10">
            <div className="text-[9px] font-black uppercase text-[#c4c0d8] tracking-[0.15em] px-3 py-3">Merchant Tools</div>
            {[
              { tab: 'orders', icon: ShoppingCart, label: 'Shipment Orders' },
              { tab: 'add-product', icon: PlusCircle, label: 'Add New Product' },
              { tab: 'profile', icon: User, label: 'Profile Settings' },
            ].map((item, i) => (
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

          <div className="p-3 border-t border-[rgba(91,33,182,0.08)] relative z-10">
            <Link to="/" className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-[#9490b8] hover:text-[#5b21b6] transition-colors cursor-pointer">
              Exit to Store
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden pt-14 lg:pt-0">
          <header className="hidden lg:flex panel-header-light h-16 items-center justify-between px-6 xl:px-8 flex-shrink-0 z-10">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <h1 className="text-base font-display font-black text-[#12100e] leading-none">{renderTabTitle()}</h1>
                <p className="text-[10px] text-[#9490b8] font-medium mt-0.5">Slabofy Merchant Center</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5 bg-[rgba(91,33,182,0.04)] border border-[rgba(91,33,182,0.1)] rounded-2xl px-3 py-2">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#5b21b6] to-[#4338ca] flex items-center justify-center text-white text-xs font-black">
                  {profile?.business_name?.charAt(0).toUpperCase() || 'M'}
                </div>
                <span className="text-xs font-bold text-[#12100e]">{profile?.business_name || 'Merchant'}</span>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-24 lg:pb-8 w-full max-w-[1400px] mx-auto">
            <div className="w-full space-y-6">"""

start_idx = content.find(layout_start)
end_idx = content.find(layout_end) + len(layout_end)
if start_idx != -1 and content.find(layout_end) != -1:
    content = content[:start_idx] + layout_replacement + content[end_idx:]

# Update stats row
stats_start = """      {/* Stats Cards Row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel border-[rgba(99,102,241,0.1)] rounded-2xl p-5 shadow-lg">
            <span className="text-[10px] text-[#b4b0d0] font-bold block uppercase tracking-wider">Sales Revenue</span>
            <span className="text-xl font-extrabold text-[#6366f1] font-display mt-1.5 block">{formatCurrency(stats.totalRevenue)}</span>
          </div>
          <div className="glass-panel border-[rgba(99,102,241,0.1)] rounded-2xl p-5 shadow-lg">
            <span className="text-[10px] text-[#b4b0d0] font-bold block uppercase tracking-wider">Active Deals</span>
            <span className="text-xl font-extrabold text-brand-gold font-display mt-1.5 block">{stats.activeGroups} open</span>
          </div>
          <div className="glass-panel border-[rgba(99,102,241,0.1)] rounded-2xl p-5 shadow-lg">
            <span className="text-[10px] text-[#b4b0d0] font-bold block uppercase tracking-wider">Orders Confirmed</span>
            <span className="text-xl font-extrabold text-[#1e1b4b] font-display mt-1.5 block">{stats.completedOrders} orders</span>
          </div>
          <div className="glass-panel border-[rgba(99,102,241,0.1)] rounded-2xl p-5 shadow-lg">
            <span className="text-[10px] text-[#b4b0d0] font-bold block uppercase tracking-wider">Pending Approvals</span>
            <span className="text-xl font-extrabold text-[#9490b8] font-display mt-1.5 block">{stats.pendingProducts} items</span>
          </div>
        </div>
      )}"""
stats_replacement = """      {/* Stats Cards Row */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Sales Revenue', value: formatCurrency(stats.totalRevenue), icon: '₹', gradient: 'from-[#5b21b6] to-[#4338ca]', shadow: 'rgba(91,33,182,0.25)' },
            { label: 'Active Deals',  value: `${stats.activeGroups} open`,      icon: '⚡', gradient: 'from-[#f59e0b] to-[#f05035]', shadow: 'rgba(245,158,11,0.25)' },
            { label: 'Orders Confirmed', value: `${stats.completedOrders}`,    icon: '✓',  gradient: 'from-[#059669] to-[#0d9488]', shadow: 'rgba(5,150,105,0.25)' },
            { label: 'Pending Approvals', value: `${stats.pendingProducts}`,   icon: '⏳', gradient: 'from-[#a855f7] to-[#5b21b6]', shadow: 'rgba(168,85,247,0.2)' },
          ].map((s, i) => (
            <div
              key={i}
              className={`stat-card-v2 animate-spring-up stagger-${i+1} card-3d`}
              onMouseMove={handleCardTilt}
              onMouseLeave={handleCardReset}
            >
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-[#9490b8] mb-2">{s.label}</div>
                  <div className="text-xl font-black font-display text-[#12100e] animate-stat-reveal">{s.value}</div>
                </div>
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white font-black text-sm`}
                     style={{ boxShadow: `0 8px 20px ${s.shadow}` }}>
                  {s.icon}
                </div>
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${s.gradient} opacity-40`} />
              <div className="card-3d-shine" />
            </div>
          ))}
        </div>
      )}"""
content = content.replace(stats_start, stats_replacement)

# Update Order Empty state
empty_orders_start = """            <div className="glass-panel border border-dashed border-[rgba(99,102,241,0.15)] rounded-2xl py-16 text-center text-[#b4b0d0]">
              No orders received on your listings yet. Keep listing deals!
            </div>"""
empty_orders_replacement = """            <div className="flex flex-col items-center justify-center py-20 gap-4 animate-spring-up bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-[rgba(91,33,182,0.08)] flex items-center justify-center">
                <Package size={28} className="text-[#9490b8]" />
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-[#12100e] mb-1">No orders yet</div>
                <div className="text-xs text-[#9490b8]">Orders will appear here once buyers purchase your products.</div>
              </div>
            </div>"""
content = content.replace(empty_orders_start, empty_orders_replacement)

# Replace the closing div structure with a Fragment + Mobile Bottom Nav
bottom_nav = """        <div className="mobile-bottom-nav lg:hidden">
          {[
            { tab: 'orders', icon: ShoppingCart, label: 'Orders' },
            { tab: 'add-product', icon: PlusCircle, label: 'Add' },
            { tab: 'profile', icon: User, label: 'Profile' },
          ].map((item) => (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className={`mobile-nav-btn ${activeTab === item.tab ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
              <div className="mobile-nav-dot" />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}"""
content = content.replace(
    "          </div>\n        </div>\n      </div>\n    </div>\n  );\n}",
    "          </div>\n        </div>\n" + bottom_nav
)

with open("src/pages/SellerPanel.jsx", "w") as f:
    f.write(content)
