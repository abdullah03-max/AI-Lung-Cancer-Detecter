"""
Main FastAPI Application Entry Point for Lung Cancer X-Ray AI Detector.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import settings
from backend.app.api.routes import router
from backend.app.services.prediction_service import PredictionService

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Check model readiness
    service = PredictionService.get_instance()
    if service.is_model_ready():
        print(f"[+] AI Model loaded and ready: {settings.MODEL_PATH}")
    else:
        print("[!] Note: AI Model not trained or found yet. Model info endpoint is available.")
    yield
    # Shutdown logic if needed
    print("[*] Backend shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Academic AI Research Prototype for Lung Cancer Chest X-Ray Classification.",
    lifespan=lifespan
)

# Configure Cross-Origin Resource Sharing (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows local Vite dev server and production clients
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
