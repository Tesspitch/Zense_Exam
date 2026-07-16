import os
import re

FRONTEND_DIR = r"d:\ZenseExam\ZenseExam\frontend\src"
API_FILE = os.path.join(FRONTEND_DIR, "utils", "api.js")

# Ensure utils directory exists
os.makedirs(os.path.dirname(API_FILE), exist_ok=True)

# Create utils/api.js
with open(API_FILE, "w", encoding="utf-8") as f:
    f.write("""import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

export default api;
""")

for root, dirs, files in os.walk(FRONTEND_DIR):
    for file in files:
        if file.endswith(".jsx") or file.endswith(".js"):
            filepath = os.path.join(root, file)
            if filepath == API_FILE:
                continue
                
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()

            if "http://localhost:8000" in content:
                # Calculate relative path to utils/api
                rel_dir = os.path.relpath(os.path.dirname(API_FILE), os.path.dirname(filepath))
                rel_dir = rel_dir.replace("\\", "/")
                if not rel_dir.startswith("."):
                    rel_dir = "./" + rel_dir
                
                api_import = f"import api from '{rel_dir}/api';"

                # Replace import axios from 'axios' with api import (if not already there)
                # Or just add api import after axios
                if "import axios from 'axios'" in content:
                    content = content.replace("import axios from 'axios'", f"import axios from 'axios';\n{api_import}")
                else:
                    # If axios is not imported, maybe they don't use it, but if they have the URL, they probably do.
                    # Just add it at the top.
                    content = api_import + "\n" + content
                
                # Replace axios.get('http://localhost:8000
                # with api.get('
                content = re.sub(r"axios\.([a-z]+)\(\s*['\"`]http://localhost:8000", r"api.\1('", content)
                
                # If they have axios.get(`http://localhost:8000...`)
                # It's covered above if it starts with backtick.
                
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(content)
                
                print(f"Refactored {filepath}")
