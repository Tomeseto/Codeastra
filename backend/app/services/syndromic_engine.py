import json
from pathlib import Path
from typing import Dict, Any, Optional, List
from backend.app.models.syndromic import (
    DailySyndromicPoint,
    VernacularFieldReport,
    WardSyndromicProfile,
    CitywideSyndromicSummary,
    ClinicalEntityExtraction
)

class SyndromicEngine:
    def __init__(self):
        self._data_path = Path(__file__).resolve().parent.parent.parent.parent / "data" / "processed" / "syndromic_surveillance_ears.json"
        self._cache: Optional[Dict[str, Any]] = None

    def _ensure_loaded(self) -> Dict[str, Any]:
        if self._cache is None:
            if not self._data_path.exists():
                raise FileNotFoundError(f"Syndromic surveillance dataset not found at {self._data_path}")
            with open(self._data_path, "r", encoding="utf-8") as f:
                self._cache = json.load(f)
        return self._cache

    def normalize_ward_id(self, ward_id: str) -> str:
        """Canonicalize ward ID by replacing slashes with hyphens and uppercasing (e.g. G/N -> G-N)."""
        return ward_id.replace("/", "-").strip().upper()

    def get_ward_syndromic_profile(self, ward_id: str, date: Optional[str] = None) -> Optional[WardSyndromicProfile]:
        data = self._ensure_loaded()
        wid = self.normalize_ward_id(ward_id)
        
        wards_dict = data.get("wards", {})
        if wid not in wards_dict:
            return None
            
        wdata = wards_dict[wid]
        time_series_raw = wdata.get("time_series", [])
        
        # Parse all points into models
        time_series = [DailySyndromicPoint(**p) for p in time_series_raw]
        
        # Select active day record (matching date or default to 2026-07-06)
        target_date = date.strip() if date else "2026-07-06"
        selected_record = None
        for p in time_series:
            if p.date == target_date:
                selected_record = p
                break
                
        # If target date not found in series, fallback to first active date or last point
        if selected_record is None:
            active_points = [p for p in time_series if p.is_active_timeline]
            selected_record = active_points[-1] if active_points else time_series[-1]
            
        return WardSyndromicProfile(
            ward_id=wid,
            ward_name=wdata["ward_name"],
            locality=wdata["locality"],
            zone=wdata["zone"],
            total_population=wdata["total_population"],
            slum_population=wdata["slum_population"],
            slum_ratio=wdata["slum_ratio"],
            pharmacy_count=wdata["pharmacy_count"],
            chv_asha_count=wdata["chv_asha_count"],
            selected_day=selected_record,
            time_series=time_series
        )

    def get_citywide_syndromic_summary(self, date: Optional[str] = None) -> CitywideSyndromicSummary:
        data = self._ensure_loaded()
        target_date = date.strip() if date else "2026-07-06"
        wards_dict = data.get("wards", {})
        
        crit_wards = []
        conv_wards = []
        z_scores = []
        
        for wid, w in wards_dict.items():
            for rec in w.get("time_series", []):
                if rec["date"] == target_date:
                    z = rec["composite_ears_zscore"]
                    z_scores.append(z)
                    if rec["syndromic_alert_tier"] == "CRITICAL_ABERRATION":
                        crit_wards.append(wid)
                    if rec["triangulation_quadrant"] == "CONVERGENT_ACTIVE_EPIDEMIC":
                        conv_wards.append(wid)
                    break
                    
        avg_z = round(sum(z_scores) / max(1, len(z_scores)), 2)
        
        return CitywideSyndromicSummary(
            date=target_date,
            total_monitored_pharmacies=data["metadata"].get("total_licensed_pharmacies_monitored", 6510),
            total_deployed_chvs=data["metadata"].get("total_frontline_chv_asha_monitored", 5000),
            critical_aberration_wards=crit_wards,
            convergent_epidemic_wards=conv_wards,
            citywide_avg_ears_zscore=avg_z,
            earliest_detection_lead_time_hours=48.0
        )

    def get_vernacular_telemetry_feed(self) -> List[VernacularFieldReport]:
        data = self._ensure_loaded()
        reports_raw = data.get("vernacular_field_telemetry", [])
        return [VernacularFieldReport(**r) for r in reports_raw]

# Global singleton
syndromic_engine = SyndromicEngine()
