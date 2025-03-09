def validate_text_input(text):
    """
    Validate text input for video generation
    
    Args:
        text (str): The text to validate
        
    Returns:
        tuple: (is_valid, error_message)
    """
    if not text:
        return False, "Text cannot be empty"
    
    if len(text) < 10:
        return False, "Text is too short (minimum 10 characters)"
    
    if len(text) > 5000:
        return False, "Text is too long (maximum 5000 characters)"
    
    return True, None