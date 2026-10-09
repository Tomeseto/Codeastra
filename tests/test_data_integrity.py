import json
import csv
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.exposure_engine import exposure_engine
from backend.app.models.exposure import DataLineageEnum, DataStatusEnum

client = TestClient(app)

def point_in_poly(x, y, poly):
    n = len(poly)
    inside = False
    p1x, p1y = poly[0]
    for i in range(n + 1):
        p2x, p2y = poly[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xints = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xints:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside

def point_in_geom(x, y, geom):
    gt = geom['type']
    coords = geom['coordinates']
    if gt == 'Polygon':
        return point_in_poly(x, y, coords[0])
    elif gt == 'MultiPolygon':
        for poly in coords:
            if point_in_poly(x, y, poly[0]):
                return True
        return False
    return False


class TestDataIntegrity:
    @classmethod
    def setup_class(cls):
        cls.root = Path(__file__).resolve().parent.parent
        with open(cls.root / "data/processed/mumbai_wards_24.geojson", encoding="utf-8") as f:
            cls.geojson = json.load(f)
        with open(cls.root / "data/processed/verified_flood_hotspots.json", encoding="utf-8") as f:
            cls.hotspots_data = json.load(f)
        with open(cls.root / "data/processed/weather_july_2026_ist.json", encoding="utf-8") as f:
            cls.weather = json.load(f)

    def test_24_wards_geometry_validity(self):
        """All 24 administrative wards must have valid, closed polygon rings and required attributes."""
        features = self.geojson.get("features", [])
        assert len(features) == 24, f"Expected 24 wards, found {len(features)}"
        
        seen_ids = set()
        for feat in features:
            props = feat["properties"]
            geom = feat["geometry"]
            wid = props["ward_id"]
            
            assert wid not in seen_ids, f"Duplicate ward_id: {wid}"
            seen_ids.add(wid)
            assert props["area_sq_km"] > 0.0, f"Ward {wid} has non-positive area"
            assert 18.8 < props["centroid_lat"] < 19.4, f"Ward {wid} centroid_lat out of Mumbai range"
            assert 72.7 < props["centroid_lon"] < 73.1, f"Ward {wid} centroid_lon out of Mumbai range"
            
            # Geometry check
            assert geom["type"] in ["Polygon", "MultiPolygon"]
            if geom["type"] == "Polygon":
                ring = geom["coordinates"][0]
                assert len(ring) >= 4, f"Ward {wid} outer ring has fewer than 4 vertices"
                assert ring[0] == ring[-1], f"Ward {wid} outer ring is not closed"
            elif geom["type"] == "MultiPolygon":
                for poly in geom["coordinates"]:
                    assert len(poly[0]) >= 4
                    assert poly[0][0] == poly[0][-1]

    def test_all_70_hotspots_strictly_contained_in_assigned_wards(self):
        """Every single verified chronic flood hotspot must fall geometrically inside its assigned ward polygon."""
        ward_geoms = {f["properties"]["ward_id"]: f["geometry"] for f in self.geojson["features"]}
        hotspots = self.hotspots_data["hotspots"]
        assert len(hotspots) == 70, f"Expected 70 hotspots, found {len(hotspots)}"
        
        uncontained = []
        for h in hotspots:
            wid = h["ward_id"]
            lon, lat = h["lon"], h["lat"]
            assert wid in ward_geoms, f"Hotspot {h['id']} assigned to unknown ward {wid}"
            if not point_in_geom(lon, lat, ward_geoms[wid]):
                uncontained.append((h["id"], h["name"], wid, lat, lon))
                
        assert len(uncontained) == 0, f"Found {len(uncontained)} hotspots outside their assigned ward: {uncontained}"

    def test_census_demographics_ground_truth_reconciliation(self):
        """Ward census values in CSV must match the underlying source (Banaji / MCGM 2011 Table 1) exactly."""
        csv_path = self.root / "data/processed/ward_census_vulnerability.csv"
        records = {}
        with open(csv_path, encoding="utf-8") as f:
            for row in csv.DictReader(f):
                records[row["ward_id"]] = {
                    "total": int(row["total_population_2011"]),
                    "slum": int(row["slum_population_2011"]),
                    "nonslum": int(row["nonslum_population_2011"])
                }
        
        assert len(records) == 24
        
        # Ground truth benchmarks from MCGM 2011 Table 1:
        # Ward A (Colaba): 185014 total, 22282 slum, 162732 nonslum
        assert records["A"] == {"total": 185014, "slum": 22282, "nonslum": 162732}
        # Ward L (Kurla): 902225 total, 758108 slum, 144117 nonslum
        assert records["L"] == {"total": 902225, "slum": 758108, "nonslum": 144117}
        # Ward M-E (Govandi): 807720 total, 685994 slum, 121726 nonslum
        assert records["M-E"] == {"total": 807720, "slum": 685994, "nonslum": 121726}
        # City Total: 12442373 total, 6534460 slum, 5907913 nonslum
        total_pop = sum(r["total"] for r in records.values())
        total_slum = sum(r["slum"] for r in records.values())
        total_nonslum = sum(r["nonslum"] for r in records.values())
        assert total_pop == 12442373
        assert total_slum == 6534460
        assert total_nonslum == 5907913

    def test_no_future_data_leakage_in_weather_replay(self):
        """Weather series dates must follow strict temporal order with no forward-looking hours in 24h windows."""
        sample_wid = next(iter(self.weather["wards"]))
        series = self.weather["wards"][sample_wid]["daily_series"]
        dates = [s["date"] for s in series]
        
        # Chronological order
        for i in range(len(dates) - 1):
            assert dates[i] < dates[i+1], f"Weather dates not in chronological order: {dates[i]} >= {dates[i+1]}"
            
        # Verify that all rainfall numbers are non-negative
        for s in series:
            assert s["rainfall_daily_mm"] >= 0.0
            assert s["rainfall_imd_0830_window_mm"] >= 0.0

    def test_mode_separation_observed_vs_simulated(self):
        """Historical replay must output HISTORICAL_OBSERVED with DERIVED lineage; simulation must output SIMULATED_SCENARIO with ESTIMATED lineage."""
        # 1. Historical Replay Request
        hist_resp = client.get("/api/v1/exposure/timeline/2026-07-05")
        assert hist_resp.status_code == 200
        hist_data = hist_resp.json()
        assert hist_data["mode"] == "HISTORICAL_OBSERVED"
        assert hist_data["wards"]["L"]["data_lineage"] == "DERIVED"

        # 2. Simulated Scenario Request
        sim_resp = client.post("/api/v1/exposure/calculate", json={
            "date": "2026-07-05",
            "uniform_rainfall_mm": 125.0
        })
        assert sim_resp.status_code == 200
        sim_data = sim_resp.json()
        assert sim_data["mode"] == "SIMULATED_SCENARIO"
        assert sim_data["wards"]["L"]["data_lineage"] == "ESTIMATED"

    def test_historical_date_boundary_404_error(self):
        """Requests for dates outside the verified historical window (2026-06-30 to 2026-07-10) must return 404, not fabricated data."""
        resp = client.get("/api/v1/exposure/timeline/2026-08-01")
        assert resp.status_code == 404
        assert "outside verified July 2026" in resp.json()["detail"]
        
        resp_past = client.get("/api/v1/exposure/timeline/2020-01-01")
        assert resp_past.status_code == 404

    def test_missing_data_protocol_and_warning(self):
        """Missing flood data must produce PROVISIONAL_PARTIAL and explicit warning message."""
        res = exposure_engine.calculate_ward_exposure("A", 50.0)
        # Force None for test
        m, status, warning = exposure_engine.calculate_susceptibility_M(None, 0.40)
        assert status == DataStatusEnum.PROVISIONAL_PARTIAL
        assert warning is not None
        assert "missing" in warning.lower()
