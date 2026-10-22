import os
import re
import json
from config import Config

UUID_REGEX = re.compile(r'^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$', re.IGNORECASE)

def is_valid_video_id(video_id: str) -> bool:
    """Validate that video_id is a secure UUID format"""
    if not video_id or not isinstance(video_id, str):
        return False
    return bool(UUID_REGEX.match(video_id.strip()))

def get_video_path(video_id):
    """
    Get the path to a video file by its ID with path traversal prevention
    
    Args:
        video_id (str): The ID of the video
        
    Returns:
        str: Path to the video file, or None if not found or invalid
    """
    if not is_valid_video_id(video_id):
        return None

    videos_dir = os.path.realpath(Config.VIDEOS_DIR)
    video_path = os.path.realpath(os.path.join(videos_dir, f"{video_id.strip()}.mp4"))
    
    # Path traversal guard: must reside strictly within VIDEOS_DIR
    if not video_path.startswith(videos_dir + os.sep):
        return None
        
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
    if not is_valid_video_id(video_id):
        raise ValueError("Invalid video_id format for metadata storage")

    metadata_dir = os.path.realpath(os.path.join(Config.VIDEOS_DIR, "metadata"))
    os.makedirs(metadata_dir, exist_ok=True)
    
    metadata_path = os.path.realpath(os.path.join(metadata_dir, f"{video_id.strip()}.json"))
    if not metadata_path.startswith(metadata_dir + os.sep):
        raise ValueError("Invalid metadata path traversal detected")
        
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2)
    
    return metadata_path