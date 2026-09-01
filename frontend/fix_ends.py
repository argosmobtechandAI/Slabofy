import re

def fix_admin():
    with open("src/pages/AdminPanel.jsx", "r") as f:
        content = f.read()
    
    # Let's just find the last modal's closing `)}` and replace from there to the end.
    idx = content.rfind("      )}\n")
    if idx != -1:
        end_content = """      )}

          </div>
        </div>
      </div>
    </div>
    </>
  );
}"""
        # find the end of the file from idx + len("      )}\n")
        content = content[:idx] + end_content
        with open("src/pages/AdminPanel.jsx", "w") as f:
            f.write(content)
            print("AdminPanel fixed")

def fix_seller():
    with open("src/pages/SellerPanel.jsx", "r") as f:
        content = f.read()
    
    # The end of SellerPanel looks like:
    #         </div>
    #       </div>
    #     </>
    #   );
    # }
    # We need to add one more </div> before </>
    content = content.replace(
        "      </div>\n    </>\n  );\n}",
        "      </div>\n    </div>\n    </>\n  );\n}"
    )
    with open("src/pages/SellerPanel.jsx", "w") as f:
        f.write(content)
        print("SellerPanel fixed")

fix_admin()
fix_seller()
