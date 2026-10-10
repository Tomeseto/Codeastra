from typing import List, Optional, Literal
from pydantic import BaseModel, Field

class DailySyndromicPoint(BaseModel):
    date: str = Field(..., description="Observation date (YYYY-MM-DD)")
    is_active_timeline: bool = Field(True, description="True if part of active 11-day crisis timeline")
    rainfall_mm: float = Field(..., description="Observed 24h precipitation from ERA5 reanalysis")
    otc_antipyretic_sales: int = Field(..., description="Aggregated retail chemist sales volume of Paracetamol/Dolo 650")
    otc_baseline_mean: float = Field(..., description="7-day sliding baseline mean for pharmacy sales")
    otc_c2_zscore: float = Field(..., description="CDC EARS C2 standardized aberration score for pharmacy sales")
    asha_fever_cases: int = Field(..., description="Frontline CHV/ASHA door-to-door fever survey count")
    asha_baseline_mean: float = Field(..., description="7-day sliding baseline mean for ASHA fever cases")
    asha_c2_zscore: float = Field(..., description="CDC EARS C2 standardized aberration score for ASHA fever cases")
    composite_ears_zscore: float = Field(..., description="Weighted composite syndromic aberration score (55% OTC + 45% ASHA)")
    syndromic_alert_tier: Literal["NORMAL_BASELINE", "SYNDROMIC_WATCH", "CRITICAL_ABERRATION"] = Field(
        ..., description="Syndromic alert classification based on composite Z-score"
    )
    triangulation_quadrant: Literal[
        "CONVERGENT_ACTIVE_EPIDEMIC",
        "SILENT_INCUBATION_WINDOW",
        "LOCALIZED_COMMUNITY_CLUSTER",
        "BASELINE_STABLE"
    ] = Field(..., description="2D Bivariate Outbreak Triangulation Matrix quadrant")

class ClinicalEntityExtraction(BaseModel):
    symptom_flags: List[str] = Field(..., description="Extracted pathognomonic and non-specific symptoms")
    exposure_vector: str = Field(..., description="Environmental exposure details (e.g. waterlogging wading)")
    suspected_pathogen: str = Field(..., description="Differential diagnostic match")
    recommended_immediate_triage: str = Field(..., description="Targeted municipal public health response")

class VernacularFieldReport(BaseModel):
    id: str = Field(..., description="Unique report identifier")
    ward_id: str = Field(..., description="Canonical municipal ward ID")
    ward_name: str = Field(..., description="Ward display title")
    settlement_name: str = Field(..., description="Slum pocket or locality name")
    reporter_designation: str = Field(..., description="Reporting health worker title and health post")
    timestamp: str = Field(..., description="ISO 8601 timestamp in Asia/Kolkata")
    audio_duration_seconds: int = Field(..., description="Audio duration in seconds")
    language: Literal["Marathi", "Hindi", "English"] = Field(..., description="Reporting language")
    transcript_original: str = Field(..., description="Vernacular audio transcript in original script")
    translation_english: str = Field(..., description="English medical translation")
    extracted_clinical_entities: ClinicalEntityExtraction = Field(..., description="Clinical entity NER tags")
    ears_trigger_zscore: float = Field(..., description="Associated EARS aberration score")
    verification_status: Literal["VALIDATED_URGENT", "UNDER_REVIEW", "RESOLVED"] = Field(
        "VALIDATED_URGENT", description="Verification state by Ward Medical Officer of Health"
    )

class WardSyndromicProfile(BaseModel):
    ward_id: str = Field(..., description="Canonical ward ID")
    ward_name: str = Field(..., description="Full ward name")
    locality: str = Field(..., description="Locality description")
    zone: str = Field(..., description="Geographic zone")
    total_population: int = Field(..., description="Census 2011 verified total population")
    slum_population: int = Field(..., description="Census 2011 verified slum population")
    slum_ratio: float = Field(..., description="Slum population percentage")
    pharmacy_count: int = Field(..., description="Monitored FDA Maharashtra retail pharmacies in ward")
    chv_asha_count: int = Field(..., description="Deployed BMC Community Health Volunteers/ASHAs")
    selected_day: DailySyndromicPoint = Field(..., description="Point-in-time record for active date")
    time_series: List[DailySyndromicPoint] = Field(..., description="Complete multi-day surveillance records")

class CitywideSyndromicSummary(BaseModel):
    date: str = Field(..., description="Selected query date (YYYY-MM-DD)")
    total_monitored_pharmacies: int = Field(6510, description="Total retail pharmacies citywide")
    total_deployed_chvs: int = Field(5000, description="Total frontline CHVs/ASHAs citywide")
    critical_aberration_wards: List[str] = Field(..., description="Wards crossing +3.0 sigma aberration")
    convergent_epidemic_wards: List[str] = Field(..., description="Wards with dual environmental and syndromic crisis")
    citywide_avg_ears_zscore: float = Field(..., description="Average composite Z-score across 24 wards")
    earliest_detection_lead_time_hours: float = Field(
        48.0, description="Empirical lead time advantage of OTC sales over clinical hospital reports"
    )
