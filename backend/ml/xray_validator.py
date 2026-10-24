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
        # Resize to standard analysis dimensions for consistent spatial analysis
        rgb_img_std = rgb_img.resize((224, 224), Image.Resampling.BILINEAR)
        arr = np.array(rgb_img_std, dtype=np.float32)

        # 1. Color Divergence & Saturation Analysis
        # Real chest X-rays are monochromatic shadowgraphs (R ≈ G ≈ B).
        ch_diff = float(np.mean(
            np.abs(arr[:, :, 0] - arr[:, :, 1]) +
            np.abs(arr[:, :, 1] - arr[:, :, 2]) +
            np.abs(arr[:, :, 0] - arr[:, :, 2])
        ) / 3.0)

        hsv_img = rgb_img_std.convert("HSV")
        sat_arr = np.array(hsv_img)[:, :, 1] / 255.0
        sat_mean = float(np.mean(sat_arr))
        vibrant_pixel_ratio = float(np.mean(sat_arr > 0.18))

        # 2. Contrast & Luminance Distribution
        gray_img = rgb_img_std.convert("L")
        gray_arr = np.array(gray_img, dtype=np.float32)
        contrast_std = float(np.std(gray_arr))
        overall_mean = float(np.mean(gray_arr))

        # Radiological Peripheral Exposure (Real X-rays have dark outer air exposure; logos/documents are bright white)
        c1, c2, c3, c4 = gray_arr[:15, :15], gray_arr[:15, -15:], gray_arr[-15:, :15], gray_arr[-15:, -15:]
        corner_avg = float((np.mean(c1) + np.mean(c2) + np.mean(c3) + np.mean(c4)) / 4.0)
        border_pixels = np.concatenate([
            gray_arr[:10, :].flatten(),
            gray_arr[-10:, :].flatten(),
            gray_arr[:, :10].flatten(),
            gray_arr[:, -10:].flatten()
        ])
        border_avg = float(np.mean(border_pixels))
        high_white_ratio = float(np.mean(gray_arr > 235))

        # Foreground saturation on non-white elements
        fg_mask = gray_arr < 240
        fg_sat_mean = float(np.mean(sat_arr[fg_mask])) if np.sum(fg_mask) > 100 else sat_mean

        metrics = {
            "channel_divergence": round(ch_diff, 2),
            "mean_saturation": round(sat_mean, 3),
            "fg_saturation": round(fg_sat_mean, 3),
            "vibrant_pixel_ratio": round(vibrant_pixel_ratio, 3),
            "contrast_std": round(contrast_std, 2),
            "border_mean": round(border_avg, 1),
            "corner_mean": round(corner_avg, 1),
            "high_white_ratio": round(high_white_ratio, 3),
            "manifold_similarity": None
        }

        # Check 1: White background / Graphic / Document detection
        if border_avg > 175.0 or corner_avg > 165.0 or high_white_ratio > 0.18 or overall_mean > 190.0:
            return (
                False,
                "Graphic / Document Detected: The uploaded image has a bright white background or digital graphic border. "
                "Diagnostic chest X-rays are projection radiographs with dark background exposure. Please upload a real chest X-ray.",
                metrics
            )

        # Check 2: Significant color detection (general photo, wallpaper, game screenshot)
        if ch_diff > 8.0 or sat_mean > 0.14 or fg_sat_mean > 0.14 or vibrant_pixel_ratio > 0.08:
            return (
                False,
                "Non-X-Ray Image Detected: The uploaded image contains high color saturation and multi-channel chrominance. "
                "Medical chest X-rays are monochromatic transmission radiographs. Please upload a valid chest X-ray.",
                metrics
            )

        # Check 3: Contrast & Dynamic Range (blank graphics, solid blocks, empty documents)
        if contrast_std < 18.0:
            return (
                False,
                "Invalid Image Quality: The uploaded image has insufficient dynamic range or appears to be a flat graphic/blank document. "
                "Diagnostic chest radiographs require distinct anatomical contrast (lung fields, ribs, and mediastinum).",
                metrics
            )

        # Check 4: Deep Feature Manifold Similarity (if feature embedding is provided)
        if feature_embedding is not None and self.centroid is not None:
            norm_feat = feature_embedding / (np.linalg.norm(feature_embedding) + 1e-7)
            sim = float(np.dot(norm_feat, self.centroid))
            metrics["manifold_similarity"] = round(sim, 4)

            # Chest X-rays typically have similarity > 0.70; non-X-rays fall below 0.60
            if sim < 0.62:
                return (
                    False,
                    f"Anatomical Manifold Mismatch: Deep neural feature representation does not match human thoracic radiography (confidence match: {sim * 100:.1f}%). "
                    "Please ensure you are uploading a standard frontal chest X-ray.",
                    metrics
                )

        return True, "", metrics

# Default singleton instance
xray_validator = ChestXRayValidator()
