import pytest

def test_get_ward_syndromic_profile_canonical():
    from backend.app.services.syndromic_engine import syndromic_engine
    
    profile = syndromic_engine.get_ward_syndromic_profile("L", date="2026-07-05")
    assert profile is not None
    assert profile.ward_id == "L"
    assert profile.pharmacy_count == 463
    assert profile.chv_asha_count == 547
    assert profile.selected_day.date == "2026-07-05"
    assert profile.selected_day.composite_ears_zscore > 3.0
    assert profile.selected_day.syndromic_alert_tier == "CRITICAL_ABERRATION"

def test_get_ward_syndromic_profile_normalized():
    from backend.app.services.syndromic_engine import syndromic_engine
    
    # Slash normalization: G/N -> G-N
    profile_gn = syndromic_engine.get_ward_syndromic_profile("G/N", date="2026-07-06")
    assert profile_gn is not None
    assert profile_gn.ward_id == "G-N"
    
    # Slash normalization: K/E -> K-E
    profile_ke = syndromic_engine.get_ward_syndromic_profile("K/E", date="2026-07-06")
    assert profile_ke is not None
    assert profile_ke.ward_id == "K-E"

def test_get_ward_syndromic_profile_date_selection():
    from backend.app.services.syndromic_engine import syndromic_engine
    
    # Pre-flood baseline date
    profile_june30 = syndromic_engine.get_ward_syndromic_profile("L", date="2026-06-30")
    assert profile_june30.selected_day.date == "2026-06-30"
    assert profile_june30.selected_day.syndromic_alert_tier == "NORMAL_BASELINE"
    
    # Peak crisis date
    profile_july7 = syndromic_engine.get_ward_syndromic_profile("L", date="2026-07-07")
    assert profile_july7.selected_day.date == "2026-07-07"
    assert profile_july7.selected_day.composite_ears_zscore > 10.0

def test_get_citywide_syndromic_summary():
    from backend.app.services.syndromic_engine import syndromic_engine
    
    summary = syndromic_engine.get_citywide_syndromic_summary("2026-07-06")
    assert summary is not None
    assert summary.date == "2026-07-06"
    assert summary.total_monitored_pharmacies == 6510
    assert summary.total_deployed_chvs == 5000
    assert "L" in summary.critical_aberration_wards
    assert "L" in summary.convergent_epidemic_wards
    assert summary.earliest_detection_lead_time_hours == 48.0

def test_get_vernacular_telemetry_feed():
    from backend.app.services.syndromic_engine import syndromic_engine
    
    feed = syndromic_engine.get_vernacular_telemetry_feed()
    assert len(feed) == 4
    report_ids = [r.id for r in feed]
    assert "ASHA-L-0407" in report_ids
    assert "ASHA-GN-0507" in report_ids
    assert "ASHA-ME-0607" in report_ids
    assert "ASHA-FN-0707" in report_ids

def test_nonexistent_ward_returns_none():
    from backend.app.services.syndromic_engine import syndromic_engine
    
    assert syndromic_engine.get_ward_syndromic_profile("XYZ99") is None
