from utils import read_video, save_video
from trackers import Tracker
import cv2
import numpy as np
from team_assigner import TeamAssigner
from player_ball_assigner import PlayerBallAssigner
from camera_movement_estimator import CameraMovementEstimator
from view_transformer import ViewTransformer
from speed_and_distance_estimator import SpeedAndDistance_Estimator

import os


def run_analysis(input_video_path, output_video_path, team_names=None):
    """
    Run the full AI analysis pipeline on a video file.

    Args:
        input_video_path: Absolute path to the input video.
        output_video_path: Absolute path to write the annotated output video.
        team_names: Optional list of two team name strings, e.g. ["Home FC", "Away FC"].
                    Defaults to ["Team A", "Team B"].

    Returns:
        Tuple of (tracks, team_ball_control) where:
          - tracks: dict of per-frame tracking data for players, referees, ball
          - team_ball_control: numpy array of frame-level team possession (1 or 2)
    """
    if team_names is None:
        team_names = ["Team A", "Team B"]

    # Read Video
    video_frames = read_video(input_video_path)

    # Initialize Tracker
    # Use absolute path relative to this file for production stability
    model_path = os.path.join(os.path.dirname(__file__), 'models', 'best.pt')
    tracker = Tracker(model_path)

    print(f"Analyzing {len(video_frames)} frames...")
    tracks = tracker.get_object_tracks(video_frames, read_from_stub=False)

    # Get object positions
    tracker.add_position_to_tracks(tracks)

    # Camera movement estimator
    print("Estimating camera movement...")
    camera_movement_estimator = CameraMovementEstimator(video_frames[0])
    camera_movement_per_frame = camera_movement_estimator.get_camera_movement(
        video_frames, read_from_stub=False
    )
    camera_movement_estimator.add_adjust_positions_to_tracks(tracks, camera_movement_per_frame)

    # View Transformer (pixel → real-world metres)
    view_transformer = ViewTransformer()
    view_transformer.add_transformed_position_to_tracks(tracks)

    # Interpolate Ball Positions
    tracks["ball"] = tracker.interpolate_ball_positions(tracks["ball"])

    # Speed and distance estimator
    speed_and_distance_estimator = SpeedAndDistance_Estimator()
    speed_and_distance_estimator.add_speed_and_distance_to_tracks(tracks)

    # Assign Player Teams (no warm-up call needed — rule-based assigner)
    print("Assigning teams...")
    team_assigner = TeamAssigner()

    for frame_num, player_track in enumerate(tracks['players']):
        for player_id, track in player_track.items():
            team = team_assigner.get_player_team(
                video_frames[frame_num], track['bbox'], player_id
            )
            tracks['players'][frame_num][player_id]['team'] = team
            tracks['players'][frame_num][player_id]['team_color'] = team_assigner.team_colors[team]

    # Assign Ball Acquisition per frame
    print("Detecting ball possession...")
    player_assigner = PlayerBallAssigner()
    team_ball_control = []
    for frame_num, player_track in enumerate(tracks['players']):
        ball_bbox = tracks['ball'][frame_num][1]['bbox']
        assigned_player = player_assigner.assign_ball_to_player(player_track, ball_bbox)

        if assigned_player != -1:
            tracks['players'][frame_num][assigned_player]['has_ball'] = True
            team_ball_control.append(tracks['players'][frame_num][assigned_player]['team'])
        else:
            # Use previous team if known; 0 means unknown on first frame
            team_ball_control.append(team_ball_control[-1] if len(team_ball_control) > 0 else 0)

    team_ball_control = np.array(team_ball_control)

    # Draw output
    output_video_frames = tracker.draw_annotations(video_frames, tracks, team_ball_control)
    output_video_frames = camera_movement_estimator.draw_camera_movement(
        output_video_frames, camera_movement_per_frame
    )
    speed_and_distance_estimator.draw_speed_and_distance(output_video_frames, tracks)

    # Save annotated video
    save_video(output_video_frames, output_video_path)

    return tracks, team_ball_control


if __name__ == '__main__':
    run_analysis('input_videos/08fd33_4.mp4', 'output_videos/output_video.mp4')