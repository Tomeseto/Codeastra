from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
from typing import Dict, Any

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="VARSHA_", case_sensitive=True)
    
    PROJECT_NAME: str = "VARSHA Municipal Health Surveillance Engine"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True
    
    # Path settings
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    DATA_PROCESSED_DIR: Path = BASE_DIR / "data" / "processed"
    
    # Mathematical Model Weights (Configurable)
    BASE_MULTIPLIER: float = 0.70
    WEIGHT_FLOOD: float = 0.30
    WEIGHT_VULNERABILITY: float = 0.30
    
    # IMD Rainfall Thresholds (mm / 24h)
    IMD_LIGHT_MM: float = 35.5
    IMD_MODERATE_MM: float = 64.5
    IMD_HEAVY_MM: float = 115.6
    IMD_VERY_HEAVY_MM: float = 204.5
    
    # Risk Tier Boundaries (Score in [0, 100])
    TIER_NORMAL_MAX: float = 30.0
    TIER_WATCH_MAX: float = 55.0
    TIER_WARNING_MAX: float = 75.0

settings = Settings()
