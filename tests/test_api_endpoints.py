import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

class TestAPIEndpoints:
    def test_health_check(self):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert data["service"] == "varsha-backend"

    def test_root_endpoint(self):
        resp = client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["project"] == "VARSHA"
        assert "endpoints" in data

    def test_get_wards_geojson(self):
        resp = client.get("/api/v1/wards")
        assert resp.status_code == 200
        data = resp.json()
        assert data["type"] == "FeatureCollection"
        features = data["features"]
        assert len(features) == 24
        
        # Verify property enrichment
        ward_ids = {f["properties"]["ward_id"] for f in features}
        assert "A" in ward_ids
        assert "L" in ward_ids
        assert "F-S" in ward_ids
        
        sample = features[0]["properties"]
        assert "total_population" in sample
        assert "vulnerability_norm" in sample
        assert "verified_flood_hotspot_count" in sample

    def test_get_wards_list(self):
        resp = client.get("/api/v1/wards/list")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) == 24
        
        # Check that Ward L has highest vulnerability
        ward_l = next(w for w in data if w["ward_id"] == "L")
        assert ward_l["vulnerability_norm"] == 1.0

    def test_get_single_ward_detail(self):
        resp = client.get("/api/v1/wards/F-N")
        assert resp.status_code == 200
        data = resp.json()
        assert data["metadata"]["ward_id"] == "F-N"
        assert len(data["chronic_hotspots"]) > 0

    def test_calculate_exposure_endpoint(self):
        payload = {
            "date": "2026-07-05",
            "use_imd_window": False
        }
        resp = client.post("/api/v1/exposure/calculate", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["date"] == "2026-07-05"
        assert len(data["wards"]) == 24
        assert data["city_max_exposure"] > 75.0  # July 5 has emergency wards
        assert data["emergency_ward_count"] >= 4

    def test_timeline_endpoint(self):
        resp = client.get("/api/v1/exposure/timeline")
        assert resp.status_code == 200
        data = resp.json()
        assert "days" in data
        assert len(data["days"]) == 11
        
        # Check milestone on July 6 (BMC advisory)
        july_6 = next((d for d in data["days"] if d["date"] == "2026-07-06"), None)
        assert july_6 is not None
        assert len(july_6["milestones"]) > 0
        assert "BMC" in july_6["milestones"][0]["title"]

    def test_invalid_ward_detail_returns_404(self):
        resp = client.get("/api/v1/wards/UNKNOWN_WARD_XYZ")
        assert resp.status_code == 404
        assert "not found" in resp.json()["detail"].lower()

    def test_api_v1_health_endpoint(self):
        resp = client.get("/api/v1/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"

    def test_calculate_exposure_with_overrides(self):
        payload = {
            "date": "2026-07-05",
            "rainfall_overrides": {
                "A": 0.0,
                "L": 250.0
            }
        }
        resp = client.post("/api/v1/exposure/calculate", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["wards"]["A"]["exposure_score"] == 0.0
        assert data["wards"]["L"]["exposure_score"] == 100.0
        assert data["wards"]["L"]["risk_tier"] == "EMERGENCY"

    def test_timeline_single_date_endpoint(self):
        resp = client.get("/api/v1/exposure/timeline/2026-07-01")
        assert resp.status_code == 200
        data = resp.json()
        assert data["date"] == "2026-07-01"
        assert len(data["wards"]) == 24
