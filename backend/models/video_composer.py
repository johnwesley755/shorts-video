import os
import subprocess
import tempfile
import shutil
import logging

logger = logging.getLogger(__name__)

def get_media_duration(file_path: str) -> float:
    """Get duration of an audio or video file using ffprobe"""
    try:
        cmd = [
            'ffprobe', '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            file_path
        ]
        out = subprocess.check_output(cmd, stderr=subprocess.DEVNULL).decode('utf-8').strip()
        return float(out)
    except Exception as e:
        logger.warning(f"Could not read duration for {file_path}: {e}")
        return 5.0  # Safe 5s fallback

def create_video_segment(img_path: str, audio_path: str, output_path: str, fps: int = 24, zoom_in: bool = True) -> str:
    """
    Creates an animated video segment from a single image and an audio clip.
    Applies the Ken Burns effect (smooth camera pan & zoom) using FFmpeg.
    """
    duration = get_media_duration(audio_path)
    total_frames = max(int(duration * fps), 24)

    # Alternate between subtle zoom-in and zoom-out for visual dynamism
    zoom_expr = f"min(zoom+0.0015,1.20)" if zoom_in else f"max(1.20-0.0015*on,1.0)"

    cmd = [
        "ffmpeg", "-y",
        "-loop", "1",
        "-i", img_path,
        "-i", audio_path,
        "-filter_complex",
        f"[0:v]scale=864:1536:force_original_aspect_ratio=increase,crop=864:1536,zoompan=z='{zoom_expr}':d={total_frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=720x1280:fps={fps}[v]",
        "-map", "[v]",
        "-map", "1:a",
        "-c:v", "libx264",
        "-preset", "faster",
        "-crf", "22",
        "-c:a", "aac",
        "-b:a", "192k",
        "-pix_fmt", "yuv420p",
        "-t", str(duration),
        output_path
    ]

    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    return output_path

def create_video_from_images_and_audio(image_paths: list, audio_paths: list, output_path: str, fps: int = 24) -> str:
    """
    Combines a sequence of AI generated keyframe images and audio segments into a seamless .mp4 video.
    """
    if len(image_paths) != len(audio_paths):
        raise ValueError(f"Number of images ({len(image_paths)}) must match audio files ({len(audio_paths)})")

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    temp_dir = tempfile.mkdtemp(prefix="shorts_composer_")

    try:
        segment_files = []
        for i, (img, audio) in enumerate(zip(image_paths, audio_paths)):
            seg_path = os.path.join(temp_dir, f"seg_{i:02d}.mp4")
            logger.info(f"Synthesizing video segment {i+1}/{len(image_paths)} with Ken Burns camera motion...")
            create_video_segment(img, audio, seg_path, fps=fps, zoom_in=(i % 2 == 0))
            segment_files.append(seg_path)

        # Concatenate using ffmpeg concat filter to guarantee AV sync and stream compliance
        filter_inputs = "".join(f"[{i}:v][{i}:a]" for i in range(len(segment_files)))
        filter_complex = f"{filter_inputs}concat=n={len(segment_files)}:v=1:a=1[outv][outa]"

        ffmpeg_cmd = ["ffmpeg", "-y"]
        for seg in segment_files:
            ffmpeg_cmd.extend(["-i", seg])

        ffmpeg_cmd.extend([
            "-filter_complex", filter_complex,
            "-map", "[outv]",
            "-map", "[outa]",
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "21",
            "-c:a", "aac",
            "-b:a", "192k",
            "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",  # Optimizes MP4 for progressive web streaming
            output_path
        ])

        logger.info(f"Multiplexing final video to: {output_path}")
        subprocess.run(ffmpeg_cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        return output_path

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)