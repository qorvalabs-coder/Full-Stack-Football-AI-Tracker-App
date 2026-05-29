# Software Requirements Specification
## GoalSense — AI Football Analytics Platform

> **Version:** 2.0 · **Date:** May 29, 2026 · **Classification:** Internal

---

## 1 · Introduction

### 1.1 Purpose
This SRS defines the complete functional, non-functional, and technical requirements for **GoalSense**, an end-to-end AI-powered football analytics platform that ingests match video footage, performs real-time computer vision analysis, and delivers actionable coaching insights through an interactive web dashboard.

### 1.2 Scope
The system comprises three independently deployable services:

| Service | Role | Runtime |
|---------|------|---------|
| **Frontend** | Interactive SPA dashboard | Vercel / Static CDN |
| **Backend** | REST API, data persistence, auth | Railway (Docker) |
| **Agent** | AI video analysis worker | Railway (Docker + GPU) |

### 1.3 Intended Audience
- Football coaches & performance analysts
- Sports data scientists
- Platform administrators & DevOps engineers

### 1.4 Definitions & Acronyms

| Term | Definition |
|------|-----------|
| YOLO | You Only Look Once — real-time object detection model |
| StrongSORT | Appearance-based multi-object tracker with ReID |
| ReID | Re-Identification — recognizing the same person across frames |
| Heatmap | Spatial density visualization of player positions |
| Celery | Distributed task queue for Python |

---

## 2 · System Overview

```
┌──────────────┐     Upload Video     ┌──────────────┐    Celery/Redis    ┌──────────────┐
│              │ ──────────────────▶   │              │ ────────────────▶  │              │
│   Frontend   │                       │   Backend    │                    │    Agent     │
│  (React/TS)  │ ◀── REST JSON ────── │  (FastAPI)   │ ◀── POST JSON ──  │  (YOLO/CV)   │
│              │                       │              │                    │              │
└──────────────┘                       └──────────────┘                    └──────────────┘
     Vercel                             Railway                             Railway
                                        + Redis                            + GPU/8GB
                                        + Volume                           + Volume
```

**Data Flow:**
1. User uploads match video via Frontend → Backend stores file on volume
2. Backend enqueues Celery task → Agent downloads video via HTTP
3. Agent runs YOLO detection → StrongSORT tracking → Team assignment → Analysis
4. Agent exports JSON match data → POSTs to Backend `/api/v1/upload`
5. Frontend fetches analytics via REST API → renders dashboard

---

## 3 · Functional Requirements

### 3.1 Video Upload & Processing

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | System SHALL accept video uploads (MP4, AVI, MOV) up to 500MB | High |
| FR-02 | System SHALL create a Celery task and return a `task_id` immediately | High |
| FR-03 | User SHALL be able to poll task status via `GET /analysis/tasks/{id}` | High |
| FR-04 | Agent SHALL download uploaded video from Backend via HTTP (cross-container) | High |
| FR-05 | Agent SHALL process video with frame-level garbage collection to stay within 8GB RAM | High |

### 3.2 AI Computer Vision Pipeline

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-10 | System SHALL detect players, referees, and ball using YOLOv5/v8 (`best.pt`) | High |
| FR-11 | System SHALL track objects across frames using StrongSORT with ReID | High |
| FR-12 | System SHALL assign detected players to teams using K-means color clustering | High |
| FR-13 | System SHALL estimate camera movement using optical flow (Lucas-Kanade) | Medium |
| FR-14 | System SHALL transform pixel coordinates to field coordinates via homography | Medium |
| FR-15 | System SHALL calculate per-frame ball possession by nearest-player assignment | High |
| FR-16 | System SHALL estimate player speed and distance from transformed coordinates | Medium |
| FR-17 | System SHALL generate an annotated output video with bounding boxes and overlays | Low |

### 3.3 Data Export & Persistence

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-20 | Exporter SHALL produce a JSON file conforming to the `MatchData` schema | High |
| FR-21 | Export SHALL include: teams, players, passes, turnovers, positions, metadata stats | High |
| FR-22 | Metadata stats SHALL include: Passes, Turnovers, Possession, Pass Accuracy, Shots, Corner Kicks, Fouls | High |
| FR-23 | Agent SHALL POST the JSON to Backend `/api/v1/upload` for cross-container persistence | High |
| FR-24 | Backend SHALL invalidate its LRU cache upon receiving new match data | High |

### 3.4 Dashboard & Analytics

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-30 | Dashboard SHALL display list of analyzed matches with scores and dates | High |
| FR-31 | Match Analysis page SHALL show scoreboard, possession donut, stat bars, bar chart | High |
| FR-32 | Comparison page SHALL show radar chart and head-to-head stat table | High |
| FR-33 | Heatmaps page SHALL render player position density on a football pitch grid (10×6) | High |
| FR-34 | Recommendations page SHALL display AI-generated tactical insights with priority badges | High |
| FR-35 | PDF export SHALL capture the full analysis page including stats table and recommendations (multi-page) | High |
| FR-36 | Team icons SHALL use professional SVG shield badges (not emojis) | Medium |

### 3.5 Authentication

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-40 | System SHALL support JWT-based authentication (HS256, 24h expiry) | Medium |
| FR-41 | System SHALL provide login and registration endpoints | Medium |
| FR-42 | Protected endpoints SHALL validate Bearer tokens | Medium |

### 3.6 Recommendations Engine

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-50 | System SHALL generate rule-based recommendations from real match data | High |
| FR-51 | Rules SHALL cover: top performers (rating ≥ 8.5), pass accuracy < 70%, turnover rate > 12% | High |
| FR-52 | System SHALL identify opposing team threats (top 3 by rating) | Medium |
| FR-53 | System SHALL generate team-level tactical advice (transitions, shot conversion, set-pieces) | Medium |
| FR-54 | System SHALL support future ML model injection via `ModelRuntime` class | Low |

---

## 4 · Non-Functional Requirements

### 4.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | API response time for cached data | < 200ms |
| NFR-02 | 5-second video processing time | < 120 seconds |
| NFR-03 | 30-minute video processing time | < 45 minutes |
| NFR-04 | Frontend initial load (LCP) | < 2.5 seconds |
| NFR-05 | PDF export generation | < 10 seconds |

### 4.2 Scalability

| ID | Requirement |
|----|-------------|
| NFR-10 | Agent SHALL process videos within 8GB RAM using frame-level GC |
| NFR-11 | Celery workers SHALL scale horizontally via Redis broker |
| NFR-12 | Backend SHALL use LRU caching with cache-busting on data upload |

### 4.3 Security

| ID | Requirement |
|----|-------------|
| NFR-20 | Upload endpoint SHALL reject non-JSON files (no pickle/joblib) |
| NFR-21 | ModelRuntime SHALL enforce path traversal protection on model loading |
| NFR-22 | JWT secret SHALL be configurable via environment variable |
| NFR-23 | CORS origins SHALL be configurable and restrictive |

### 4.4 Reliability

| ID | Requirement |
|----|-------------|
| NFR-30 | System SHALL gracefully degrade when no ML model is loaded |
| NFR-31 | Agent SHALL retry video downloads on network failure |
| NFR-32 | All API responses SHALL use a consistent envelope format |

### 4.5 Maintainability

| ID | Requirement |
|----|-------------|
| NFR-40 | Backend SHALL follow layered architecture (Routes → Services → Domain) |
| NFR-41 | All domain models SHALL use Pydantic v2 with validation |
| NFR-42 | Test suite SHALL maintain ≥ 44 tests across 7 files |

---

## 5 · Technical Architecture

### 5.1 Technology Stack

#### Backend (REST API)
| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | FastAPI | Latest |
| Server | Uvicorn | Latest |
| Validation | Pydantic v2 | Latest |
| Configuration | pydantic-settings | Latest |
| ML Runtime | scikit-learn, joblib, pandas | Latest |
| Testing | pytest, httpx | Latest |
| Container | Docker | Latest |

#### Frontend (Dashboard)
| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | React | 19.2 |
| Language | TypeScript | 5.9 |
| Build | Vite | 7.3 |
| Styling | Tailwind CSS | 4.2 |
| Animations | Framer Motion | 12.35 |
| Charts | Recharts | 3.8 |
| PDF Export | jsPDF + html-to-image | Latest |
| 3D Effects | Three.js | 0.184 |
| Routing | React Router | 7.13 |
| Notifications | react-hot-toast | 2.6 |

#### Agent (AI Worker)
| Component | Technology | Version |
|-----------|-----------|---------|
| Object Detection | Ultralytics YOLOv5/v8 | Latest |
| Multi-Object Tracking | boxmot (StrongSORT) | 19.x |
| Deep Learning | PyTorch + TorchVision | Latest |
| Computer Vision | OpenCV (headless) | Latest |
| Task Queue | Celery | 5.6 |
| Message Broker | Redis | Latest |
| HTTP Client | requests | Latest |

### 5.2 Domain Model

```
Position (x, y, timestamp, minute)
    └── Positions (collection with centroid, bounding_box, heatmap_coords)

Pass (player_id, recipient_id, team_id, start/end coords, successful)
    ├── distance() → float
    └── is_progressive() → bool  (>10x forward, >15 total distance)

Turnover (player_id, team_id, x, y, type)

PlayerStats
    ├── Core: id, name, team_id, position, number
    ├── Stats: goals, assists, minutes_played, rating
    ├── Computed: pass_accuracy, turnover_rate
    └── Attributes: speed, dribbling, shooting, passing, defending, physical

MatchData
    ├── Teams: home_team, away_team (TeamSummary)
    ├── Score: home_score, away_score, status, date
    ├── Events: players[], passes[], turnovers[]
    ├── Spatial: positions{player_id → Position[]}
    ├── Metadata: stats[], raw config
    └── Helpers: team_possession(), team_players()

Recommendation
    ├── Scope: match | team | player
    ├── Identity: id, match_id, team_id, player_id
    ├── Content: title, description, reasoning
    └── Meta: priority (high/medium/low), confidence (0-1), metrics{}
```

### 5.3 API Specification

**Base URL:** `/api/v1` · **Response Format:** `{ success, data, message, timestamp }`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Liveness check |
| `GET` | `/matches` | List all matches |
| `GET` | `/matches/{id}` | Match detail with events |
| `GET` | `/matches/{id}/overview` | Possession, pass accuracy, full stats |
| `GET` | `/players` | List all players (from matches + standalone) |
| `GET` | `/players/{id}` | Player summary |
| `GET` | `/players/{id}/stats` | Full stats with computed metrics |
| `GET` | `/players/{id}/heatmap` | Position heatmap zones |
| `GET` | `/teams` | List all teams |
| `GET` | `/teams/{id}` | Team detail with attributes |
| `GET` | `/teams/{id}/players` | Team roster |
| `GET` | `/teams/{id}/possession` | Possession % from latest match |
| `GET` | `/recommendations` | All recommendations |
| `GET` | `/recommendations/match/{id}` | Match-scoped recommendations |
| `GET` | `/recommendations/player/{id}` | Player-scoped recommendations |
| `POST` | `/upload` | Upload JSON match data file |
| `POST` | `/analysis/upload` | Upload video for AI processing |
| `GET` | `/analysis/tasks/{id}` | Poll task processing status |
| `POST` | `/auth/login` | JWT login |
| `POST` | `/auth/register` | User registration |
| `GET` | `/auth/me` | Current user profile |

### 5.4 AI Pipeline Stages

```
Stage 1: Video Ingestion
    └── read_video() → list[numpy.ndarray]

Stage 2: Object Detection
    └── YOLO best.pt → bounding boxes {players, referees, ball}

Stage 3: Multi-Object Tracking
    └── StrongSORT + ReID → persistent track IDs across frames

Stage 4: Team Assignment
    └── K-means clustering on jersey color (HSV) → team_id {1, 2}

Stage 5: Ball Possession
    └── Nearest-player to ball per frame → team_ball_control[]

Stage 6: Camera Movement Estimation
    └── Lucas-Kanade optical flow → dx, dy per frame

Stage 7: View Transformation
    └── Homography matrix → pixel coords to field coords (0-100)

Stage 8: Speed & Distance
    └── Frame-to-frame displacement → m/s speed, cumulative distance

Stage 9: Data Export
    └── export_to_match_data() → MatchData JSON schema

Stage 10: Result Delivery
    └── HTTP POST to Backend /api/v1/upload → cache invalidation
```

---

## 6 · Frontend Specification

### 6.1 Page Architecture

| Page | Route | Key Components |
|------|-------|----------------|
| Landing | `/` | 3D hero, feature cards, tech stack |
| Login | `/login` | Email/password form, JWT storage |
| Register | `/register` | Name/email/password form |
| Dashboard | `/dashboard` | Match list, team stats, recent activity |
| Match Analysis | `/analysis/:id` | Scoreboard, possession donut, bar chart, stats table, recommendations, PDF export |
| Heatmaps | `/heatmaps` | Player selector, 10×6 pitch grid, zone density visualization |
| Comparison | `/comparison` | Radar chart, head-to-head table, team shields |
| Player Profile | `/players/:id` | Stats, radar chart, attributes |
| Team Details | `/teams/:id` | Roster, team attributes |
| Recommendations | `/recommendations` | Priority-sorted insight cards |
| Upload | `/upload` | Video upload with progress, task polling |
| Settings | `/settings` | User preferences |
| Support | `/support` | Help & FAQ |

### 6.2 Design System

| Token | Value |
|-------|-------|
| Primary | `#00e676` (Emerald Green) |
| Background | `#080c10` (Deep Navy Black) |
| Surface | `rgba(255,255,255,0.03)` (Glass) |
| Border | `#1a2332` |
| Foreground | `#e8edf2` |
| Muted | `#8495a7` |
| Font Display | `Outfit` (Google Fonts) |
| Font Mono | `JetBrains Mono` |

### 6.3 UI Components

| Component | Purpose |
|-----------|---------|
| `GlassCard` | Frosted glass container with border glow |
| `BlurIn` | Scroll-triggered blur-to-focus animation |
| `StatCard` | Numeric stat with optional green glow |
| `SectionLabel` | Monospace section header with path |
| `TeamShield` | SVG shield badge with team initial + gradient |
| `Navbar` | Fixed top nav with glassmorphism |

---

## 7 · Infrastructure & Deployment

### 7.1 Railway Configuration

| Service | Root Dir | Start Command | RAM |
|---------|----------|---------------|-----|
| Backend | `Backend/` | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` | 2GB |
| Agent | `Agent/` | `celery -A worker worker_app --loglevel=info` | 8GB |
| Redis | — | Managed Redis instance | 256MB |
| Frontend | `Frontend/` | Deployed to Vercel separately | — |

### 7.2 Environment Variables

| Variable | Service | Description |
|----------|---------|-------------|
| `PORT` | Backend | Server port (auto-set by Railway) |
| `REDIS_URL` | Both | Redis connection string |
| `DATABASE_URL` | Both | PostgreSQL connection (optional) |
| `CORS_ORIGINS` | Backend | Comma-separated allowed origins |
| `JWT_SECRET_KEY` | Backend | HMAC signing key |
| `BACKEND_API_URL` | Agent | Backend public URL for file download |
| `CELERY_BROKER_URL` | Agent | Redis URL for Celery |
| `VITE_API_BASE_URL` | Frontend | Backend API URL |

### 7.3 Volume Architecture

```
Backend Container                    Agent Container
├── /backend/app/data/               ├── /app/data/
│   ├── matches.json                 │   ├── media/inputs/   (downloaded videos)
│   ├── players.json                 │   └── media/outputs/  (annotated videos)
│   ├── teams.json                   │
│   └── media/inputs/ (uploads)      └── football_analysis/models/best.pt
│
└── Cross-container transfer: Agent → POST JSON → Backend /api/v1/upload
```

---

## 8 · Data Schemas

### 8.1 Match JSON Export Schema

```json
{
  "id": "ai_<task_id>",
  "date": "2026-05-28",
  "home_team": { "id": "team_1", "name": "FC Green" },
  "away_team": { "id": "team_2", "name": "FC Bayern" },
  "home_score": 0,
  "away_score": 0,
  "status": "AI Analyzed",
  "players": [
    {
      "id": "p_<track_id>",
      "name": "Player <number>",
      "team_id": "team_1",
      "team_name": "FC Green",
      "position": "Midfielder",
      "number": 7,
      "rating": 7.2,
      "goals": 0,
      "assists": 0,
      "minutes_played": 90,
      "passes_attempted": 12,
      "passes_completed": 9,
      "turnovers": 2,
      "attributes": { "speed": 75, "dribbling": 70, ... }
    }
  ],
  "passes": [{ "player_id": "...", "team_id": "...", "start_x": 45, ... }],
  "turnovers": [{ "player_id": "...", "x": 60, "y": 30, ... }],
  "positions": { "p_1": [{ "x": 45.2, "y": 62.1, "minute": 1 }] },
  "metadata": {
    "stats": [
      { "name": "Passes", "home": 38, "away": 22 },
      { "name": "Possession", "home": 63.3, "away": 36.7 },
      { "name": "Pass Accuracy", "home": 82.5, "away": 71.2 },
      { "name": "Shots", "home": 0, "away": 0 },
      { "name": "Corner Kicks", "home": 0, "away": 0 },
      { "name": "Fouls", "home": 0, "away": 0 }
    ]
  }
}
```

### 8.2 API Response Envelope

```json
{
  "success": true,
  "data": { ... },
  "message": "OK",
  "timestamp": "2026-05-28T19:30:00+00:00"
}
```

### 8.3 Error Response

```json
{
  "detail": "Match 'xyz' not found.",
  "error_code": "NOT_FOUND",
  "context": { "resource": "Match", "id": "xyz" }
}
```

---

## 9 · Testing Strategy

### 9.1 Backend Tests (44 tests, 7 files)

| File | Scope |
|------|-------|
| `test_health.py` | App startup, health endpoint, CORS headers |
| `test_matches.py` | List, detail, overview, 404 handling |
| `test_players.py` | List, detail, stats, heatmap, 404 |
| `test_teams.py` | List, detail, roster, possession |
| `test_recommendations.py` | All scopes, ML fallback |
| `test_json_loader.py` | Missing file, invalid JSON, upload accept/reject |
| `test_analytics.py` | Pass accuracy math, heatmap coords, distance |

### 9.2 Integration Testing
- Upload video → verify task creation → verify JSON appears in Backend
- Cross-container HTTP file transfer validation
- PDF export completeness verification

---

## 10 · Known Constraints & Future Roadmap

### Current Constraints
| Constraint | Impact |
|-----------|--------|
| 8GB RAM limit on Railway | Long videos (>30 min) may require frame-skipping |
| No GPU on free tier | YOLO inference is CPU-only (~2-5 FPS) |
| Shots/Corners/Fouls detection | Not supported by current YOLO model (placeholder 0) |
| Single-camera input | No multi-angle reconstruction |

### Future Roadmap
| Phase | Feature |
|-------|---------|
| v2.1 | Frame-skipping for 90-minute match processing |
| v2.2 | Event detection (goals, fouls, offsides) via action recognition |
| v2.3 | ML-based recommendation engine replacing rule-based |
| v2.4 | Multi-match season analytics and trend tracking |
| v2.5 | Real-time live stream processing |
| v3.0 | Multi-camera tactical board with 3D reconstruction |

---

## 11 · Glossary

| Term | Definition |
|------|-----------|
| Possession | % of frames where a team's player is nearest to the ball |
| Pass Accuracy | Successful passes / total passes attempted × 100 |
| Turnover Rate | Turnovers / (passes + turnovers) |
| Progressive Pass | A pass moving >10 units forward with >15 total distance |
| Heatmap Zone | 10×6 grid cell on normalized (0-100) field coordinates |
| Track ID | Persistent identifier for a detected object across frames |

---

*Generated by GoalSense AI Platform · v2.0 · May 2026*
