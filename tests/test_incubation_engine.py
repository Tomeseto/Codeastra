import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.incubation_engine import incubation_engine

client = TestClient(app)

def test_14_day_surge_curve_structure_and_peak():
    """Verify 14-day surge curve array has exactly 14 elements and peaks strictly between Day 7 and Day 12."""
    curve = incubation_engine.generate_surge_curve("L", exposure_score=85.0, rainfall_mm=140.0)
    
    assert len(curve.timeline) == 14, "Surge timeline must contain exactly 14 daily points"
    assert curve.peak_day >= 7 and curve.peak_day <= 12, f"Peak day must be between Day 7 and 12, got {curve.peak_day}"
    
    # Check timeline values match peak_day
    max_point = max(curve.timeline, key=lambda p: p.surge_intensity_index)
    assert max_point.day == curve.peak_day, f"Max timeline point day {max_point.day} must equal peak_day {curve.peak_day}"
    assert max_point.is_peak is True, "Peak point must have is_peak=True"
    
    # Verify golden window bounds
    assert curve.golden_window_days == 3
    day_1_to_3 = [p for p in curve.timeline if p.day <= 3]
    for p in day_1_to_3:
        assert p.phase == "PROPHYLAXIS_GOLDEN_WINDOW"
        assert p.zone_color == "#10B981"
        assert "Doxycycline" in p.medical_action

def test_vector_stagnation_score_bounds_and_scaling():
    """Verify vector stagnation score is non-negative, <= 100.0, and scales with flood propensity."""
    # Test high flood bowl ward (Ward C, F_norm = 1.0)
    vec_high = incubation_engine.calculate_vector_stagnation_risk("C", rainfall_mm=100.0)
    assert vec_high.stagnation_risk_score >= 0.0
    assert vec_high.stagnation_risk_score <= 100.0
    assert vec_high.stagnation_risk_score == 100.0  # min(100, 1.0*80 + 50) = 100
    assert vec_high.risk_tier == "CRITICAL"
    assert "Abate" in vec_high.chemical_spray_recommendation or "Temephos" in vec_high.chemical_spray_recommendation

    # Test low flood bowl ward (Ward T, F_norm = 0.042)
    vec_low = incubation_engine.calculate_vector_stagnation_risk("T", rainfall_mm=20.0)
    assert vec_low.stagnation_risk_score >= 0.0
    assert vec_low.stagnation_risk_score < vec_high.stagnation_risk_score
    assert vec_low.stagnation_risk_score == pytest.approx(round(min(100.0, 0.0424 * 80.0 + 10.0), 1), rel=1e-1)

def test_benchmark_events_metadata_and_validation():
    """Verify all 3 benchmark events load and contain valid metadata and rainfall."""
    benchmarks = incubation_engine.get_benchmarks()
    
    assert "JULY_2026" in benchmarks.events
    assert "JULY_2005" in benchmarks.events
    assert "AUGUST_2025" in benchmarks.events
    assert len(benchmarks.benchmark_list) == 3

    # Check July 2026 event
    july_2026 = benchmarks.events["JULY_2026"]
    assert july_2026.case_count == 78
    assert july_2026.prior_month_cases == 33
    assert july_2026.lead_time_hours == pytest.approx(38.15, rel=1e-2)
    assert july_2026.rainfall_mm == 175.0

    # Check July 2005 event
    july_2005 = benchmarks.events["JULY_2005"]
    assert july_2005.peak_rainfall_mm >= 944.0
    assert "E=100" in july_2005.validation_note or "E = 100" in july_2005.saturation_scope

    # Check August 2025 event
    aug_2025 = benchmarks.events["AUGUST_2025"]
    assert aug_2025.rainfall_mm == 110.0
    assert "False Alarm" in aug_2025.validation_note

def test_api_surge_curve_endpoint():
    """Verify GET /api/v1/epidemiology/surge-curve/{ward_id} returns valid payload."""
    resp = client.get("/api/v1/epidemiology/surge-curve/L?exposure_score=85.0&rainfall_mm=140.0")
    assert resp.status_code == 200
    data = resp.json()
    assert data["ward_id"] == "L"
    assert data["exposure_score"] == 85.0
    assert "surge_curve" in data
    assert "vector_risk" in data
    assert len(data["surge_curve"]["timeline"]) == 14
    assert data["surge_curve"]["peak_day"] in [7, 8, 9, 10, 11, 12]

def test_api_benchmarks_endpoint():
    """Verify GET /api/v1/benchmarks returns the 3 benchmark events."""
    resp = client.get("/api/v1/benchmarks")
    assert resp.status_code == 200
    data = resp.json()
    assert "events" in data
    assert len(data["events"]) == 3
    assert "JULY_2026" in data["events"]
