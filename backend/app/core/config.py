"""
Application Configuration and Environment Settings.
"""

import os
from pathlib import Path
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "Lung Cancer X-Ray AI Detector"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # Supabase Credentials
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "")

    # CORS Allowed Origins
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Model and Storage Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    MODEL_PATH: Path = BASE_DIR / "models" / "best_lung_cancer_model.keras"
    CLASS_INDICES_PATH: Path = BASE_DIR / "models" / "class_indices.json"
    MODEL_METADATA_PATH: Path = BASE_DIR / "models" / "model_metadata.json"
    EVALUATION_METRICS_PATH: Path = BASE_DIR / "models" / "evaluation_metrics.json"
    DATASET_SUMMARY_PATH: Path = BASE_DIR / "models" / "dataset_summary.json"

    # Image upload constraints
    MAX_IMAGE_SIZE_BYTES: int = 15 * 1024 * 1024  # 15 MB
    ALLOWED_IMAGE_EXTENSIONS: set[str] = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

settings = Settings()
