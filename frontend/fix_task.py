with open("/Users/rishabhgupta/.gemini/antigravity-ide/brain/50dd01e3-b0a1-4c1b-92a4-0bf00dc614cc/task.md", "r") as f:
    content = f.read()

content = content.replace("- `[x]` Test animations performanceakpoints", "- `[x]` Test animations performance")

with open("/Users/rishabhgupta/.gemini/antigravity-ide/brain/50dd01e3-b0a1-4c1b-92a4-0bf00dc614cc/task.md", "w") as f:
    f.write(content)
