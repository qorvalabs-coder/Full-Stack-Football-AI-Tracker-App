import os
import sys
from pathlib import Path

# Add Backend and football_analysis to sys.path so we can import them
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'Backend')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'football_analysis')))

from celery import Celery
from football_analysis.main import run_analysis

# Celery app mirrors the Backend configuration
REDIS_URL = (
    os.environ.get("CELERY_BROKER_URL")
    or os.environ.get("REDIS_URL")
    or "redis://localhost:6379/0"
)
DATABASE_URL = os.environ.get("DATABASE_URL")

worker_app = Celery(
    "football_analytics",
    broker=REDIS_URL,
    backend=REDIS_URL,
)


@worker_app.task(name="agent.analyze_video")
def analyze_video_task(task_id: str, input_path: str,
                        home_team_name: str = "Team A",
                        away_team_name: str = "Team B"):
    """
    Celery task: run YOLO video analysis and export results to Backend data dir.

    Args:
        task_id:        UUID assigned by the Backend on upload.
        input_path:     Absolute path to the uploaded video file.
        home_team_name: Team name for team 1 (from Upload form).
        away_team_name: Team name for team 2 (from Upload form).
    """
    print(f"[Worker] Starting task {task_id} | {home_team_name} vs {away_team_name} | {input_path}")

    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.models.persistence import AnalysisTask, TaskStatus

    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    task = None

    try:
        # 1. Mark task as PROCESSING
        task = session.query(AnalysisTask).filter(AnalysisTask.id == task_id).first()
        if task:
            task.status = TaskStatus.PROCESSING
            session.commit()

        # 2. Run the full AI analysis pipeline
        output_path = input_path.replace("inputs", "outputs")
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)

        # run_analysis now returns (tracks, team_ball_control)
        tracks, team_ball_control = run_analysis(
            input_path,
            output_path,
            team_names=[home_team_name, away_team_name],
        )

        # 3. Export to Backend-compatible MatchData JSON
        from football_analysis.exporter import export_to_match_data

        backend_data_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), '..', 'Backend', 'app', 'data')
        )
        match_id, json_path = export_to_match_data(
            task_id=task_id,
            filename=task.filename if task else "unknown.mp4",
            tracks=tracks,
            team_ball_control=team_ball_control,
            backend_data_dir=backend_data_dir,
            home_team_name=home_team_name,
            away_team_name=away_team_name,
        )

        # 4. Mark task as SUCCESS
        if task:
            task.status = TaskStatus.SUCCESS
            task.output_path = output_path
            task.result_data = {
                "completed": True,
                "match_id": match_id,
                "json_path": json_path,
            }
            session.commit()

        print(f"[Worker] Task {task_id} completed successfully → match_id={match_id}")

    except Exception as e:
        print(f"[Worker] Error in task {task_id}: {e}")
        if task:
            task.status = TaskStatus.FAILED
            task.error_message = str(e)
            session.commit()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    worker_app.worker_main(["worker", "--loglevel=info"])
