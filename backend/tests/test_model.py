import pytest
from PIL import Image
from backend.ml.predict import LungCancerPredictor

def test_model_loading_and_inference():
    predictor = LungCancerPredictor()
    assert predictor.model is not None
    assert len(predictor.classes) == 2
    assert "Cancer" in predictor.classes
    assert "NORMAL" in predictor.classes

    # Run inference on real chest X-ray
    img = Image.open("chest_xray_lung/test/Cancer/test_cancer1.jpeg")
    res = predictor.predict(img)

    assert "predicted_class" in res
    assert res["predicted_class"] in predictor.classes
    assert 0.0 <= res["confidence"] <= 1.0
    assert "probabilities" in res
    assert len(res["probabilities"]) == 2

    # Verify probability distribution sums to ~1.0
    prob_sum = sum(res["probabilities"].values())
    assert abs(prob_sum - 1.0) < 0.05

def test_non_xray_image_rejected():
    predictor = LungCancerPredictor()
    # Test rejection on non-medical image (user soldier crop)
    with pytest.raises(ValueError, match="Non-X-Ray Image Detected"):
        predictor.predict("backend/models/user_soldier_crop.jpg")
