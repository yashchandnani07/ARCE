import os
from flask import Flask, jsonify
import yaml

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def load_config():
    """Load application configuration from YAML file."""
    config_path = os.path.join(BASE_DIR, "config.yaml")
    with open(config_path, "r") as f:
        config = yaml.load(f)  # Vulnerable: CVE-2020-14343
    return config

@app.route("/")
def index():
    config = load_config()
    return jsonify({"status": "running", "app_name": config.get("app_name")})

@app.route("/api/health")
def health():
    return jsonify({"status": "healthy", "version": "1.0.0"})

if __name__ == "__main__":
    app.run(debug=False, port=5000)
