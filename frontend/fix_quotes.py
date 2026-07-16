import os
import re

FRONTEND_DIR = r"d:\ZenseExam\ZenseExam\frontend\src"

for root, dirs, files in os.walk(FRONTEND_DIR):
    for file in files:
        if file.endswith(".jsx") or file.endswith(".js"):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()

            new_content = re.sub(r"api\.([a-z]+)\('(/api/[^\n]*?\$\{[^\n]*?)\`", r"api.\1(`\2`", content)
            
            if new_content != content:
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Fixed quotes in {filepath}")
