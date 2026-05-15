import pytest
import sys
from pathlib import Path

# Add parent directory to path to import app module
sys.path.insert(0, str(Path(__file__).parent.parent))

from app import app, load_config


@pytest.fixture
def client():
    """Create a test client for the Flask application."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def test_health(client):
    """Test the /api/health endpoint returns 200 and correct JSON."""
    response = client.get('/api/health')
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data == {"status": "healthy"}


def test_index(client):
    """Test the / endpoint returns 200 and correct JSON structure."""
    response = client.get('/')
    assert response.status_code == 200
    json_data = response.get_json()
    assert "status" in json_data
    assert "app_name" in json_data
    assert json_data["status"] == "running"
    assert json_data["app_name"] == "ARCE Demo App"


def test_load_config():
    """Test the load_config function directly."""
    config = load_config()
    assert config is not None
    assert "app_name" in config
    assert config["app_name"] == "ARCE Demo App"
    assert "version" in config
    assert config["version"] == "1.0.0"
    assert "database" in config
    assert config["database"]["host"] == "localhost"
    assert config["database"]["port"] == 5432
    assert config["database"]["name"] == "arce_db"

# Made with Bob
