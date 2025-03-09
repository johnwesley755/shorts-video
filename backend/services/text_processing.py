import re
from models.model_loader import get_text_summarization_model

def process_text(text):
    """
    Process the input text and split it into segments
    
    Args:
        text (str): The input text to process
        
    Returns:
        list: A list of text segments
    """
    # Clean the text
    text = text.strip()
    
    # Split text into sentences
    sentences = re.split(r'(?<=[.!?])\s+', text)
    
    # Group sentences into segments (you can adjust the logic based on your needs)
    segments = []
    current_segment = ""
    
    for sentence in sentences:
        if not sentence:
            continue
            
        # If adding this sentence would make the segment too long, start a new segment
        if len(current_segment) + len(sentence) > 200:  # Adjust max length as needed
            if current_segment:
                segments.append(current_segment.strip())
            current_segment = sentence
        else:
            if current_segment:
                current_segment += " " + sentence
            else:
                current_segment = sentence
    
    # Add the last segment if it's not empty
    if current_segment:
        segments.append(current_segment.strip())
    
    # If the text is very long, use summarization to create a more concise version
    if len(text) > 1000:
        try:
            summarizer = get_text_summarization_model()
            summary = summarizer(text, max_length=150, min_length=30, do_sample=False)[0]['summary_text']
            segments.insert(0, summary)  # Add summary as the first segment
        except Exception as e:
            print(f"Error during summarization: {str(e)}")
    
    return segments