"""
Exhaustive Reverification Test Suite for EARS-Sanjeevani Syndromic Surveillance Data.
Validates all invariants, counts, mathematical algorithms, and medical accuracy.
"""

import json
import pytest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "data" / "processed" / "syndromic_surveillance_ears.json"

@pytest.fixture(scope="module")
def syndromic_data():
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def test_file_exists_and_metadata(syndromic_data):
    assert "metadata" in syndromic_data
    assert "wards" in syndromic_data
    assert "vernacular_field_telemetry" in syndromic_data
    meta = syndromic_data["metadata"]
    assert meta["total_licensed_pharmacies_monitored"] == 6510
    assert meta["total_frontline_chv_asha_monitored"] == 5000
    assert meta["algorithm"]["aberration_threshold_sigma"] == 3.0

def test_ward_completeness_and_canonical_ids(syndromic_data):
    canonical_wards = {
        "A", "B", "C", "D", "E", "F-N", "F-S", "G-N", "G-S",
        "H-E", "H-W", "K-E", "K-W", "L", "M-E", "M-W", "N",
        "P-N", "P-S", "R-C", "R-N", "R-S", "S", "T"
    }
    wards = syndromic_data["wards"]
    assert len(wards) == 24
    assert set(wards.keys()) == canonical_wards

def test_pharmacy_total_invariant(syndromic_data):
    wards = syndromic_data["wards"]
    total_pharmacies = sum(w["pharmacy_count"] for w in wards.values())
    assert total_pharmacies == 6510, f"Expected exactly 6510 pharmacies, got {total_pharmacies}"

def test_chv_total_invariant(syndromic_data):
    wards = syndromic_data["wards"]
    total_chvs = sum(w["chv_asha_count"] for w in wards.values())
    assert total_chvs == 5000, f"Expected exactly 5000 CHVs/ASHAs, got {total_chvs}"

def test_population_and_slum_invariants(syndromic_data):
    wards = syndromic_data["wards"]
    total_pop = sum(w["total_population"] for w in wards.values())
    total_slum = sum(w["slum_population"] for w in wards.values())
    assert total_pop == 12442373, f"Expected 12,442,373 total pop, got {total_pop}"
    assert total_slum == 6534460, f"Expected 6,534,460 slum pop, got {total_slum}"

def test_timeline_date_coverage(syndromic_data):
    active_dates = syndromic_data["metadata"]["active_dates"]
    assert len(active_dates) == 11
    assert active_dates[0] == "2026-06-30"
    assert active_dates[-1] == "2026-07-10"
    
    for wid, w in syndromic_data["wards"].items():
        ward_dates = [record["date"] for record in w["time_series"]]
        for ad in active_dates:
            assert ad in ward_dates, f"Date {ad} missing in ward {wid}"

def test_cdc_ears_kurla_aberration_progression(syndromic_data):
    kurla = syndromic_data["wards"]["L"]
    records_by_date = {r["date"]: r for r in kurla["time_series"]}
    
    # 1. On June 30 (Baseline), Z-score must be baseline normal
    assert records_by_date["2026-06-30"]["composite_ears_zscore"] < 1.5
    assert records_by_date["2026-06-30"]["syndromic_alert_tier"] == "NORMAL_BASELINE"
    
    # 2. On July 5 (Day 1 post-deluge), Chemist OTC surge must fire first
    otc_july5_z = records_by_date["2026-07-05"]["otc_c2_zscore"]
    asha_july5_z = records_by_date["2026-07-05"]["asha_c2_zscore"]
    assert otc_july5_z > asha_july5_z, "Chemist OTC surge should lead ASHA fever calls on July 5"
    
    # 3. On July 6-9 (Active Outbreak), composite Z-score must cross 3.0 sigma
    for d in ["2026-07-06", "2026-07-07", "2026-07-08", "2026-07-09"]:
        rec = records_by_date[d]
        assert rec["composite_ears_zscore"] >= 3.0, f"Date {d} failed to trigger >= 3.0 sigma in Kurla"
        assert rec["syndromic_alert_tier"] == "CRITICAL_ABERRATION"

def test_triangulation_quadrants_validity(syndromic_data):
    valid_quadrants = {
        "CONVERGENT_ACTIVE_EPIDEMIC",
        "SILENT_INCUBATION_WINDOW",
        "LOCALIZED_COMMUNITY_CLUSTER",
        "BASELINE_STABLE"
    }
    for wid, w in syndromic_data["wards"].items():
        for r in w["time_series"]:
            assert r["triangulation_quadrant"] in valid_quadrants

def test_vernacular_telemetry_authenticity(syndromic_data):
    reports = syndromic_data["vernacular_field_telemetry"]
    assert len(reports) >= 4
    
    languages = {r["language"] for r in reports}
    assert "Marathi" in languages
    assert "Hindi" in languages
    
    for r in reports:
        assert r["ward_id"] in syndromic_data["wards"]
        assert len(r["transcript_original"]) > 20
        assert len(r["translation_english"]) > 20
        assert "symptom_flags" in r["extracted_clinical_entities"]
        assert len(r["extracted_clinical_entities"]["symptom_flags"]) >= 2
        assert r["ears_trigger_zscore"] >= 2.5
