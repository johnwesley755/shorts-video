import os
import logging
import numpy as np
import torch
import time
import math  # Add this import
from diffusers import StableDiffusionPipeline
import imageio
from PIL import Image, ImageDraw, ImageFont
import tempfile
import subprocess
from gtts import gTTS  # For text-to-speech

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_video_from_text(text, output_path, num_frames=5, height=512, width=512, enable_audio=True, enable_captions=True, min_duration=30):
    """
    Generate a video from text using a series of images with optional narration and captions
    """
    # Make sure the directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    try:
        logger.info(f"Generating video for prompt: {text}")
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {device}")
        
        # Use a better model for higher quality and more relevant images
        pipe = StableDiffusionPipeline.from_pretrained(
            "stabilityai/stable-diffusion-2-1",  # Using a better model
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
            safety_checker=None
        )
        pipe = pipe.to(device)
        pipe.enable_attention_slicing()
        
        # Generate a series of slightly different images to create a video effect
        logger.info("Starting image sequence generation...")
        frames = []
        
        # Set a timeout for the entire generation process
        start_time = time.time()
        max_time = 420  # 7 minutes max
        
        # Ensure we generate exactly 5 frames
        num_frames = 5
        
        # Generate frames with optimized quality settings for speed
        for i in range(num_frames):
            # Check if we're exceeding the time limit
            if time.time() - start_time > max_time:
                logger.warning(f"Generation taking too long, using {len(frames)} frames")
                break
                
            # Add variations to the prompt for each frame
            seed = i * 100 + 42  # Different seed for each frame
            generator = torch.Generator(device=device).manual_seed(seed)
            
            # Better prompt engineering for more relevant results
            enhanced_prompt = f"high quality, detailed {text}, professional photography, 4k, sharp focus"
            
            # Generate image with faster settings
            image = pipe(
                prompt=enhanced_prompt,
                negative_prompt="blurry, low quality, distorted, deformed, disfigured, bad anatomy, watermark, signature, text",
                num_inference_steps=20,  # Reduced for faster generation
                guidance_scale=7.5,  # Slightly reduced for speed
                height=height,
                width=width,
                generator=generator
            ).images[0]
            
            # Convert to numpy array
            frame = np.array(image)
            frames.append(frame)
            logger.info(f"Generated frame {i+1}/{num_frames}")
            
            # If we're taking too long after generating minimum frames, stop
            if len(frames) >= 3 and time.time() - start_time > 360:  # 6 minutes
                logger.warning("Generation taking longer than expected, stopping with minimum frames")
                break
        
        # Ensure we have at least 5 frames by duplicating if needed
        while len(frames) < 5:
            logger.warning(f"Only generated {len(frames)} frames, duplicating last frame to reach 5")
            frames.append(frames[-1] if frames else np.zeros((height, width, 3), dtype=np.uint8))
        
        # Add captions to the frames before interpolation if enabled
        if enable_captions:
            logger.info("Adding captions to frames...")
            captioned_frames = []
            
            # Try to load a font, use default if not available
            try:
                caption_font = ImageFont.truetype("arial.ttf", 28)
            except:
                caption_font = ImageFont.load_default()
                
            # Add caption to each base frame
            for frame in frames:
                img = Image.fromarray(frame)
                draw = ImageDraw.Draw(img)
                
                # Create caption text
                caption_text = text[:50] + "..." if len(text) > 50 else text
                
                # Calculate text width and position (centered at bottom with padding)
                text_width = draw.textlength(caption_text, font=caption_font) if hasattr(draw, 'textlength') else len(caption_text) * 15
                text_position = ((width - text_width) // 2, height - 60)
                
                # Draw text background for better readability
                text_bbox = draw.textbbox(text_position, caption_text, font=caption_font) if hasattr(draw, 'textbbox') else (
                    text_position[0], text_position[1], 
                    text_position[0] + text_width, text_position[1] + 40
                )
                
                # Add semi-transparent background
                bg_bbox = (text_bbox[0]-10, text_bbox[1]-5, text_bbox[2]+10, text_bbox[3]+5)
                overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
                draw_overlay = ImageDraw.Draw(overlay)
                draw_overlay.rectangle(bg_bbox, fill=(0, 0, 0, 180))
                img = Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')
                draw = ImageDraw.Draw(img)
                
                # Draw caption text
                draw.text(text_position, caption_text, font=caption_font, fill=(255, 255, 255))
                
                # Convert back to numpy array
                captioned_frames.append(np.array(img))
            
            frames = captioned_frames
        else:
            logger.info("Captions disabled, skipping caption generation")
        
        # If we have at least 2 frames, interpolate between them to reach target duration
        if len(frames) >= 2:
            logger.info(f"Interpolating between {len(frames)} frames...")
            interpolated_frames = []
            
            # Calculate how many frames we need for the minimum duration at 24 fps
            fps = 24  # Higher FPS for smoother video
            target_frame_count = min_duration * fps
            
            # Faster interpolation between frames
            for i in range(int(target_frame_count)):
                # Determine which base frames to interpolate between
                frame_idx = (i / target_frame_count) * (len(frames) - 1)
                frame1_idx = int(frame_idx)
                frame2_idx = min(frame1_idx + 1, len(frames) - 1)
                weight = frame_idx - frame1_idx
                
                # Simple linear blending for speed
                if frame1_idx == frame2_idx:
                    interpolated_frames.append(frames[frame1_idx])
                else:
                    blended_frame = np.uint8((1 - weight) * frames[frame1_idx] + weight * frames[frame2_idx])
                    interpolated_frames.append(blended_frame)
            
            frames = interpolated_frames
        
        # Save as video with higher quality
        temp_video_path = output_path
        if enable_audio:
            # Use a temporary file for the silent video
            temp_video_path = os.path.join(tempfile.gettempdir(), "temp_video.mp4")
            
        logger.info(f"Saving video to: {temp_video_path}")
        # Use higher quality settings for the video
        imageio.mimsave(temp_video_path, frames, fps=fps, quality=9, macro_block_size=1)
        
        # Generate audio narration if enabled
        if enable_audio:
            try:
                logger.info("Generating audio narration...")
                audio_path = os.path.join(tempfile.gettempdir(), "narration.mp3")
                
                # Generate speech from the prompt text
                tts = gTTS(text=text, lang='en', slow=False)
                tts.save(audio_path)
                
                # Combine video and audio with better ffmpeg settings
                logger.info("Combining video and audio...")
                
                # Check audio duration
                audio_info_cmd = [
                    'ffprobe', '-v', 'error', '-show_entries', 'format=duration', 
                    '-of', 'default=noprint_wrappers=1:nokey=1', audio_path
                ]
                
                try:
                    audio_duration = float(subprocess.check_output(audio_info_cmd).decode('utf-8').strip())
                    logger.info(f"Audio duration: {audio_duration} seconds")
                    
                    # If audio is shorter than 30 seconds, loop it
                    if audio_duration < 30:
                        logger.info("Audio is shorter than 30 seconds, creating looped version")
                        looped_audio_path = os.path.join(tempfile.gettempdir(), "looped_narration.mp3")
                        
                        # Create a filter to loop audio to at least 30 seconds
                        loop_count = math.ceil(30 / audio_duration)
                        
                        loop_cmd = [
                            'ffmpeg', '-y',
                            '-i', audio_path,
                            '-filter_complex', f'aloop=loop={loop_count}:size=1:start=0',
                            '-t', '30',  # Limit to exactly 30 seconds
                            looped_audio_path
                        ]
                        
                        subprocess.run(loop_cmd, check=True)
                        
                        # Use the looped audio instead
                        audio_path = looped_audio_path
                except Exception as e:
                    logger.warning(f"Could not check audio duration: {str(e)}")
                
                # Use ffmpeg to combine video and audio - ensure output is exactly 30 seconds
                ffmpeg_cmd = [
                    'ffmpeg', '-y',
                    '-i', temp_video_path,
                    '-i', audio_path,
                    '-c:v', 'libx264',  # Use better codec
                    '-preset', 'medium',  # Better quality preset
                    '-crf', '23',  # Better quality setting
                    '-c:a', 'aac',
                    '-b:a', '192k',  # Better audio quality
                    '-t', '30',  # Force exactly 30 seconds
                    output_path
                ]
                
                subprocess.run(ffmpeg_cmd, check=True)
                logger.info(f"Video with narration saved to: {output_path}")
                
                # Clean up temporary files
                if os.path.exists(temp_video_path):
                    os.remove(temp_video_path)
                if os.path.exists(audio_path):
                    os.remove(audio_path)
            except Exception as e:
                logger.error(f"Error adding narration: {str(e)}")
                # If audio fails, just use the video without audio
                if os.path.exists(temp_video_path) and temp_video_path != output_path:
                    os.rename(temp_video_path, output_path)
        
        return output_path
        
    except Exception as e:
        logger.error(f"Error in video generation: {str(e)}")
        # Use a faster fallback video generation
        return generate_fallback_video(output_path, 5, height, width, enable_audio, enable_captions, text)

def generate_fallback_video(output_path, num_frames=30, height=512, width=512, enable_audio=True, enable_captions=True, text="Video Generation"):
    """
    Generate a simple fallback video when the main generation fails
    """
    try:
        logger.info("Generating fallback video with text overlay")
        frames = []
        
        # Create a series of frames with text and the prompt
        for i in range(num_frames * 12):  # 30 seconds at 12 fps
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
            
            # Add the prompt text
            prompt_lines = text.split('\n')
            y_offset = height // 2 + 20
            for line in prompt_lines:
                if len(line) > 40:
                    # Split long lines
                    words = line.split()
                    current_line = ""
                    for word in words:
                        if len(current_line + " " + word) <= 40:
                            current_line += " " + word if current_line else word
                        else:
                            prompt_width = draw.textlength(current_line, font=small_font) if hasattr(draw, 'textlength') else 150
                            prompt_position = ((width - prompt_width) // 2, y_offset)
                            draw.text(prompt_position, current_line, fill=(200, 200, 255), font=small_font)
                            y_offset += 25
                            current_line = word
                    
                    if current_line:
                        prompt_width = draw.textlength(current_line, font=small_font) if hasattr(draw, 'textlength') else 150
                        prompt_position = ((width - prompt_width) // 2, y_offset)
                        draw.text(prompt_position, current_line, fill=(200, 200, 255), font=small_font)
                        y_offset += 25
                else:
                    prompt_width = draw.textlength(line, font=small_font) if hasattr(draw, 'textlength') else 150
                    prompt_position = ((width - prompt_width) // 2, y_offset)
                    draw.text(prompt_position, line, fill=(200, 200, 255), font=small_font)
                    y_offset += 25
            
            # Caption code removed - we no longer add captions at the bottom of the screen
            
            # Add animated elements
            angle = (i / (num_frames * 12)) * 360
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
        temp_video_path = output_path
        if enable_audio:
            # Use a temporary file for the silent video
            temp_video_path = os.path.join(tempfile.gettempdir(), "temp_fallback.mp4")
            
        logger.info(f"Saving fallback video to: {temp_video_path}")
        imageio.mimsave(temp_video_path, frames, fps=12)  # Higher FPS for smoother animation
        
        # Generate audio narration if enabled
        if enable_audio:
            try:
                logger.info("Generating audio narration for fallback...")
                audio_path = os.path.join(tempfile.gettempdir(), "fallback_narration.mp3")
                
                # Generate speech from the prompt text
                tts = gTTS(text=text, lang='en', slow=False)
                tts.save(audio_path)
                
                # Combine video and audio
                logger.info("Combining fallback video and audio...")
                
                # Use ffmpeg to combine video and audio
                ffmpeg_cmd = [
                    'ffmpeg', '-y',
                    '-i', temp_video_path,
                    '-i', audio_path,
                    '-c:v', 'copy',
                    '-c:a', 'aac',
                    '-shortest',  # End when the shortest input ends
                    output_path
                ]
                
                subprocess.run(ffmpeg_cmd, check=True)
                logger.info(f"Fallback video with narration saved to: {output_path}")
                
                # Clean up temporary files
                if os.path.exists(temp_video_path):
                    os.remove(temp_video_path)
                if os.path.exists(audio_path):
                    os.remove(audio_path)
            except Exception as e:
                logger.error(f"Error adding narration to fallback: {str(e)}")
                # If audio fails, just use the video without audio
                if os.path.exists(temp_video_path) and temp_video_path != output_path:
                    os.rename(temp_video_path, output_path)
        
        return output_path
    except Exception as e:
        logger.error(f"Error generating fallback video: {str(e)}")
        return output_path