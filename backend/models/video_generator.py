import os
import logging
import numpy as np
import torch
import time  # Add this import
from diffusers import StableDiffusionPipeline
import imageio
from PIL import Image, ImageDraw, ImageFont

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_video_from_text(text, output_path, num_frames=8, height=512, width=512):
    """
    Generate a video from text using a series of images
    """
    # Make sure the directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    try:
        logger.info(f"Generating video for prompt: {text}")
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {device}")
        
        # Use stable diffusion with higher quality settings
        pipe = StableDiffusionPipeline.from_pretrained(
            "runwayml/stable-diffusion-v1-5",
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
            safety_checker=None
        )
        pipe = pipe.to(device)
        
        # Generate a series of slightly different images to create a video effect
        logger.info("Starting image sequence generation...")
        frames = []
        
        # Set a timeout for the entire generation process
        start_time = time.time()
        max_time = 600  # 10 minutes max to ensure we get at least 4 frames
        min_frames = 4  # Minimum number of frames to generate
        
        # Generate frames with more variation
        for i in range(num_frames):
            # Check if we're exceeding the time limit and have minimum frames
            if time.time() - start_time > max_time and len(frames) >= min_frames:
                logger.warning(f"Generation taking too long, using {len(frames)} frames")
                break
                
            # Add more significant variations to the prompt for each frame
            seed = i * 100  # Different seed for each frame
            generator = torch.Generator(device=device).manual_seed(seed)
            
            # Enhanced prompt for better quality
            enhanced_prompt = f"{text}, high resolution, detailed, 8k, professional photography"
            
            # Generate image with improved quality settings
            image = pipe(
                prompt=enhanced_prompt,
                negative_prompt="blurry, low quality, pixelated, distorted",
                num_inference_steps=20,  # Increased for better quality
                guidance_scale=8.5,  # Increased for better adherence to prompt
                height=height,
                width=width,
                generator=generator
            ).images[0]
            
            # Convert to numpy array
            frame = np.array(image)
            frames.append(frame)
            logger.info(f"Generated frame {i+1}/{num_frames}")
            
            # If we have the minimum frames and are taking too long, consider stopping
            if len(frames) >= min_frames and time.time() - start_time > 300:  # 5 minutes
                logger.warning("Generation taking longer than expected, may stop after next frame")
        
        # If we have at least 2 frames, interpolate between them
        if len(frames) >= 2:
            logger.info(f"Interpolating between {len(frames)} frames...")
            interpolated_frames = []
            target_frame_count = min(240, len(frames) * 30)  # Limit total frames
            
            # Simple linear interpolation between frames
            for i in range(target_frame_count):
                # Determine which base frames to interpolate between
                frame_idx = (i / target_frame_count) * (len(frames) - 1)
                frame1_idx = int(frame_idx)
                frame2_idx = min(frame1_idx + 1, len(frames) - 1)
                weight = frame_idx - frame1_idx
                
                # Blend the frames
                if frame1_idx == frame2_idx:
                    interpolated_frames.append(frames[frame1_idx])
                else:
                    blended_frame = np.uint8((1 - weight) * frames[frame1_idx] + weight * frames[frame2_idx])
                    interpolated_frames.append(blended_frame)
            
            frames = interpolated_frames
        
        # Save as video with higher quality
        logger.info(f"Saving video to: {output_path}")
        imageio.mimsave(output_path, frames, fps=12, quality=9)
        
        return output_path
        
    except Exception as e:
        logger.error(f"Error in video generation: {str(e)}")
        return generate_fallback_video(output_path, 30, height, width)

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