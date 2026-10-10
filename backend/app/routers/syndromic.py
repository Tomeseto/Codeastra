from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from backend.app.models.syndromic import (
    WardSyndromicProfile,
    CitywideSyndromicSummary,
    VernacularFieldReport
)
from backend.app.services.syndromic_engine import syndromic_engine

router = APIRouter(prefix="/syndromic", tags=["Syndromic Surveillance (CDC EARS)"])

@router.get("/ward/{ward_id:path}", response_model=WardSyndromicProfile, summary="Get Ward Syndromic Aberration Profile")
def get_ward_syndromic_profile(
    ward_id: str,
    date: Optional[str] = Query(None, description="Timeline date filter in YYYY-MM-DD format (default: 2026-07-06)")
):
    """
    Retrieve real-time syndromic surveillance telemetry and CDC EARS C2 aberration
    scores for a municipal ward based on 6,510 retail pharmacies and 5,000 BMC CHVs.
    """
    profile = syndromic_engine.get_ward_syndromic_profile(ward_id, date=date)
    if not profile:
        raise HTTPException(
            status_code=404,
            detail=f"Ward '{ward_id}' not found in syndromic surveillance register"
        )
    return profile

@router.get("/summary", response_model=CitywideSyndromicSummary, summary="Get Citywide Syndromic Surveillance Summary")
def get_citywide_syndromic_summary(
    date: Optional[str] = Query(None, description="Query date in YYYY-MM-DD format (default: 2026-07-06)")
):
    """
    Citywide aggregation of syndromic aberration flags, convergent active epidemic wards,
    and lead-time advantage statistics across all 24 municipal wards.
    """
    return syndromic_engine.get_citywide_syndromic_summary(date=date)

@router.get("/vernacular-feed", response_model=List[VernacularFieldReport], summary="Get ASHA Vernacular Audio Telemetry Feed")
def get_vernacular_telemetry_feed():
    """
    Returns authentic grassroots Marathi and Hindi field reports from frontline CHVs/ASHAs
    in high-risk slum basins, complete with clinical entity extraction and triage advisories.
    """
    return syndromic_engine.get_vernacular_telemetry_feed()
