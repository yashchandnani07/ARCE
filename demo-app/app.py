from flask import Flask, jsonify
import yaml
from pathlib import Path

app = Flask(__name__)


def load_config():
    """Load configuration from YAML file.
    
    WARNING: This uses vulnerable yaml.load() without a Loader argument.
    This is intentionally vulnerable for demonstration purposes (CVE-2020-14343).
    """
    config_path = Path(__file__).parent / "config.yaml"
    with open(config_path, 'r') as f:
        # INTENTIONALLY VULNERABLE: Using yaml.load() without Loader argument
        config = yaml.load(f)
    return config


@app.route('/')
def index():
    """Root endpoint returning app status and name."""
    config = load_config()
    return jsonify({
        "status": "running",
        "app_name": config.get("app_name")
    })


@app.route('/api/health')
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy"
    })


if __name__ == "__main__":
    app.run(port=5000)

# Made with Bob
