import json
import csv
from pathlib import Path
from typing import Dict, Any, List
from backend.app.config import settings

class DataLoader:
    _instance = None
    
    def __init__(self):
        self.geojson: Dict[str, Any] = {}
        self.vulnerability: Dict[str, Dict[str, Any]] = {}
        self.flood_data: Dict[str, Any] = {}
        self.flood_wards: Dict[str, Dict[str, Any]] = {}
        self.flood_hotspots: List[Dict[str, Any]] = []
        self.weather_series: Dict[str, Any] = {}
        self.wards_metadata: Dict[str, Dict[str, Any]] = {}
        self._load_all()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = DataLoader()
        return cls._instance

    def _load_all(self):
        processed_dir = settings.DATA_PROCESSED_DIR
        if not processed_dir.exists():
            for candidate in [
                Path.cwd() / "data" / "processed",
                Path(__file__).resolve().parent.parent.parent.parent / "data" / "processed",
                Path("/var/task") / "data" / "processed"
            ]:
                if candidate.exists():
                    processed_dir = candidate
                    break
        
        # 1. Load GeoJSON
        geojson_path = processed_dir / "mumbai_wards_24.geojson"
        with open(geojson_path, "r", encoding="utf-8") as f:
            self.geojson = json.load(f)
            
        for feat in self.geojson.get("features", []):
            p = feat.get("properties", {})
            wid = p.get("ward_id")
            if wid:
                self.wards_metadata[wid] = {
                    "ward_id": wid,
                    "ward_name": p.get("ward_name", wid),
                    "locality": p.get("locality", ""),
                    "zone": p.get("zone", ""),
                    "area_sq_km": p.get("area_sq_km", 0.0),
                    "centroid_lat": p.get("centroid_lat", 0.0),
                    "centroid_lon": p.get("centroid_lon", 0.0)
                }

        # 2. Load Census Vulnerability CSV
        census_path = processed_dir / "ward_census_vulnerability.csv"
        with open(census_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                wid = row["ward_id"]
                self.vulnerability[wid] = {
                    "ward_id": wid,
                    "total_population_2011": int(row["total_population_2011"]),
                    "slum_population_2011": int(row["slum_population_2011"]),
                    "nonslum_population_2011": int(row["nonslum_population_2011"]),
                    "slum_ratio": float(row["slum_ratio"]),
                    "population_density_per_sq_km": float(row["population_density_per_sq_km"]),
                    "density_norm": float(row["density_norm"]),
                    "vulnerability_raw": float(row["vulnerability_raw"]),
                    "vulnerability_norm": float(row["vulnerability_norm"]),
                    "data_lineage": row.get("data_lineage", "OBSERVED")
                }

        # 3. Load Chronic Flood Hotspots
        flood_path = processed_dir / "verified_flood_hotspots.json"
        with open(flood_path, "r", encoding="utf-8") as f:
            self.flood_data = json.load(f)
            self.flood_wards = self.flood_data.get("wards", {})
            self.flood_hotspots = self.flood_data.get("hotspots", [])

        # 4. Load Weather Time Machine Series
        weather_path = processed_dir / "weather_july_2026_ist.json"
        with open(weather_path, "r", encoding="utf-8") as f:
            self.weather_series = json.load(f)

    def get_ward_list(self) -> List[Dict[str, Any]]:
        wards_list = []
        for wid, meta in sorted(self.wards_metadata.items()):
            vuln = self.vulnerability.get(wid, {})
            f_info = self.flood_wards.get(wid, {})
            
            wards_list.append({
                "ward_id": wid,
                "ward_name": meta["ward_name"],
                "locality": meta["locality"],
                "zone": meta["zone"],
                "area_sq_km": meta["area_sq_km"],
                "centroid_lat": meta["centroid_lat"],
                "centroid_lon": meta["centroid_lon"],
                "total_population": vuln.get("total_population_2011", 0),
                "slum_population": vuln.get("slum_population_2011", 0),
                "slum_ratio": vuln.get("slum_ratio", 0.0),
                "population_density_per_sq_km": vuln.get("population_density_per_sq_km", 0.0),
                "vulnerability_norm": vuln.get("vulnerability_norm", 0.0),
                "chronic_flood_hotspot_count": f_info.get("verified_hotspot_count", 0),
                "flood_hotspot_density": f_info.get("hotspot_density_per_sq_km", 0.0),
                "flood_propensity_F_norm": f_info.get("f_norm", 0.0)
            })
        return wards_list

data_loader = DataLoader.get_instance()
