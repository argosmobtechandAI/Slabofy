import re

with open('src/pages/Home.jsx', 'r') as f:
    content = f.read()

# 1. Update Ticker Strip
content = content.replace(
    "<div style={{ background: '#12100e', color: '#faf8f4', padding: '10px 0', overflow: 'hidden' }}>",
    "<div style={{ background: 'rgba(91,33,182,0.06)', color: '#5b21b6', padding: '10px 0', overflow: 'hidden', borderBottom: '1px solid rgba(91,33,182,0.1)' }}>"
)
content = content.replace(
    "color: j % 3 === 1 ? '#f05035' : j % 3 === 2 ? '#f59e0b' : '#faf8f4'",
    "color: j % 3 === 1 ? '#f05035' : j % 3 === 2 ? '#f59e0b' : '#5b21b6'"
)

# 2. Update Hero Section (remove dark header from float card)
content = content.replace(
    "<div style={{ background: '#12100e', padding: '20px 22px' }}>",
    "<div style={{ background: 'linear-gradient(135deg, #f7f5fd, #fff)', padding: '20px 22px', borderBottom: '1px solid rgba(18,16,14,0.06)' }}>"
)
content = content.replace(
    "color: '#faf8f4' }}>Premium Headphones</div>",
    "color: '#12100e' }}>Premium Headphones</div>"
)

# 3. Update 'How It Works' Section
content = content.replace(
    "<section style={{ background: '#12100e', padding: '80px 24px' }}>",
    "<section className=\"mesh-violet\" style={{ padding: '80px 24px', borderTop: '1px solid rgba(18,16,14,0.06)' }}>"
)
content = content.replace(
    "color: '#faf8f4', letterSpacing: '-0.03em' }}>",
    "color: '#12100e', letterSpacing: '-0.03em' }}>"
)
# Update step cards
content = content.replace(
    "<div key={n} style={{ background: 'rgba(250,248,244,0.05)', border: '1px solid rgba(250,248,244,0.08)', borderRadius: 24, padding: '28px 24px', transition: 'all 0.3s' }}",
    "<div key={n} className=\"scroll-reveal-group\" style={{ background: '#fff', border: '1px solid rgba(18,16,14,0.08)', borderRadius: 24, padding: '28px 24px', transition: 'all 0.3s', boxShadow: '0 4px 20px rgba(18,16,14,0.03)' }}"
)
content = content.replace(
    "e.currentTarget.style.borderColor = 'rgba(250,248,244,0.08)'; e.currentTarget.style.background = 'rgba(250,248,244,0.05)';",
    "e.currentTarget.style.borderColor = 'rgba(18,16,14,0.08)'; e.currentTarget.style.background = '#fff';"
)
content = content.replace(
    "color: '#faf8f4', marginBottom: 10, letterSpacing: '-0.02em' }}>{title}</h3>",
    "color: '#12100e', marginBottom: 10, letterSpacing: '-0.02em' }}>{title}</h3>"
)

# 4. Enhance Active Teams Sidebar
content = content.replace(
    "<div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f05035', animation: 'pulse 2s infinite' }} />",
    "<div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f05035', animation: 'pulse-ring 2s infinite' }} />"
)

with open('src/pages/Home.jsx', 'w') as f:
    f.write(content)
