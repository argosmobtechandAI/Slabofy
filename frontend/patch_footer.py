import re

with open('src/components/Footer.jsx', 'r') as f:
    content = f.read()

# Replace the outer footer tag and the dark backgrounds
# <footer style={{ background: '#12100e', color: '#faf8f4', marginTop: 80 }}>
# becomes:
# <footer style={{ background: 'linear-gradient(to bottom, #faf8f4, #f0ece6)', color: '#12100e', marginTop: 80, borderTop: '1px solid rgba(18,16,14,0.06)', position: 'relative', overflow: 'hidden' }}>

content = content.replace("<footer style={{ background: '#12100e', color: '#faf8f4', marginTop: 80 }}>", 
    "<footer style={{ background: 'linear-gradient(to bottom, #faf8f4, #f0ece6)', color: '#12100e', marginTop: 80, borderTop: '1px solid rgba(18,16,14,0.06)', position: 'relative', overflow: 'hidden' }}>\n      <div className=\"blob\" style={{ position: 'absolute', bottom: '-20%', right: '-5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(91,33,182,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />\n      <div className=\"blob blob-delay-2\" style={{ position: 'absolute', top: '10%', left: '-10%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(240,80,53,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />")

# Update text colors
content = content.replace("color: '#faf8f4'", "color: '#12100e'")
content = content.replace("color: '#fff'", "color: '#fff'") # keep logo letter white

# Replace social icons hover logic and border
content = content.replace("background: 'rgba(250,248,244,0.07)'", "background: '#fff'")
content = content.replace("border: '1px solid rgba(250,248,244,0.1)'", "border: '1px solid rgba(18,16,14,0.1)'")
content = content.replace("e.currentTarget.style.background = color + '18'", "e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 4px 12px ' + color + '40'")
content = content.replace("e.currentTarget.style.background = 'rgba(250,248,244,0.07)'", "e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = 'none'")
content = content.replace("e.currentTarget.style.borderColor = 'rgba(250,248,244,0.1)'", "e.currentTarget.style.borderColor = 'rgba(18,16,14,0.1)'")

# Replace Discover / For Sellers text hover colors
content = content.replace("e.currentTarget.style.color = '#faf8f4'", "e.currentTarget.style.color = '#5b21b6'")

# Update borderTop color at the bottom
content = content.replace("borderTop: '1px solid rgba(250,248,244,0.08)'", "borderTop: '1px solid rgba(18,16,14,0.08)'")

with open('src/components/Footer.jsx', 'w') as f:
    f.write(content)
