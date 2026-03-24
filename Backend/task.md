# FastAPI Backend Implementation Plan

## 1. Objective

Build a production-style FastAPI backend under `Backend/` for the football analytics application. The backend must support current frontend needs and remain ready for future local ML model integration.

## 2. Current Repository Context

- Frontend exists as a Vite React TypeScript app under `Frontend/`.
- Backend currently has no application code.
- Target stack:
  - Python 3.10+
  - FastAPI
  - Uvicorn
  - Pydantic
  - joblib / pickle compatibility
  - scikit-learn / pandas compatibility
- Required CORS origins:
  - `http://localhost:3000`
  - `http://localhost:5173`

## 3. Assumptions from Frontend

Before implementation, validate the exact response contract from:
- `Frontend/src/pages/MatchAnalysis.tsx`
- `Frontend/src/pages/Heatmaps.tsx`
- `Frontend/src/pages/PlayerProfile.tsx`
- `Frontend/src/pages/Recommendations.tsx`
- `Frontend/src/pages/TeamDetails.tsx`
- `Frontend/src/pages/Dashboard.tsx`
- `Frontend/src/pages/Upload.tsx`
- `Frontend/src/services/mockData.ts`

Working assumptions:
- API should use `/api/v1`.
- Responses may need camelCase aliases if the frontend expects them.
- Upload support should be isolated from analytics logic.
- Recommendations should start with rule-based logic and later support local ML inference.

## 4. Target Architecture

Recommended structure:

- `Backend/app/main.py`
- `Backend/app/api/router.py`
- `Backend/app/api/routes/health.py`
- `Backend/app/api/routes/matches.py`
- `Backend/app/api/routes/players.py`
- `Backend/app/api/routes/teams.py`
- `Backend/app/api/routes/recommendations.py`
- `Backend/app/api/routes/upload.py`
- `Backend/app/core/config.py`
- `Backend/app/core/exceptions.py`
- `Backend/app/core/logging.py`
- `Backend/app/models/domain.py`
- `Backend/app/models/schemas.py`
- `Backend/app/models/responses.py`
- `Backend/app/services/json_loader.py`
- `Backend/app/services/analytics_service.py`
- `Backend/app/services/recommendation_service.py`
- `Backend/app/services/model_runtime.py`
- `Backend/app/data/`
- `Backend/tests/`
- `Backend/requirements.txt`
- `Backend/requirements-dev.txt`
- `Backend/.env.example`
- `Backend/Dockerfile`
- `Backend/docker-compose.yml`
- `Backend/README.md`

## 5. Domain Models

Implement UML-derived classes with clean typing and helper methods:

### Position
Suggested fields:
- `x`
- `y`
- `timestamp`
- `minute`

### Positions
Suggested responsibilities:
- hold a list of `Position`
- provide centroid and bounding box helpers
- return heatmap-friendly coordinates

### Pass
Suggested fields:
- `player_id`
- `recipient_id`
- `team_id`
- `start_x`
- `start_y`
- `end_x`
- `end_y`
- `successful`
- `minute`

Suggested helpers:
- pass distance
- progressive or forward pass heuristic

### Turnover
Suggested fields:
- `player_id`
- `team_id`
- `x`
- `y`
- `minute`
- `turnover_type`

### PlayerStats
Suggested fields:
- player identity
- team identity
- minutes played
- passes attempted
- passes completed
- turnovers
- goals
- assists
- derived metrics

Suggested helpers:
- pass accuracy
- turnover rate
- compact summary export

### MatchData
Suggested contents:
- match metadata
- teams
- players
- passes
- turnovers
- positions
- possession segments
- extra metadata

Suggested helpers:
- overview summary
- player/team lookup
- possession aggregation

### Recommendation
Suggested fields:
- `id`
- `scope`
- `match_id`
- `team_id`
- `player_id`
- `title`
- `description`
- `priority`
- `confidence`
- `reasoning`
- `metrics`

## 6. Service Layer

### JSONLoader
Responsibilities:
- load trusted local JSON fixtures
- validate and transform raw data into typed models
- handle missing or malformed files safely
- optionally cache loaded datasets

### AnalyticsService
Responsibilities:
- compute match overview
- compute player stats
- prepare player heatmap points
- compute team possession
- summarize pass and turnover metrics

Rules:
- keep business logic out of routers
- prefer pure and testable methods

### RecommendationService
Responsibilities:
- produce recommendations from analytics results
- start with rule-based logic
- remain swappable with ML-backed logic later

### ModelRuntime
Responsibilities:
- abstract model loading and inference
- support trusted local `.joblib` and `.pkl` assets
- remain compatible with scikit-learn and pandas workflows

Important rule:
- do not deserialize untrusted user-supplied pickle/joblib files

## 7. API Routes

Suggested routes under `/api/v1`:

### Health
- `GET /health`

### Matches
- `GET /matches`
- `GET /matches/{match_id}`
- `GET /matches/{match_id}/overview`

### Players
- `GET /players`
- `GET /players/{player_id}`
- `GET /players/{player_id}/stats`
- `GET /players/{player_id}/heatmap`

### Teams
- `GET /teams`
- `GET /teams/{team_id}`
- `GET /teams/{team_id}/players`
- `GET /teams/{team_id}/possession`

### Recommendations
- `GET /recommendations`
- `GET /recommendations/match/{match_id}`
- `GET /recommendations/player/{player_id}`

### Upload
- `POST /upload`

## 8. Response Contracts

Align response shapes with frontend expectations.

General guidance:
- overview endpoints should return card/chart-friendly fields
- heatmap endpoints should return coordinate arrays
- possession endpoints should return percentages and totals
- recommendation endpoints should return a list of recommendation objects

If needed:
- use internal snake_case
- expose camelCase aliases externally

## 9. Validation and Error Handling

Standardize:
- `404` for unknown match, player, or team
- `422` for request validation errors
- `400` for malformed uploads or bad input payloads
- `500` for unexpected server errors

Recommended error shape:
- `detail`
- optional `error_code`
- optional `context`

## 10. Test Plan

Use `pytest` with FastAPI `TestClient`.

Minimum coverage:
- app startup
- `GET /health`
- CORS configuration
- match overview success path
- player stats success and not-found paths
- player heatmap response shape
- team possession aggregation
- recommendation fallback without ML model
- JSON loader missing-file and invalid-JSON handling
- analytics calculations for pass accuracy and turnover totals

## 11. Docker and Environment

Include:
- `Dockerfile` with Python 3.10+
- `docker-compose.yml`
- `.env.example`

Environment values should cover:
- app name
- environment
- debug
- host
- port
- data directory
- model directory
- CORS origins
- log level

## 12. AI / ML Readiness

Prepare for future local model integration:
- isolate inference logic in `model_runtime.py`
- define a stable feature contract for analytics-to-model inputs
- allow DataFrame-friendly transformation with pandas later
- support joblib and pickle loading for trusted local artifacts
- keep rule-based recommendations as fallback when no model is present

## 13. Milestones

### Phase 1
- bootstrap FastAPI app
- config
- logging
- CORS
- health route
- sample fixture loading

### Phase 2
- domain models
- schemas
- JSON loader
- analytics service

### Phase 3
- matches, players, and teams endpoints
- frontend-aligned response shapes

### Phase 4
- recommendations service
- AI runtime abstraction
- upload endpoint

### Phase 5
- tests
- Docker
- README
- env example

## 14. Risks and Mitigations

### Risk: frontend/backend contract drift
Mitigation:
- derive endpoint and field names from actual frontend pages and mock data before coding

### Risk: missing real ML model
Mitigation:
- use a rule-based recommendation engine now and wrap future inference behind `ModelRuntime`

### Risk: unsafe deserialization
Mitigation:
- load only trusted local model artifacts from a controlled directory

### Risk: sparse or inconsistent match data
Mitigation:
- define a canonical internal schema and validate at load time

## 15. Definition of Done

The backend is complete when:
- FastAPI app runs locally
- CORS works for `localhost:3000` and `localhost:5173`
- health, overview, player stats, heatmap, possession, and recommendation routes are implemented
- routers remain separate from business logic
- UML-derived classes are represented in code
- tests pass
- Docker assets and docs exist
- AI compatibility layer exists even without a shipped model