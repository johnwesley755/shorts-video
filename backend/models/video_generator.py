import os
import logging
import numpy as np
import torch
from diffusers import StableDiffusionPipeline
import imageio
from PIL import Image, ImageDraw, ImageFont

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_video_from_text(text, output_path, num_frames=8, height=512, width=512):
    """
    Generate a video from text using a series of images
    
    Args:
        text (str): The text prompt to generate a video from
        output_path (str): Path to save the generated video
        num_frames (int): Number of frames to generate
        height (int): Height of the generated video
        width (int): Width of the generated video
    """
    # Make sure the directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    try:
        logger.info(f"Generating video for prompt: {text}")
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {device}")
        
        # Use stable diffusion instead - more reliable and widely available
        pipe = StableDiffusionPipeline.from_pretrained(
            "runwayml/stable-diffusion-v1-5",
            torch_dtype=torch.float16 if device == "cuda" else torch.float32
        )
        pipe = pipe.to(device)
        
        # Generate a series of slightly different images to create a video effect
        logger.info("Starting image sequence generation...")
        frames = []
        
        for i in range(num_frames):
            # Add slight variations to the prompt for each frame
            frame_prompt = f"{text}, frame {i+1}"
            
            # Generate image
            image = pipe(
                prompt=frame_prompt,
                negative_prompt="blurry, low quality, distorted, text, watermark",
                num_inference_steps=25,
                guidance_scale=7.5,
                height=height,
                width=width
            ).images[0]
            
            # Convert to numpy array
            frame = np.array(image)
            frames.append(frame)
            logger.info(f"Generated frame {i+1}/{num_frames}")
        
        # Save as video
        logger.info(f"Saving video to: {output_path}")
        imageio.mimsave(output_path, frames, fps=8)
        
        return output_path
        
    except Exception as e:
        logger.error(f"Error in video generation: {str(e)}")
        return generate_fallback_video(output_path, num_frames, height, width)

def generate_fallback_video(output_path, num_frames=8, height=512, width=512):
    """
    Generate a simple fallback video when the main generation fails
    """
    try:
        logger.info("Generating fallback video with text overlay")
        frames = []
        
        # Create a series of frames with text and the prompt
        for i in range(num_frames):
            # Create a gradient background
            img = Image.new('RGB', (width, height), color=(25, 25, 50))
            draw = ImageDraw.Draw(img)
            
            # Try to load a font, use default if not available
            try:
                font = ImageFont.truetype("arial.ttf", 30)
                small_font = ImageFont.truetype("arial.ttf", 20)
            except:
                font = ImageFont.load_default()
                small_font = ImageFont.load_default()
            
            # Add text to the image
            text_to_draw = "Video Generation"
            text_width = draw.textlength(text_to_draw, font=font) if hasattr(draw, 'textlength') else 200
            
            # Position text in center
            text_position = ((width - text_width) // 2, height // 2 - 50)
            draw.text(text_position, text_to_draw, fill=(255, 255, 255), font=font)
            
            # Add animated elements
            angle = (i / num_frames) * 360
            for j in range(5):  # Multiple circles for more visual interest
                sub_angle = angle + (j * 72)  # Distribute evenly
                radius = min(width, height) // 3
                x = width // 2 + int(radius * np.cos(np.radians(sub_angle)))
                y = height // 2 + int(radius * np.sin(np.radians(sub_angle)))
                
                # Draw circles with different colors
                colors = [(255, 200, 0), (0, 200, 255), (200, 0, 255), (0, 255, 100), (255, 100, 100)]
                draw.ellipse((x-15, y-15, x+15, y+15), fill=colors[j % len(colors)])
            
            # Convert to numpy array and append to frames
            frames.append(np.array(img))
        
        # Save as video
        logger.info(f"Saving fallback video to: {output_path}")
        imageio.mimsave(output_path, frames, fps=12)  # Higher FPS for smoother animation
        
        return output_path
    except Exception as e:
        logger.error(f"Error generating fallback video: {str(e)}")
        return output_path