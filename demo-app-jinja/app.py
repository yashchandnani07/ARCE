# Baseline: jinja2==3.1.2 (vulnerable to CVE-2024-22195)
# Expected behavior: After patching to jinja2>=3.1.3, the attribute injection test should pass
# The vulnerability is in the xmlattr filter which doesn't properly sanitize attribute keys

import os
from flask import Flask, request, jsonify
from jinja2 import Environment, select_autoescape

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Create a Jinja2 environment
env = Environment(
    autoescape=select_autoescape(['html', 'xml'])
)

@app.route("/")
def index():
    return jsonify({"status": "running", "app_name": "Jinja2 Demo App"})

@app.route("/api/health")
def health():
    return jsonify({"status": "healthy", "version": "1.0.0"})

@app.route("/render", methods=["POST"])
def render():
    """
    Render HTML attributes using jinja2's xmlattr filter.
    Vulnerable to CVE-2024-22195 when using jinja2<3.1.3
    """
    data = request.get_json()
    if not data or "attributes" not in data:
        return jsonify({"error": "Missing 'attributes' in request"}), 400
    
    attributes = data["attributes"]
    
    # Use xmlattr filter - vulnerable in jinja2<3.1.3
    template_str = "{{ attrs|xmlattr }}"
    template = env.from_string(template_str)
    result = template.render(attrs=attributes)
    
    return jsonify({"rendered": result})

if __name__ == "__main__":
    app.run(debug=False, port=5001)

# Made with Bob
