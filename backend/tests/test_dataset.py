from pathlib import Path
from backend.ml.inspect_dataset import find_dataset_root, compute_file_hash, VALID_EXTENSIONS

def test_dataset_discovery():
    root = find_dataset_root()
    assert root is not None, "Should automatically locate dataset directory"
    assert root.exists() and root.is_dir()
    
    subdirs = [d.name.lower() for d in root.iterdir() if d.is_dir()]
    assert any(s in subdirs for s in ["train", "test", "cancer", "normal"])

def test_file_hash_computation(tmp_path):
    test_file = tmp_path / "sample.txt"
    test_file.write_text("Chest X-Ray Test Data")
    h1 = compute_file_hash(test_file)
    h2 = compute_file_hash(test_file)
    assert len(h1) == 32
    assert h1 == h2

def test_valid_extensions():
    assert ".jpeg" in VALID_EXTENSIONS
    assert ".png" in VALID_EXTENSIONS
    assert ".jpg" in VALID_EXTENSIONS
    assert ".txt" not in VALID_EXTENSIONS
