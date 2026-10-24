"""
Pydantic Schemas for Model Information, Inference, and Prediction History.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class ModelInfoResponse(BaseModel):
    status: str = Field(description="Training status: 'ready', 'untrained', or 'training'")
    model_architecture: Optional[str] = None
    dataset_size: Optional[int] = None
    num_classes: Optional[int] = None
    classes: List[str] = Field(default_factory=list)
    model_version: Optional[str] = None
    last_training_timestamp: Optional[str] = None
    evaluation_metrics: Optional[Dict[str, Any]] = None
    dataset_summary: Optional[Dict[str, Any]] = None
    disclaimer: str

class PredictionResponse(BaseModel):
    id: Optional[str] = None
    predicted_class: str
    confidence: float = Field(description="Model prediction confidence score (0.0 - 1.0)")
    probabilities: Dict[str, float] = Field(description="Probability distribution across all classes")
    model_version: str
    disclaimer: str
    created_at: Optional[str] = None

class PredictionHistoryItem(BaseModel):
    id: str
    user_id: str
    predicted_class: str
    confidence: float
    probabilities: Dict[str, float]
    model_version: str
    created_at: str

class PredictionHistoryResponse(BaseModel):
    items: List[PredictionHistoryItem]
    total: int
