from typing import Dict, Optional, Tuple, List, Any
from backend.app.config import settings
from backend.app.models.exposure import (
    WardExposureScore,
    HazardBreakdown,
    SusceptibilityBreakdown,
    RiskTierEnum,
    DataStatusEnum,
    DataLineageEnum,
    DailyExposureSummary,
    TimelineMilestone
)
from backend.app.services.data_loader import data_loader

# Verified historical milestones for July 2026 replay
JULY_2026_MILESTONES: Dict[str, List[TimelineMilestone]] = {
    "2026-07-01": [
        TimelineMilestone(
            event_type="DELUGE_ONSET",
            timestamp_ist="2026-07-01T08:30:00+05:30",
            title="Monsoon Deluge Onset",
            description="Intense continuous downpours hit Island City and Western Suburbs (75-105 mm). Low-lying pockets report early waterlogging.",
            source_citation="IMD Mumbai Daily Bulletin & Open-Meteo"
        )
    ],
    "2026-07-04": [
        TimelineMilestone(
            event_type="SURGE_ACCELERATION",
            timestamp_ist="2026-07-04T12:00:00+05:30",
            title="Catchment Saturation",
            description="Soil saturation exceeds absorption threshold; Mithi River water level rises near Kranti Nagar (Ward L). Hindmata and Milan Subway flooded.",
            source_citation="BMC Disaster Management Cell Updates"
        )
    ],
    "2026-07-05": [
        TimelineMilestone(
            event_type="VARSHA_EMERGENCY_TRIGGER",
            timestamp_ist="2026-07-05T08:30:00+05:30",
            title="VARSHA Early-Warning Emergency Trigger",
            description="VARSHA calculates EMERGENCY exposure (scores > 75.0) across Wards C, G-N, L, and B. Acute 72-hour leptospirosis prophylaxis window opens.",
            source_citation="VARSHA Algorithmic Surveillance Engine",
            lead_time_hours_vs_alert=38.15
        )
    ],
    "2026-07-06": [
        TimelineMilestone(
            event_type="OFFICIAL_BMC_ADVISORY",
            timestamp_ist="2026-07-06T22:39:00+05:30",
            title="Retrospective BMC Leptospirosis Advisory Issued",
            description="BMC issues public warning urging citizens who waded through floodwaters to take prophylactic doxycycline/azithromycin within 72 hours.",
            source_citation="Free Press Journal (6 July 2026, 10:39 PM IST)",
            lead_time_hours_vs_alert=0.0
        )
    ],
    "2026-07-10": [
        TimelineMilestone(
            event_type="OUTBREAK_VALIDATION",
            timestamp_ist="2026-07-10T18:00:00+05:30",
            title="Official Outbreak Case Jump",
            description="BMC Epidemiology Cell confirms Mumbai leptospirosis cases surged from 33 in June to 78 in July following the 1–7 July inundation.",
            source_citation="BMC Public Health Department Monthly Review (July 2026)"
        )
    ]
}

class ExposureEngine:
    @staticmethod
    def calculate_hazard_H(rainfall_mm: float) -> Tuple[float, str]:
        """
        Piecewise continuous meteorological hazard function mapped directly from
        official India Meteorological Department (IMD) 24h classification thresholds:
        - R = 0.0 -> H = 0.0
        - 0 < R < 35.5 (Light) -> [0, 20)
        - 35.5 <= R < 64.5 (Moderate) -> [20, 40)
        - 64.5 <= R < 115.6 (Heavy) -> [40, 65)
        - 115.6 <= R < 204.5 (Very Heavy) -> [65, 90)
        - R >= 204.5 (Extremely Heavy) -> [90, 100]
        """
        R = max(0.0, float(rainfall_mm))
        
        if R == 0.0:
            return 0.0, "Zero / Dry"
        elif R < settings.IMD_LIGHT_MM:
            h = (R / settings.IMD_LIGHT_MM) * 20.0
            return round(h, 4), "Light Rain (< 35.5 mm)"
        elif R < settings.IMD_MODERATE_MM:
            fraction = (R - settings.IMD_LIGHT_MM) / (settings.IMD_MODERATE_MM - settings.IMD_LIGHT_MM)
            h = 20.0 + fraction * 20.0
            return round(h, 4), "Moderate Rain (35.5 - 64.5 mm)"
        elif R < settings.IMD_HEAVY_MM:
            fraction = (R - settings.IMD_MODERATE_MM) / (settings.IMD_HEAVY_MM - settings.IMD_MODERATE_MM)
            h = 40.0 + fraction * 25.0
            return round(h, 4), "Heavy Rain (64.5 - 115.6 mm)"
        elif R < settings.IMD_VERY_HEAVY_MM:
            fraction = (R - settings.IMD_HEAVY_MM) / (settings.IMD_VERY_HEAVY_MM - settings.IMD_HEAVY_MM)
            h = 65.0 + fraction * 25.0
            return round(h, 4), "Very Heavy Rain (115.6 - 204.5 mm)"
        else:
            fraction = min(1.0, (R - settings.IMD_VERY_HEAVY_MM) / 100.0)
            h = 90.0 + fraction * 10.0
            return round(h, 4), "Extremely Heavy Deluge (>= 204.5 mm)"

    @staticmethod
    def calculate_susceptibility_M(
        flood_propensity_F_norm: Optional[float],
        vulnerability_V_norm: float,
        w_F: float = settings.WEIGHT_FLOOD,
        w_V: float = settings.WEIGHT_VULNERABILITY
    ) -> Tuple[float, DataStatusEnum, Optional[str]]:
        """
        Computes the ward susceptibility multiplier M(w) in [0.70, 1.30].
        Strict Missing Data Protocol:
        If F_norm is None, never substitute artificial default (0.50).
        Recalibrate on V_norm alone preserving the [0.70, 1.30] range, and tag PROVISIONAL_PARTIAL.
        """
        V = max(0.0, min(1.0, float(vulnerability_V_norm)))
        
        if flood_propensity_F_norm is None:
            m = settings.BASE_MULTIPLIER + 0.60 * V
            return (
                round(m, 4),
                DataStatusEnum.PROVISIONAL_PARTIAL,
                "Verified flood-hotspot mapping missing for this ward; score reflects hazard and demographic vulnerability only."
            )
        
        F = max(0.0, min(1.0, float(flood_propensity_F_norm)))
        m = settings.BASE_MULTIPLIER + w_F * F + w_V * V
        m_clamped = max(0.70, min(1.30, m))
        return round(m_clamped, 4), DataStatusEnum.VERIFIED_COMPLETE, None

    @classmethod
    def calculate_ward_exposure(
        cls,
        ward_id: str,
        rainfall_mm: float,
        date_str: Optional[str] = None,
        data_lineage: DataLineageEnum = DataLineageEnum.DERIVED
    ) -> WardExposureScore:
        meta = data_loader.wards_metadata.get(ward_id, {})
        vuln = data_loader.vulnerability.get(ward_id, {})
        flood = data_loader.flood_wards.get(ward_id, {})
        
        V_norm = vuln.get("vulnerability_norm", 0.50)
        F_norm = flood.get("f_norm", None)
        
        H, imd_cat = cls.calculate_hazard_H(rainfall_mm)
        M, status, warning = cls.calculate_susceptibility_M(F_norm, V_norm)
        
        raw_exposure = H * M
        final_score = min(100.0, round(raw_exposure, 1))
        
        if final_score < settings.TIER_NORMAL_MAX:
            tier = RiskTierEnum.NORMAL
        elif final_score < settings.TIER_WATCH_MAX:
            tier = RiskTierEnum.WATCH
        elif final_score < settings.TIER_WARNING_MAX:
            tier = RiskTierEnum.WARNING
        else:
            tier = RiskTierEnum.EMERGENCY

        return WardExposureScore(
            ward_id=ward_id,
            ward_name=meta.get("ward_name", ward_id),
            locality=meta.get("locality", ""),
            zone=meta.get("zone", ""),
            date=date_str,
            exposure_score=final_score,
            risk_tier=tier,
            hazard=HazardBreakdown(
                rainfall_mm=round(rainfall_mm, 2),
                hazard_score_H=round(H, 3),
                imd_category=imd_cat
            ),
            susceptibility=SusceptibilityBreakdown(
                base_multiplier=settings.BASE_MULTIPLIER,
                flood_propensity_F_norm=F_norm,
                demographic_vulnerability_V_norm=round(V_norm, 4),
                weight_flood=settings.WEIGHT_FLOOD,
                weight_vulnerability=settings.WEIGHT_VULNERABILITY,
                multiplier_M=round(M, 3),
                status=status,
                warning_message=warning
            ),
            data_lineage=data_lineage
        )

    @classmethod
    def evaluate_timeline_date(
        cls,
        date_str: str,
        use_imd_window: bool = False,
        rainfall_overrides: Optional[Dict[str, float]] = None,
        uniform_rainfall_mm: Optional[float] = None
    ) -> DailyExposureSummary:
        ward_scores: Dict[str, WardExposureScore] = {}
        is_simulated = (rainfall_overrides is not None or uniform_rainfall_mm is not None)
        lineage = DataLineageEnum.ESTIMATED if is_simulated else DataLineageEnum.DERIVED
        operating_mode = "SIMULATED_SCENARIO" if is_simulated else "HISTORICAL_OBSERVED"
        
        for wid in sorted(data_loader.wards_metadata.keys()):
            rainfall_val = 0.0
            
            if rainfall_overrides and wid in rainfall_overrides:
                rainfall_val = rainfall_overrides[wid]
            elif uniform_rainfall_mm is not None:
                rainfall_val = uniform_rainfall_mm
            else:
                # Look up from ingested weather series
                w_info = data_loader.weather_series.get("wards", {}).get(wid, {})
                series = w_info.get("daily_series", [])
                match = next((s for s in series if s["date"] == date_str), None)
                if match:
                    if use_imd_window:
                        rainfall_val = match.get("rainfall_imd_0830_window_mm", match.get("rainfall_daily_mm", 0.0))
                    else:
                        rainfall_val = match.get("rainfall_daily_mm", 0.0)
                else:
                    rainfall_val = 0.0

            score = cls.calculate_ward_exposure(wid, rainfall_val, date_str=date_str, data_lineage=lineage)
            ward_scores[wid] = score

        scores_list = [ws.exposure_score for ws in ward_scores.values()]
        avg_score = round(sum(scores_list) / len(scores_list), 1) if scores_list else 0.0
        max_score = max(scores_list) if scores_list else 0.0
        
        emergency_count = sum(1 for ws in ward_scores.values() if ws.risk_tier == RiskTierEnum.EMERGENCY)
        warning_count = sum(1 for ws in ward_scores.values() if ws.risk_tier == RiskTierEnum.WARNING)
        watch_count = sum(1 for ws in ward_scores.values() if ws.risk_tier == RiskTierEnum.WATCH)
        normal_count = sum(1 for ws in ward_scores.values() if ws.risk_tier == RiskTierEnum.NORMAL)
        
        milestones = JULY_2026_MILESTONES.get(date_str, [])

        return DailyExposureSummary(
            date=date_str,
            mode=operating_mode,
            wards=ward_scores,
            city_average_exposure=avg_score,
            city_max_exposure=max_score,
            emergency_ward_count=emergency_count,
            warning_ward_count=warning_count,
            watch_ward_count=watch_count,
            normal_ward_count=normal_count,
            milestones=milestones
        )

exposure_engine = ExposureEngine()
