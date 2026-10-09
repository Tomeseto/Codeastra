from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Optional
from backend.app.models.exposure import (
    CalculateExposureRequest,
    DailyExposureSummary,
    WardExposureScore
)
from backend.app.services.exposure_engine import exposure_engine
from backend.app.services.data_loader import data_loader

router = APIRouter(prefix="/exposure", tags=["Exposure Scoring"])

@router.post("/calculate", summary="Calculate environmental exposure scores for 24 wards")
def calculate_exposure(request: CalculateExposureRequest) -> DailyExposureSummary:
    """
    Computes deterministic ward exposure scores E(w, d) across all 24 wards.
    Supports historical date lookup, uniform scenario rainfall, or per-ward overrides.
    """
    target_date = request.date or "2026-07-05"
    return exposure_engine.evaluate_timeline_date(
        date_str=target_date,
        use_imd_window=request.use_imd_window,
        rainfall_overrides=request.rainfall_overrides,
        uniform_rainfall_mm=request.uniform_rainfall_mm
    )

@router.get("/timeline", summary="Get complete July 2026 daily exposure timeseries")
def get_timeline_timeseries(
    use_imd_window: bool = Query(False, description="Use 08:30 IST IMD window")
) -> Dict[str, Any]:
    """
    Returns the complete July 2026 replay sequence (2026-06-30 to 2026-07-10),
    with daily calculated exposure scores across all 24 wards and historical milestones.
    """
    weather_series = data_loader.weather_series
    all_dates = []
    
    # Extract unique dates from weather series
    if "wards" in weather_series:
        sample_wid = next(iter(weather_series["wards"]))
        all_dates = [item["date"] for item in weather_series["wards"][sample_wid].get("daily_series", [])]

    timeline_days: List[DailyExposureSummary] = []
    for d in all_dates:
        summary = exposure_engine.evaluate_timeline_date(d, use_imd_window=use_imd_window)
        timeline_days.append(summary)

    return {
        "metadata": {
            "title": "VARSHA July 2026 Historical Replay Series",
            "start_date": all_dates[0] if all_dates else None,
            "end_date": all_dates[-1] if all_dates else None,
            "total_days": len(timeline_days),
            "use_imd_window": use_imd_window
        },
        "days": timeline_days
    }

@router.get("/timeline/{date_str}", summary="Get exposure summary for a specific replay date")
def get_timeline_date(
    date_str: str,
    use_imd_window: bool = Query(False, description="Use 08:30 IST IMD window")
) -> DailyExposureSummary:
    weather_series = data_loader.weather_series
    available_dates = []
    if "wards" in weather_series:
        sample_wid = next(iter(weather_series["wards"]))
        available_dates = [item["date"] for item in weather_series["wards"][sample_wid].get("daily_series", [])]
    
    if date_str not in available_dates:
        start_d = available_dates[0] if available_dates else "unknown"
        end_d = available_dates[-1] if available_dates else "unknown"
        raise HTTPException(
            status_code=404,
            detail=f"Date '{date_str}' is outside verified July 2026 historical replay series (available range: {start_d} to {end_d})."
        )
    return exposure_engine.evaluate_timeline_date(date_str, use_imd_window=use_imd_window)
