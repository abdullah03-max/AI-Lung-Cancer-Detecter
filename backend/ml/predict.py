"""
Inference Module for Lung Cancer X-Ray AI Detector.
Validates images, executes model inference, and formats class probabilities.
Includes Chest X-Ray validation to reject non-medical images, wallpapers,
people, and out-of-distribution photos before clinical analysis.
"""

import os
import sys
import json
import argparse
from pathlib import Path
from typing import Dict, Any, Optional, Tuple, Union

import numpy as np
from PIL import Image

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
import tensorflow as tf
from tensorflow import keras

try:
    from backend.ml.xray_validator import ChestXRayValidator
except ImportError:
    from xray_validator import ChestXRayValidator

# Standard clinical disclaimer
DISCLAIMER_TEXT = (
    "This application is an academic AI research prototype. Its predictions are experimental "
    "and are not a medical diagnosis. Results must not be used to make treatment decisions. "
    "Consult a qualified medical professional for clinical evaluation."
)

class LungCancerPredictor:
    """
    Production-ready inference class for the Lung Cancer X-Ray Detector.
    Integrates Multi-Stage Chest X-Ray verification.
    """
    def __init__(
        self,
        model_path: str = "backend/models/best_lung_cancer_model.keras",
        class_indices_path: str = "backend/models/class_indices.json",
        metadata_path: str = "backend/models/model_metadata.json"
    ):
        self.model_path = Path(model_path)
        self.class_indices_path = Path(class_indices_path)
        self.metadata_path = Path(metadata_path)
        self.model: Optional[keras.Model] = None
        self.feature_extractor: Optional[keras.Model] = None
        self.classes: list = []
        self.class_to_idx: dict = {}
        self.idx_to_class: dict = {}
        self.metadata: dict = {}
        self.validator = ChestXRayValidator()
        self._load_artifacts()

    def _load_artifacts(self):
        """Loads model weights, class indices, and metadata."""
        if not self.model_path.exists():
            raise FileNotFoundError(
                f"Trained model not found at '{self.model_path}'. "
                "Please train the model first by running `backend/ml/train.py`."
            )
        if not self.class_indices_path.exists():
            raise FileNotFoundError(
                f"Class indices not found at '{self.class_indices_path}'."
            )

        with open(self.class_indices_path, "r") as f:
            mapping = json.load(f)
        self.classes = mapping["classes"]
        self.class_to_idx = mapping["class_to_idx"]
        self.idx_to_class = {int(k): v for k, v in mapping["idx_to_class"].items()}

        if self.metadata_path.exists():
            with open(self.metadata_path, "r") as f:
                self.metadata = json.load(f)

        print(f"[*] Loading trained model: {self.model_path}")
        self.model = keras.models.load_model(str(self.model_path))

        # Build submodel for feature extraction
        try:
            pool_layer = self.model.get_layer("global_avg_pool")
            self.feature_extractor = keras.Model(inputs=self.model.input, outputs=pool_layer.output)
        except Exception:
            self.feature_extractor = None

        print(f"[+] Model loaded successfully. Classes: {self.classes}")

    def load_pil_image(self, image_input: Union[str, Path, Image.Image, bytes]) -> Image.Image:
        """Loads and returns a verified PIL Image object."""
        if isinstance(image_input, (str, Path)):
            path = Path(image_input)
            if not path.exists():
                raise FileNotFoundError(f"Image not found at: {path}")
            try:
                img = Image.open(path)
            except Exception as err:
                raise ValueError(f"Unreadable or corrupted image file: {err}")
        elif isinstance(image_input, bytes):
            import io
            try:
                img = Image.open(io.BytesIO(image_input))
            except Exception as err:
                raise ValueError(f"Failed to decode image bytes: {err}")
        elif isinstance(image_input, Image.Image):
            img = image_input
        else:
            raise TypeError("Unsupported image input type.")

        if img.width < 10 or img.height < 10:
            raise ValueError(f"Image dimensions too small ({img.width}x{img.height}) to be a valid chest X-ray.")

        return img

    def preprocess_image(self, image_input: Union[str, Path, Image.Image, bytes]) -> Tuple[np.ndarray, Image.Image]:
        """
        Validates, normalizes, and resizes image to (1, 224, 224, 3) for inference.
        Returns the preprocessed tensor and original PIL image.
        """
        img = self.load_pil_image(image_input)
        img_rgb = img.convert("RGB")
        img_resized = img_rgb.resize((224, 224), Image.Resampling.BILINEAR)

        img_arr = np.array(img_resized, dtype=np.float32)
        img_tensor = np.expand_dims(img_arr, axis=0)
        return img_tensor, img

    def predict(self, image_input: Union[str, Path, Image.Image, bytes]) -> Dict[str, Any]:
        """
        Executes prediction with chest X-ray verification gate.
        Rejects non-medical images before generating classifications.
        """
        if self.model is None:
            raise RuntimeError("Model is not loaded.")

        preprocessed_img, pil_img = self.preprocess_image(image_input)

        # Extract deep manifold feature embedding if available
        feat_embedding = None
        if self.feature_extractor is not None:
            try:
                raw_feat = self.feature_extractor.predict(preprocessed_img, verbose=0)[0]
                feat_embedding = raw_feat
            except Exception:
                pass

        # Execute Multi-Tier Chest X-Ray Validation
        is_valid, rejection_msg, metrics = self.validator.validate_image(
            pil_img,
            feature_embedding=feat_embedding
        )

        if not is_valid:
            raise ValueError(rejection_msg)

        raw_probs = self.model.predict(preprocessed_img, verbose=0)[0]

        # Map probabilities to class names
        probabilities = {}
        for idx, prob in enumerate(raw_probs):
            cls_name = self.idx_to_class.get(idx, f"Class_{idx}")
            probabilities[cls_name] = round(float(prob), 4)

        pred_idx = int(np.argmax(raw_probs))
        predicted_class = self.idx_to_class.get(pred_idx, f"Class_{pred_idx}")
        confidence = round(float(raw_probs[pred_idx]), 4)

        return {
            "predicted_class": predicted_class,
            "confidence": confidence,
            "probabilities": probabilities,
            "validation_metrics": metrics,
            "model_version": self.metadata.get("model_version", "1.0.0"),
            "model_architecture": self.metadata.get("model_architecture", "MobileNetV2"),
            "disclaimer": DISCLAIMER_TEXT
        }

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Lung Cancer X-Ray AI Inference")
    parser.add_argument("image_path", type=str, help="Path to chest X-ray image file")
    parser.add_argument("--model", type=str, default="backend/models/best_lung_cancer_model.keras")
    parser.add_argument("--indices", type=str, default="backend/models/class_indices.json")

    args = parser.parse_args()
    predictor = LungCancerPredictor(model_path=args.model, class_indices_path=args.indices)
    try:
        result = predictor.predict(args.image_path)
        print("\n" + "=" * 50)
        print(" PREDICTION RESULT")
        print("=" * 50)
        print(f"Predicted Class: {result['predicted_class']}")
        print(f"Confidence:      {result['confidence'] * 100:.2f}% (Model Confidence)")
        print(f"Probabilities:   {result['probabilities']}")
        print(f"\nMedical Disclaimer:\n{result['disclaimer']}")
        print("=" * 50 + "\n")
    except ValueError as val_err:
        print("\n" + "=" * 50)
        print(" [REJECTED] IMAGE VALIDATION FAILED")
        print("=" * 50)
        print(str(val_err))
        print("=" * 50 + "\n")
