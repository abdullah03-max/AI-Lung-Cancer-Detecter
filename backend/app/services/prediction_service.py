"""
Prediction Service for AI Model Inference.
Manages model loading, image validation, preprocessing, and inference execution.
"""

import io
from typing import Dict, Any, Optional
from PIL import Image

from backend.app.core.config import settings
from backend.ml.predict import LungCancerPredictor, DISCLAIMER_TEXT

class PredictionService:
    _instance: Optional["PredictionService"] = None
    _predictor: Optional[LungCancerPredictor] = None

    @classmethod
    def get_instance(cls) -> "PredictionService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        self._load_predictor()

    def _load_predictor(self):
        if settings.MODEL_PATH.exists() and settings.CLASS_INDICES_PATH.exists():
            try:
                self._predictor = LungCancerPredictor(
                    model_path=str(settings.MODEL_PATH),
                    class_indices_path=str(settings.CLASS_INDICES_PATH),
                    metadata_path=str(settings.MODEL_METADATA_PATH)
                )
            except Exception as e:
                print(f"[!] Warning: Could not initialize predictor: {e}")
                self._predictor = None
        else:
            self._predictor = None

    def is_model_ready(self) -> bool:
        if self._predictor is None:
            self._load_predictor()
        return self._predictor is not None and self._predictor.model is not None

    def validate_image_bytes(self, image_bytes: bytes, filename: str) -> Image.Image:
        """
        Thoroughly validates uploaded image data:
        checks file size, extension, corruption, and minimum dimensions.
        """
        if len(image_bytes) == 0:
            raise ValueError("Uploaded image file is empty.")

        if len(image_bytes) > settings.MAX_IMAGE_SIZE_BYTES:
            max_mb = settings.MAX_IMAGE_SIZE_BYTES / (1024 * 1024)
            raise ValueError(f"Uploaded file exceeds maximum size limit of {max_mb:.0f} MB.")

        # Check extension
        import os
        _, ext = os.path.splitext(filename)
        if ext.lower() not in settings.ALLOWED_IMAGE_EXTENSIONS:
            allowed = ", ".join(sorted(settings.ALLOWED_IMAGE_EXTENSIONS))
            raise ValueError(f"Unsupported image format '{ext}'. Allowed formats: {allowed}")

        # Check PIL integrity
        try:
            # First pass: verify file structure
            bio = io.BytesIO(image_bytes)
            with Image.open(bio) as im:
                im.verify()
        except Exception as e:
            raise ValueError(f"Corrupted or invalid image file: {str(e)}")

        # Second pass: reopen for processing
        try:
            bio = io.BytesIO(image_bytes)
            img = Image.open(bio)
            img.load()  # Force load pixel data
        except Exception as e:
            raise ValueError(f"Failed to decode image pixels: {str(e)}")

        # Validate dimensions
        if img.width < 32 or img.height < 32:
            raise ValueError(f"Image dimensions ({img.width}x{img.height}) are too small for an X-ray.")

        return img

    def predict_image_bytes(self, image_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Validates the image and runs model inference.
        """
        if not self.is_model_ready():
            raise RuntimeError(
                "Model is not ready or has not been trained yet. "
                "Please run `python backend/ml/train.py` to train the deep learning model."
            )

        img = self.validate_image_bytes(image_bytes, filename)
        result = self._predictor.predict(img)
        return result
