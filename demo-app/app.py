from flask import Flask, jsonify
import yaml

app = Flask(__name__)

def load_config():
    """Load application configuration from YAML file."""
    with open("config.yaml", "r") as f:
        config = yaml.safe_load(f)  # Fixed: CVE-2020-14343
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
