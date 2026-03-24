from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path
from typing import Any

from app.core.config import settings
from app.core.exceptions import DataLoadError
from app.core.logging import get_logger
from app.models.domain import (
    MatchData,
    MatchEvent,
    Pass,
    PlayerStats,
    PlayerAttributes,
    Position,
    PossessionSegment,
    TeamSummary,
    Turnover,
)

logger = get_logger(__name__)


def _data_path() -> Path:
    """Resolve DATA_DIR relative to the Backend/ working directory."""
    return Path(settings.data_dir)


def _read_json(filename: str) -> list[dict]:
    path = _data_path() / filename
    if not path.exists():
        raise DataLoadError(f"Data file not found: {filename}", str(path))
    try:
        with path.open("r", encoding="utf-8") as fh:
            return json.load(fh)
    except json.JSONDecodeError as exc:
        raise DataLoadError(f"Invalid JSON in {filename}: {exc}", str(path)) from exc


# ── Typed loaders ─────────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def load_teams() -> list[dict]:
    """Load teams.json – cached for the process lifetime."""
    raw = _read_json("teams.json")
    logger.debug("Loaded %d teams", len(raw))
    return raw


@lru_cache(maxsize=1)
def load_players() -> list[PlayerStats]:
    """Load players.json and return typed PlayerStats list."""
    raw = _read_json("players.json")
    players = []
    for item in raw:
        attrs = item.get("attributes", {})
        player = PlayerStats(
            id=item["id"],
            name=item["name"],
            team_id=item["team_id"],
            team_name=item.get("team_name", ""),
            position=item.get("position", "Unknown"),
            number=item.get("number", 0),
            minutes_played=item.get("minutes_played", 90),
            passes_attempted=item.get("passes_attempted", 0),
            passes_completed=item.get("passes_completed", 0),
            turnovers=item.get("turnovers", 0),
            goals=item.get("goals", 0),
            assists=item.get("assists", 0),
            rating=item.get("rating", 7.0),
            attributes=PlayerAttributes(**attrs),
        )
        players.append(player)
    logger.debug("Loaded %d players", len(players))
    return players


@lru_cache(maxsize=1)
def load_matches() -> list[MatchData]:
    """Load matches.json and return typed MatchData list."""
    raw = _read_json("matches.json")
    matches = []
    for item in raw:
        home = TeamSummary(**item["home_team"])
        away = TeamSummary(**item["away_team"])

        passes = [Pass(**p) for p in item.get("passes", [])]
        turnovers = [Turnover(**t) for t in item.get("turnovers", [])]
        events = [MatchEvent(**e) for e in item.get("events", [])]
        segments = [PossessionSegment(**s) for s in item.get("possession_segments", [])]

        # positions: dict[player_id → list[Position]]
        raw_positions: dict[str, list[dict]] = item.get("positions", {})
        typed_positions: dict[str, list[Position]] = {
            pid: [Position(**p) for p in pos_list]
            for pid, pos_list in raw_positions.items()
        }

        match = MatchData(
            id=item["id"],
            date=item["date"],
            home_team=home,
            away_team=away,
            home_score=item["home_score"],
            away_score=item["away_score"],
            duration_minutes=item.get("duration_minutes", 90),
            status=item.get("status", "Full Time"),
            passes=passes,
            turnovers=turnovers,
            events=events,
            possession_segments=segments,
            positions=typed_positions,
            metadata=item.get("metadata", {}),
        )
        # Attach players from global player list for this match's teams
        all_players = load_players()
        match_team_ids = {home.id, away.id}
        match.players = [p for p in all_players if p.team_id in match_team_ids]
        matches.append(match)

    logger.debug("Loaded %d matches", len(matches))
    return matches


def bust_cache() -> None:
    """Invalidate in-memory caches – called after an upload."""
    load_teams.cache_clear()
    load_players.cache_clear()
    load_matches.cache_clear()
