import os

FRONTEND_DIR = r"d:\ZenseExam\ZenseExam\frontend\src"

for root, dirs, files in os.walk(FRONTEND_DIR):
    for file in files:
        if file.endswith(".jsx") or file.endswith(".js"):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()

            if ";;" in content:
                content = content.replace(";;", ";")
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"Fixed {filepath}")
