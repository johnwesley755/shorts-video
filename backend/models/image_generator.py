import os
import time
import logging
import urllib.parse
import requests
from io import BytesIO
from PIL import Image
from config import Config

logger = logging.getLogger(__name__)

# Standard browser user-agent to ensure clean CDN routing
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
}

def generate_image_from_text(text: str, output_path: str, width: int = 720, height: int = 1280, seed: int = 42) -> str:
    """
    Generate an AI keyframe image conditioned on the text prompt using pre-trained diffusion models.
    Supports local pre-trained SD-Turbo pipeline and free serverless pre-trained diffusion inference.

    Args:
        text (str): The scene visual prompt
        output_path (str): Destination path to save the generated image
        width (int): Output image width (default: 720 for vertical 9:16)
        height (int): Output image height (default: 1280 for vertical 9:16)
        seed (int): Deterministic random seed for generation

    Returns:
        str: Absolute path to the saved generated image
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    clean_prompt = text.strip()
    
    # Enrich prompt for high-retention cinematic vertical Shorts
    enhanced_prompt = f"{clean_prompt}, vertical 9:16 aspect ratio, dramatic cinematic lighting, masterpiece, 8k resolution, photorealistic, sharp focus, no watermark"
    
    # 1. Attempt local pre-trained diffusion model if explicitly configured
    if Config.INFERENCE_MODE == 'local':
        try:
            import torch
            from models.model_loader import get_image_generation_model
            
            logger.info(f"Generating image locally with pre-trained {Config.IMAGE_MODEL}...")
            pipe = get_image_generation_model()
            device = "cuda" if torch.cuda.is_available() else "cpu"
            generator = torch.Generator(device=device).manual_seed(seed)
            
            steps = 1 if "turbo" in Config.IMAGE_MODEL.lower() else 20
            guidance = 0.0 if "turbo" in Config.IMAGE_MODEL.lower() else 7.5
            
            diff_w = (min(width, 768) // 8) * 8
            diff_h = (min(height, 1024) // 8) * 8
            
            result = pipe(
                prompt=enhanced_prompt,
                num_inference_steps=steps,
                guidance_scale=guidance,
                height=diff_h,
                width=diff_w,
                generator=generator
            )
            img = result.images[0].resize((width, height), Image.Resampling.LANCZOS)
            img.save(output_path, "JPEG", quality=95)
            logger.info(f"Local diffusion generation successful: {output_path}")
            return output_path
        except Exception as e:
            logger.warning(f"Local diffusion generation failed ({e}). Falling back to pre-trained serverless inference.")

    # 2. Serverless Pre-Trained Diffusion Inference
    # Free tier uses max 576x1024 (9:16 aspect ratio) to stay within anonymous limits
    fetch_w = 576
    fetch_h = 1024
    encoded_prompt = urllib.parse.quote(enhanced_prompt)
    
    req_headers = dict(HEADERS)
    if Config.POLLINATIONS_API_KEY:
        req_headers["Authorization"] = f"Bearer {Config.POLLINATIONS_API_KEY}"
        url = f"https://gen.pollinations.ai/image/{encoded_prompt}?width={fetch_w}&height={fetch_h}&seed={seed}&nologo=true&model=flux"
    else:
        url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={fetch_w}&height={fetch_h}&seed={seed}&nologo=true"

    max_retries = 2
    for attempt in range(max_retries):
        try:
            logger.info(f"Generating AI image [attempt {attempt+1}/{max_retries}]: {clean_prompt[:45]}...")
            response = requests.get(url, headers=req_headers, timeout=25)
            
            if response.status_code == 200 and len(response.content) > 1000:
                img = Image.open(BytesIO(response.content)).convert("RGB")
                img = img.resize((width, height), Image.Resampling.LANCZOS)
                img.save(output_path, "JPEG", quality=95)
                logger.info(f"Successfully generated and saved AI image to {output_path}")
                return output_path
            elif response.status_code in [402, 503]:
                logger.warning(
                    f"Serverless image response status {response.status_code} (Anonymous rate limit / capacity). "
                    f"Tip: Set POLLINATIONS_API_KEY in backend/.env for free priority quota from https://enter.pollinations.ai"
                )
                time.sleep(2.0)
            else:
                logger.warning(f"Serverless image response status {response.status_code}, retrying in 2s...")
                time.sleep(2.0)
        except Exception as e:
            logger.warning(f"Error fetching serverless AI image (attempt {attempt+1}): {e}")
            time.sleep(1.5)

    # 3. High-quality procedural aesthetic synthesis fallback (Ensures pipeline never fails or halts)
    logger.info("Using procedural gradient synthesizer for aesthetic fallback...")
    from PIL import ImageDraw, ImageFilter
    img = Image.new('RGB', (width, height), color=(15, 23, 42))
    draw = ImageDraw.Draw(img)
    for r in range(min(width, height) // 2, 0, -10):
        alpha = int(255 * (1 - r / (min(width, height) / 2)))
        draw.ellipse(
            [width//2 - r, height//2 - r, width//2 + r, height//2 + r],
            fill=(59, 130, 246, alpha)
        )
    img = img.filter(ImageFilter.GaussianBlur(radius=15))
    img.save(output_path, "JPEG", quality=95)
    return output_path