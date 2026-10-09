import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.action_engine import action_engine
from backend.app.services.data_loader import data_loader

client = TestClient(app)

class TestActionEngine:
    def test_prophylaxis_demand_bounds_normal_tier(self):
        """NORMAL tier (exposure < 30) requires 0 prophylaxis and 0 mobile fever vans."""
        slum_pop = 100000
        demand = action_engine.calculate_prophylaxis_demand(slum_pop, 25.0)
        assert demand.risk_tier == "NORMAL"
        assert demand.exposure_factor == 0.0
        assert demand.doxycycline_packs_recommended == 0
        assert demand.mobile_fever_vans_required == 0
        assert demand.priority_level == "BASELINE"

    def test_prophylaxis_demand_bounds_watch_tier(self):
        """WATCH tier (30 <= exposure < 55) requires 5% of slum population and 0 vans."""
        slum_pop = 100000
        demand = action_engine.calculate_prophylaxis_demand(slum_pop, 45.0)
        assert demand.risk_tier == "WATCH"
        assert demand.exposure_factor == 0.05
        assert demand.doxycycline_packs_recommended == 5000
        assert demand.mobile_fever_vans_required == 0
        assert demand.priority_level == "STANDBY"

    def test_prophylaxis_demand_bounds_warning_tier(self):
        """WARNING tier (55 <= exposure < 75) requires 15% of slum population and 1 van."""
        slum_pop = 100000
        demand = action_engine.calculate_prophylaxis_demand(slum_pop, 65.0)
        assert demand.risk_tier == "WARNING"
        assert demand.exposure_factor == 0.15
        assert demand.doxycycline_packs_recommended == 15000
        assert demand.mobile_fever_vans_required == 1
        assert demand.priority_level == "ELEVATED"

    def test_prophylaxis_demand_bounds_emergency_tier(self):
        """EMERGENCY tier (exposure >= 75) requires 35% of slum population and 2 vans."""
        slum_pop = 100000
        demand = action_engine.calculate_prophylaxis_demand(slum_pop, 82.5)
        assert demand.risk_tier == "EMERGENCY"
        assert demand.exposure_factor == 0.35
        assert demand.doxycycline_packs_recommended == 35000
        assert demand.mobile_fever_vans_required == 2
        assert demand.priority_level == "IMMEDIATE"

    def test_ward_l_prophylaxis_exact_calculation(self):
        """Ward L (Kurla) with 472,328 slum population under Emergency exposure."""
        ward_l_slum = data_loader.vulnerability.get("L", {}).get("slum_population_2011", 472328)
        demand = action_engine.calculate_prophylaxis_demand(ward_l_slum, 85.0)
        expected_doses = round(ward_l_slum * 0.35)
        assert demand.doxycycline_packs_recommended == expected_doses
        assert demand.mobile_fever_vans_required == 2

    def test_multilingual_advisory_interpolation_ward_l(self):
        """Verify Marathi, Hindi, and English string interpolation for Ward L."""
        directive = action_engine.generate_ward_directive("L", exposure_score=85.0)
        assert "L" in directive.advisory.marathi
        assert "Kurla" in directive.advisory.marathi
        assert "डॉक्सीसायक्लिन" in directive.advisory.marathi
        assert "२४ ते ७२ तासांच्या आत" in directive.advisory.marathi

        assert "L" in directive.advisory.hindi
        assert "Kurla" in directive.advisory.hindi
        assert "आपला दवाखाना" in directive.advisory.hindi
        assert "७२ घंटों के भीतर" in directive.advisory.hindi

        assert "L" in directive.advisory.english
        assert "CRITICAL flood exposure" in directive.advisory.english
        assert "24–72 hours" in directive.advisory.english
        assert "Aapla Dawakhana" in directive.advisory.english

    def test_multilingual_advisory_interpolation_ward_fn(self):
        """Verify Marathi, Hindi, and English string interpolation for Ward F-N."""
        directive = action_engine.generate_ward_directive("F-N", exposure_score=78.0)
        assert "F-N" in directive.advisory.marathi
        assert "Matunga" in directive.advisory.marathi or "Wadala" in directive.advisory.marathi or "Sion" in directive.advisory.marathi
        assert "F-N" in directive.advisory.hindi
        assert "F-N" in directive.advisory.english

    def test_all_24_wards_have_valid_clinics(self):
        """All 24 administrative wards must have mapped Aapla Dawakhana clinics."""
        all_ward_ids = list(data_loader.wards_metadata.keys())
        assert len(all_ward_ids) == 24

        high_risk_wards = ["L", "F-N", "F-S", "G-N", "H-E", "M-E", "K-E", "P-N"]
        for wid in all_ward_ids:
            clinics = action_engine.get_clinics_for_ward(wid)
            assert len(clinics) >= 2, f"Ward {wid} has fewer than 2 clinics"
            if wid in high_risk_wards:
                assert len(clinics) >= 4, f"High-risk ward {wid} expected at least 4 clinics, got {len(clinics)}"
            for c in clinics:
                assert c.ward_id == wid
                assert c.operating_hours == "9:00 AM - 2:00 PM & 3:00 PM - 8:00 PM"
                assert "Free Doxycycline Prophylaxis" in c.services
                assert c.stock_status == "STOCKED"

    def test_api_directive_endpoint(self):
        """API endpoint /api/v1/action/directive/L returns valid directive."""
        resp = client.get("/api/v1/action/directive/L?exposure_score=85.0")
        assert resp.status_code == 200
        data = resp.json()
        assert data["ward_id"] == "L"
        assert data["risk_tier"] == "EMERGENCY"
        assert data["prophylaxis"]["mobile_fever_vans_required"] == 2
        assert len(data["clinics"]) >= 4
        assert "marathi" in data["advisory"]

    def test_api_clinics_endpoint(self):
        """API endpoint /api/v1/action/clinics/F-N returns clinics list."""
        resp = client.get("/api/v1/action/clinics/F-N")
        assert resp.status_code == 200
        clinics = resp.json()
        assert isinstance(clinics, list)
        assert len(clinics) >= 4
        assert any("Sion" in c["name"] or "Wadala" in c["name"] for c in clinics)

    def test_api_directive_unknown_ward_404(self):
        """API endpoint returns 404 for unknown ward."""
        resp = client.get("/api/v1/action/directive/UNKNOWN_XYZ")
        assert resp.status_code == 404
