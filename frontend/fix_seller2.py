with open("src/pages/SellerPanel.jsx", "r") as f:
    content = f.read()

content = content.replace("    </div>\n    </>\n  );\n}", "    </>\n  );\n}")

with open("src/pages/SellerPanel.jsx", "w") as f:
    f.write(content)
