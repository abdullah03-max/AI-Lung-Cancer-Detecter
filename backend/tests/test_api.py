import io
import json
import base64
import jwt
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from backend.app.main import app

client = TestClient(app)

def create_mock_bearer_token(user_id: str, email: str = "test@hospital.org") -> str:
    payload = {"sub": user_id, "email": email, "user_metadata": {"full_name": "Dr. Test"}}
    token = jwt.encode(payload, "dev-secret", algorithm="HS256")
    return f"Bearer {token}"

def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "model_ready" in data

def test_model_info_endpoint():
    res = client.get("/api/model/info")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ready"
    assert "classes" in data
    assert "disclaimer" in data
    assert len(data["classes"]) == 2

def test_predict_requires_auth():
    with open("chest_xray_lung/test/Cancer/test_cancer1.jpeg", "rb") as f:
        image_bytes = f.read()

    files = {"file": ("xray.jpeg", image_bytes, "image/jpeg")}
    res = client.post("/api/predict", files=files)
    assert res.status_code == 401

def test_predict_invalid_image_format():
    token = create_mock_bearer_token("user_123")
    fake_txt = io.BytesIO(b"Hello world, not an image")
    files = {"file": ("notes.txt", fake_txt, "text/plain")}

    res = client.post("/api/predict", files=files, headers={"Authorization": token})
    assert res.status_code == 400
    assert "Unsupported image format" in res.json()["detail"]

def test_predict_rejects_non_xray_image():
    token = create_mock_bearer_token("physician_user")
    with open("backend/models/user_soldier_crop.jpg", "rb") as f:
        image_bytes = f.read()

    files = {"file": ("soldier_wallpaper.jpg", image_bytes, "image/jpeg")}
    res = client.post("/api/predict", files=files, headers={"Authorization": token})
    assert res.status_code == 400
    assert "Non-X-Ray Image Detected" in res.json()["detail"]

def test_predict_valid_image_and_history_flow():
    token_user_a = create_mock_bearer_token("physician_user_a")
    token_user_b = create_mock_bearer_token("physician_user_b")

    with open("chest_xray_lung/test/Cancer/test_cancer1.jpeg", "rb") as f:
        image_bytes = f.read()

    # User A performs a prediction with genuine X-ray
    files = {"file": ("patient_xray.jpeg", image_bytes, "image/jpeg")}
    res = client.post("/api/predict", files=files, headers={"Authorization": token_user_a})
    assert res.status_code == 200
    pred = res.json()
    assert pred["predicted_class"] in ["Cancer", "NORMAL"]
    assert "confidence" in pred
    assert "probabilities" in pred
    assert pred["id"] is not None
    pred_id = pred["id"]

    # User A checks history
    hist_res_a = client.get("/api/history", headers={"Authorization": token_user_a})
    assert hist_res_a.status_code == 200
    items_a = hist_res_a.json()["items"]
    assert any(item["id"] == pred_id for item in items_a)

    # User B checks history -> should NOT see User A's prediction (Data Isolation & RLS)
    hist_res_b = client.get("/api/history", headers={"Authorization": token_user_b})
    assert hist_res_b.status_code == 200
    items_b = hist_res_b.json()["items"]
    assert not any(item["id"] == pred_id for item in items_b), "User B must not see User A predictions"

    # User A deletes prediction
    del_res = client.delete(f"/api/history/{pred_id}", headers={"Authorization": token_user_a})
    assert del_res.status_code == 200
