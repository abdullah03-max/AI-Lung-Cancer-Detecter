# Dataset Directory

This directory can hold dataset files or references for the Lung Cancer X-Ray AI Detector.

### Current Detected Dataset:
The dataset from Kaggle (`quynhlecl/lung-cancer-x-ray`) is located at:
`../chest_xray_lung/`

### Classes Detected:
- `Cancer` (chest X-rays indicating cancerous/malignant conditions)
- `NORMAL` (chest X-rays of healthy/normal lung conditions)

### Original Directory Layout:
- `chest_xray_lung/train/Cancer` (3,875 images)
- `chest_xray_lung/train/NORMAL` (1,341 images)
- `chest_xray_lung/test/Cancer` (390 images)
- `chest_xray_lung/test/NORMAL` (234 images)
- `chest_xray_lung/val/Cancer` (8 images)
- `chest_xray_lung/val/NORMAL` (8 images)
Total unique raw images: 5,856 images.

Note: An unzipped nested directory `chest_xray_lung/chest_xray` also exists; the inspection and training scripts automatically ignore nested duplicates.
