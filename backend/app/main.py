from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.routers import wards, exposure

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Vector-And-Rain-driven Surveillance for Health Alerts (VARSHA) — Public Health Early-Warning Decision Support Engine for Mumbai",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for local dev servers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(wards.router, prefix=settings.API_V1_STR)
app.include_router(exposure.router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["System"])
@app.get(f"{settings.API_V1_STR}/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": "varsha-backend",
        "version": "1.0.0",
        "data_status": "loaded"
    }

@app.get("/", tags=["System"])
def root():
    return {
        "project": "VARSHA",
        "full_name": "Vector-And-Rain-driven Surveillance for Health Alerts",
        "jurisdiction": "Brihanmumbai Municipal Corporation (BMC / MCGM), Mumbai",
        "documentation": "/docs",
        "endpoints": {
            "health": "/health",
            "wards_geojson": f"{settings.API_V1_STR}/wards",
            "wards_list": f"{settings.API_V1_STR}/wards/list",
            "calculate_exposure": f"{settings.API_V1_STR}/exposure/calculate",
            "timeline": f"{settings.API_V1_STR}/exposure/timeline"
        }
    }
