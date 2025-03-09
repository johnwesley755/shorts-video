import os
from gtts import gTTS

def text_to_speech(text, output_path):
    """
    Convert text to speech using Google Text-to-Speech
    
    Args:
        text (str): The text to convert to speech
        output_path (str): Path to save the generated audio file
    """
    # Make sure the directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Generate speech using gTTS
    tts = gTTS(text=text, lang='en', slow=False)
    
    # Save the audio file
    tts.save(output_path)
    
    return output_path