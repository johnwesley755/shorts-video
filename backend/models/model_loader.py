import torch
import logging
from transformers import pipeline
from diffusers import AutoPipelineForText2Image, StableDiffusionPipeline, DPMSolverMultistepScheduler, DiffusionPipeline
from config import Config

logger = logging.getLogger(__name__)

# Cache for loaded models in memory
_models_cache = {}

def get_tts_model():
    """
    Load and return the text-to-speech pipeline
    """
    cache_key = 'tts'
    if cache_key not in _models_cache:
        model_name = Config.TTS_MODEL
        logger.info(f"Loading pre-trained TTS pipeline: {model_name}")
        try:
            tts = pipeline("text-to-speech", model=model_name)
            _models_cache[cache_key] = tts
        except Exception as e:
            logger.warning(f"Could not load local TTS model '{model_name}': {e}. Falling back to gTTS engine.")
            return None
    
    return _models_cache.get(cache_key)

def get_image_generation_model(model_id=None):
    """
    Load and return a pre-trained Diffusion model.
    Defaults to stabilityai/sd-turbo (1-step inference for ultra-fast generation on CPU/GPU)
    """
    cache_key = 'image_gen'
    if cache_key not in _models_cache:
        model_id = model_id or Config.IMAGE_MODEL
        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Loading pre-trained diffusion model: {model_id} on {device}")
        
        try:
            # Use AutoPipelineForText2Image for modern SD / SD-Turbo / SDXL compatibility
            torch_dtype = torch.float16 if device == "cuda" else torch.float32
            pipe = AutoPipelineForText2Image.from_pretrained(
                model_id,
                torch_dtype=torch_dtype,
                variant="fp16" if device == "cuda" else None,
                safety_checker=None
            )
            pipe = pipe.to(device)
            pipe.enable_attention_slicing()
            _models_cache[cache_key] = pipe
            logger.info(f"Successfully loaded diffusion model: {model_id}")
        except Exception as e:
            logger.error(f"Failed to load local diffusion model '{model_id}': {e}")
            raise e
            
    return _models_cache[cache_key]

def get_text_summarization_model():
    """
    Load and return the pre-trained NLP transformer for text segmentation & summarization
    """
    cache_key = 'summarizer'
    if cache_key not in _models_cache:
        logger.info("Loading pre-trained NLP model: facebook/bart-large-cnn")
        try:
            summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
            _models_cache[cache_key] = summarizer
        except Exception as e:
            logger.warning(f"Could not load BART summarizer: {e}")
            return None
    
    return _models_cache[cache_key]

def get_text_to_video_model():
    """
    Load and return the text-to-video pre-trained model (damo-vilab/text-to-video-ms-1.7b)
    """
    cache_key = 'text_to_video'
    if cache_key not in _models_cache:
        logger.info("Loading pre-trained text-to-video model: damo-vilab/text-to-video-ms-1.7b")
        device = "cuda" if torch.cuda.is_available() else "cpu"
        
        try:
            pipe = DiffusionPipeline.from_pretrained(
                "damo-vilab/text-to-video-ms-1.7b", 
                torch_dtype=torch.float16 if device == "cuda" else torch.float32,
                variant="fp16" if device == "cuda" else None
            )
            pipe = pipe.to(device)
            _models_cache[cache_key] = pipe
        except Exception as e:
            logger.error(f"Could not load video diffusion model: {e}")
            raise e
    
    return _models_cache[cache_key]