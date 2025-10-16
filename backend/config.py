import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    # Flask configuration
    DEBUG = os.getenv('DEBUG', 'True') == 'True'
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 5000))
    
    # Storage paths (fixed)
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    # This correctly points to /app/storage, which is a valid path
    STORAGE_DIR = os.path.join(BASE_DIR, 'storage')
    TEMP_DIR = os.path.join(STORAGE_DIR, 'temp')
    VIDEOS_DIR = os.path.join(STORAGE_DIR, 'videos')
    IMAGES_DIR = os.path.join(STORAGE_DIR, 'images')
    AUDIO_DIR = os.path.join(STORAGE_DIR, 'audio')
    
    # API URLs
    API_URL = os.getenv('API_URL', 'http://localhost:5000/api')
    
    # Model configurations
    TTS_MODEL = os.getenv('TTS_MODEL', 'facebook/fastspeech2-en-ljspeech')
    IMAGE_MODEL = os.getenv('IMAGE_MODEL', 'stabilityai/stable-diffusion-2-1')
