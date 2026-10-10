from pydantic import BaseModel, Field
from typing import List, Optional

class ClinicInfo(BaseModel):
    clinic_id: str
    name: str
    ward_id: str
    locality: Optional[str] = ""
    address: str
    operating_hours: str = "9:00 AM - 2:00 PM & 3:00 PM - 8:00 PM"
    contact: Optional[str] = ""
    services: str = "Free Doxycycline Prophylaxis & Rapid Diagnostics"
    lat: Optional[float] = None
    lon: Optional[float] = None
    stock_status: Optional[str] = "STOCKED"
    prophylaxis_available: bool = True

class ProphylaxisDemand(BaseModel):
    slum_population: int = Field(..., ge=0, description="Census 2011 vulnerable slum population")
    exposure_score: float = Field(..., ge=0.0, le=100.0, description="Calculated environmental exposure score")
    risk_tier: str = Field(..., description="NORMAL | WATCH | WARNING | EMERGENCY")
    exposure_factor: float = Field(..., ge=0.0, le=1.0, description="Prophylaxis mobilization ratio based on risk tier")
    doxycycline_packs_recommended: int = Field(..., ge=0, description="Recommended Doxycycline 200mg single dose blister packs")
    mobile_fever_vans_required: int = Field(..., ge=0, description="Mobile Fever Outreach Vans to deploy (0, 1, or 2)")
    priority_level: str = Field(..., description="IMMEDIATE | ELEVATED | STANDBY | BASELINE")
    target_protocol: str = "Doxycycline 200mg single dose within 24-72h of floodwater exposure"

class MultiLingualAdvisory(BaseModel):
    marathi: str
    hindi: str
    english: str

class WardMunicipalDirective(BaseModel):
    ward_id: str
    ward_name: str
    locality: str
    zone: str
    exposure_score: float
    risk_tier: str
    prophylaxis: ProphylaxisDemand
    advisory: MultiLingualAdvisory
    clinics: List[ClinicInfo] = []
    generated_at: str
