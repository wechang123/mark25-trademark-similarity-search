#!/usr/bin/env python3
"""
Local vector similarity server for trademark image search.

API:
- POST /api/search (multipart/form-data, field: image)
- GET /api/stats
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, List

import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
from PIL import Image

# Lazy-loaded ML modules (loaded in load_model)
torch = None
F = None
AutoImageProcessor = None
AutoModel = None


def _resolve_path(env_name: str, default_relative: str) -> Path:
    env_value = os.environ.get(env_name)
    if env_value:
        return Path(env_value).expanduser().resolve()
    return (Path(__file__).resolve().parent / default_relative).resolve()


EMBEDDINGS_PATH = _resolve_path("EMBEDDINGS_PATH", "filtered_embeddings.npy")
FILENAMES_PATH = _resolve_path("FILENAMES_PATH", "filtered_filenames.json")
MODEL_NAME = os.environ.get("DINO_MODEL_NAME", "facebook/dinov2-large")
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "3001"))
MODEL_CACHE_DIR = str((Path(__file__).resolve().parent / "models").resolve())

app = Flask(__name__)
CORS(app)


def extract_trademark_number(filepath: str) -> str:
    # ex) C:\KIPRIS\...\4020247005427_md000001.jpg -> 4020247005427
    filename = filepath.replace("\\", "/").split("/")[-1]
    base = filename.rsplit(".", 1)[0]
    return base.split("_")[0]


def deduplicate_results(results: List[Dict[str, Any]], top_k: int = 20) -> List[Dict[str, Any]]:
    best_by_tm: Dict[str, Dict[str, Any]] = {}
    for row in results:
        tm = row["trademark_number"]
        current_best = best_by_tm.get(tm)
        if current_best is None or row["similarity"] > current_best["similarity"]:
            best_by_tm[tm] = row

    unique_sorted = sorted(best_by_tm.values(), key=lambda r: r["similarity"], reverse=True)
    trimmed = unique_sorted[:top_k]
    for rank, row in enumerate(trimmed, start=1):
        row["rank"] = rank
    return trimmed


def load_embeddings() -> np.ndarray:
    arr = np.load(str(EMBEDDINGS_PATH))
    if arr.ndim != 2:
        raise ValueError(f"Expected 2D embeddings array, got shape={arr.shape}")
    return arr.astype(np.float32, copy=False)


def normalize_matrix(mat: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(mat, axis=1, keepdims=True)
    norms = np.clip(norms, 1e-8, None)
    return mat / norms


def load_filenames() -> List[str]:
    with open(FILENAMES_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError("filenames json must be a list")
    return data


def load_model() -> tuple[Any, Any, str]:
    global torch, F, AutoImageProcessor, AutoModel

    print("Loading ML dependencies (torch/transformers)...")
    import torch as _torch
    import torch.nn.functional as _F
    from transformers import AutoImageProcessor as _AutoImageProcessor, AutoModel as _AutoModel

    torch = _torch
    F = _F
    AutoImageProcessor = _AutoImageProcessor
    AutoModel = _AutoModel

    if torch.cuda.is_available():
        device = "cuda"
    elif torch.backends.mps.is_available():
        device = "mps"
    else:
        device = "cpu"

    # 1) Try local cache first for offline/fast startup.
    try:
        processor = AutoImageProcessor.from_pretrained(
            MODEL_NAME, cache_dir=MODEL_CACHE_DIR, local_files_only=True
        )
        model = AutoModel.from_pretrained(
            MODEL_NAME, cache_dir=MODEL_CACHE_DIR, local_files_only=True
        ).to(device)
    except Exception:
        # 2) Fallback to online fetch for first-time setup.
        processor = AutoImageProcessor.from_pretrained(
            MODEL_NAME, cache_dir=MODEL_CACHE_DIR, local_files_only=False
        )
        model = AutoModel.from_pretrained(
            MODEL_NAME, cache_dir=MODEL_CACHE_DIR, local_files_only=False
        ).to(device)
    model.eval()
    return processor, model, device


def embed_image(pil_image: Image.Image) -> np.ndarray:
    inputs = processor(images=pil_image, return_tensors="pt")
    inputs = {k: v.to(device) for k, v in inputs.items()}
    with torch.no_grad():
        outputs = model(**inputs)
        # CLS token
        vec = outputs.last_hidden_state[:, 0, :]
        vec = F.normalize(vec, p=2, dim=1)
    return vec.squeeze(0).detach().cpu().numpy().astype(np.float32, copy=False)


print("\n" + "=" * 72)
print("Trademark Vector Search Server (DINOv2)")
print("=" * 72)
print(f"Embeddings: {EMBEDDINGS_PATH}")
print(f"Filenames : {FILENAMES_PATH}")
print("Loading embedding files...")

embeddings = load_embeddings()
filenames = load_filenames()
if len(filenames) != embeddings.shape[0]:
    raise ValueError(
        f"Row count mismatch: embeddings={embeddings.shape[0]}, filenames={len(filenames)}"
    )
embeddings_normalized = normalize_matrix(embeddings)

print(f"Loaded vectors: {embeddings.shape[0]:,}")
print(f"Vector dimension: {embeddings.shape[1]}")
print("Loading DINOv2 model...")
processor, model, device = load_model()
print(f"Model loaded: {MODEL_NAME} on {device}")
print("=" * 72 + "\n")


@app.get("/api/stats")
def stats():
    return jsonify(
        {
            "total_embeddings": int(embeddings.shape[0]),
            "embedding_dimension": int(embeddings.shape[1]),
            "model": MODEL_NAME,
            "device": device,
            "embeddings_path": str(EMBEDDINGS_PATH),
            "filenames_path": str(FILENAMES_PATH),
        }
    )


@app.post("/api/search")
def search():
    try:
        if "image" not in request.files:
            return jsonify({"success": False, "error": "image is required"}), 400

        up = request.files["image"]
        pil = Image.open(up.stream).convert("RGB")
        q = embed_image(pil)
        q_norm = q / max(float(np.linalg.norm(q)), 1e-8)

        # cosine similarity against pre-normalized matrix
        sims = embeddings_normalized @ q_norm

        # top 50 first, then deduplicate trademark_number -> top 20
        top_n = min(50, sims.shape[0])
        if top_n == 0:
            return jsonify({"success": True, "results": [], "total": 0, "deduplication": {"original_count": 0, "unique_count": 0, "removed": 0}})
        top_idx = np.argpartition(-sims, top_n - 1)[:top_n]
        top_idx = top_idx[np.argsort(-sims[top_idx])]

        raw_results: List[Dict[str, Any]] = []
        for idx in top_idx.tolist():
            filepath = filenames[idx]
            tm_no = extract_trademark_number(filepath)
            raw_results.append(
                {
                    "rank": len(raw_results) + 1,
                    "trademark_number": tm_no,
                    "similarity": float(sims[idx]),
                    "filepath": filepath,
                    "filename": filepath.replace("\\", "/").split("/")[-1],
                }
            )

        results = deduplicate_results(raw_results, top_k=20)

        return jsonify(
            {
                "success": True,
                "results": results,
                "total": len(results),
                "deduplication": {
                    "original_count": len(raw_results),
                    "unique_count": len({r["trademark_number"] for r in raw_results}),
                    "removed": len(raw_results) - len({r["trademark_number"] for r in raw_results}),
                },
            }
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    print(f"Server running at http://localhost:{PORT}")
    app.run(host=HOST, port=PORT, debug=True)
