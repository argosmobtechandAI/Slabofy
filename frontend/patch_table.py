with open("src/pages/AdminPanel.jsx", "r") as f:
    content = f.read()

# Add table-row-v2 to tr elements inside tbody (they usually have hover:bg-gray-50)
content = content.replace(
    'className="hover:bg-gray-50 transition-colors"',
    'className="table-row-v2 hover:bg-gray-50 transition-colors"'
)

with open("src/pages/AdminPanel.jsx", "w") as f:
    f.write(content)
