from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from backend.app.models.action import (
    WardMunicipalDirective,
    ClinicInfo
)
from backend.app.services.action_engine import action_engine
from backend.app.services.data_loader import data_loader

router = APIRouter(prefix="/action", tags=["Civic Action Directives"])

@router.get("/directive/{ward_id}", summary="Get unified municipal action directive for a ward")
def get_ward_directive(
    ward_id: str,
    exposure_score: float = Query(75.0, ge=0.0, le=100.0, description="Ward environmental exposure score E(w, d)")
) -> WardMunicipalDirective:
    """
    Returns clinical prophylaxis requirements (Doxycycline doses),
    mobile fever van allocation, verified Marathi/Hindi/English advisories,
    and local Aapla Dawakhana clinics for the specified ward.
    """
    normalized_id = ward_id.upper().replace("/", "-")
    if normalized_id not in data_loader.wards_metadata:
        raise HTTPException(
            status_code=404,
            detail=f"Ward '{ward_id}' not found in 24 canonical Mumbai wards."
        )

    return action_engine.generate_ward_directive(normalized_id, exposure_score=exposure_score)

@router.get("/clinics/{ward_id}", summary="Get Aapla Dawakhana clinics in a specific ward")
def get_ward_clinics(ward_id: str) -> List[ClinicInfo]:
    """
    Returns Hinduhridaysamrat Balasaheb Thackeray Aapla Dawakhana urban dispensaries
    mapped within the specified ward polygon.
    """
    normalized_id = ward_id.upper().replace("/", "-")
    if normalized_id not in data_loader.wards_metadata:
        raise HTTPException(
            status_code=404,
            detail=f"Ward '{ward_id}' not found in 24 canonical Mumbai wards."
        )

    return action_engine.get_clinics_for_ward(normalized_id)

@router.get("/clinics", summary="Get all Aapla Dawakhana clinics citywide")
def get_all_clinics() -> List[ClinicInfo]:
    """Returns all mapped Aapla Dawakhana clinics across Greater Mumbai."""
    all_clinics = []
    for wid in sorted(data_loader.wards_metadata.keys()):
        all_clinics.extend(action_engine.get_clinics_for_ward(wid))
    return all_clinics
