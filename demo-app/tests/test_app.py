import pytest
from app import app, load_config

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200

def test_index(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.get_json()
    assert data["app_name"] == "ARCE Demo App"

def test_load_config():
    config = load_config()
    assert "app_name" in config
    assert config["app_name"] == "ARCE Demo App"
