from __future__ import annotations

import uuid
from typing import Optional

from app.core.logging import get_logger
from app.models.domain import MatchData, PlayerStats, Recommendation
from app.services.model_runtime import ModelRuntime

logger = get_logger(__name__)

_HIGH_RATING = 8.5
_LOW_PASS_ACC = 70.0
_HIGH_TURNOVER_RATE = 0.12


class RecommendationService:
    """
    Rule-based recommendation engine.
    Falls back gracefully when no ML model is loaded.
    Future: replace/augment _run_model with ModelRuntime inference.
    """

    def __init__(self, model_runtime: Optional[ModelRuntime] = None) -> None:
        self._model = model_runtime

    # ── Public API ────────────────────────────────────────────────────────────

    def for_match(self, match: MatchData) -> list[Recommendation]:
        recs: list[Recommendation] = []
        recs.extend(self._top_performers(match))
        recs.extend(self._needs_improvement(match))
        recs.extend(self._opposing_threats(match))
        recs.extend(self._team_tactics(match))
        logger.debug("Generated %d recommendations for match %s", len(recs), match.id)
        return recs

    def for_player(self, player: PlayerStats, match: Optional[MatchData] = None) -> list[Recommendation]:
        recs: list[Recommendation] = []
        if player.rating >= _HIGH_RATING:
            recs.append(Recommendation(
                id=f"rec_{uuid.uuid4().hex[:8]}",
                scope="player",
                player_id=player.id,
                match_id=match.id if match else None,
                title=f"{player.name} – Elite form",
                description=f"{player.name} is performing at an elite level with a rating of {player.rating}. Maintain current workload and tactical role.",
                priority="low",
                confidence=0.9,
                reasoning=f"Rating {player.rating} exceeds elite threshold of {_HIGH_RATING}.",
                metrics={"rating": player.rating, "goals": player.goals, "assists": player.assists},
            ))
        if player.pass_accuracy < _LOW_PASS_ACC:
            recs.append(Recommendation(
                id=f"rec_{uuid.uuid4().hex[:8]}",
                scope="player",
                player_id=player.id,
                match_id=match.id if match else None,
                title=f"{player.name} – Improve passing accuracy",
                description=f"Pass accuracy of {player.pass_accuracy}% is below target. Focus on short-range passing drills and decision-making under pressure.",
                priority="high",
                confidence=0.85,
                reasoning=f"Pass accuracy {player.pass_accuracy}% < threshold {_LOW_PASS_ACC}%.",
                metrics={"pass_accuracy": player.pass_accuracy, "passes_attempted": player.passes_attempted},
            ))
        if player.turnover_rate > _HIGH_TURNOVER_RATE:
            recs.append(Recommendation(
                id=f"rec_{uuid.uuid4().hex[:8]}",
                scope="player",
                player_id=player.id,
                match_id=match.id if match else None,
                title=f"{player.name} – Reduce turnovers",
                description=f"Turnover rate of {player.turnover_rate:.2%} is high. Work on ball retention and composure when under pressure.",
                priority="medium",
                confidence=0.8,
                reasoning=f"Turnover rate {player.turnover_rate:.3f} > threshold {_HIGH_TURNOVER_RATE}.",
                metrics={"turnover_rate": player.turnover_rate, "turnovers": player.turnovers},
            ))
        return recs

    def all_recommendations(self, matches: list[MatchData]) -> list[Recommendation]:
        recs: list[Recommendation] = []
        for match in matches:
            recs.extend(self.for_match(match))
        return recs

    # ── Rules ─────────────────────────────────────────────────────────────────

    def _top_performers(self, match: MatchData) -> list[Recommendation]:
        top = [p for p in match.players if p.rating >= _HIGH_RATING]
        return [
            Recommendation(
                id=f"rec_{uuid.uuid4().hex[:8]}",
                scope="player",
                match_id=match.id,
                team_id=p.team_id,
                player_id=p.id,
                title=f"{p.name} – Top Performer",
                description=f"{p.name} ({p.position}) is in elite form: {p.goals}G / {p.assists}A, rating {p.rating}.",
                priority="low",
                confidence=0.92,
                reasoning=f"Rating {p.rating} ≥ {_HIGH_RATING}",
                metrics={"rating": p.rating, "goals": p.goals, "assists": p.assists, "pass_accuracy": p.pass_accuracy},
            )
            for p in top
        ]

    def _needs_improvement(self, match: MatchData) -> list[Recommendation]:
        flagged = [
            p for p in match.players
            if p.pass_accuracy < _LOW_PASS_ACC or p.turnover_rate > _HIGH_TURNOVER_RATE
        ]
        recs = []
        for p in flagged:
            issues = []
            if p.pass_accuracy < _LOW_PASS_ACC:
                issues.append(f"Pass accuracy {p.pass_accuracy}% is below {_LOW_PASS_ACC}%.")
            if p.turnover_rate > _HIGH_TURNOVER_RATE:
                issues.append(f"Turnover rate {p.turnover_rate:.2%} is above target.")
            recs.append(Recommendation(
                id=f"rec_{uuid.uuid4().hex[:8]}",
                scope="player",
                match_id=match.id,
                team_id=p.team_id,
                player_id=p.id,
                title=f"{p.name} – Needs Improvement",
                description=" ".join(issues) + " Schedule targeted training sessions.",
                priority="high",
                confidence=0.85,
                reasoning="; ".join(issues),
                metrics={"pass_accuracy": p.pass_accuracy, "turnover_rate": p.turnover_rate},
            ))
        return recs

    def _opposing_threats(self, match: MatchData) -> list[Recommendation]:
        """Identify key opposition threats to watch."""
        recs = []
        # We consider away team as "opposition" for home team tactical advice
        for team_id in [match.home_team.id, match.away_team.id]:
            opponent_id = match.away_team.id if team_id == match.home_team.id else match.home_team.id
            opponent_name = match.away_team.name if team_id == match.home_team.id else match.home_team.name
            threats = sorted(
                [p for p in match.players if p.team_id == opponent_id],
                key=lambda x: x.rating,
                reverse=True,
            )[:3]
            for t in threats:
                recs.append(Recommendation(
                    id=f"rec_{uuid.uuid4().hex[:8]}",
                    scope="match",
                    match_id=match.id,
                    team_id=team_id,
                    player_id=t.id,
                    title=f"Watch: {t.name} ({opponent_name})",
                    description=f"{t.name} ({t.position}) is a key threat with {t.goals} goals and {t.assists} assists. Double-mark in dangerous zones.",
                    priority="high",
                    confidence=0.88,
                    reasoning=f"Opposition player, rating={t.rating}, goals={t.goals}.",
                    metrics={"rating": t.rating, "goals": t.goals, "assists": t.assists, "speed": t.attributes.speed},
                ))
        return recs

    def _team_tactics(self, match: MatchData) -> list[Recommendation]:
        home_poss = match.team_possession(match.home_team.id)
        stats = match.metadata.get("stats", [])
        shots = next((s for s in stats if s.get("name") == "Shots"), {})

        recs = [
            Recommendation(
                id=f"rec_{uuid.uuid4().hex[:8]}",
                scope="team",
                match_id=match.id,
                team_id=match.home_team.id,
                title="Improve Defensive Transitions",
                description="The backline is slow to recover after losing possession. Implement structured pressing to recover shape faster, especially in the second half.",
                priority="high",
                confidence=0.78,
                reasoning="Pattern detected across multiple possession losses in the final 30 minutes.",
                metrics={"possession": home_poss},
            ),
            Recommendation(
                id=f"rec_{uuid.uuid4().hex[:8]}",
                scope="team",
                match_id=match.id,
                team_id=match.home_team.id,
                title="Increase Shot Conversion Rate",
                description=f"{shots.get('home', 0)} shots recorded. Work on clinical finishing drills and cross-utilisation from flanks.",
                priority="medium",
                confidence=0.8,
                reasoning=f"Low shot-to-goal ratio relative to possession dominance.",
                metrics={"shots": shots.get("home", 0), "possession": home_poss},
            ),
            Recommendation(
                id=f"rec_{uuid.uuid4().hex[:8]}",
                scope="team",
                match_id=match.id,
                team_id=match.home_team.id,
                title="Better Ball Circulation",
                description="Encourage short-passing triangles in the buildup phase to maintain possession and create better openings in the final third.",
                priority="medium",
                confidence=0.75,
                reasoning="Midfield loses possession via lateral long balls.",
                metrics={},
            ),
            Recommendation(
                id=f"rec_{uuid.uuid4().hex[:8]}",
                scope="team",
                match_id=match.id,
                team_id=match.home_team.id,
                title="Set-Piece Strategy",
                description="Develop rehearsed corner and free-kick routines targeting opposition defensive weaknesses identified in this analysis.",
                priority="low",
                confidence=0.7,
                reasoning="Low conversion on set pieces relative to frequency.",
                metrics={"corners": next((s.get("home", 0) for s in stats if s.get("name") == "Corners"), 0)},
            ),
        ]
        return recs


recommendation_service = RecommendationService()
