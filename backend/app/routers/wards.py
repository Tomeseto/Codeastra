from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from backend.app.services.data_loader import data_loader

router = APIRouter(prefix="/wards", tags=["Wards"])

@router.get("", summary="Get 24 Mumbai Wards GeoJSON FeatureCollection")
def get_wards_geojson() -> Dict[str, Any]:
    """
    Returns the canonical 24 Mumbai administrative wards GeoJSON FeatureCollection,
    enriched with demographic vulnerability, population, and flood propensity attributes.
    """
    geojson = dict(data_loader.geojson)
    enriched_features = []
    
    for feat in geojson.get("features", []):
        f_copy = dict(feat)
        props = dict(f_copy.get("properties", {}))
        wid = props.get("ward_id")
        
        # Merge vulnerability & flood data
        vuln = data_loader.vulnerability.get(wid, {})
        flood = data_loader.flood_wards.get(wid, {})
        
        props["total_population"] = vuln.get("total_population_2011", 0)
        props["slum_population"] = vuln.get("slum_population_2011", 0)
        props["slum_ratio"] = vuln.get("slum_ratio", 0.0)
        props["population_density"] = vuln.get("population_density_per_sq_km", 0.0)
        props["vulnerability_norm"] = vuln.get("vulnerability_norm", 0.0)
        props["verified_flood_hotspot_count"] = flood.get("verified_hotspot_count", 0)
        props["flood_propensity_F_norm"] = flood.get("f_norm", 0.0)
        props["data_lineage"] = "OBSERVED"
        
        f_copy["properties"] = props
        enriched_features.append(f_copy)
        
    geojson["features"] = enriched_features
    return geojson

@router.get("/list", summary="Get tabular list of 24 ward metrics")
def get_wards_list() -> List[Dict[str, Any]]:
    """Returns a flat list of 24 wards with demographic and flood indicators."""
    return data_loader.get_ward_list()

@router.get("/{ward_id}", summary="Get detailed profile for a specific ward")
def get_ward_detail(ward_id: str) -> Dict[str, Any]:
    normalized_id = ward_id.upper().replace("/", "-")
    meta = data_loader.wards_metadata.get(normalized_id)
    if not meta:
        raise HTTPException(status_code=404, detail=f"Ward '{ward_id}' not found in 24 canonical wards.")
    
    vuln = data_loader.vulnerability.get(normalized_id, {})
    flood = data_loader.flood_wards.get(normalized_id, {})
    ward_hotspots = [h for h in data_loader.flood_hotspots if h.get("ward_id") == normalized_id]
    
    return {
        "metadata": meta,
        "demographics": vuln,
        "flood_indicators": flood,
        "chronic_hotspots": ward_hotspots
    }

@router.get("/{ward_id}/hotspots", summary="Get verified flood hotspots in a specific ward")
def get_ward_hotspots(ward_id: str) -> List[Dict[str, Any]]:
    normalized_id = ward_id.upper().replace("/", "-")
    if normalized_id not in data_loader.wards_metadata:
        raise HTTPException(status_code=404, detail=f"Ward '{ward_id}' not found.")
    return [h for h in data_loader.flood_hotspots if h.get("ward_id") == normalized_id]
