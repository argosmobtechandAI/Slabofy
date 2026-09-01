import re

with open('src/pages/Checkout.jsx', 'r') as f:
    content = f.read()

# Replace the outer background to mesh-violet
content = content.replace("<div style={{ background: '#faf8f4', minHeight: '100vh', padding: '100px 24px 60px' }}>", 
    "<div className=\"mesh-violet\" style={{ minHeight: '100vh', padding: '100px 24px 60px' }}>")

# Replace header box dark bg with light gradient
content = content.replace("<div style={{ background: '#12100e', borderRadius: '24px 24px 0 0', padding: '32px', color: '#faf8f4', display: 'flex', alignItems: 'center', gap: 16 }}>",
    "<div style={{ background: 'linear-gradient(135deg, #f7f5fd, #fff)', borderBottom: '1px solid rgba(18,16,14,0.06)', borderRadius: '24px 24px 0 0', padding: '32px', color: '#12100e', display: 'flex', alignItems: 'center', gap: 16 }}>")
content = content.replace("<ShieldCheck size={28} color=\"#5b21b6\" />", "<ShieldCheck size={28} color=\"#5b21b6\" />")

# The lock icon section text
content = content.replace("<p style={{ color: '#a09a94', fontSize: '0.9rem', marginTop: 4 }}>", "<p style={{ color: '#6b6560', fontSize: '0.9rem', marginTop: 4 }}>")

# Sticky order summary
content = content.replace("boxShadow: '0 8px 30px rgba(18,16,14,0.06)'", "boxShadow: '0 20px 60px rgba(91,33,182,0.06)'")

# Address block
content = content.replace("border: '1px solid rgba(18,16,14,0.1)'", "border: '1.5px solid rgba(18,16,14,0.08)'")

with open('src/pages/Checkout.jsx', 'w') as f:
    f.write(content)
