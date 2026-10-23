import re
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

def decompose_text_to_scenes(prompt: str) -> List[Dict[str, str]]:
    """
    Decomposes an idea or raw script into 3-4 structured Shorts narrative scenes.
    Each scene contains:
    - scene_text: Narration voiceover script
    - visual_prompt: Tailored positive prompt conditioned for diffusion image models
    """
    clean_text = prompt.strip()
    
    # Check if user provided multi-sentence input
    raw_sentences = [
        s.strip() for s in re.split(r'(?<=[.!?])\s+|\n+', clean_text)
        if len(s.strip()) > 10
    ]

    if len(raw_sentences) >= 3:
        scenes = []
        for i, sentence in enumerate(raw_sentences[:4]):
            scenes.append({
                "scene_text": sentence,
                "visual_prompt": f"{sentence}, dramatic cinematic lighting, photorealistic, 8k, Unreal Engine 5, dynamic shot {i+1}",
                "order": i + 1
            })
        return scenes

    # Auto-generate a high-retention 3-scene viral Shorts narrative arc
    # 1. The Hook, 2. The Core Reveal, 3. The Climax
    return [
        {
            "scene_text": f"Did you know? {clean_text}.",
            "visual_prompt": f"Dramatic establishing visual of {clean_text}, atmospheric volumetric fog, hyperdetailed photorealistic 8k, award winning cinematography",
            "order": 1
        },
        {
            "scene_text": f"Beneath the surface, the hidden reality of {clean_text} defies everything scientists thought possible.",
            "visual_prompt": f"Intense close-up cinematic reveal of {clean_text}, mysterious glowing elements, highly detailed, photorealistic 9:16 vertical masterpiece",
            "order": 2
        },
        {
            "scene_text": f"This discovery completely alters our understanding of {clean_text}.",
            "visual_prompt": f"Epic wide-angle climax visual of {clean_text}, stunning cosmic scale, breathtaking composition, cinematic photorealism",
            "order": 3
        }
    ]

def process_text(text: str) -> List[str]:
    """
    Legacy helper to return list of text segments for backward compatibility.
    """
    scenes = decompose_text_to_scenes(text)
    return [s["scene_text"] for s in scenes]