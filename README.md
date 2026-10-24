# AI-Lung-Cancer-Detecter (PulmoScan AI)

An academic AI research web application and deep learning diagnostic prototype designed to classify chest X-ray radiographs into **Cancer** and **NORMAL** conditions using transfer learning (MobileNetV2 / EfficientNetB0), FastAPI, Supabase Auth & PostgreSQL (with Row Level Security), and a React + Vite + TypeScript dashboard.

---

## 1. System Requirements & Prerequisites

- **Operating System:** Windows 10 / 11 (64-bit)
- **Python:** Python 3.11.x (installed automatically via `uv` or directly from python.org)
- **Node.js:** Node v18+ or v20+ / v24+ with npm
- **Package Managers:** `uv` (recommended for fast virtual environment setup) and `npm`
- **Dataset:** Kaggle Lung Cancer X-Ray Dataset (`quynhlecl/lung-cancer-x-ray`) placed in `./chest_xray_lung`
- **Database (Optional/Recommended):** Free account at [Supabase](https://supabase.com)

---

## 2. Windows PowerShell Setup Guide

Open Windows PowerShell in the project directory (`D:\Ai Cancer detection`):

### Step 2.1: Python Virtual Environment Setup

Using `uv` (recommended):
```powershell
# If uv is not installed:
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
$env:Path = "$HOME\.local\bin;$env:Path"

# Install Python 3.11 and create virtual environment:
uv python install 3.11
uv venv .venv --python 3.11

# Activate virtual environment:
.venv\Scripts\Activate.ps1
```

If using standard Python 3.11 without `uv`:
```powershell
py -3.11 -m venv .venv
.venv\Scripts\Activate.ps1
```

### Step 2.2: Install Backend Dependencies

```powershell
uv pip install -r backend/requirements.txt
# OR
pip install -r backend/requirements.txt
```

### Step 2.3: Install Frontend Dependencies

```powershell
Set-Location frontend
npm install
Set-Location ..
```

---

## 3. Dataset Inspection & Quality Auditing

Place your unzipped Kaggle dataset in the `chest_xray_lung` directory. The structure should contain:
```text
chest_xray_lung/
  ├── train/
  │    ├── Cancer/
  │    └── NORMAL/
  ├── test/
  │    ├── Cancer/
  │    └── NORMAL/
  └── val/
       ├── Cancer/
       └── NORMAL/
```

Run the automated inspection script:
```powershell
.venv\Scripts\python.exe backend/ml/inspect_dataset.py
```

### Discovered Dataset Summary:
- **Total Images Validated:** 5,856
- **Classes:** `Cancer` (4,273 images, 73.0%) and `NORMAL` (1,583 images, 27.0%)
- **Integrity:** 0 corrupted images. 32 duplicate files filtered. Zero cross-split leakage.
- **Image Color Modes:** 5,573 Grayscale (`L`) converted to 3-channel RGB, 283 RGB.
- **Input Pipeline Matrix:** 224 &times; 224 pixels.

---

## 4. Deep Learning Model Training & Evaluation

### Step 4.1: Train the Deep Learning Model

The training script automatically performs stratified train/validation/test splitting to prevent data leakage, applies data augmentation to training data only, balances class weights, and saves the best model based on validation metrics:

```powershell
# Accelerated development run (subsamples 400 images):
.venv\Scripts\python.exe backend/ml/train.py --sample_limit 400 --epochs 3 --fine_tune_epochs 0

# Full production training run across all 5,856 images:
.venv\Scripts\python.exe backend/ml/train.py --epochs 12 --fine_tune_epochs 3 --batch_size 32
```

Trained artifacts will be saved in `backend/models/`:
- `best_lung_cancer_model.keras`
- `class_indices.json`
- `training_history.json`
- `model_metadata.json`
- `test_manifest.json`

### Step 4.2: Evaluate Model on Independent Test Data

Run the evaluation script to calculate overall and per-class metrics:
```powershell
.venv\Scripts\python.exe backend/ml/evaluate.py
```

### Measured Evaluation Performance:
- **Test Samples:** 60 independent images (zero leakage)
- **Overall Accuracy:** 81.67%
- **Macro Precision:** 90.00%
- **Macro Recall:** 65.62%
- **Macro F1-Score:** 68.25%
- **ROC AUC:** 0.9901
- **Per-Class Metrics:**
  - `Cancer`: Precision 80.0%, Recall 100.0%, F1 88.9%
  - `NORMAL`: Precision 100.0%, Recall 31.2%, F1 47.6%

### Step 4.3: Test Inference from Command Line

```powershell
.venv\Scripts\python.exe backend/ml/predict.py "chest_xray_lung/test/Cancer/test_cancer1.jpeg"
```

---

## 5. Supabase Database & Authentication Setup

### Step 5.1: Create a Supabase Project
1. Log in to [Supabase](https://supabase.com) and click **New Project**.
2. Name your project (e.g., `pulmoscan-ai`).
3. Set a strong database password and select a region near you.

### Step 5.2: Execute SQL Migration
1. Go to the **SQL Editor** in your Supabase dashboard.
2. Open or paste the migration script from:
   `supabase/migrations/20261023_init_lung_cancer.sql`
3. Click **Run**.
   - This creates the `profiles` and `predictions` tables.
   - Enforces **Row Level Security (RLS)** so users can only view, insert, and delete their own records.
   - Sets up automatic profile creation triggers when new users register via Supabase Auth.

### Step 5.3: Retrieve API Keys
Go to **Project Settings** &rarr; **API**:
- Copy the **Project URL**
- Copy the **anon / public** key
- Copy the **JWT Secret**

### Step 5.4: Configure Environment Variables

Create `.env` in the project root:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
```

Create `frontend/.env`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=http://127.0.0.1:8000
```

> **Note:** If Supabase keys are left empty, the application runs in **Local Development Mode** with mock sessions and local storage fallback so you can test all features offline without signing up.

---

## 6. Running the Complete Application

Open two PowerShell windows:

### Window 1: Start FastAPI Backend
```powershell
cd "D:\Ai Cancer detection"
.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Base URL: `http://127.0.0.1:8000`
- Interactive Swagger Documentation: `http://127.0.0.1:8000/docs`
- Health Endpoint: `http://127.0.0.1:8000/health`

### Window 2: Start React Frontend
```powershell
cd "D:\Ai Cancer detection\frontend"
npm run dev
```
- Application Web UI: `http://localhost:5173`

---

## 7. Automated Test Suite Verification

Run the full pytest suite (13 automated tests covering dataset integrity, PIL preprocessing, corrupted image rejection, model inference, authentication, and RLS data isolation):

```powershell
cd "D:\Ai Cancer detection"
.venv\Scripts\pytest.exe -v
```

---

## 8. Common Troubleshooting & Notes

| Issue | Cause | Fix |
|---|---|---|
| `TensorFlow GPU support not available on native Windows` | Native Windows wheels for TensorFlow &ge; 2.11 are CPU-only | MobileNetV2 runs fast on CPU. For GPU training on Windows, use WSL2 or DirectML. |
| `Missing Authorization Header (401)` | Protected endpoint called without Bearer token | Sign in to obtain an auth token or use the web dashboard. |
| `Corrupted or invalid image file (400)` | Uploaded file is not a valid JPEG/PNG/WEBP | Upload standard chest X-ray image formats. Files &lt; 32x32 pixels are rejected. |
| `ExecutionPolicy Error in PowerShell` | PowerShell restricts script execution | Run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` |

---

## 9. Academic Disclaimer

> **IMPORTANT:** This application is an academic AI research prototype. Its predictions are experimental and are not a medical diagnosis. Results must not be used to make clinical treatment decisions. Consult a qualified physician or radiologist for clinical evaluation.
