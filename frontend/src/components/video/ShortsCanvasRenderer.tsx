// src/components/video/ShortsCanvasRenderer.tsx
import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { GeneratedShort, StoryScene } from "../../services/aiStoryService";
import { VoiceOption, PRESET_VOICES, speakTextWithTimings, createAmbientAudioBuffer } from "../../services/voiceService";
import { exportCanvasToVideo, downloadVideoBlob, ExportProgress } from "../../services/videoExporter";
import { Play, Pause, RotateCcw, Download, Volume2, VolumeX } from "lucide-react";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";

export interface ShortsCanvasRendererRef {
  exportVideo: () => Promise<void>;
  play: () => void;
  pause: () => void;
}

interface ShortsCanvasRendererProps {
  short: GeneratedShort;
  selectedVoice?: VoiceOption;
  enableMusic?: boolean;
  musicMood?: "cinematic" | "chill" | "cyberpunk";
  captionStyle?: "tiktok-yellow" | "neon-cyan" | "pure-white";
  onExportProgress?: (progress: ExportProgress) => void;
}

const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 1280;

export const ShortsCanvasRenderer = forwardRef<ShortsCanvasRendererRef, ShortsCanvasRendererProps>(
  (
    {
      short,
      selectedVoice = PRESET_VOICES[0],
      enableMusic = true,
      musicMood = "cinematic",
      captionStyle = "tiktok-yellow",
      onExportProgress,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [exportPercent, setExportPercent] = useState<number>(0);
    const [currentWord, setCurrentWord] = useState<string>("");

    const animationFrameId = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const pausedTimeRef = useRef<number>(0);
    const speechController = useRef<{ stop: () => void } | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const musicSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);

    // Preloaded image/video cache
    const mediaElements = useRef<Map<string, HTMLImageElement | HTMLVideoElement>>(new Map());

    // Preload scene media
    useEffect(() => {
      short.scenes.forEach((scene) => {
        if (scene.mediaType === "image") {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = scene.mediaUrl;
          mediaElements.current.set(scene.id, img);
        } else if (scene.mediaType === "video") {
          const video = document.createElement("video");
          video.crossOrigin = "anonymous";
          video.src = scene.mediaUrl;
          video.muted = true;
          video.loop = true;
          video.playsInline = true;
          video.load();
          mediaElements.current.set(scene.id, video);
        }
      });
    }, [short]);

    // Setup Web Audio Context for background music & export destination
    const initAudio = () => {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
        audioDestinationRef.current = audioContextRef.current.createMediaStreamDestination();
      }
      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }
    };

    const startBackgroundMusic = () => {
      if (!enableMusic || !audioContextRef.current || isMuted) return;
      stopBackgroundMusic();

      const ctx = audioContextRef.current;
      const buffer = createAmbientAudioBuffer(ctx, short.totalDuration + 2, musicMood);
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.18, ctx.currentTime); // Low ducked volume behind speech

      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      if (audioDestinationRef.current) {
        gainNode.connect(audioDestinationRef.current);
      }

      source.start();
      musicSourceRef.current = source;
    };

    const stopBackgroundMusic = () => {
      if (musicSourceRef.current) {
        try {
          musicSourceRef.current.stop();
          musicSourceRef.current.disconnect();
        } catch {
          // Ignore if already stopped
        }
        musicSourceRef.current = null;
      }
    };

    // Finds the current scene based on global playback timestamp
    const getCurrentSceneInfo = (time: number): { scene: StoryScene; sceneLocalTime: number; progress: number } => {
      let accumulated = 0;
      for (const scene of short.scenes) {
        if (time >= accumulated && time <= accumulated + scene.duration) {
          const localTime = time - accumulated;
          return {
            scene,
            sceneLocalTime: localTime,
            progress: Math.min(1, Math.max(0, localTime / scene.duration)),
          };
        }
        accumulated += scene.duration;
      }
      const last = short.scenes[short.scenes.length - 1];
      return { scene: last, sceneLocalTime: last.duration, progress: 1 };
    };

    // Draw frame onto the 9:16 Canvas
    const drawFrame = (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { scene, progress } = getCurrentSceneInfo(time);

      // Clear Canvas with sleek dark background
      ctx.fillStyle = "#0a0a0f";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Render Scene Media (Ken Burns for images, direct draw for video)
      const media = mediaElements.current.get(scene.id);
      if (media instanceof HTMLImageElement && media.complete && media.naturalWidth > 0) {
        // Ken Burns Camera Motion: Interpolate scale (1.0 -> 1.15) and pan offset
        const scale = 1.0 + progress * 0.15;
        const panX = Math.sin(progress * Math.PI) * 25;
        const panY = -progress * 30;

        ctx.save();
        ctx.translate(CANVAS_WIDTH / 2 + panX, CANVAS_HEIGHT / 2 + panY);
        ctx.scale(scale, scale);

        // Aspect Fill calculation
        const imgAspect = media.naturalWidth / media.naturalHeight;
        const canvasAspect = CANVAS_WIDTH / CANVAS_HEIGHT;
        let drawW = CANVAS_WIDTH;
        let drawH = CANVAS_HEIGHT;

        if (imgAspect > canvasAspect) {
          drawW = CANVAS_HEIGHT * imgAspect;
        } else {
          drawH = CANVAS_WIDTH / imgAspect;
        }

        ctx.drawImage(media, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      } else if (media instanceof HTMLVideoElement && media.readyState >= 2) {
        ctx.drawImage(media, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      } else {
        // Fallback: Elegant cosmic gradient while media is caching
        const grad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        grad.addColorStop(0, "#111827");
        grad.addColorStop(0.5, "#1e1b4b");
        grad.addColorStop(1, "#030712");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      // Cinematic Vignette Overlay (darkens edges for punchy contrast)
      const vignette = ctx.createRadialGradient(
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2,
        CANVAS_HEIGHT * 0.35,
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2,
        CANVAS_HEIGHT * 0.75
      );
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.65)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Render Kinetic Animated Subtitles (TikTok / Shorts typography)
      drawSubtitles(ctx, time, scene);
    };

    // Draw synchronized word-by-word bouncing captions
    const drawSubtitles = (ctx: CanvasRenderingContext2D, time: number, scene: StoryScene) => {
      // Group words into short 3-5 word readable chunks for mobile display
      const chunkWords = scene.words.filter(
        () => time >= scene.words[0].startTime - 0.2 && time <= scene.words[scene.words.length - 1].endTime + 0.5
      );

      // Determine which 3-word window is currently visible
      const activeIndex = chunkWords.findIndex((w) => time >= w.startTime && time <= w.endTime);
      const safeIndex = activeIndex >= 0 ? activeIndex : 0;
      const windowStart = Math.max(0, safeIndex - 1);
      const windowEnd = Math.min(chunkWords.length, windowStart + 3);
      const displayChunk = chunkWords.slice(windowStart, windowEnd);

      if (displayChunk.length === 0) return;

      const centerY = CANVAS_HEIGHT * 0.74; // Positioned in lower third for optimal mobile viewing
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Calculate total text width for rounded backdrop
      ctx.font = "900 44px 'Impact', 'Arial Black', sans-serif";
      const fullPhrase = displayChunk.map((w) => w.word).join(" ");
      const metrics = ctx.measureText(fullPhrase);
      const boxWidth = metrics.width + 60;
      const boxHeight = 72;

      // Dark translucent backdrop pill behind subtitle
      ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
      ctx.beginPath();
      ctx.roundRect(CANVAS_WIDTH / 2 - boxWidth / 2, centerY - boxHeight / 2, boxWidth, boxHeight, 16);
      ctx.fill();

      // Draw words with highlighting
      let startX = CANVAS_WIDTH / 2 - metrics.width / 2;

      displayChunk.forEach((w) => {
        const isCurrent = time >= w.startTime && time <= w.endTime;
        const wordText = w.word;
        const wordWidth = ctx.measureText(wordText + " ").width;

        ctx.save();
        const wordCenterX = startX + wordWidth / 2;

        if (isCurrent) {
          // Kinetic bounce scale on active word
          ctx.translate(wordCenterX, centerY);
          ctx.scale(1.18, 1.18);
          ctx.translate(-wordCenterX, -centerY);

          // Subtitle color palette
          if (captionStyle === "tiktok-yellow") {
            ctx.fillStyle = "#FACC15"; // Vibrant TikTok yellow
            ctx.shadowColor = "rgba(250, 204, 21, 0.75)";
          } else if (captionStyle === "neon-cyan") {
            ctx.fillStyle = "#22D3EE"; // Cyberpunk neon cyan
            ctx.shadowColor = "rgba(34, 211, 238, 0.75)";
          } else {
            ctx.fillStyle = "#FFFFFF";
            ctx.shadowColor = "rgba(255, 255, 255, 0.6)";
          }
          ctx.shadowBlur = 18;
        } else {
          ctx.fillStyle = "#FFFFFF";
          ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
          ctx.shadowBlur = 8;
        }

        // Deep outline stroke for high contrast readability
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 8;
        ctx.strokeText(wordText, wordCenterX, centerY);
        ctx.fillText(wordText, wordCenterX, centerY);
        ctx.restore();

        startX += wordWidth;
      });

      ctx.restore();
    };

    // Main animation loop
    const tick = (now: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = now;
      }

      const elapsed = (now - startTimeRef.current) / 1000 + pausedTimeRef.current;

      if (elapsed >= short.totalDuration) {
        // Loop or end playback
        setCurrentTime(short.totalDuration);
        drawFrame(short.totalDuration);
        pause();
        return;
      }

      setCurrentTime(elapsed);
      drawFrame(elapsed);

      // Keep playing videos if scene is video
      const { scene } = getCurrentSceneInfo(elapsed);
      const media = mediaElements.current.get(scene.id);
      if (media instanceof HTMLVideoElement && media.paused) {
        media.play().catch(() => {});
      }

      animationFrameId.current = requestAnimationFrame(tick);
    };

    const play = () => {
      initAudio();
      setIsPlaying(true);
      startTimeRef.current = performance.now();

      // Trigger Web Speech narration
      if (!isMuted) {
        speechController.current = speakTextWithTimings(
          short.fullScript,
          selectedVoice,
          (_index, word) => {
            setCurrentWord(word);
          },
          () => {
            setCurrentWord("");
          }
        );
        startBackgroundMusic();
      }

      animationFrameId.current = requestAnimationFrame(tick);
    };

    const pause = () => {
      setIsPlaying(false);
      setCurrentWord("");
      pausedTimeRef.current = currentTime;
      startTimeRef.current = null;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      if (speechController.current) {
        speechController.current.stop();
        speechController.current = null;
      }
      stopBackgroundMusic();
      // Pause any video elements
      mediaElements.current.forEach((m) => {
        if (m instanceof HTMLVideoElement) m.pause();
      });
    };

    const restart = () => {
      pause();
      pausedTimeRef.current = 0;
      setCurrentTime(0);
      drawFrame(0);
      play();
    };

    const togglePlay = () => {
      if (isPlaying) {
        pause();
      } else {
        if (currentTime >= short.totalDuration) {
          restart();
        } else {
          play();
        }
      }
    };

    // Seek to specific timestamp
    const handleSeek = (newTime: number) => {
      pause();
      pausedTimeRef.current = newTime;
      setCurrentTime(newTime);
      drawFrame(newTime);
    };

    // Export video handler
    const handleExport = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      setIsExporting(true);
      pause();
      restart(); // Play from start while recording

      try {
        const videoBlob = await exportCanvasToVideo(
          canvas,
          audioDestinationRef.current,
          short.totalDuration,
          (prog) => {
            setExportPercent(prog.progress);
            if (onExportProgress) onExportProgress(prog);
          }
        );

        downloadVideoBlob(videoBlob, short.title);
      } catch (err) {
        console.error("Export error:", err);
      } finally {
        setIsExporting(false);
      }
    };

    // Expose control methods via ref
    useImperativeHandle(ref, () => ({
      exportVideo: handleExport,
      play,
      pause,
    }));

    // Initial frame draw on mount
    useEffect(() => {
      drawFrame(0);
      return () => {
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
        }
        if (speechController.current) {
          speechController.current.stop();
        }
        stopBackgroundMusic();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [short, captionStyle]);

    const formatTimecode = (sec: number) => {
      const mins = Math.floor(sec / 60);
      const secs = (sec % 60).toFixed(2);
      return `${mins.toString().padStart(2, "0")}:${secs.padStart(5, "0")}`;
    };

    const currentSceneInfo = getCurrentSceneInfo(currentTime);

    return (
      <div className="flex flex-col items-center w-full max-w-[360px] sm:max-w-[390px] mx-auto select-none font-sans">
        {/* Sleek 9:16 Vertical Video Frame */}
        <div className="relative w-full aspect-[9/16] bg-[#04050c] rounded-[2rem] border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.9),_0_0_40px_rgba(0,242,254,0.12)] overflow-hidden flex flex-col justify-between group">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,242,254,0.06)_0%,_transparent_75%)] pointer-events-none" />

          {/* Canvas Render Element */}
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-full object-cover rounded-[2rem] cursor-pointer"
            onClick={togglePlay}
          />

          {/* Top Subtle Status Badge */}
          <div className="absolute top-3.5 inset-x-3.5 z-20 flex items-center justify-between pointer-events-none">
            <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-sans text-cyan-300 font-medium flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Scene 0{currentSceneInfo.scene.order} of {short.scenes.length}</span>
              {currentWord && <span className="text-white/50 font-normal ml-1">· "{currentWord}"</span>}
            </span>

            <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-sans text-white/80">
              {formatTimecode(currentTime)} / {formatTimecode(short.totalDuration)}
            </span>
          </div>

          {/* Center Play Glass Overlay when paused */}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 m-auto size-16 bg-white/95 text-[#04050c] backdrop-blur-md rounded-full flex items-center justify-center shadow-[0_0_35px_rgba(255,255,255,0.45)] transition-all hover:scale-110 active:scale-95 cursor-pointer z-30"
              aria-label="Play video"
            >
              <Play className="w-7 h-7 ml-1 fill-current" />
            </button>
          )}

          {/* Subtle bottom progress line */}
          <div className="absolute bottom-0 inset-x-0 h-1 bg-white/15 z-20 pointer-events-none">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 transition-all duration-100"
              style={{ width: `${(currentTime / short.totalDuration) * 100}%` }}
            />
          </div>
        </div>

        {/* Floating Frosted-Glass Playback Controls */}
        <div className="w-full mt-3.5 bg-white/[0.04] border border-white/10 p-3.5 rounded-2xl backdrop-blur-xl shadow-2xl space-y-3">
          {/* Progress Slider */}
          <div className="space-y-1">
            <Slider
              value={[currentTime]}
              min={0}
              max={short.totalDuration}
              step={0.05}
              onValueChange={([val]) => handleSeek(val)}
              className="cursor-pointer py-1"
            />
          </div>

          {/* Buttons Row */}
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-center gap-2">
              <button
                onClick={restart}
                className="w-8 h-8 rounded-full hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Restart"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-white text-[#04050c] flex items-center justify-center hover:scale-105 active:scale-95 shadow-[0_0_16px_rgba(255,255,255,0.3)] transition-all cursor-pointer"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className="w-8 h-8 rounded-full hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title={isMuted ? "Unmute sound" : "Mute sound"}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-cyan-300" />
                )}
              </button>

              <span className="text-xs font-mono text-[var(--body-muted)] pl-1">
                {formatTimecode(currentTime)}
              </span>
            </div>

            <Button
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
              className="btn-pill-white text-xs h-8 px-4 flex items-center gap-1.5 shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? `${exportPercent}%` : "Export MP4"}</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

ShortsCanvasRenderer.displayName = "ShortsCanvasRenderer";
