from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

class DataLineageEnum(str, Enum):
    OBSERVED = "OBSERVED"
    DERIVED = "DERIVED"
    ESTIMATED = "ESTIMATED"
    MISSING = "MISSING"

class RiskTierEnum(str, Enum):
    NORMAL = "NORMAL"
    WATCH = "WATCH"
    WARNING = "WARNING"
    EMERGENCY = "EMERGENCY"

class DataStatusEnum(str, Enum):
    VERIFIED_COMPLETE = "VERIFIED_COMPLETE"
    PROVISIONAL_PARTIAL = "PROVISIONAL_PARTIAL"

class HazardBreakdown(BaseModel):
    rainfall_mm: float = Field(..., ge=0.0, description="Observed or scenario 24h rainfall in millimeters")
    hazard_score_H: float = Field(..., ge=0.0, le=100.0, description="Piecewise meteorological hazard score in [0, 100]")
    imd_category: str = Field(..., description="Official IMD rainfall classification")

class SusceptibilityBreakdown(BaseModel):
    base_multiplier: float = 0.70
    flood_propensity_F_norm: Optional[float] = Field(None, ge=0.0, le=1.0, description="Normalized chronic flood density")
    demographic_vulnerability_V_norm: float = Field(..., ge=0.0, le=1.0, description="Normalized demographic vulnerability")
    weight_flood: float = 0.30
    weight_vulnerability: float = 0.30
    multiplier_M: float = Field(..., ge=0.70, le=1.30, description="Combined susceptibility multiplier in [0.70, 1.30]")
    status: DataStatusEnum = DataStatusEnum.VERIFIED_COMPLETE
    warning_message: Optional[str] = None

class WardExposureScore(BaseModel):
    ward_id: str
    ward_name: str
    locality: str
    zone: str
    date: Optional[str] = None
    exposure_score: float = Field(..., ge=0.0, le=100.0, description="Final environmental exposure score E(w, d)")
    risk_tier: RiskTierEnum
    hazard: HazardBreakdown
    susceptibility: SusceptibilityBreakdown
    data_lineage: DataLineageEnum = DataLineageEnum.DERIVED

class WardMetrics(BaseModel):
    ward_id: str
    ward_name: str
    locality: str
    zone: str
    area_sq_km: float
    total_population: int
    slum_population: int
    slum_ratio: float
    population_density_per_sq_km: float
    vulnerability_norm: float
    chronic_flood_hotspot_count: int
    flood_hotspot_density: float
    flood_propensity_F_norm: float
    centroid_lat: float
    centroid_lon: float

class CalculateExposureRequest(BaseModel):
    date: Optional[str] = Field(None, description="ISO date for July 2026 replay, e.g. '2026-07-05'")
    rainfall_overrides: Optional[Dict[str, float]] = Field(None, description="Per-ward rainfall overrides (ward_id -> mm)")
    uniform_rainfall_mm: Optional[float] = Field(None, ge=0.0, description="Uniform rainfall across all 24 wards")
    use_imd_window: bool = Field(False, description="Use IMD 08:30 IST 24-hour window instead of calendar day")

class TimelineMilestone(BaseModel):
    event_type: str
    timestamp_ist: str
    title: str
    description: str
    source_citation: str
    lead_time_hours_vs_alert: Optional[float] = None

class DailyExposureSummary(BaseModel):
    date: str
    mode: str = Field("HISTORICAL_OBSERVED", description="Operating mode: 'HISTORICAL_OBSERVED' or 'SIMULATED_SCENARIO'")
    wards: Dict[str, WardExposureScore]
    city_average_exposure: float
    city_max_exposure: float
    emergency_ward_count: int
    warning_ward_count: int
    watch_ward_count: int
    normal_ward_count: int
    milestones: List[TimelineMilestone] = []
