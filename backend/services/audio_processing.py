from models.text_to_speech import text_to_speech

def generate_audio(text, output_path):
    """
    Generate audio from text and save it to the specified path
    
    Args:
        text (str): The text to convert to speech
        output_path (str): Path to save the generated audio
        
    Returns:
        str: Path to the generated audio file
    """
    return text_to_speech(text, output_path)