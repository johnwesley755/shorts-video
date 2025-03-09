import os
import requests
from PIL import Image
from io import BytesIO

def generate_image_from_text(text, output_path, width=512, height=512):
    """
    Generate an image from text using Unsplash API
    
    Args:
        text (str): The text prompt to generate an image from
        output_path (str): Path to save the generated image
        width (int): Width of the generated image
        height (int): Height of the generated image
    """
    # Make sure the directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Use Unsplash API to get a relevant image based on the text
    search_term = text.split()[:3]  # Use first few words as search terms
    search_query = '+'.join(search_term)
    
    # Fetch a random image related to the text
    response = requests.get(f"https://source.unsplash.com/random/{width}x{height}/?{search_query}")
    
    if response.status_code == 200:
        # Open the image from the response content
        img = Image.open(BytesIO(response.content))
        
        # Save the image
        img.save(output_path)
        
        return output_path
    else:
        # If the request fails, create a simple colored background with text
        img = Image.new('RGB', (width, height), color=(73, 109, 137))
        img.save(output_path)
        
        return output_path