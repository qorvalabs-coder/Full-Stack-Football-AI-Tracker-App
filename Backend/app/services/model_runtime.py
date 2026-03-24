from __future__ import annotations

from pathlib import Path
from typing import Any, Optional

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class ModelRuntime:
    """
    Abstraction for loading and running local ML model artifacts.

    Security contract:
    - Only loads files from the controlled MODEL_DIR.
    - Never deserializes user-supplied bytes.
    - Supports .joblib and .pkl formats (scikit-learn compatible).
    """

    def __init__(self) -> None:
        self._model: Optional[Any] = None
        self._model_path: Optional[Path] = None

    @property
    def is_loaded(self) -> bool:
        return self._model is not None

    def load(self, filename: str) -> None:
        """
        Load a model from MODEL_DIR.
        Raises ValueError if the path escapes MODEL_DIR (path traversal guard).
        """
        import joblib

        model_dir = Path(settings.model_dir).resolve()
        target = (model_dir / filename).resolve()

        # Security: reject any path that doesn't stay inside MODEL_DIR
        if not str(target).startswith(str(model_dir)):
            raise ValueError(f"Refusing to load model outside MODEL_DIR: {filename}")

        if not target.exists():
            raise FileNotFoundError(f"Model file not found: {target}")

        suffix = target.suffix.lower()
        if suffix not in {".joblib", ".pkl", ".pickle"}:
            raise ValueError(f"Unsupported model format: {suffix}")

        self._model = joblib.load(target)
        self._model_path = target
        logger.info("Loaded model from %s", target)

    def predict(self, features: dict) -> dict:
        """Run inference. Returns empty dict if no model is loaded (rule-based fallback)."""
        if not self.is_loaded:
            logger.debug("ModelRuntime: no model loaded, returning empty prediction.")
            return {}

        import pandas as pd

        df = pd.DataFrame([features])
        result = self._model.predict(df)
        return {"prediction": result.tolist()}

    def unload(self) -> None:
        self._model = None
        self._model_path = None
        logger.info("Model unloaded.")


# Singleton – shared across the app
model_runtime = ModelRuntime()
