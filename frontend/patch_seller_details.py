with open("src/pages/SellerPanel.jsx", "r") as f:
    content = f.read()

# 1. Orders Mobile Cards
orders_table_start = """            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">"""
orders_replacement = """            <>
              {/* Mobile: cards */}
              <div className="md:hidden space-y-3">
                {orders.map(order => (
                  <div key={order.id} className="bg-white rounded-2xl border border-[rgba(91,33,182,0.08)] p-4 shadow-sm animate-spring-up">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-xs font-black text-[#12100e]">#{order.id}</div>
                        <div className="text-[10px] text-[#9490b8]">{new Date(order.created_at).toLocaleDateString()}</div>
                      </div>
                      <span className={`badge-pill ${order.status === 'shipped' ? 'badge-emerald' : 'badge-amber'}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-[#12100e] mb-1">{order.product_name}</div>
                    <div className="text-xs text-[#6b6560]">Buyer: {order.buyer_name}</div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <div className="text-sm font-black text-[#5b21b6]">{formatCurrency(order.total_amount)}</div>
                      {order.status === 'confirmed' && (
                        <button onClick={() => setShippingOrderId(order.id)} className="text-xs font-bold bg-[#5b21b6] text-white px-3 py-1.5 rounded-xl">
                          Ship Now
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">"""
content = content.replace(orders_table_start, orders_replacement)

# End the React fragment after the table
orders_table_end = """              </table>
            </div>"""
orders_table_end_rep = """              </table>
            </div>
            </>"""
content = content.replace(orders_table_end, orders_table_end_rep)

# 2. Add Product section enhancements
form_header_1 = """            {/* 1. Basic Info */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-[#1e1b4b] mb-4 flex items-center gap-2">
                <Tag size={16} className="text-[#6366f1]" /> Basic Information
              </h3>"""
form_header_1_rep = """            {/* 1. Basic Info */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#5b21b6] to-[#4338ca] flex items-center justify-center text-white text-xs font-black">1</div>
              <div>
                <div className="text-xs font-black text-[#12100e] uppercase tracking-wide">Product Details</div>
                <div className="text-[10px] text-[#9490b8]">Basic info and media</div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-hidden mb-8 animate-spring-up stagger-1">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#5b21b6] to-[#4338ca]" />"""
content = content.replace(form_header_1, form_header_1_rep)

form_header_2 = """            {/* 2. Media */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-[#1e1b4b] mb-4 flex items-center gap-2">
                <UploadCloud size={16} className="text-[#6366f1]" /> Product Media
              </h3>"""
form_header_2_rep = """            {/* 2. Media */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#5b21b6] to-[#4338ca] flex items-center justify-center text-white text-xs font-black">2</div>
              <div>
                <div className="text-xs font-black text-[#12100e] uppercase tracking-wide">Product Media</div>
                <div className="text-[10px] text-[#9490b8]">Images and video demonstrations</div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-hidden mb-8 animate-spring-up stagger-2">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#5b21b6] to-[#4338ca]" />"""
content = content.replace(form_header_2, form_header_2_rep)

form_header_3 = """            {/* 3. Group Buying Configuration */}
            <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Users size={80} />
              </div>
              <h3 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2 relative z-10">
                <Users size={16} className="text-indigo-600" /> Group Buying Configuration
              </h3>"""
form_header_3_rep = """            {/* 3. Group Buying Configuration */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#5b21b6] to-[#4338ca] flex items-center justify-center text-white text-xs font-black">3</div>
              <div>
                <div className="text-xs font-black text-[#12100e] uppercase tracking-wide">Group Config</div>
                <div className="text-[10px] text-[#9490b8]">Set maximum group size and window</div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-hidden mb-8 animate-spring-up stagger-3">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#5b21b6] to-[#4338ca]" />"""
content = content.replace(form_header_3, form_header_3_rep)

form_header_4 = """            {/* 4. Pricing Tiers Builder */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-[#1e1b4b] flex items-center gap-2">
                  <Tag size={16} className="text-[#6366f1]" /> Dynamic Pricing Tiers
                </h3>"""
form_header_4_rep = """            {/* 4. Pricing Tiers Builder */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#5b21b6] to-[#4338ca] flex items-center justify-center text-white text-xs font-black">4</div>
              <div>
                <div className="text-xs font-black text-[#12100e] uppercase tracking-wide">Dynamic Pricing Tiers</div>
                <div className="text-[10px] text-[#9490b8]">Build price drops based on group size</div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-hidden mb-8 animate-spring-up stagger-4">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#5b21b6] to-[#4338ca]" />
              <div className="flex justify-between items-center mb-4">"""
content = content.replace(form_header_4, form_header_4_rep)

form_header_5 = """            {/* 5. Inventory Matrix */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#1e1b4b] flex items-center gap-2 mb-1">
                    <Store size={16} className="text-[#6366f1]" /> Inventory Matrix
                  </h3>"""
form_header_5_rep = """            {/* 5. Inventory Matrix */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#5b21b6] to-[#4338ca] flex items-center justify-center text-white text-xs font-black">5</div>
              <div>
                <div className="text-xs font-black text-[#12100e] uppercase tracking-wide">Inventory Matrix</div>
                <div className="text-[10px] text-[#9490b8]">Manage stock across variants</div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-hidden mb-8 animate-spring-up stagger-5">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#5b21b6] to-[#4338ca]" />
              <div className="flex justify-between items-end mb-4">"""
content = content.replace(form_header_5, form_header_5_rep)

# 3. Animate tier builder rows
tier_builder_start = """                {tiers.map((tier, idx) => (
                  <div key={idx} className="flex items-center gap-3">"""
tier_builder_rep = """                {tiers.map((tier, idx) => (
                  <div key={idx} className="flex items-center gap-3 animate-spring-up" style={{ animationDelay: `${idx * 0.05}s` }}>"""
content = content.replace(tier_builder_start, tier_builder_rep)

# Also apply table-row-v2 to tr elements in SellerPanel
content = content.replace(
    '<tr key={ord.id} className="hover:bg-gray-50 transition-colors">',
    '<tr key={ord.id} className="table-row-v2 hover:bg-gray-50 transition-colors">'
)

with open("src/pages/SellerPanel.jsx", "w") as f:
    f.write(content)
