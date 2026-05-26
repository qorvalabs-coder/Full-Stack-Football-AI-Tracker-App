FROM python:3.11-slim

# System dependencies for OpenCV, psycopg2, and wget
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libpq-dev \
    gcc \
    wget \
    && rm -rf /var/lib/apt/cache/*

WORKDIR /app

# Install CPU-only PyTorch first to avoid pulling the 2GB CUDA build
RUN pip install --no-cache-dir torch torchvision \
    --index-url https://download.pytorch.org/whl/cpu

# Copy and install remaining Agent requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download StrongSort ReID weights at build time so the worker
# starts instantly without a cold-download on first task.
# osnet_x0_25_msmt17.pt is ~2.2 MB.
RUN python -c "\
from pathlib import Path; \
from boxmot.trackers.strongsort.strongsort import StrongSort; \
StrongSort(reid_weights=Path('osnet_x0_25_msmt17.pt'), device='cpu', half=False); \
print('ReID weights downloaded successfully.')"

# Copy Agent code
COPY . .

# Note: Backend/app models are mounted at runtime via shared volume
# or copied into Agent/app/ for the import path used in worker.py.

# Python paths
ENV PYTHONPATH=/app:/app/football_analysis

# YOLO config dir must be writable
ENV YOLO_CONFIG_DIR=/tmp

# Start the Celery worker
CMD ["celery", "-A", "worker.worker_app", "worker", "--loglevel=info", "--concurrency=1"]
