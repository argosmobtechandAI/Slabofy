import re

with open('src/components/ProductCard.jsx', 'r') as f:
    content = f.read()

# Add useScrollReveal
content = content.replace("import React, { useState } from 'react';", "import React, { useState } from 'react';\nimport useScrollReveal from '../hooks/useScrollReveal';")

# Add ref
content = content.replace("  const [tilt, setTilt] = useState({ x: 0, y: 0 });", "  const [tilt, setTilt] = useState({ x: 0, y: 0 });\n  const revealRef = useScrollReveal({ persist: false });")

# Wrap Link in scroll reveal ref
content = content.replace("    <Link", "    <div ref={revealRef} className=\"scroll-reveal-group\" style={{ height: '100%' }}>\n    <Link")
content = content.replace("    </Link>\n  );\n}", "    </Link>\n    </div>\n  );\n}")

# Update card styles to use .product-card-v2 and hover-shine-sweep
# We can just change the inner div style slightly. The tilt logic is already there.

with open('src/components/ProductCard.jsx', 'w') as f:
    f.write(content)
