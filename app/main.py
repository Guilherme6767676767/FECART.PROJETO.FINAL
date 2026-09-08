from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers.coleta import router as coleta_router
from .routers.health import router as health_router

app = FastAPI(title="Sentinel IA Data Collection")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(coleta_router)
app.include_router(health_router)

# Root endpoint
@app.get("/")
async def raiz():
    return {"message": "Sentinel IA API"}
