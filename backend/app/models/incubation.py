from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class IncubationTimelinePoint(BaseModel):
    day: int = Field(..., description="Day number post-flood event (1 to 14)")
    phase: str = Field(..., description="Epidemiological phase identifier")
    phase_label: str = Field(..., description="Clinical phase title")
    civilian_headline: str = Field(..., description="Intuitive civilian headline (zero medical jargon)")
    civilian_explanation: str = Field(..., description="Plain-language explanation for residents")
    surge_intensity_index: float = Field(..., description="Projected outpatient presentation surge index (0.0 to 100.0)")
    medical_action: str = Field(..., description="Clinical protocol / municipal action directive")
    zone_color: str = Field(..., description="Traffic-light color hex for visual timeline")
    is_peak: bool = Field(False, description="Flag indicating the peak surge day")

class SurgeCurve(BaseModel):
    ward_id: str
    ward_name: str
    exposure_score: float
    rainfall_mm: float
    peak_day: int = Field(..., description="Day post-flood where clinic surge reaches maximum (Days 7–12)")
    peak_intensity: float
    golden_window_days: int = Field(3, description="Prophylaxis golden efficacy window duration in days")
    timeline: List[IncubationTimelinePoint]
    evidence_citation: str = "Supe et al., National Medical Journal of India 2018; 31(1): 19-21"

class VectorStagnationRisk(BaseModel):
    ward_id: str
    stagnation_risk_score: float = Field(..., description="Score 0.0 to 100.0 based on flood bowls and rainfall")
    risk_tier: str = Field(..., description="LOW, MODERATE, HIGH, or CRITICAL")
    target_vectors: List[str] = Field(default_factory=lambda: [
        "Aedes aegypti (Dengue / Chikungunya)",
        "Anopheles stephensi (Urban Malaria)"
    ])
    larval_breeding_window: str = Field(
        "Standing water bowls create peak larval emergence 14–21 days post-flood recession."
    )
    chemical_spray_recommendation: str
    target_hotspot_count: int
    priority_action: str

class WardEpidemiologyForecast(BaseModel):
    ward_id: str
    ward_name: str
    exposure_score: float
    rainfall_mm: float
    surge_curve: SurgeCurve
    vector_risk: VectorStagnationRisk
    generated_at: str

class BenchmarkEvent(BaseModel):
    id: str
    name: str
    date_range: str
    rainfall_mm: float
    peak_rainfall_mm: float
    tide_condition: str
    drainage_state: str
    lead_time_hours: float
    case_count: int
    prior_month_cases: int
    case_surge_percentage: float
    historical_outcome: str
    validation_note: str
    saturation_scope: str
    target_wards: List[str]
    recommended_action: str

class BenchmarkSummaryItem(BaseModel):
    id: str
    title: str
    subtitle: str
    rainfall_mm: float
    tag: str
    color: str

class BenchmarkSuiteResponse(BaseModel):
    events: Dict[str, BenchmarkEvent]
    benchmark_list: List[BenchmarkSummaryItem]
