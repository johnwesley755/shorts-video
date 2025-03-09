from models.video_composer import create_video_from_images_and_audio

def create_video(image_paths, audio_paths, output_path):
    """
    Create a video from images and audio files
    
    Args:
        image_paths (list): List of paths to image files
        audio_paths (list): List of paths to audio files
        output_path (str): Path to save the generated video
        
    Returns:
        str: Path to the generated video file
    """
    return create_video_from_images_and_audio(image_paths, audio_paths, output_path)