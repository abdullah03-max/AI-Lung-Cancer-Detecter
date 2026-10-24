import io
import pytest
import numpy as np
from PIL import Image
from backend.app.services.prediction_service import PredictionService

@pytest.fixture
def prediction_service():
    return PredictionService.get_instance()

def test_valid_image_preprocessing(prediction_service):
    # Use real test X-ray image
    with open("chest_xray_lung/test/Cancer/test_cancer1.jpeg", "rb") as f:
        image_bytes = f.read()

    validated_img = prediction_service.validate_image_bytes(image_bytes, "chest.jpeg")
    assert validated_img.width >= 32 and validated_img.height >= 32

    # Check preprocessing tensor shape
    tensor, _ = prediction_service._predictor.preprocess_image(validated_img)
    assert tensor.shape == (1, 224, 224, 3)
    assert tensor.dtype == np.float32

def test_corrupted_image_rejected(prediction_service):
    corrupted_bytes = b"NOT_A_VALID_JPEG_HEADER_BYTES_123456789"
    with pytest.raises(ValueError, match="Corrupted or invalid image"):
        prediction_service.validate_image_bytes(corrupted_bytes, "broken.jpeg")

def test_unsupported_file_extension(prediction_service):
    img = Image.new("RGB", (100, 100))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    with pytest.raises(ValueError, match="Unsupported image format"):
        prediction_service.validate_image_bytes(buf.getvalue(), "radiograph.pdf")

def test_too_small_dimensions_rejected(prediction_service):
    tiny_img = Image.new("RGB", (10, 10))
    buf = io.BytesIO()
    tiny_img.save(buf, format="JPEG")
    with pytest.raises(ValueError, match="dimensions.*too small"):
        prediction_service.validate_image_bytes(buf.getvalue(), "tiny.jpeg")
