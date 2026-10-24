"""
Model Evaluation Script for Lung Cancer X-Ray AI Detector.
Calculates Accuracy, Precision, Recall, F1-Score, Confusion Matrix,
and per-class performance metrics on the independent test dataset.
"""

import os
import sys
import json
import argparse
from pathlib import Path
from typing import Dict, Any, List

import numpy as np
from PIL import Image
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score
)

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
import tensorflow as tf
from tensorflow import keras

def evaluate_model(
    model_path: str = "backend/models/best_lung_cancer_model.keras",
    class_indices_path: str = "backend/models/class_indices.json",
    test_manifest_path: str = "backend/models/test_manifest.json",
    output_path: str = "backend/models/evaluation_metrics.json"
) -> Dict[str, Any]:
    """
    Evaluates the trained model on test data and exports structured metrics.
    """
    model_file = Path(model_path)
    if not model_file.exists():
        raise FileNotFoundError(f"Model file not found at: {model_path}. Train the model first.")

    indices_file = Path(class_indices_path)
    if not indices_file.exists():
        raise FileNotFoundError(f"Class indices file not found at: {class_indices_path}")

    with open(indices_file, "r") as f:
        mapping = json.load(f)
    classes = mapping["classes"]
    class_to_idx = mapping["class_to_idx"]
    idx_to_class = {int(k): v for k, v in mapping["idx_to_class"].items()}

    manifest_file = Path(test_manifest_path)
    if not manifest_file.exists():
        raise FileNotFoundError(f"Test manifest not found at: {test_manifest_path}")

    with open(manifest_file, "r") as f:
        test_records = json.load(f)

    print(f"[*] Loading model from {model_file}...")
    model = keras.models.load_model(str(model_file))

    print(f"[*] Evaluating on {len(test_records)} test samples...")
    y_true = []
    y_pred_probs = []

    # Batch process test samples
    batch_size = 32
    for i in range(0, len(test_records), batch_size):
        batch = test_records[i:i + batch_size]
        batch_imgs = []
        for r in batch:
            y_true.append(class_to_idx[r["class_name"]])
            img = Image.open(r["path"]).convert("RGB").resize((224, 224))
            arr = np.array(img, dtype=np.float32)
            batch_imgs.append(arr)
        
        batch_arr = np.array(batch_imgs)
        probs = model.predict(batch_arr, verbose=0)
        y_pred_probs.extend(probs)

    y_true = np.array(y_true)
    y_pred_probs = np.array(y_pred_probs)
    y_pred = np.argmax(y_pred_probs, axis=1)

    # Calculate overall metrics
    acc = float(accuracy_score(y_true, y_pred))
    precision_macro = float(precision_score(y_true, y_pred, average="macro", zero_division=0))
    recall_macro = float(recall_score(y_true, y_pred, average="macro", zero_division=0))
    f1_macro = float(f1_score(y_true, y_pred, average="macro", zero_division=0))

    precision_weighted = float(precision_score(y_true, y_pred, average="weighted", zero_division=0))
    recall_weighted = float(recall_score(y_true, y_pred, average="weighted", zero_division=0))
    f1_weighted = float(f1_score(y_true, y_pred, average="weighted", zero_division=0))

    # Confusion Matrix
    cm = confusion_matrix(y_true, y_pred).tolist()

    # Per-class metrics
    report = classification_report(
        y_true, y_pred, target_names=classes, output_dict=True, zero_division=0
    )

    per_class_metrics = {}
    for c in classes:
        if c in report:
            per_class_metrics[c] = {
                "precision": round(float(report[c]["precision"]), 4),
                "recall": round(float(report[c]["recall"]), 4),
                "f1_score": round(float(report[c]["f1-score"]), 4),
                "support": int(report[c]["support"])
            }

    # ROC AUC if binary or multiclass
    roc_auc = None
    try:
        if len(classes) == 2:
            roc_auc = float(roc_auc_score(y_true, y_pred_probs[:, 1]))
        else:
            roc_auc = float(roc_auc_score(y_true, y_pred_probs, multi_class="ovr"))
    except Exception:
        roc_auc = None

    metrics_result = {
        "test_sample_count": len(test_records),
        "classes": classes,
        "overall": {
            "accuracy": round(acc, 4),
            "precision_macro": round(precision_macro, 4),
            "recall_macro": round(recall_macro, 4),
            "f1_macro": round(f1_macro, 4),
            "precision_weighted": round(precision_weighted, 4),
            "recall_weighted": round(recall_weighted, 4),
            "f1_weighted": round(f1_weighted, 4),
            "roc_auc": round(roc_auc, 4) if roc_auc is not None else None
        },
        "confusion_matrix": cm,
        "per_class_metrics": per_class_metrics,
        "classification_report": report
    }

    # Save metrics to output file
    out_file = Path(output_path)
    out_file.parent.mkdir(parents=True, exist_ok=True)
    with open(out_file, "w") as f:
        json.dump(metrics_result, f, indent=2)

    print("\n" + "=" * 55)
    print(" LUNG X-RAY AI MODEL EVALUATION REPORT")
    print("=" * 55)
    print(f"Test Set Size:       {len(test_records)} samples")
    print(f"Overall Accuracy:    {acc * 100:.2f}%")
    print(f"Macro Precision:     {precision_macro * 100:.2f}%")
    print(f"Macro Recall:        {recall_macro * 100:.2f}%")
    print(f"Macro F1-Score:      {f1_macro * 100:.2f}%")
    if roc_auc:
        print(f"ROC AUC:             {roc_auc:.4f}")
    print("\nConfusion Matrix (Row=True, Col=Predicted):")
    print("Labels: ", classes)
    for row in cm:
        print("  ", row)
    print("\nPer-Class Breakdown:")
    for c, data in per_class_metrics.items():
        print(f"  [{c}] Prec: {data['precision']*100:.1f}%, Rec: {data['recall']*100:.1f}%, F1: {data['f1_score']*100:.1f}%, Support: {data['support']}")
    print("=" * 55)
    print(f"[+] Evaluation metrics saved to: {out_file}\n")

    return metrics_result

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate Lung Cancer AI Model")
    parser.add_argument("--model", type=str, default="backend/models/best_lung_cancer_model.keras")
    parser.add_argument("--indices", type=str, default="backend/models/class_indices.json")
    parser.add_argument("--manifest", type=str, default="backend/models/test_manifest.json")
    parser.add_argument("--output", type=str, default="backend/models/evaluation_metrics.json")
    args = parser.parse_args()

    evaluate_model(
        model_path=args.model,
        class_indices_path=args.indices,
        test_manifest_path=args.manifest,
        output_path=args.output
    )
