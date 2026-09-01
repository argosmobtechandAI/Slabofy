def fix_admin():
    with open("src/pages/AdminPanel.jsx", "r") as f:
        content = f.read()
    
    idx = content.rfind("      )}\n\n          </div>\n        </div>\n      </div>\n    </div>\n    </>\n  );\n}")
    if idx != -1:
        end_content = """      )}

    </div>
    </>
  );
}"""
        content = content[:idx] + end_content
        with open("src/pages/AdminPanel.jsx", "w") as f:
            f.write(content)

def fix_seller():
    with open("src/pages/SellerPanel.jsx", "r") as f:
        content = f.read()
    
    idx = content.rfind("        <div className=\"mobile-bottom-nav lg:hidden\">")
    if idx != -1:
        content = content[:idx] + """        </div>
      </div>
        <div className="mobile-bottom-nav lg:hidden">""" + content[idx + len("        <div className=\"mobile-bottom-nav lg:hidden\">"):]

        idx2 = content.rfind("          ))}\n        </div>\n      </div>\n    </div>\n    </>\n  );\n}")
        if idx2 != -1:
            content = content[:idx2] + "          ))}\n        </div>\n    </div>\n    </>\n  );\n}"
        with open("src/pages/SellerPanel.jsx", "w") as f:
            f.write(content)

fix_admin()
fix_seller()
