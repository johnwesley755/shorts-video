// src/pages/Home.tsx
import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  Film,
  Layers,
  Sparkles,
  Download,
  Share2,
  CheckCircle2,
  RotateCcw,
  Volume2,
  Music,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShortsCanvasRenderer,
  ShortsCanvasRendererRef,
} from "../components/video/ShortsCanvasRenderer";
import { generateShortsStory, GeneratedShort, AiVisualArtStyle } from "../services/aiStoryService";
import { saveShortToLibrary, generateVideo } from "../services/videoService";
import { PRESET_VOICES, VoiceOption } from "../services/voiceService";

const HEADING_TEXT = "Deep Work in a Distracted World";
const SUBLINE_TEXT =
  "Cut through the noise, reclaim your attention, and do work that truly matters.";

const GENERATION_STEPS = [
  "Decomposing narrative arc into Hook, Reveal, Climax...",
  "Synthesizing vertical 9:16 diffusion keyframes...",
  "Generating neural voice narration & acoustic timing...",
  "Composing Ken Burns camera motion & kinetic subtitles...",
  "Multiplexing audio/video streams for 60 FPS playback...",
];

const ARCHETYPES: { label: string; prompt: string; style: AiVisualArtStyle }[] = [
  {
    label: "Cyberpunk Tokyo",
    prompt:
      "A cybernetic detective in rain-slicked Tokyo megacity alleyways with volumetric neon lighting and flying spinners",
    style: "cyberpunk",
  },
  {
    label: "Deep Cosmos",
    prompt:
      "The terrifying silence of supermassive black holes warping spacetime and swallowing stars in the cosmic abyss",
    style: "photoreal",
  },
  {
    label: "Floating Shrines",
    prompt:
      "Ancient floating temple islands high above the clouds where mythical storm dragons dwell in tranquil mist",
    style: "anime",
  },
  {
    label: "Inner Citadel",
    prompt:
      "You cannot control the turbulent storm outside, but you can always master the silent fortress within",
    style: "photoreal",
  },
];

const STYLE_OPTIONS: { id: AiVisualArtStyle; label: string }[] = [
  { id: "photoreal", label: "Cinematic" },
  { id: "cyberpunk", label: "Cyberpunk" },
  { id: "anime", label: "Anime" },
  { id: "fantasy", label: "Fantasy" },
];

export const Home = () => {
  const [revealed, setRevealed] = useState(false);
  const [promptInput, setPromptInput] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<AiVisualArtStyle>("photoreal");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(PRESET_VOICES[0]);
  const [enableMusic, setEnableMusic] = useState(true);
  const [musicMood, setMusicMood] = useState<"cinematic" | "chill" | "cyberpunk">("cinematic");
  const [captionStyle, setCaptionStyle] = useState<"tiktok-yellow" | "neon-cyan" | "pure-white">("neon-cyan");

  const [currentShort, setCurrentShort] = useState<GeneratedShort | null>(() => {
    try {
      const saved = localStorage.getItem("active_generated_short");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);

  const canvasRendererRef = useRef<ShortsCanvasRendererRef | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRevealed(true);
    }, 20);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (currentShort) {
      localStorage.setItem("active_generated_short", JSON.stringify(currentShort));
    }
  }, [currentShort]);

  const handleGenerate = async (textToGenerate?: string) => {
    const text = (textToGenerate || promptInput).trim();
    if (!text || loading) return;

    // Check if input is waitlist email
    if (text.includes("@")) {
      setSubmittedMessage("You have been added to the Flowstate waitlist.");
      setTimeout(() => setSubmittedMessage(null), 4000);
      setPromptInput("");
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentStepIndex(0);

    // Scroll smoothly to the video stage area
    setTimeout(() => {
      stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < GENERATION_STEPS.length - 1 ? prev + 1 : prev));
    }, 1500);

    try {
      // 1. Generate multi-scene AI story with diffusion prompts
      const storyResult = await generateShortsStory(text, selectedStyle, selectedVoice.rate);

      // 2. Concurrently call backend to synthesize server-side stitched .mp4
      try {
        const backendRes = await generateVideo(text, true);
        storyResult.serverVideoUrl = backendRes.videoUrl;
        if (backendRes.scenes && backendRes.scenes.length > 0) {
          backendRes.scenes.forEach((bs, idx) => {
            if (storyResult.scenes[idx] && bs.imageUrl) {
              storyResult.scenes[idx].mediaUrl = bs.imageUrl;
            }
          });
        }
      } catch (backendErr) {
        console.warn("Backend video generation warning (client fallback active):", backendErr);
      }

      clearInterval(interval);
      setCurrentStepIndex(GENERATION_STEPS.length - 1);

      setCurrentShort(storyResult);
      setActiveSceneIndex(0);
      saveShortToLibrary(storyResult, storyResult.serverVideoUrl);
    } catch (err) {
      clearInterval(interval);
      console.error("Shorts generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate video");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (canvasRendererRef.current) {
      canvasRendererRef.current.exportVideo();
    }
  };

  const handleSceneClick = (index: number) => {
    setActiveSceneIndex(index);
    if (currentShort && canvasRendererRef.current) {
      canvasRendererRef.current.pause();
    }
  };

  const handleArchetypeClick = (archetype: (typeof ARCHETYPES)[0]) => {
    setPromptInput(archetype.prompt);
    setSelectedStyle(archetype.style);
  };

  const headingWords = HEADING_TEXT.split(/\s+/);
  const sublineWords = SUBLINE_TEXT.split(/\s+/);

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* ========================================================= */}
      {/* FLOWSTATE HERO & UNIFIED VIDEO GENERATOR                 */}
      {/* ========================================================= */}
      <section className="relative flex flex-col items-center justify-center min-h-[100lvh] w-full text-center px-5 sm:px-10 overflow-hidden select-none">
        <div className="relative z-10 flex flex-col items-center w-full max-w-[22rem] sm:max-w-[42rem] lg:max-w-[56rem] pt-24 pb-16">
          {/* Badge pill — 320ms delay */}
          <div
            className="transition-all duration-700 ease-[cubic-bezier(0.2,0,0,1)]"
            style={{
              opacity: revealed ? 1 : 0,
              transform: revealed ? "translateY(0)" : "translateY(1.25rem)",
              transitionDelay: "320ms",
            }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--glass-fill)] px-3.5 py-1.5 text-xs sm:text-sm font-medium text-[var(--body-muted)] backdrop-blur-xl shadow-sm">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>10K+ already in flow</span>
              <span className="opacity-40">//</span>
              <span className="text-[var(--heading)]">AI Shorts Studio</span>
            </div>
          </div>

          {/* Heading — word-by-word reveal: 480ms delay, 85ms stagger */}
          <h1 className="mt-5 sm:mt-7 max-w-[20rem] sm:max-w-[36rem] lg:max-w-[50rem] text-3xl sm:text-5xl lg:text-[4.5rem] font-medium leading-[1.08] tracking-[-0.025em] text-[var(--heading)] text-center">
            {headingWords.map((word, i) => (
              <span key={i} className="inline-block whitespace-pre">
                <span
                  className="inline-block transition-all duration-[720ms] ease-[cubic-bezier(0.215,0.61,0.355,1)]"
                  style={{
                    opacity: revealed ? 1 : 0,
                    transform: revealed ? "translateY(0)" : "translateY(26px)",
                    transitionDelay: `${480 + i * 85}ms`,
                  }}
                >
                  {word}
                </span>{" "}
              </span>
            ))}
          </h1>

          {/* Sub-line — word-by-word reveal: 1150ms delay, 22ms stagger */}
          <p className="mt-4 sm:mt-5 max-w-[20rem] sm:max-w-[36rem] lg:max-w-none text-base sm:text-lg lg:text-xl font-normal leading-relaxed text-[var(--body-muted)] text-center">
            {sublineWords.map((word, i) => (
              <span key={i} className="inline-block whitespace-pre">
                <span
                  className="inline-block transition-all duration-[600ms] ease-[cubic-bezier(0.215,0.61,0.355,1)]"
                  style={{
                    opacity: revealed ? 1 : 0,
                    transform: revealed ? "translateY(0)" : "translateY(14px)",
                    transitionDelay: `${1150 + i * 22}ms`,
                  }}
                >
                  {word}
                </span>{" "}
              </span>
            ))}
          </p>

          {/* Unified Generator Prompt Bar — 1450ms delay */}
          <div
            className="mt-8 sm:mt-10 flex flex-col items-center w-full max-w-[42rem] transition-all duration-700 ease-[cubic-bezier(0.2,0,0,1)] space-y-4"
            style={{
              opacity: revealed ? 1 : 0,
              transform: revealed ? "translateY(0)" : "translateY(1.25rem)",
              transitionDelay: "1450ms",
            }}
          >
            {/* The Main Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGenerate();
              }}
              className="w-full"
            >
              <div className="flex items-center h-14 sm:h-16 rounded-full border border-[var(--glass-border)] bg-[var(--glass-fill)] backdrop-blur-xl shadow-2xl pl-5 pr-1.5 sm:pl-6 sm:pr-2 focus-within:border-cyan-400/50 focus-within:ring-2 focus-within:ring-cyan-400/20 transition-all">
                <input
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="Enter video topic to generate 9:16 short, or email for waitlist..."
                  aria-label="Enter video topic or email"
                  className="flex-1 min-w-0 h-full bg-transparent border-none outline-none text-[var(--heading)] placeholder-[var(--body-muted)]/70 text-sm sm:text-base font-normal"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-pill-white text-xs sm:text-sm font-medium h-10 sm:h-12 px-4 sm:px-6 cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <span>{loading ? "Synthesizing..." : promptInput.includes("@") ? "Join Waitlist" : "Generate Short"}</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-80" />
                </button>
              </div>
            </form>

            {/* Style Pills & Quick Controls */}
            <div className="flex flex-wrap items-center justify-between w-full px-2 gap-2 text-xs">
              {/* Style selector pills */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[var(--body-muted)] uppercase tracking-wider font-mono mr-1">
                  Style:
                </span>
                {STYLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedStyle(opt.id)}
                    className={`px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${
                      selectedStyle === opt.id
                        ? "bg-white text-[#04050c] font-medium shadow-[0_0_12px_rgba(255,255,255,0.3)]"
                        : "bg-white/5 border border-white/10 text-[var(--body-muted)] hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Audio & Settings Toggle */}
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[var(--body-muted)] hover:text-white transition-all cursor-pointer text-xs"
              >
                <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
                <span>Audio & Voice</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Collapsible Advanced Settings (Voice / Music / Subtitles) */}
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full overflow-hidden"
                >
                  <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 text-xs">
                    {/* Voice Selection */}
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-[var(--body-muted)]">Voice:</span>
                      <select
                        value={selectedVoice.id}
                        onChange={(e) => {
                          const v = PRESET_VOICES.find((voice) => voice.id === e.target.value);
                          if (v) setSelectedVoice(v);
                        }}
                        className="bg-black/60 border border-white/15 rounded-lg px-2.5 py-1 text-white text-xs outline-none cursor-pointer"
                      >
                        {PRESET_VOICES.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name} ({v.lang})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Ambient Music */}
                    <div className="flex items-center gap-2">
                      <Music className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-[var(--body-muted)]">Music:</span>
                      <button
                        type="button"
                        onClick={() => setEnableMusic(!enableMusic)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer ${
                          enableMusic ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "bg-white/5 text-white/40"
                        }`}
                      >
                        {enableMusic ? "ON" : "OFF"}
                      </button>
                      {enableMusic && (
                        <select
                          value={musicMood}
                          onChange={(e) =>
                            setMusicMood(e.target.value as "cinematic" | "chill" | "cyberpunk")
                          }
                          className="bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-white text-xs outline-none cursor-pointer"
                        >
                          <option value="cinematic">Cinematic Drone</option>
                          <option value="chill">Chill Lofi</option>
                          <option value="cyberpunk">Cyberpunk Synth</option>
                        </select>
                      )}
                    </div>

                    {/* Subtitle Style */}
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--body-muted)]">Captions:</span>
                      <select
                        value={captionStyle}
                        onChange={(e) =>
                          setCaptionStyle(
                            e.target.value as "neon-cyan" | "tiktok-yellow" | "pure-white"
                          )
                        }
                        className="bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-white text-xs outline-none cursor-pointer"
                      >
                        <option value="neon-cyan">Neon Cyan</option>
                        <option value="tiktok-yellow">TikTok Yellow</option>
                        <option value="pure-white">Pure White</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Inspiration Archetype Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="text-[11px] text-[var(--body-muted)]/70 uppercase tracking-wider font-mono">
                Try:
              </span>
              {ARCHETYPES.map((arch) => (
                <button
                  key={arch.label}
                  type="button"
                  onClick={() => handleArchetypeClick(arch)}
                  className="px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/10 text-white/80 hover:text-white transition-all text-xs cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                  <span>{arch.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Submitted Waitlist Toast */}
          {submittedMessage && (
            <div className="mt-4 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 text-xs font-medium animate-fadeIn">
              {submittedMessage}
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mt-4 px-4 py-2.5 rounded-2xl bg-red-950/60 border border-red-800/60 text-red-200 text-xs flex items-center gap-2 backdrop-blur-xl">
              <span className="font-semibold text-white">Alert:</span> {error}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* VIDEO STAGE WORKSPACE (SMOOTH IN-PAGE PRESENTATION)       */}
      {/* ========================================================= */}
      <div ref={stageRef} className="w-full max-w-7xl px-4 sm:px-8 pb-28 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {loading ? (
            /* Minimalist Generation State */
            <motion.div
              key="loading-stage"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md mx-auto aspect-[9/14] rounded-3xl bg-white/[0.04] border border-cyan-400/30 p-8 flex flex-col items-center justify-center text-center backdrop-blur-2xl shadow-2xl space-y-6"
            >
              <div className="relative">
                <div className="size-20 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin flex items-center justify-center">
                  <Sparkles className="size-8 text-cyan-400 animate-pulse" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium text-[var(--heading)] tracking-tight">
                  Composing 9:16 Short
                </h3>
                <p className="text-xs text-cyan-300 min-h-[32px] flex items-center justify-center font-medium">
                  {GENERATION_STEPS[currentStepIndex]}
                </p>
              </div>

              {/* Progress checklist */}
              <div className="w-full space-y-2.5 text-left bg-black/40 p-4 rounded-2xl border border-white/10">
                {GENERATION_STEPS.map((step, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2.5 text-xs transition-colors duration-200 ${
                      idx <= currentStepIndex ? "text-white" : "text-[var(--body-muted)]/50"
                    }`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        idx < currentStepIndex
                          ? "text-emerald-400"
                          : idx === currentStepIndex
                          ? "text-cyan-400 animate-pulse"
                          : "text-white/20"
                      }`}
                    />
                    <span className="truncate">{step}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : currentShort ? (
            /* Generated Short Showcase: Focused Two-Column Layout */
            <motion.div
              key="video-stage"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-8 border-t border-white/[0.08]"
            >
              {/* Left Column (Cols 1-7): 9:16 Vertical Video Frame */}
              <div className="lg:col-span-7 flex flex-col items-center">
                <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-white/10 px-2">
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-medium text-white">{currentShort.title}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownload}
                      className="btn-pill-white text-xs h-8 px-3.5 flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export MP4</span>
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        alert("Short link copied!");
                      }}
                      className="inline-flex items-center gap-1 h-8 px-3 rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/20 transition-all text-xs cursor-pointer"
                      title="Copy link"
                    >
                      <Share2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        setCurrentShort(null);
                        setPromptInput("");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="inline-flex items-center gap-1 h-8 px-3 rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/20 transition-all text-xs cursor-pointer"
                      title="Create another short"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>New</span>
                    </button>
                  </div>
                </div>

                <ShortsCanvasRenderer
                  ref={canvasRendererRef}
                  short={currentShort}
                  selectedVoice={selectedVoice}
                  enableMusic={enableMusic}
                  musicMood={musicMood}
                  captionStyle={captionStyle}
                />
              </div>

              {/* Right Column (Cols 8-12): Narrative Storyboard Arc */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10 px-1">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-medium text-white">Story Narrative Arc</span>
                  </div>
                  <span className="text-xs font-mono text-cyan-300">
                    Total: {currentShort.totalDuration}s
                  </span>
                </div>

                <div className="space-y-3">
                  {currentShort.scenes.map((scene, idx) => {
                    const isActive = activeSceneIndex === idx;
                    return (
                      <div
                        key={scene.id}
                        onClick={() => handleSceneClick(idx)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 ${
                          isActive
                            ? "bg-white/10 border-cyan-400 shadow-[0_0_24px_rgba(0,242,254,0.18)]"
                            : "bg-white/[0.03] border-white/10 hover:border-white/20"
                        }`}
                      >
                        {/* Scene Thumbnail */}
                        <div className="aspect-[9/16] w-20 rounded-xl overflow-hidden bg-black shrink-0 relative border border-white/10 shadow-inner">
                          <img
                            src={scene.mediaUrl}
                            alt={`Scene ${scene.order}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-black/80 text-[9px] font-mono text-cyan-300">
                            0{scene.order}
                          </div>
                        </div>

                        {/* Scene Script Copy */}
                        <div className="flex flex-col justify-between flex-1 py-1">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-white">
                                {idx === 0 ? "Hook & Opening" : idx === 1 ? "Narrative Turn" : "Climax & Reveal"}
                              </span>
                              <span className="text-[10px] text-cyan-300 font-mono">
                                {scene.duration}s
                              </span>
                            </div>
                            <p className="text-xs text-[var(--body-muted)] leading-relaxed italic line-clamp-3">
                              "{scene.text}"
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-[var(--body-muted)] font-mono">
                            <span>Ken Burns 1.15x Zoom</span>
                            {isActive && <span className="text-cyan-400 font-sans font-medium">Playing Scene</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-xs text-[var(--body-muted)] border-t border-white/5">
        <span>&copy; 2026 Flowstate &mdash; engineered for deep work.</span>
      </footer>
    </div>
  );
};

export default Home;
