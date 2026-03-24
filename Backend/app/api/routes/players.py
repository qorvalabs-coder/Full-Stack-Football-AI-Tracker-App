from __future__ import annotations

from fastapi import APIRouter

from app.core.exceptions import NotFoundException
from app.models.responses import ApiResponse
from app.models.schemas import PlayerDetailSchema, PlayerHeatmapSchema, PlayerSummarySchema
from app.services.analytics_service import analytics_service
from app.services.json_loader import load_matches, load_players

router = APIRouter()


@router.get("", response_model=ApiResponse[list[PlayerSummarySchema]])
async def list_players() -> ApiResponse:
    players = load_players()
    summaries = [
        PlayerSummarySchema(
            id=p.id,
            name=p.name,
            team_id=p.team_id,
            team_name=p.team_name,
            position=p.position,
            number=p.number,
            rating=p.rating,
            goals=p.goals,
            assists=p.assists,
        )
        for p in players
    ]
    return ApiResponse.ok(summaries)


@router.get("/{player_id}", response_model=ApiResponse[PlayerSummarySchema])
async def get_player(player_id: str) -> ApiResponse:
    player = next((p for p in load_players() if p.id == player_id), None)
    if not player:
        raise NotFoundException("Player", player_id)
    return ApiResponse.ok(
        PlayerSummarySchema(
            id=player.id, name=player.name, team_id=player.team_id,
            team_name=player.team_name, position=player.position,
            number=player.number, rating=player.rating,
            goals=player.goals, assists=player.assists,
        )
    )


@router.get("/{player_id}/stats", response_model=ApiResponse[PlayerDetailSchema])
async def player_stats(player_id: str) -> ApiResponse:
    player = next((p for p in load_players() if p.id == player_id), None)
    if not player:
        raise NotFoundException("Player", player_id)
    detail = analytics_service.player_detail(player)
    return ApiResponse.ok(detail)


@router.get("/{player_id}/heatmap", response_model=ApiResponse[PlayerHeatmapSchema])
async def player_heatmap(player_id: str) -> ApiResponse:
    player = next((p for p in load_players() if p.id == player_id), None)
    if not player:
        raise NotFoundException("Player", player_id)

    # Find the most recent match involving the player's team
    matches = load_matches()
    match = next(
        (m for m in matches if player.team_id in {m.home_team.id, m.away_team.id}),
        matches[0] if matches else None,
    )

    heatmap = analytics_service.player_heatmap(player, match) if match else analytics_service.player_heatmap(player, _empty_match())
    return ApiResponse.ok(heatmap)


# ── Internal helper ───────────────────────────────────────────────────────────

def _empty_match():
    from app.models.domain import MatchData, TeamSummary
    return MatchData(
        id="__empty__",
        date="",
        home_team=TeamSummary(id="t1", name="Home"),
        away_team=TeamSummary(id="t2", name="Away"),
        home_score=0,
        away_score=0,
    )
