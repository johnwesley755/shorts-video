import os
import json
from config import Config

def get_video_path(video_id):
    """
    Get the path to a video file by its ID
    
    Args:
        video_id (str): The ID of the video
        
    Returns:
        str: Path to the video file, or None if not found
    """
    # Check if the video file exists
    video_path = os.path.join(Config.VIDEOS_DIR, f"{video_id}.mp4")
    
    if os.path.exists(video_path):
        return video_path
    
    return None

def save_video_metadata(video_id, metadata):
    """
    Save video metadata to a JSON file
    
    Args:
        video_id (str): The ID of the video
        metadata (dict): The metadata to save
        
    Returns:
        str: Path to the metadata file
    """
    # Create metadata directory if it doesn't exist
    metadata_dir = os.path.join(Config.VIDEOS_DIR, "metadata")
    os.makedirs(metadata_dir, exist_ok=True)
    
    # Save metadata to a JSON file
    metadata_path = os.path.join(metadata_dir, f"{video_id}.json")
    
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    return metadata_path