from fastapi import APIRouter, Request, HTTPException, Response, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import uuid
import json
from datetime import datetime
from utils.file_utils import get_video_path, save_video_metadata, is_valid_video_id
from utils.validation import validate_text_input
from config import Config
from models.video_generator import generate_video_from_text

video_router = APIRouter()

# Define request and response models
class VideoRequest(BaseModel):
    text: str
    enableAudio: Optional[bool] = True

class SceneItem(BaseModel):
    order: int
    text: str
    visualPrompt: str
    imageFilename: Optional[str] = None
    imageUrl: Optional[str] = None

class VideoResponse(BaseModel):
    id: str
    videoUrl: str
    title: str
    hasAudio: bool
    scenes: Optional[List[SceneItem]] = []

class VideoListItem(BaseModel):
    id: str
    title: str
    url: str
    thumbnailUrl: Optional[str] = None
    createdAt: str
    scenesCount: Optional[int] = 0

@video_router.post('/generate', response_model=VideoResponse, status_code=201)
async def generate_video(video_request: VideoRequest, background_tasks: BackgroundTasks):
    is_valid, error_msg = validate_text_input(video_request.text)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    try:
        text = video_request.text.strip()
        enable_audio = video_request.enableAudio if video_request.enableAudio is not None else True
        
        video_id = str(uuid.uuid4())
        video_filename = f"{video_id}.mp4"
        final_video_path = os.path.join(Config.VIDEOS_DIR, video_filename)
        
        # Execute the multi-modal AI video synthesis pipeline
        _, scenes_meta = generate_video_from_text(
            text=text,
            output_path=final_video_path,
            enable_audio=enable_audio
        )

        # Enrich scene metadata with public image URLs
        for s in scenes_meta:
            if s.get("imageFilename"):
                s["imageUrl"] = f"{Config.API_URL}/videos/images/{s['imageFilename']}"

        title = text[:50] + "..." if len(text) > 50 else text
        metadata = {
            "id": video_id,
            "title": title,
            "text": text,
            "hasAudio": enable_audio,
            "createdAt": datetime.now().isoformat(),
            "filename": video_filename,
            "scenes": scenes_meta,
            "thumbnailUrl": scenes_meta[0]["imageUrl"] if scenes_meta else None
        }
        save_video_metadata(video_id, metadata)
        
        video_url = f"{Config.API_URL}/videos/{video_id}"
        
        return {
            "id": video_id,
            "videoUrl": video_url,
            "title": title,
            "hasAudio": enable_audio,
            "scenes": scenes_meta
        }
        
    except Exception as e:
        print(f"Error generating video: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate video: {str(e)}")

@video_router.get('', response_model=List[VideoListItem])
@video_router.get('/', response_model=List[VideoListItem])
async def get_videos():
    try:
        videos = []
        metadata_dir = os.path.join(Config.VIDEOS_DIR, "metadata")
        
        if os.path.exists(metadata_dir):
            for filename in os.listdir(metadata_dir):
                if filename.endswith('.json'):
                    try:
                        with open(os.path.join(metadata_dir, filename), 'r', encoding='utf-8') as f:
                            metadata = json.load(f)
                            thumbnail = metadata.get("thumbnailUrl")
                            if not thumbnail and metadata.get("scenes"):
                                first_scene = metadata["scenes"][0]
                                if first_scene.get("imageFilename"):
                                    thumbnail = f"{Config.API_URL}/videos/images/{first_scene['imageFilename']}"

                            videos.append({
                                "id": metadata["id"],
                                "title": metadata["title"],
                                "url": f"{Config.API_URL}/videos/{metadata['id']}",
                                "thumbnailUrl": thumbnail,
                                "createdAt": metadata["createdAt"],
                                "scenesCount": len(metadata.get("scenes", []))
                            })
                    except Exception as e:
                        print(f"Error reading metadata {filename}: {e}")
        
        videos.sort(key=lambda x: x["createdAt"], reverse=True)
        return videos
        
    except Exception as e:
        print(f"Error fetching videos: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch videos")

@video_router.get('/images/{filename}')
async def get_scene_image(filename: str):
    """Serve generated scene AI images with path traversal protection"""
    clean_filename = os.path.basename(filename)
    images_dir = os.path.realpath(Config.IMAGES_DIR)
    image_path = os.path.realpath(os.path.join(images_dir, clean_filename))

    if not image_path.startswith(images_dir + os.sep) or not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Image not found")

    return FileResponse(image_path, media_type="image/jpeg")

@video_router.get('/{video_id}')
async def get_video(video_id: str):
    if not is_valid_video_id(video_id):
        raise HTTPException(status_code=400, detail="Invalid video ID format")

    try:
        video_path = get_video_path(video_id)
        
        if not video_path or not os.path.exists(video_path):
            raise HTTPException(status_code=404, detail="Video not found")
            
        return FileResponse(
            video_path,
            media_type='video/mp4',
            headers={
                "Accept-Ranges": "bytes",
                "Content-Disposition": f"inline; filename={video_id}.mp4"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching video {video_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch video")