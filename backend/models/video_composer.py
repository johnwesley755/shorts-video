import os
import subprocess
import tempfile
import shutil

def create_video_from_images_and_audio(image_paths, audio_paths, output_path, fps=24):
    """
    Create a video from a list of images and audio files using FFmpeg
    
    Args:
        image_paths (list): List of paths to image files
        audio_paths (list): List of paths to audio files
        output_path (str): Path to save the generated video
        fps (int): Frames per second for the video
    """
    if len(image_paths) != len(audio_paths):
        raise ValueError("Number of images must match number of audio files")
    
    # Make sure the output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Create a temporary directory for intermediate files
    temp_dir = tempfile.mkdtemp()
    
    try:
        # Create segment videos (image + audio)
        segment_videos = []
        
        for i, (img_path, audio_path) in enumerate(zip(image_paths, audio_paths)):
            segment_output = os.path.join(temp_dir, f"segment_{i}.mp4")
            
            # Use FFmpeg to create a video segment from image and audio
            cmd = [
                "ffmpeg", "-y",
                "-loop", "1",
                "-i", img_path,
                "-i", audio_path,
                "-c:v", "libx264",
                "-tune", "stillimage",
                "-c:a", "aac",
                "-b:a", "192k",
                "-pix_fmt", "yuv420p",
                "-shortest",
                segment_output
            ]
            
            subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            segment_videos.append(segment_output)
        
        # Create a file listing all segments
        concat_file = os.path.join(temp_dir, "concat.txt")
        with open(concat_file, "w") as f:
            for video in segment_videos:
                f.write(f"file '{video}'\n")
        
        # Concatenate all segments
        cmd = [
            "ffmpeg", "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", concat_file,
            "-c", "copy",
            output_path
        ]
        
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        return output_path
        
    finally:
        # Clean up temporary directory
        shutil.rmtree(temp_dir)