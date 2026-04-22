import os
import sys
from pathlib import Path

# Add the current directory and backend to sys.path so we can import things
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'Backend')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'football_analysis')))

from celery import Celery
from football_analysis.main import run_analysis

# We create a local Celery app that matches the backend configuration
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
DATABASE_URL = os.environ.get("DATABASE_URL")

worker_app = Celery(
    "football_analytics",
    broker=REDIS_URL,
    backend=REDIS_URL,
)

# We define the task with the same name as the backend expects
@worker_app.task(name="agent.analyze_video")
def analyze_video_task(task_id: str, input_path: str):
    print(f"Starting task {task_id} for {input_path}")
    
    # Imports for DB updates (Worker needs to talk to the same DB)
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.models.persistence import AnalysisTask, TaskStatus
    
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # 1. Update status to PROCESSING
        task = session.query(AnalysisTask).filter(AnalysisTask.id == task_id).first()
        if task:
            task.status = TaskStatus.PROCESSING
            session.commit()
            
        # 2. Run analysis
        output_path = input_path.replace("inputs", "outputs")
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        
        results = run_analysis(input_path, output_path)
        
        # 3. Export to Match Data (Bridge to Match API)
        from football_analysis.exporter import export_to_match_data
        # We save this to the Backend's data directory so load_matches can find it
        backend_data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'Backend', 'app', 'data'))
        match_id, json_path = export_to_match_data(task_id, task.filename, results, backend_data_dir)

        # 4. Update status to SUCCESS
        if task:
            task.status = TaskStatus.SUCCESS
            task.output_path = output_path
            task.result_data = {
                "completed": True,
                "match_id": match_id,
                "json_path": json_path
            } 
            session.commit()

            
    except Exception as e:
        print(f"Error in task {task_id}: {str(e)}")
        if task:
            task.status = TaskStatus.FAILED
            task.error_message = str(e)
            session.commit()
    finally:
        session.close()

if __name__ == "__main__":
    worker_app.worker_main(["worker", "--loglevel=info"])
