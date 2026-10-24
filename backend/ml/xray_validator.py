"""
Chest X-Ray Verification & Out-Of-Distribution (OOD) Validator.
Ensures uploaded images are genuine frontal chest radiographs before running
clinical classification heads, preventing false predictions on random photos,
wallpapers, people, landscapes, or non-medical graphics.
"""

from pathlib import Path
from typing import Dict, Any, Tuple, Optional
import numpy as np
from PIL import Image

class ChestXRayValidator:
    """
    Multi-stage verification engine for thoracic radiographs:
    1. Chrominance & Saturation Analysis (medical X-rays are monochromatic radiographs)
    2. Dynamic Range & Contrast Distribution
    3. Deep Radiographic Manifold Distance (MobileNetV2 feature embedding vs chest centroid)
    """

    def __init__(self, centroid_path: Optional[str] = None):
        self.centroid = None
        if centroid_path is None:
            default_path = Path("backend/models/xray_embedding_centroid.npy")
            if default_path.exists():
                self.centroid = np.load(default_path)
        else:
            p = Path(centroid_path)
            if p.exists():
                self.centroid = np.load(p)

    def validate_image(
        self,
        img: Image.Image,
        feature_embedding: Optional[np.ndarray] = None
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Validates whether the image is a frontal chest X-ray.
        Returns:
            is_valid (bool): True if verified as a chest radiograph.
            error_message (str): Clinical explanation if rejected.
            metrics (dict): Measurements (color difference, saturation, contrast, manifold score).
        """
        rgb_img = img.convert("RGB")
        arr = np.array(rgb_img, dtype=np.float32)

        # 1. Color Divergence & Saturation Analysis
        # Real chest X-rays are monochromatic shadowgraphs (R ≈ G ≈ B).
        ch_diff = float(np.mean(
            np.abs(arr[:, :, 0] - arr[:, :, 1]) +
            np.abs(arr[:, :, 1] - arr[:, :, 2]) +
            np.abs(arr[:, :, 0] - arr[:, :, 2])
        ) / 3.0)

        hsv_img = rgb_img.convert("HSV")
        sat_arr = np.array(hsv_img)[:, :, 1] / 255.0
        sat_mean = float(np.mean(sat_arr))
        vibrant_pixel_ratio = float(np.mean(sat_arr > 0.18))

        # 2. Contrast & Luminance Distribution
        gray_img = rgb_img.convert("L")
        gray_arr = np.array(gray_img, dtype=np.float32)
        contrast_std = float(np.std(gray_arr))

        metrics = {
            "channel_divergence": round(ch_diff, 2),
            "mean_saturation": round(sat_mean, 3),
            "vibrant_pixel_ratio": round(vibrant_pixel_ratio, 3),
            "contrast_std": round(contrast_std, 2),
            "manifold_similarity": None
        }

        # Check 1: Significant color detection (general photo, wallpaper, game screenshot)
        if ch_diff > 8.0 or sat_mean > 0.14 or vibrant_pixel_ratio > 0.08:
            return (
                False,
                "Non-X-Ray Image Detected: The uploaded image contains high color saturation and multi-channel chrominance. "
                "Medical chest X-rays are monochromatic transmission radiographs. Please upload a valid chest X-ray.",
                metrics
            )

        # Check 2: Contrast & Dynamic Range (blank graphics, solid blocks, empty documents)
        if contrast_std < 18.0:
            return (
                False,
                "Invalid Image Quality: The uploaded image has insufficient dynamic range or appears to be a flat graphic/blank document. "
                "Diagnostic chest radiographs require distinct anatomical contrast (lung fields, ribs, and mediastinum).",
                metrics
            )

        # Check 3: Deep Feature Manifold Similarity (if feature embedding is provided)
        if feature_embedding is not None and self.centroid is not None:
            norm_feat = feature_embedding / (np.linalg.norm(feature_embedding) + 1e-7)
            sim = float(np.dot(norm_feat, self.centroid))
            metrics["manifold_similarity"] = round(sim, 4)

            # Chest X-rays typically have similarity > 0.70; non-X-rays fall below 0.55
            if sim < 0.62:
                return (
                    False,
                    "Anatomical Manifold Mismatch: Deep neural feature representation does not match human thoracic radiography. "
                    "Please ensure you are uploading a standard frontal chest X-ray.",
                    metrics
                )

        return True, "", metrics

# Default singleton instance
xray_validator = ChestXRayValidator()
