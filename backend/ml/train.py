"""
Deep Learning Training Pipeline for Lung Cancer X-Ray AI Detector.
Uses Transfer Learning (MobileNetV2 / EfficientNetB0) with ImageNet weights,
handles class imbalance, prevents data leakage, applies data augmentation to training data only,
and exports all required model artifacts.
"""

import os
import sys
import json
import time
import argparse
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional

import numpy as np
from PIL import Image
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight

# Set TF logging level
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

try:
    from backend.ml.inspect_dataset import find_dataset_root, compute_file_hash, VALID_EXTENSIONS
except ImportError:
    from inspect_dataset import find_dataset_root, compute_file_hash, VALID_EXTENSIONS

# Set random seeds for reproducibility
SEED = 42
tf.random.set_seed(SEED)
np.random.seed(SEED)

def gather_dataset_manifest(dataset_root: Path) -> Tuple[List[Dict[str, Any]], List[str]]:
    """
    Scans the dataset directory, filters out nested duplicate folders,
    and returns a clean list of image records with zero duplicate leakage.
    """
    print(f"[*] Scanning dataset at: {dataset_root}")
    records = []
    seen_hashes = {}
    classes_set = set()

    # Search for all image files
    for filepath in dataset_root.rglob("*"):
        if filepath.is_file() and filepath.suffix.lower() in VALID_EXTENSIONS:
            # Skip nested duplicate 'chest_xray' parent directory if present
            parents = [p.name.lower() for p in filepath.parents if p != dataset_root]
            if "chest_xray" in parents:
                continue

            # Class folder is the immediate parent directory
            class_name = filepath.parent.name
            classes_set.add(class_name)

            file_hash = compute_file_hash(filepath)
            # Prevent exact duplicate images from causing leakage
            if file_hash in seen_hashes:
                continue
            seen_hashes[file_hash] = str(filepath)

            records.append({
                "path": str(filepath.resolve()),
                "class_name": class_name,
                "hash": file_hash
            })

    classes = sorted(list(classes_set))
    print(f"[+] Total unique validated images: {len(records)}")
    print(f"[+] Discovered classes: {classes}")
    for c in classes:
        cnt = sum(1 for r in records if r["class_name"] == c)
        print(f"    - {c:12s}: {cnt:5d} images")

    return records, classes

def create_stratified_splits(
    records: List[Dict[str, Any]],
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    seed: int = 42
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Creates stratified Train / Val / Test splits with guaranteed zero overlap.
    """
    labels = [r["class_name"] for r in records]
    
    # First split off the test set
    train_val_records, test_records, train_val_labels, _ = train_test_split(
        records, labels, test_size=test_ratio, stratify=labels, random_state=seed
    )
    
    # Second split train into train and validation
    adjusted_val_ratio = val_ratio / (1.0 - test_ratio)
    train_records, val_records, _, _ = train_test_split(
        train_val_records, train_val_labels, test_size=adjusted_val_ratio,
        stratify=train_val_labels, random_state=seed
    )

    print(f"[+] Stratified splits created: Train={len(train_records)}, Val={len(val_records)}, Test={len(test_records)}")
    return train_records, val_records, test_records

def build_data_pipeline(
    records: List[Dict[str, Any]],
    class_to_idx: Dict[str, int],
    batch_size: int = 32,
    img_size: Tuple[int, int] = (224, 224),
    is_training: bool = False
) -> tf.data.Dataset:
    """
    Constructs an optimized tf.data.Dataset with caching and prefetching.
    Applies data augmentation ONLY when is_training is True.
    """
    paths = [r["path"] for r in records]
    labels = [class_to_idx[r["class_name"]] for r in records]

    path_ds = tf.data.Dataset.from_tensor_slices(paths)
    label_ds = tf.data.Dataset.from_tensor_slices(labels)
    ds = tf.data.Dataset.zip((path_ds, label_ds))

    # Preprocessing function for each image
    def load_and_preprocess_image(path, label):
        img_bytes = tf.io.read_file(path)
        img = tf.image.decode_jpeg(img_bytes, channels=3, try_recover_truncated=True)
        img = tf.image.resize(img, img_size)
        return img, label

    # Data augmentation block applied only to training data
    augmentation_model = keras.Sequential([
        layers.RandomFlip("horizontal"),
        layers.RandomRotation(0.08),
        layers.RandomZoom(0.08),
        layers.RandomTranslation(0.05, 0.05),
        layers.RandomContrast(0.1),
    ], name="training_data_augmentation")

    if is_training:
        # Shuffling path strings takes virtually zero RAM (< 100 KB)
        ds = ds.shuffle(buffer_size=len(records), seed=SEED)

    # Decode and resize into small batches with conservative prefetch
    ds = ds.map(load_and_preprocess_image, num_parallel_calls=2)
    ds = ds.batch(batch_size)

    if is_training:
        ds = ds.map(lambda x, y: (augmentation_model(x, training=True), y), num_parallel_calls=2)

    ds = ds.prefetch(buffer_size=2)
    return ds

def build_model(
    num_classes: int,
    backbone_name: str = "MobileNetV2",
    input_shape: Tuple[int, int, int] = (224, 224, 3),
    dropout_rate: float = 0.3
) -> keras.Model:
    """
    Builds a Transfer Learning model with ImageNet pretrained weights.
    Freezes the base backbone initially.
    """
    inputs = keras.Input(shape=input_shape, name="input_image")
    
    # Preprocessing layer corresponding to backbone
    if backbone_name.lower() == "mobilenetv2":
        preprocessed = tf.keras.applications.mobilenet_v2.preprocess_input(inputs)
        base_model = tf.keras.applications.MobileNetV2(
            input_shape=input_shape,
            include_top=False,
            weights="imagenet"
        )
    elif backbone_name.lower() == "efficientnetb0":
        preprocessed = tf.keras.applications.efficientnet.preprocess_input(inputs)
        base_model = tf.keras.applications.EfficientNetB0(
            input_shape=input_shape,
            include_top=False,
            weights="imagenet"
        )
    else:
        raise ValueError(f"Unsupported backbone: {backbone_name}. Choose MobileNetV2 or EfficientNetB0.")

    # Freeze base model backbone
    base_model.trainable = False

    x = base_model(preprocessed, training=False)
    x = layers.GlobalAveragePooling2D(name="global_avg_pool")(x)
    x = layers.BatchNormalization(name="batch_norm")(x)
    x = layers.Dense(128, activation="relu", name="dense_features")(x)
    x = layers.Dropout(dropout_rate, name="dropout")(x)
    outputs = layers.Dense(num_classes, activation="softmax", name="prediction_probabilities")(x)

    model = keras.Model(inputs=inputs, outputs=outputs, name=f"LungCancer_{backbone_name}")
    return model, base_model

def train_pipeline(
    dataset_dir: Optional[str] = None,
    output_dir: str = "backend/models",
    backbone: str = "MobileNetV2",
    epochs: int = 15,
    batch_size: int = 32,
    fine_tune_epochs: int = 5,
    sample_limit: Optional[int] = None
) -> Dict[str, Any]:
    """
    Executes the complete training workflow.
    """
    start_time = time.time()
    
    # Hardware detection
    gpus = tf.config.list_physical_devices("GPU")
    device_type = "GPU" if gpus else "CPU"
    print(f"[*] Compute acceleration device: {device_type} (GPUs detected: {len(gpus)})")

    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    # 1. Dataset Discovery
    root_path = Path(dataset_dir) if dataset_dir else find_dataset_root()
    if not root_path or not root_path.exists():
        raise FileNotFoundError(f"Dataset directory not found: {root_path}")

    records, classes = gather_dataset_manifest(root_path)
    if not records:
        raise ValueError(f"No valid images found in dataset directory: {root_path}")

    if sample_limit and len(records) > sample_limit:
        print(f"[*] Subsampling dataset to {sample_limit} images for accelerated development/testing...")
        labels = [r["class_name"] for r in records]
        records, _, _, _ = train_test_split(records, labels, train_size=sample_limit, stratify=labels, random_state=SEED)

    # Save class mappings
    class_to_idx = {cls: idx for idx, cls in enumerate(classes)}
    idx_to_class = {idx: cls for idx, cls in enumerate(classes)}

    class_indices_path = out_path / "class_indices.json"
    with open(class_indices_path, "w") as f:
        json.dump({
            "classes": classes,
            "class_to_idx": class_to_idx,
            "idx_to_class": idx_to_class
        }, f, indent=2)
    print(f"[+] Saved class index mapping to: {class_indices_path}")

    # 2. Splits
    train_records, val_records, test_records = create_stratified_splits(records, seed=SEED)

    # Save test manifest for evaluation script
    test_manifest_path = out_path / "test_manifest.json"
    with open(test_manifest_path, "w") as f:
        json.dump(test_records, f, indent=2)

    # 3. Handle Class Imbalance
    train_labels = [class_to_idx[r["class_name"]] for r in train_records]
    class_weights_arr = compute_class_weight(
        class_weight="balanced",
        classes=np.unique(train_labels),
        y=train_labels
    )
    class_weights_dict = {i: float(w) for i, w in enumerate(class_weights_arr)}
    print(f"[+] Computed Class Weights: {class_weights_dict}")

    # 4. Create tf.data Pipelines
    train_ds = build_data_pipeline(train_records, class_to_idx, batch_size=batch_size, is_training=True)
    val_ds = build_data_pipeline(val_records, class_to_idx, batch_size=batch_size, is_training=False)

    # 5. Build Model
    model, base_model = build_model(num_classes=len(classes), backbone_name=backbone)
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )
    model.summary()

    # Callbacks
    best_model_path = out_path / "best_lung_cancer_model.keras"
    callbacks = [
        keras.callbacks.ModelCheckpoint(
            filepath=str(best_model_path),
            monitor="val_accuracy",
            mode="max",
            save_best_only=True,
            verbose=1
        ),
        keras.callbacks.EarlyStopping(
            monitor="val_loss",
            patience=5,
            restore_best_weights=True,
            verbose=1
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.2,
            patience=2,
            min_lr=1e-6,
            verbose=1
        )
    ]

    # 6. Initial Training (Classification Head)
    print("\n" + "=" * 50)
    print(f"[*] Starting Phase 1 Training (Feature Extraction) - {epochs} epochs")
    print("=" * 50)
    history_phase1 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=epochs,
        class_weight=class_weights_dict,
        callbacks=callbacks
    )

    combined_history = {k: [float(val) for val in v] for k, v in history_phase1.history.items()}

    # 7. Optional Fine-Tuning Phase
    if fine_tune_epochs > 0:
        print("\n" + "=" * 50)
        print(f"[*] Starting Phase 2 (Fine-Tuning selected top layers) - {fine_tune_epochs} epochs")
        print("=" * 50)
        base_model.trainable = True
        # Fine-tune only the top 30 layers
        for layer in base_model.layers[:-30]:
            layer.trainable = False

        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=1e-5),
            loss="sparse_categorical_crossentropy",
            metrics=["accuracy"]
        )

        history_phase2 = model.fit(
            train_ds,
            validation_data=val_ds,
            epochs=fine_tune_epochs,
            class_weight=class_weights_dict,
            callbacks=callbacks
        )

        for k, v in history_phase2.history.items():
            if k in combined_history:
                combined_history[k].extend([float(val) for val in v])
            else:
                combined_history[k] = [float(val) for val in v]

    # Save training history
    history_path = out_path / "training_history.json"
    with open(history_path, "w") as f:
        json.dump(combined_history, f, indent=2)
    print(f"[+] Saved training history to: {history_path}")

    # Ensure model is saved even if early stopping had issues
    if not best_model_path.exists():
        model.save(str(best_model_path))

    # Save model metadata
    total_training_time = round(time.time() - start_time, 2)
    metadata = {
        "model_architecture": backbone,
        "input_shape": [224, 224, 3],
        "num_classes": len(classes),
        "classes": classes,
        "class_to_idx": class_to_idx,
        "total_dataset_size": len(records),
        "train_samples": len(train_records),
        "val_samples": len(val_records),
        "test_samples": len(test_records),
        "total_epochs_trained": len(combined_history.get("loss", [])),
        "best_val_accuracy": max(combined_history.get("val_accuracy", [0.0])),
        "lowest_val_loss": min(combined_history.get("val_loss", [float("inf")])),
        "training_device": device_type,
        "training_duration_seconds": total_training_time,
        "model_version": "1.0.0",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%SZ", time.gmtime())
    }
    metadata_path = out_path / "model_metadata.json"
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"[+] Saved model metadata to: {metadata_path}")

    print("\n" + "=" * 50)
    print(f"[SUCCESS] Training Pipeline Complete in {total_training_time}s!")
    print(f"Best Model Artifact: {best_model_path}")
    print("=" * 50 + "\n")

    return metadata

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Lung Cancer X-Ray AI Model")
    parser.add_argument("--dataset_dir", type=str, default=None, help="Root path of dataset")
    parser.add_argument("--output_dir", type=str, default="backend/models", help="Output directory")
    parser.add_argument("--backbone", type=str, default="MobileNetV2", help="MobileNetV2 or EfficientNetB0")
    parser.add_argument("--epochs", type=int, default=10, help="Initial training epochs")
    parser.add_argument("--fine_tune_epochs", type=int, default=3, help="Fine-tune epochs")
    parser.add_argument("--batch_size", type=int, default=32, help="Batch size")
    parser.add_argument("--sample_limit", type=int, default=None, help="Optional sample limit for quick test")

    args = parser.parse_args()
    train_pipeline(
        dataset_dir=args.dataset_dir,
        output_dir=args.output_dir,
        backbone=args.backbone,
        epochs=args.epochs,
        fine_tune_epochs=args.fine_tune_epochs,
        batch_size=args.batch_size,
        sample_limit=args.sample_limit
    )
