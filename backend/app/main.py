from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.routers import wards, exposure, action, incubation, syndromic

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

# Include Routers (supporting both /api/v1 and /v1 for Vercel serverless proxies)
app.include_router(wards.router, prefix=settings.API_V1_STR)
app.include_router(wards.router, prefix="/v1")
app.include_router(exposure.router, prefix=settings.API_V1_STR)
app.include_router(exposure.router, prefix="/v1")
app.include_router(action.router, prefix=settings.API_V1_STR)
app.include_router(action.router, prefix="/v1")
app.include_router(incubation.router, prefix=settings.API_V1_STR)
app.include_router(incubation.router, prefix="/v1")
app.include_router(syndromic.router, prefix=settings.API_V1_STR)
app.include_router(syndromic.router, prefix="/v1")

@app.get("/health", tags=["System"])
@app.get("/api/health", tags=["System"])
@app.get("/api/v1/health", tags=["System"])
@app.get("/v1/health", tags=["System"])
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
            "timeline": f"{settings.API_V1_STR}/exposure/timeline",
            "action_directive": f"{settings.API_V1_STR}/action/directive/{{ward_id}}",
            "action_clinics": f"{settings.API_V1_STR}/action/clinics/{{ward_id}}",
            "surge_curve": f"{settings.API_V1_STR}/epidemiology/surge-curve/{{ward_id}}",
            "benchmarks": f"{settings.API_V1_STR}/benchmarks",
            "syndromic_ward": f"{settings.API_V1_STR}/syndromic/ward/{{ward_id}}",
            "syndromic_summary": f"{settings.API_V1_STR}/syndromic/summary",
            "syndromic_vernacular_feed": f"{settings.API_V1_STR}/syndromic/vernacular-feed"
        }
    }
