import torch
from transformers import AutoTokenizer, pipeline
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler
from config import Config

# Cache for loaded models
_models_cache = {}

def get_tts_model():
    """
    Load and return the text-to-speech model
    """
    cache_key = 'tts'
    if cache_key not in _models_cache:
        print(f"Loading TTS model: facebook/tts-transformer")
        # Using a TTS pipeline instead of direct model
        tts = pipeline("text-to-speech", model="facebook/tts-transformer")
        _models_cache[cache_key] = tts
    
    return _models_cache[cache_key]

def get_image_generation_model():
    """
    Load and return the image generation model
    """
    cache_key = 'image_gen'
    if cache_key not in _models_cache:
        print(f"Loading image generation model: stabilityai/stable-diffusion-2-1")
        
        # Use CUDA if available
        device = "cuda" if torch.cuda.is_available() else "cpu"
        
        # Using Stability AI's Stable Diffusion 2.1 for high-quality image generation
        model_id = "stabilityai/stable-diffusion-2-1"
        
        # Load the model with optimized settings
        pipe = StableDiffusionPipeline.from_pretrained(
            model_id,
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
            safety_checker=None  # Disable safety checker for faster generation
        )
        
        # Use DPM-Solver++ scheduler for faster and better quality generation
        pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)
        pipe = pipe.to(device)
        
        # Enable memory efficient attention if using CUDA
        if device == "cuda":
            pipe.enable_attention_slicing()
            # Enable xformers memory efficient attention if available
            try:
                pipe.enable_xformers_memory_efficient_attention()
            except:
                pass
        
        _models_cache[cache_key] = pipe
    
    return _models_cache[cache_key]

def get_text_summarization_model():
    """
    Load and return the text summarization model
    """
    cache_key = 'summarizer'
    if cache_key not in _models_cache:
        print(f"Loading text summarization model: facebook/bart-large-cnn")
        
        # Using Facebook's BART model for text summarization
        summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
        _models_cache[cache_key] = summarizer
    
    return _models_cache[cache_key]


def get_text_to_video_model():
    """
    Load and return the text-to-video model from Hugging Face
    """
    cache_key = 'text_to_video'
    if cache_key not in _models_cache:
        print("Loading text-to-video model: damo-vilab/text-to-video-ms-1.7b")
        
        # Use CUDA if available
        device = "cuda" if torch.cuda.is_available() else "cpu"
        
        # Load the text-to-video model
        pipe = DiffusionPipeline.from_pretrained(
            "damo-vilab/text-to-video-ms-1.7b", 
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
            variant="fp16" if device == "cuda" else None
        )
        pipe = pipe.to(device)
        
        _models_cache[cache_key] = pipe
    
    return _models_cache[cache_key]