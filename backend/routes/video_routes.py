from fastapi import APIRouter, Request, HTTPException, Response, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List
import os
import uuid
import json
from datetime import datetime
from services.text_processing import process_text
from services.audio_processing import generate_audio
from services.image_processing import generate_images
from services.video_processing import create_video
from utils.file_utils import get_video_path, save_video_metadata
from config import Config

# Add this import
from models.video_generator import generate_video_from_text

video_router = APIRouter()

# Define request and response models
class VideoRequest(BaseModel):
    text: str
    enableAudio: Optional[bool] = True

class VideoResponse(BaseModel):
    id: str
    videoUrl: str
    title: str
    hasAudio: bool

class VideoListItem(BaseModel):
    id: str
    title: str
    url: str
    createdAt: str

@video_router.post('/generate', response_model=VideoResponse, status_code=201)
async def generate_video(video_request: VideoRequest, background_tasks: BackgroundTasks):
    try:
        text = video_request.text
        enable_audio = video_request.enableAudio
        
        # Generate a unique ID for this video
        video_id = str(uuid.uuid4())
        
        # Process text to get a concise prompt
        segments = process_text(text)
        main_prompt = segments[0] if segments else text
        
        # Generate video directly from text
        video_filename = f"{video_id}.mp4"
        temp_video_path = os.path.join(Config.TEMP_DIR, f"temp_{video_filename}")
        final_video_path = os.path.join(Config.VIDEOS_DIR, video_filename)
        
        # Use the Hugging Face model to generate the video
        generate_video_from_text(main_prompt, temp_video_path)
        
        # Generate audio narration if enabled
        if enable_audio:
            # Generate audio from the text
            audio_filename = f"{video_id}.mp3"
            audio_path = os.path.join(Config.AUDIO_DIR, audio_filename)
            generate_audio(text, audio_path)
            
            # Combine audio with video
            import subprocess
            subprocess.run([
                'ffmpeg',
                '-i', temp_video_path,
                '-i', audio_path,
                '-c:v', 'copy',
                '-c:a', 'aac',
                '-map', '0:v:0',
                '-map', '1:a:0',
                '-shortest',
                final_video_path
            ], check=True)
            
            # Clean up temporary files
            if os.path.exists(temp_video_path):
                os.remove(temp_video_path)
        else:
            # Just use the video without audio
            import shutil
            shutil.move(temp_video_path, final_video_path)
        
        # Save metadata
        title = text[:50] + "..." if len(text) > 50 else text
        metadata = {
            "id": video_id,
            "title": title,
            "text": text,
            "hasAudio": enable_audio,
            "createdAt": datetime.now().isoformat(),
            "filename": video_filename
        }
        save_video_metadata(video_id, metadata)
        
        # Return the URL to access the video
        video_url = f"{Config.API_URL}/videos/{video_id}"
        
        return {
            "id": video_id,
            "videoUrl": video_url,
            "title": title,
            "hasAudio": enable_audio
        }
        
    except Exception as e:
        print(f"Error generating video: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate video")

@video_router.get('/', response_model=List[VideoListItem])
async def get_videos():
    try:
        videos = []
        metadata_dir = os.path.join(Config.VIDEOS_DIR, "metadata")
        
        if os.path.exists(metadata_dir):
            for filename in os.listdir(metadata_dir):
                if filename.endswith('.json'):
                    with open(os.path.join(metadata_dir, filename), 'r') as f:
                        metadata = json.load(f)
                        videos.append({
                            "id": metadata["id"],
                            "title": metadata["title"],
                            "url": f"{Config.API_URL}/videos/{metadata['id']}",
                            "createdAt": metadata["createdAt"]
                        })
        
        # Sort by creation date (newest first)
        videos.sort(key=lambda x: x["createdAt"], reverse=True)
        
        return videos
        
    except Exception as e:
        print(f"Error fetching videos: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch videos")

@video_router.get('/{video_id}')
async def get_video(video_id: str):
    try:
        video_path = get_video_path(video_id)
        
        if not video_path or not os.path.exists(video_path):
            raise HTTPException(status_code=404, detail="Video not found")
            
        return FileResponse(video_path, media_type='video/mp4')
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching video {video_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch video")