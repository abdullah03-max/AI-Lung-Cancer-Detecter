"""
Dataset Inspection and Validation Tool for Lung Cancer X-Ray AI Detector.
Inspects directory structure, validates image readability, detects duplicates,
and calculates class distribution and statistics.
"""

import os
import sys
import json
import hashlib
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional
from collections import Counter
from PIL import Image

# Supported image extensions
VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".jfif"}

def compute_file_hash(filepath: Path, block_size: int = 65536) -> str:
    """Compute MD5 hash of a file to detect duplicates."""
    hasher = hashlib.md5()
    try:
        with open(filepath, "rb") as f:
            for block in iter(lambda: f.read(block_size), b""):
                hasher.update(block)
        return hasher.hexdigest()
    except Exception:
        return ""

def find_dataset_root(search_paths: Optional[List[str]] = None) -> Optional[Path]:
    """Find the root dataset directory containing class or split folders."""
    if search_paths is None:
        search_paths = [
            "chest_xray_lung",
            "../chest_xray_lung",
            "data",
            "dataset"
        ]
    
    cwd = Path.cwd()
    for sp in search_paths:
        candidate = (cwd / sp).resolve()
        if candidate.exists() and candidate.is_dir():
            # Check if it has train/test/val or class folders
            subdirs = [d.name.lower() for d in candidate.iterdir() if d.is_dir()]
            if any(s in subdirs for s in ["train", "test", "cancer", "normal"]):
                return candidate
    return None

def inspect_dataset(root_dir: Optional[str] = None) -> Dict[str, Any]:
    """
    Inspect the dataset, finding class folders, validating images,
    detecting duplicate hashes, and gathering summary statistics.
    """
    if root_dir is None:
        dataset_path = find_dataset_root()
        if not dataset_path:
            raise FileNotFoundError(
                "Could not automatically locate the dataset directory. "
                "Please place the dataset in './chest_xray_lung' or './data' "
                "or pass the root path explicitly."
            )
    else:
        dataset_path = Path(root_dir).resolve()
        if not dataset_path.exists():
            raise FileNotFoundError(f"Specified dataset directory does not exist: {dataset_path}")

    print(f"[*] Inspecting dataset at: {dataset_path}")

    # Detect existing splits or pure class folders
    subdirs = [d for d in dataset_path.iterdir() if d.is_dir()]
    subdir_names_lower = [d.name.lower() for d in subdirs]

    has_standard_splits = any(s in subdir_names_lower for s in ["train", "test", "val"])

    # We will gather files per split (or 'all' if no standard splits)
    # Notice: Ignore nested duplicate 'chest_xray' directory if present
    splits_to_scan = []
    if has_standard_splits:
        for d in subdirs:
            if d.name.lower() in ["train", "test", "val"]:
                splits_to_scan.append((d.name.lower(), d))
    else:
        splits_to_scan.append(("all", dataset_path))

    classes_found = set()
    total_images = 0
    corrupted_images = []
    unreadable_images = []
    duplicate_hash_map: Dict[str, List[str]] = {}
    split_stats: Dict[str, Dict[str, int]] = {}
    dimensions: List[Tuple[int, int]] = []
    color_modes: Counter = Counter()

    all_scanned_files = []

    for split_name, split_dir in splits_to_scan:
        split_stats[split_name] = {}
        # Find class subdirectories
        class_dirs = [c for c in split_dir.iterdir() if c.is_dir() and c.name.lower() != "chest_xray"]
        
        for cdir in class_dirs:
            class_name = cdir.name
            classes_found.add(class_name)
            split_stats[split_name][class_name] = 0

            # Scan images in class folder
            for img_path in cdir.rglob("*"):
                if img_path.is_file() and img_path.suffix.lower() in VALID_EXTENSIONS:
                    # Ignore paths inside nested 'chest_xray' subdirectory
                    if "chest_xray" in [p.name.lower() for p in img_path.parents if p != dataset_path]:
                        continue

                    total_images += 1
                    split_stats[split_name][class_name] += 1
                    rel_path = str(img_path.relative_to(dataset_path))
                    all_scanned_files.append((split_name, class_name, img_path, rel_path))

                    # Check hash for duplicate detection
                    file_hash = compute_file_hash(img_path)
                    if file_hash:
                        duplicate_hash_map.setdefault(file_hash, []).append(rel_path)

                    # Validate readability and get dimensions
                    try:
                        with Image.open(img_path) as im:
                            im.verify()
                        with Image.open(img_path) as im:
                            color_modes[im.mode] += 1
                            dimensions.append(im.size)
                    except Exception as err:
                        corrupted_images.append({
                            "path": rel_path,
                            "error": str(err)
                        })

    # Find duplicates across dataset
    cross_split_duplicates = []
    exact_duplicates_count = 0
    for h, paths in duplicate_hash_map.items():
        if len(paths) > 1:
            exact_duplicates_count += (len(paths) - 1)
            # Check if duplicate spans across different splits
            splits_involved = {p.split(os.sep)[0] for p in paths if os.sep in p}
            if len(splits_involved) > 1:
                cross_split_duplicates.append({
                    "hash": h,
                    "splits": list(splits_involved),
                    "paths": paths
                })

    sorted_classes = sorted(list(classes_found))
    class_totals = Counter()
    for split_data in split_stats.values():
        for c, count in split_data.items():
            class_totals[c] += count

    avg_width = sum(w for w, h in dimensions) / len(dimensions) if dimensions else 0
    avg_height = sum(h for w, h in dimensions) / len(dimensions) if dimensions else 0

    summary = {
        "dataset_root": str(dataset_path),
        "total_images_scanned": total_images,
        "classes": sorted_classes,
        "num_classes": len(sorted_classes),
        "class_distribution": dict(class_totals),
        "split_distribution": split_stats,
        "corrupted_images_count": len(corrupted_images),
        "corrupted_images": corrupted_images[:10], # show sample if any
        "exact_duplicates_count": exact_duplicates_count,
        "cross_split_leakage_groups": len(cross_split_duplicates),
        "cross_split_leakage_sample": cross_split_duplicates[:5],
        "image_color_modes": dict(color_modes),
        "average_dimensions": {"width": round(avg_width, 1), "height": round(avg_height, 1)},
        "target_model_input_size": [224, 224, 3]
    }

    return summary

def print_summary(summary: Dict[str, Any]):
    """Print a clean, formatted report of the dataset inspection."""
    print("\n" + "=" * 60)
    print(" LUNG X-RAY DATASET INSPECTION REPORT")
    print("=" * 60)
    print(f"Dataset Root:             {summary['dataset_root']}")
    print(f"Total Images Validated:   {summary['total_images_scanned']}")
    print(f"Classes Discovered ({summary['num_classes']}):   {', '.join(summary['classes'])}")
    print("\nClass Distribution:")
    for c, cnt in summary['class_distribution'].items():
        pct = (cnt / summary['total_images_scanned'] * 100) if summary['total_images_scanned'] else 0
        print(f"  - {c:12s}: {cnt:5d} images ({pct:.1f}%)")
    
    print("\nSplit Distribution:")
    for sname, sdata in summary['split_distribution'].items():
        total_split = sum(sdata.values())
        print(f"  - Split '{sname}': {total_split} images")
        for c, cnt in sdata.items():
            print(f"      {c:10s}: {cnt:5d}")

    print("\nQuality & Integrity Checks:")
    print(f"  - Corrupted Images:      {summary['corrupted_images_count']}")
    print(f"  - Duplicate Files:       {summary['exact_duplicates_count']}")
    print(f"  - Cross-Split Leakage:   {summary['cross_split_leakage_groups']} groups")
    if summary['cross_split_leakage_groups'] > 0:
        print("    [!] Warning: Data leakage detected across pre-existing Kaggle splits.")
        print("        Re-stratified splitting will be applied during training to guarantee zero leakage.")
    print(f"  - Image Color Modes:     {summary['image_color_modes']}")
    print(f"  - Average Dimensions:    {summary['average_dimensions']['width']} x {summary['average_dimensions']['height']}")
    print(f"  - Target Pipeline Size:  {summary['target_model_input_size']}")
    print("=" * 60 + "\n")

if __name__ == "__main__":
    path_arg = sys.argv[1] if len(sys.argv) > 1 else None
    summary_data = inspect_dataset(path_arg)
    print_summary(summary_data)
    
    # Save output to backend/models/dataset_summary.json
    out_dir = Path("backend/models")
    out_dir.mkdir(parents=True, exist_ok=True)
    summary_path = out_dir / "dataset_summary.json"
    with open(summary_path, "w") as f:
        json.dump(summary_data, f, indent=2)
    print(f"[+] Dataset summary saved to: {summary_path}")
