from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers.coleta import router as coleta_router
from .routers.health import router as health_router
from .routers.geodata import router as geodata_router

app = FastAPI(title="Sentinel IA Data Collection")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(coleta_router)
app.include_router(health_router)
app.include_router(geodata_router)

# Mount legacy backend app if available
try:
    import sys, os
    backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
    if backend_path not in sys.path:
        sys.path.insert(0, backend_path)
    from main import app as legacy_app
    app.mount("", legacy_app)
except Exception as exc:
    pass

# Root endpoint
@app.get("/api/v1/ping")
async def raiz():
    return {"message": "Sentinel IA API"}
