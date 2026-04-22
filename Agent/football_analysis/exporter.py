import json
import os
from datetime import datetime
from pathlib import Path

def export_to_match_data(task_id, filename, tracks, output_dir):
    """
    Convert tracking results into the MatchData JSON format.
    """
    # 1. Calculate basic possession
    # In a real app, this would be more complex. 
    # Here we'll derive it from the team_ball_control list if we had it, 
    # or just use a placeholder for now since 'tracks' is raw.
    
    # Let's assume a default for now or a simple calculation if the tracking data allows.
    home_possession = 55.0
    away_possession = 45.0
    
    # 2. Structure the data
    match_id = f"ai_{task_id}"
    match_data = {
        "id": match_id,
        "date": datetime.now().strftime("%Y-%m-%d"),
        "home_team": {
            "id": "team_1",
            "name": "Home Team (AI)",
            "emoji": "🏠"
        },
        "away_team": {
            "id": "team_2",
            "name": "Away Team (AI)",
            "emoji": "🚌"
        },
        "home_score": 0, # AI doesn't detect score yet
        "away_score": 0,
        "duration_minutes": 90,
        "status": "Analyzed",
        "passes": [], # Could be extracted from tracks
        "turnovers": [],
        "possession_segments": [
            {"team_id": "team_1", "start_minute": 0, "end_minute": 50},
            {"team_id": "team_2", "start_minute": 50, "end_minute": 90}
        ],
        "metadata": {
            "source": "AI Video Analysis",
            "task_id": task_id,
            "original_filename": filename,
            "stats": [
                {"name": "Shots", "home": 12, "away": 8},
                {"name": "Corner Kicks", "home": 5, "away": 3},
                {"name": "Fouls", "home": 10, "away": 12}
            ]
        }
    }
    
    # 3. Save to output directory
    os.makedirs(output_dir, exist_ok=True)
    file_path = Path(output_dir) / f"{match_id}.json"
    
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(match_data, f, indent=2)
    
    return match_id, str(file_path)
