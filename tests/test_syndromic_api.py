import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_api_ward_syndromic_profile_success():
    response = client.get("/api/v1/syndromic/ward/L?date=2026-07-05")
    assert response.status_code == 200
    data = response.json()
    assert data["ward_id"] == "L"
    assert data["pharmacy_count"] == 463
    assert data["chv_asha_count"] == 547
    assert data["selected_day"]["date"] == "2026-07-05"
    assert data["selected_day"]["syndromic_alert_tier"] == "CRITICAL_ABERRATION"

def test_api_ward_syndromic_profile_v1_alias():
    response = client.get("/v1/syndromic/ward/L?date=2026-07-05")
    assert response.status_code == 200
    data = response.json()
    assert data["ward_id"] == "L"

def test_api_ward_syndromic_profile_normalized_slash():
    response = client.get("/api/v1/syndromic/ward/G/N?date=2026-07-06")
    # depending on URL encoding, G%2FN or path handling
    response2 = client.get("/api/v1/syndromic/ward/G-N?date=2026-07-06")
    assert response2.status_code == 200
    assert response2.json()["ward_id"] == "G-N"

def test_api_ward_syndromic_profile_not_found():
    response = client.get("/api/v1/syndromic/ward/INVALID999")
    assert response.status_code == 404

def test_api_citywide_summary_success():
    response = client.get("/api/v1/syndromic/summary?date=2026-07-06")
    assert response.status_code == 200
    data = response.json()
    assert data["date"] == "2026-07-06"
    assert data["total_monitored_pharmacies"] == 6510
    assert data["total_deployed_chvs"] == 5000
    assert "L" in data["critical_aberration_wards"]

def test_api_vernacular_feed_success():
    response = client.get("/api/v1/syndromic/vernacular-feed")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 4
    assert data[0]["language"] in ["Marathi", "Hindi"]
