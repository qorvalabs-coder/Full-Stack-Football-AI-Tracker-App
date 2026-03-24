from __future__ import annotations

import pytest

from app.models.domain import Pass, PlayerStats, PlayerAttributes, Positions, Position
from app.services.analytics_service import AnalyticsService


svc = AnalyticsService()


# ── Pass accuracy ─────────────────────────────────────────────────────────────

def _make_passes(total: int, successful: int) -> list[Pass]:
    passes = []
    for i in range(total):
        passes.append(Pass(
            player_id="player_1",
            team_id="team_1",
            start_x=10, start_y=20,
            end_x=30, end_y=40,
            successful=(i < successful),
        ))
    return passes


def test_pass_accuracy_perfect():
    passes = _make_passes(10, 10)
    acc = AnalyticsService._pass_accuracy(passes)
    assert acc == 100.0


def test_pass_accuracy_partial():
    passes = _make_passes(10, 7)
    acc = AnalyticsService._pass_accuracy(passes)
    assert acc == 70.0


def test_pass_accuracy_empty():
    assert AnalyticsService._pass_accuracy([]) == 0.0


# ── PlayerStats computed fields ───────────────────────────────────────────────

def _make_player(**kwargs) -> PlayerStats:
    defaults = dict(
        id="p1", name="Test", team_id="t1", team_name="Test FC",
        position="CM", number=7, attributes=PlayerAttributes(),
    )
    defaults.update(kwargs)
    return PlayerStats(**defaults)


def test_player_pass_accuracy():
    p = _make_player(passes_attempted=50, passes_completed=43)
    assert p.pass_accuracy == 86.0


def test_player_turnover_rate():
    p = _make_player(passes_attempted=50, turnovers=5)
    assert p.turnover_rate == 0.1


def test_player_zero_passes():
    p = _make_player(passes_attempted=0, passes_completed=0, turnovers=0)
    assert p.pass_accuracy == 0.0
    assert p.turnover_rate == 0.0


# ── Positions / Heatmap ───────────────────────────────────────────────────────

def test_positions_centroid():
    pos = Positions(positions=[Position(x=10, y=20), Position(x=30, y=40)])
    cx, cy = pos.centroid()
    assert cx == 20.0
    assert cy == 30.0


def test_heatmap_coords_non_empty():
    positions = [Position(x=float(i * 5), y=float(i * 5)) for i in range(5)]
    pos = Positions(positions=positions)
    coords = pos.heatmap_coords()
    assert isinstance(coords, list)
    assert all("x" in c and "y" in c and "value" in c for c in coords)


# ── Pass distance and progressive ────────────────────────────────────────────

def test_pass_distance():
    p = Pass(player_id="p1", team_id="t1", start_x=0, start_y=0, end_x=30, end_y=40)
    assert p.distance() == 50.0


def test_progressive_pass():
    p = Pass(player_id="p1", team_id="t1", start_x=10, start_y=20, end_x=50, end_y=50)
    assert p.is_progressive() is True


def test_non_progressive_pass():
    p = Pass(player_id="p1", team_id="t1", start_x=50, start_y=50, end_x=55, end_y=50)
    assert p.is_progressive() is False
