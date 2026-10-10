import pytest
from pydantic import ValidationError

def test_daily_syndromic_point_valid():
    from backend.app.models.syndromic import DailySyndromicPoint
    
    point = DailySyndromicPoint(
        date="2026-07-05",
        is_active_timeline=True,
        rainfall_mm=111.7,
        otc_antipyretic_sales=2483,
        otc_baseline_mean=1220.6,
        otc_c2_zscore=15.86,
        asha_fever_cases=223,
        asha_baseline_mean=172.3,
        asha_c2_zscore=4.55,
        composite_ears_zscore=10.77,
        syndromic_alert_tier="CRITICAL_ABERRATION",
        triangulation_quadrant="CONVERGENT_ACTIVE_EPIDEMIC"
    )
    assert point.date == "2026-07-05"
    assert point.composite_ears_zscore == 10.77
    assert point.syndromic_alert_tier == "CRITICAL_ABERRATION"
    assert point.triangulation_quadrant == "CONVERGENT_ACTIVE_EPIDEMIC"

def test_vernacular_field_report_valid():
    from backend.app.models.syndromic import VernacularFieldReport, ClinicalEntityExtraction
    
    entities = ClinicalEntityExtraction(
        symptom_flags=["Acute High Fever", "Severe Calf Myalgia"],
        exposure_vector="Monsoon floodwater wading > 2 hours",
        suspected_pathogen="Leptospira interrogans",
        recommended_immediate_triage="Stat Doxycycline 200mg prophylaxis"
    )
    report = VernacularFieldReport(
        id="ASHA-L-0407",
        ward_id="L",
        ward_name="L (Kurla / Sakinaka)",
        settlement_name="Kranti Nagar",
        reporter_designation="CHV Sunita Jadhav",
        timestamp="2026-07-05T09:15:00+05:30",
        audio_duration_seconds=12,
        language="Marathi",
        transcript_original="नमस्कार डॉक्टर साहेब, क्रांती नगरात...",
        translation_english="Namaste Doctor Sir, in Kranti Nagar...",
        extracted_clinical_entities=entities,
        ears_trigger_zscore=3.42,
        verification_status="VALIDATED_URGENT"
    )
    assert report.id == "ASHA-L-0407"
    assert report.language == "Marathi"
    assert len(report.extracted_clinical_entities.symptom_flags) == 2

def test_ward_syndromic_profile_valid():
    from backend.app.models.syndromic import WardSyndromicProfile, DailySyndromicPoint
    
    point = DailySyndromicPoint(
        date="2026-07-05",
        is_active_timeline=True,
        rainfall_mm=111.7,
        otc_antipyretic_sales=2483,
        otc_baseline_mean=1220.6,
        otc_c2_zscore=15.86,
        asha_fever_cases=223,
        asha_baseline_mean=172.3,
        asha_c2_zscore=4.55,
        composite_ears_zscore=10.77,
        syndromic_alert_tier="CRITICAL_ABERRATION",
        triangulation_quadrant="CONVERGENT_ACTIVE_EPIDEMIC"
    )
    profile = WardSyndromicProfile(
        ward_id="L",
        ward_name="L (Kurla / Sakinaka)",
        locality="Kurla / Sakinaka",
        zone="Eastern Suburbs",
        total_population=902225,
        slum_population=758108,
        slum_ratio=0.8403,
        pharmacy_count=388,
        chv_asha_count=582,
        selected_day=point,
        time_series=[point]
    )
    assert profile.ward_id == "L"
    assert profile.pharmacy_count == 388
    assert profile.chv_asha_count == 582
    assert profile.selected_day.composite_ears_zscore == 10.77
