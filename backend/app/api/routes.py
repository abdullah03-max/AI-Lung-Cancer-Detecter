"""
FastAPI Routes for Lung Cancer X-Ray AI Detector.
Implements model info, inference, and user prediction history endpoints.
"""

import json
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Header, status

from backend.app.core.config import settings
from backend.app.core.security import get_current_user
from backend.app.services.prediction_service import PredictionService
from backend.app.services.supabase_service import db_service
from backend.app.schemas.prediction import (
    ModelInfoResponse,
    PredictionResponse,
    PredictionHistoryItem,
    PredictionHistoryResponse
)
from backend.ml.predict import DISCLAIMER_TEXT

router = APIRouter()
prediction_service = PredictionService.get_instance()

@router.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint to verify backend service status."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "model_ready": prediction_service.is_model_ready()
    }

@router.get("/api/model/info", response_model=ModelInfoResponse, tags=["Model"])
async def get_model_info():
    """
    Returns information about the trained AI model architecture,
    dataset details, and evaluation metrics.
    """
    is_ready = prediction_service.is_model_ready()

    # Load metadata if exists
    metadata: Dict[str, Any] = {}
    if settings.MODEL_METADATA_PATH.exists():
        try:
            with open(settings.MODEL_METADATA_PATH, "r") as f:
                metadata = json.load(f)
        except Exception:
            pass

    # Load dataset summary if exists
    dataset_summary: Optional[Dict[str, Any]] = None
    if settings.DATASET_SUMMARY_PATH.exists():
        try:
            with open(settings.DATASET_SUMMARY_PATH, "r") as f:
                dataset_summary = json.load(f)
        except Exception:
            pass

    # Load evaluation metrics if exists
    evaluation_metrics: Optional[Dict[str, Any]] = None
    if settings.EVALUATION_METRICS_PATH.exists():
        try:
            with open(settings.EVALUATION_METRICS_PATH, "r") as f:
                evaluation_metrics = json.load(f)
        except Exception:
            pass

    # Determine classes
    classes = []
    if settings.CLASS_INDICES_PATH.exists():
        try:
            with open(settings.CLASS_INDICES_PATH, "r") as f:
                indices_data = json.load(f)
                classes = indices_data.get("classes", [])
        except Exception:
            pass
    elif dataset_summary:
        classes = dataset_summary.get("classes", [])

    return ModelInfoResponse(
        status="ready" if is_ready else "untrained",
        model_architecture=metadata.get("model_architecture", "MobileNetV2 (Transfer Learning)"),
        dataset_size=metadata.get("total_dataset_size", dataset_summary.get("total_images_scanned") if dataset_summary else None),
        num_classes=len(classes) if classes else (dataset_summary.get("num_classes") if dataset_summary else None),
        classes=classes,
        model_version=metadata.get("model_version", "1.0.0"),
        last_training_timestamp=metadata.get("timestamp"),
        evaluation_metrics=evaluation_metrics,
        dataset_summary=dataset_summary,
        disclaimer=DISCLAIMER_TEXT
    )

@router.post("/api/predict", response_model=PredictionResponse, tags=["Inference"])
async def predict_xray(
    file: UploadFile = File(..., description="Uploaded chest X-ray image (JPEG/PNG/WEBP)"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    authorization: Optional[str] = Header(None)
):
    """
    Analyzes an uploaded chest X-ray image using the trained deep learning model.
    Requires user authentication; user ID is verified and derived server-side.
    """
    user_id = current_user["id"]
    token = authorization.split()[1] if authorization and len(authorization.split()) == 2 else None

    # Read uploaded file content
    try:
        image_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file: {str(e)}"
        )

    # Perform validation and model prediction
    try:
        prediction_result = prediction_service.predict_image_bytes(image_bytes, file.filename or "image.jpg")
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except RuntimeError as run_err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(run_err)
        )
    except Exception as general_err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(general_err)}"
        )

    # Persist prediction to Supabase predictions table for the authenticated user
    saved_record = db_service.save_prediction(
        user_id=user_id,
        predicted_class=prediction_result["predicted_class"],
        confidence=prediction_result["confidence"],
        probabilities=prediction_result["probabilities"],
        model_version=prediction_result.get("model_version", "1.0.0"),
        user_access_token=token
    )

    return PredictionResponse(
        id=saved_record.get("id"),
        predicted_class=prediction_result["predicted_class"],
        confidence=prediction_result["confidence"],
        probabilities=prediction_result["probabilities"],
        model_version=prediction_result.get("model_version", "1.0.0"),
        disclaimer=DISCLAIMER_TEXT,
        created_at=saved_record.get("created_at")
    )

@router.get("/api/history", response_model=PredictionHistoryResponse, tags=["History"])
async def get_history(
    current_user: Dict[str, Any] = Depends(get_current_user),
    authorization: Optional[str] = Header(None)
):
    """
    Retrieves all past predictions for the currently authenticated user.
    """
    user_id = current_user["id"]
    token = authorization.split()[1] if authorization and len(authorization.split()) == 2 else None

    records = db_service.get_user_history(user_id, user_access_token=token)

    history_items = [
        PredictionHistoryItem(
            id=str(r["id"]),
            user_id=str(r["user_id"]),
            predicted_class=r["predicted_class"],
            confidence=float(r["confidence"]),
            probabilities=r["probabilities"] if isinstance(r["probabilities"], dict) else {},
            model_version=r.get("model_version", "1.0.0"),
            created_at=str(r["created_at"])
        )
        for r in records
    ]

    return PredictionHistoryResponse(
        items=history_items,
        total=len(history_items)
    )

@router.get("/api/history/{prediction_id}", response_model=PredictionHistoryItem, tags=["History"])
async def get_single_prediction(
    prediction_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    authorization: Optional[str] = Header(None)
):
    """
    Retrieves a single past prediction by ID, ensuring user ownership.
    """
    user_id = current_user["id"]
    token = authorization.split()[1] if authorization and len(authorization.split()) == 2 else None

    record = db_service.get_prediction_by_id(prediction_id, user_id, user_access_token=token)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction record not found or access denied."
        )

    return PredictionHistoryItem(
        id=str(record["id"]),
        user_id=str(record["user_id"]),
        predicted_class=record["predicted_class"],
        confidence=float(record["confidence"]),
        probabilities=record["probabilities"] if isinstance(record["probabilities"], dict) else {},
        model_version=record.get("model_version", "1.0.0"),
        created_at=str(record["created_at"])
    )

@router.delete("/api/history/{prediction_id}", tags=["History"])
async def delete_history_item(
    prediction_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    authorization: Optional[str] = Header(None)
):
    """
    Deletes an individual prediction record owned by the authenticated user.
    """
    user_id = current_user["id"]
    token = authorization.split()[1] if authorization and len(authorization.split()) == 2 else None

    # First check existence
    record = db_service.get_prediction_by_id(prediction_id, user_id, user_access_token=token)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction record not found or access denied."
        )

    success = db_service.delete_prediction(prediction_id, user_id, user_access_token=token)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete prediction record."
        )

    return {"message": "Prediction deleted successfully.", "id": prediction_id}
