import os
import time
import logging
import tempfile
import shutil
from typing import List, Dict, Tuple
from config import Config
from models.image_generator import generate_image_from_text
from models.video_composer import create_video_from_images_and_audio
from services.text_processing import decompose_text_to_scenes

logger = logging.getLogger(__name__)


def _tts_to_file(text: str, output_path: str) -> None:
    """
    Generate speech audio from text. Tries gTTS first (higher quality, needs internet),
    then falls back to pyttsx3 (offline, Windows SAPI / macOS NSS / Linux espeak).
    """
    # --- Attempt 1: gTTS (requires internet) ---
    try:
        from gtts import gTTS
        tts = gTTS(text=text, lang='en', slow=False)
        tts.save(output_path)
        logger.info(f"gTTS audio saved: {output_path}")
        return
    except Exception as e:
        logger.warning(f"gTTS failed (likely no internet): {e}. Falling back to pyttsx3 offline TTS.")

    # --- Attempt 2: pyttsx3 (fully offline) ---
    try:
        import pyttsx3
        engine = pyttsx3.init()
        engine.setProperty('rate', 175)   # words-per-minute
        engine.setProperty('volume', 0.9)
        # pyttsx3 saves as WAV; moviepy can handle WAV fine
        wav_path = output_path.replace(".mp3", ".wav")
        engine.save_to_file(text, wav_path)
        engine.runAndWait()
        # If caller expected .mp3 path, update output_path reference by saving wav with expected name
        if not os.path.exists(wav_path):
            raise RuntimeError("pyttsx3 did not produce output file")
        # Rename to mp3 extension so the rest of the pipeline treats it uniformly
        os.replace(wav_path, output_path)
        logger.info(f"pyttsx3 offline audio saved: {output_path}")
        return
    except Exception as e:
        logger.warning(f"pyttsx3 also failed: {e}. Generating silent placeholder audio.")

    # --- Attempt 3: Silent audio placeholder via wave module (always works) ---
    import wave, struct, math
    sample_rate = 22050
    # Estimate duration: ~3 words/second
    words = len(text.split())
    duration_s = max(3, words // 3)
    num_samples = sample_rate * duration_s

    silent_wav = output_path.replace(".mp3", "_silent.wav")
    with wave.open(silent_wav, 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        # Write near-silent audio (tiny hum so encoders don't choke on true silence)
        frames = [struct.pack('<h', int(100 * math.sin(2 * math.pi * 440 * i / sample_rate)))
                  for i in range(num_samples)]
        wf.writeframes(b''.join(frames))
    os.replace(silent_wav, output_path)
    logger.info(f"Silent placeholder audio saved: {output_path}")


def generate_video_from_text(
    text: str,
    output_path: str,
    num_frames: int = 3,
    height: int = 1280,
    width: int = 720,
    enable_audio: bool = True,
    enable_captions: bool = True,
    min_duration: int = 15
) -> Tuple[str, List[Dict]]:
    """
    Synthesize an authentic AI Short from text using a multi-modal pre-trained model pipeline:
    1. NLP Storyboard decomposition into 3-4 scenes
    2. Conditioning pre-trained diffusion models to generate vertical 9:16 keyframes
    3. Synthesizing voiceover narration with neural speech models (online or offline fallback)
    4. Stitching keyframes with Ken Burns motion & audio synchronization into .mp4

    Returns:
        Tuple[str, List[Dict]]: (output_path, scene_metadata_list)
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    temp_dir = tempfile.mkdtemp(prefix="shorts_gen_")

    try:
        logger.info(f"Initiating Multi-Modal AI Video Synthesis for: '{text[:60]}...'")
        
        # 1. NLP Storyboard Decomposition
        scenes_data = decompose_text_to_scenes(text)
        logger.info(f"Decomposed narrative into {len(scenes_data)} structured scenes")

        image_paths = []
        audio_paths = []
        scenes_meta = []

        # 2. Generate AI Keyframes & Audio per scene
        for i, scene in enumerate(scenes_data):
            if i > 0:
                time.sleep(1.0)
            scene_order = scene.get("order", i + 1)
            img_filename = f"scene_{scene_order:02d}.jpg"
            img_path = os.path.join(temp_dir, img_filename)
            
            # Deterministic seed per scene
            seed = (i + 1) * 100 + 42
            logger.info(f"Synthesizing AI Image for Scene {scene_order}: {scene['visual_prompt'][:50]}...")
            generate_image_from_text(
                text=scene["visual_prompt"],
                output_path=img_path,
                width=width,
                height=height,
                seed=seed
            )
            image_paths.append(img_path)

            # Persistent copy into images directory for UI thumbnails
            public_img_filename = f"img_{os.path.basename(output_path).replace('.mp4', '')}_{scene_order}.jpg"
            public_img_path = os.path.join(Config.IMAGES_DIR, public_img_filename)
            shutil.copy2(img_path, public_img_path)

            # Generate Speech Narration (with offline fallback)
            audio_path = os.path.join(temp_dir, f"audio_{scene_order:02d}.mp3")
            if enable_audio:
                _tts_to_file(scene["scene_text"], audio_path)
            else:
                # Generate a silent placeholder so the pipeline always has an audio file
                _tts_to_file("", audio_path)
            audio_paths.append(audio_path)

            scenes_meta.append({
                "order": scene_order,
                "text": scene["scene_text"],
                "visualPrompt": scene["visual_prompt"],
                "imagePath": public_img_path,
                "imageFilename": public_img_filename
            })

        # 3. Temporal Video Composition & Multiplexing via FFmpeg
        logger.info("Composing video scenes with Ken Burns camera motion & audio...")
        create_video_from_images_and_audio(
            image_paths=image_paths,
            audio_paths=audio_paths,
            output_path=output_path,
            fps=24
        )

        logger.info(f"Video synthesis complete: {output_path}")
        return output_path, scenes_meta

    except Exception as e:
        logger.error(f"Error during AI video synthesis: {e}", exc_info=True)
        raise e
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)