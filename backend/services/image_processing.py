from models.image_generator import generate_image_from_text

def generate_images(text, output_path, width=1080, height=1920):
    """
    Generate an image from text and save it to the specified path
    
    Args:
        text (str): The text to generate an image from
        output_path (str): Path to save the generated image
        width (int): Width of the generated image
        height (int): Height of the generated image
        
    Returns:
        str: Path to the generated image file
    """
    return generate_image_from_text(text, output_path, width, height)