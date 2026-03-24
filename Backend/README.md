# Football Analytics API

Production-grade FastAPI backend for the AI football analytics platform.

## Stack

| Layer | Tech |
|---|---|
| Framework | FastAPI + Uvicorn |
| Validation | Pydantic v2 |
| Config | pydantic-settings |
| ML Runtime | joblib / scikit-learn |
| Tests | pytest + httpx |
| Container | Docker / Docker Compose |

## Quick Start (Local)

```bash
cd "e:\Services Images\InfoSec\football-app\Backend"

# 1 – Create virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux / macOS

# 2 – Install dependencies
pip install -r requirements.txt

# 3 – Copy env file
copy .env.example .env

# 4 – Run dev server
uvicorn app.main:app --reload --port 8000
```

API docs available at → http://localhost:8000/docs

## Docker

```bash
docker compose up --build
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `APP_NAME` | Football Analytics API | App display name |
| `ENVIRONMENT` | development | Deployment environment |
| `DEBUG` | false | Enable debug mode |
| `HOST` | 0.0.0.0 | Bind host |
| `PORT` | 8000 | Bind port |
| `DATA_DIR` | app/data | Path to JSON fixture files |
| `MODEL_DIR` | app/models_store | Path to trusted ML model files |
| `CORS_ORIGINS` | localhost:3000,localhost:5173 | Comma-separated CORS origins |
| `LOG_LEVEL` | INFO | Logging level |

## API Reference

All routes are under `/api/v1`.

### Health
| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness probe |

### Matches
| Method | Path | Description |
|---|---|---|
| GET | `/matches` | List all matches |
| GET | `/matches/{id}` | Match detail + events |
| GET | `/matches/{id}/overview` | Possession, pass accuracy, stats |

### Players
| Method | Path | Description |
|---|---|---|
| GET | `/players` | List all players |
| GET | `/players/{id}` | Player summary |
| GET | `/players/{id}/stats` | Full stats + computed accuracy |
| GET | `/players/{id}/heatmap` | Position heatmap coordinates |

### Teams
| Method | Path | Description |
|---|---|---|
| GET | `/teams` | List all teams |
| GET | `/teams/{id}` | Team detail |
| GET | `/teams/{id}/players` | Team roster |
| GET | `/teams/{id}/possession` | Possession % |

### Recommendations
| Method | Path | Description |
|---|---|---|
| GET | `/recommendations` | All rule-based recommendations |
| GET | `/recommendations/match/{id}` | Match-scoped recommendations |
| GET | `/recommendations/player/{id}` | Player-scoped recommendations |

### Upload
| Method | Path | Description |
|---|---|---|
| POST | `/upload` | Upload a JSON match file |

> ⚠️ Only `.json` files are accepted. Pickle/joblib uploads are rejected for security.

## Running Tests

```bash
cd "e:\Services Images\InfoSec\football-app\Backend"
pip install -r requirements-dev.txt
pytest
```

## ML Model Integration

Place trusted `.joblib` or `.pkl` model files in `MODEL_DIR`. The `ModelRuntime` class handles secure loading (path-traversal protection) and inference. Rule-based recommendations are always used as a fallback when no model is loaded.

## Project Structure

```
Backend/
├── app/
│   ├── main.py              # FastAPI app factory
│   ├── api/
│   │   ├── router.py        # Central router
│   │   └── routes/          # health, matches, players, teams, recommendations, upload
│   ├── core/
│   │   ├── config.py        # Settings (pydantic-settings)
│   │   ├── exceptions.py    # Typed exceptions + handlers
│   │   └── logging.py       # Structured logging
│   ├── models/
│   │   ├── domain.py        # UML-derived domain classes
│   │   ├── schemas.py       # Pydantic API schemas (camelCase)
│   │   └── responses.py     # Generic ApiResponse[T]
│   ├── services/
│   │   ├── json_loader.py      # Cached JSON data loading
│   │   ├── analytics_service.py # Match, player, team analytics
│   │   ├── recommendation_service.py # Rule-based recommendations
│   │   └── model_runtime.py    # ML model abstraction
│   └── data/                # JSON fixture files
├── tests/                   # pytest test suite
├── requirements.txt
├── requirements-dev.txt
├── .env.example
├── Dockerfile
├── docker-compose.yml
└── README.md
```
