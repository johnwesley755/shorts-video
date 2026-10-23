// src/components/video/VideoForm.tsx
import { useState } from "react";
import { Sparkles, SlidersHorizontal, Dice5, Volume2, Music, Type } from "lucide-react";
import { AiVisualArtStyle } from "../../services/aiStoryService";
import { PRESET_VOICES, VoiceOption } from "../../services/voiceService";

export interface VideoFormSubmitOptions {
  style: AiVisualArtStyle;
  voice: VoiceOption;
  enableMusic: boolean;
  musicMood: "cinematic" | "chill" | "cyberpunk";
  captionStyle: "tiktok-yellow" | "neon-cyan" | "pure-white";
}

interface VideoFormProps {
  onSubmit: (text: string, options: VideoFormSubmitOptions) => Promise<void>;
  isLoading: boolean;
  initialPrompt?: string;
}

const INSPIRATION_ARCHETYPES = [
  {
    label: "Cyberpunk Tokyo",
    prompt:
      "A cybernetic detective in rain-slicked Tokyo megacity alleyways with volumetric neon lighting and flying spinners",
    style: "cyberpunk" as AiVisualArtStyle,
  },
  {
    label: "Deep Cosmos",
    prompt:
      "The terrifying silence of supermassive black holes warping spacetime and swallowing stars in the cosmic abyss",
    style: "photoreal" as AiVisualArtStyle,
  },
  {
    label: "Floating Shrines",
    prompt:
      "Ancient floating temple islands high above the clouds where mythical storm dragons dwell in tranquil mist",
    style: "anime" as AiVisualArtStyle,
  },
  {
    label: "Abyssal Sea",
    prompt:
      "Glowing abyssal creatures swimming through the deepest unexplored thermal vents of the Mariana Trench",
    style: "fantasy" as AiVisualArtStyle,
  },
  {
    label: "Inner Citadel",
    prompt:
      "You cannot control the turbulent storm outside, but you can always master the silent fortress within",
    style: "photoreal" as AiVisualArtStyle,
  },
];

const STYLE_OPTIONS: { id: AiVisualArtStyle; label: string }[] = [
  { id: "photoreal", label: "Cinematic" },
  { id: "cyberpunk", label: "Cyberpunk" },
  { id: "anime", label: "Anime" },
  { id: "fantasy", label: "Fantasy" },
];

export const VideoForm = ({
  onSubmit,
  isLoading,
  initialPrompt,
}: VideoFormProps) => {
  const [text, setText] = useState(
    initialPrompt || "A cybernetic samurai in neon rain looking over a futuristic skyline"
  );
  const [style, setStyle] = useState<AiVisualArtStyle>("photoreal");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(PRESET_VOICES[0]);
  const [enableMusic, setEnableMusic] = useState<boolean>(true);
  const [musicMood, setMusicMood] = useState<"cinematic" | "chill" | "cyberpunk">("cinematic");
  const [captionStyle, setCaptionStyle] = useState<"tiktok-yellow" | "neon-cyan" | "pure-white">("neon-cyan");

  const handleArchetypeClick = (archetype: (typeof INSPIRATION_ARCHETYPES)[0]) => {
    setText(archetype.prompt);
    setStyle(archetype.style);
  };

  const handleRandomizePrompt = () => {
    const random =
      INSPIRATION_ARCHETYPES[Math.floor(Math.random() * INSPIRATION_ARCHETYPES.length)];
    handleArchetypeClick(random);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onSubmit(text, {
        style,
        voice: selectedVoice,
        enableMusic,
        musicMood,
        captionStyle,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      {/* 1. Main Frosted Glass Input Container (matches Home page input style) */}
      <div className="rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-fill)] backdrop-blur-2xl p-4 sm:p-5 shadow-2xl space-y-4 focus-within:border-white/30 transition-all">
        {/* Archetype Quick Pills */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
            {INSPIRATION_ARCHETYPES.map((arch) => (
              <button
                key={arch.label}
                type="button"
                onClick={() => handleArchetypeClick(arch)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer border ${
                  text === arch.prompt
                    ? "bg-white text-[#04050c] border-white shadow-sm font-semibold"
                    : "bg-white/5 hover:bg-white/10 border-white/10 text-[var(--body-muted)] hover:text-white"
                }`}
              >
                {arch.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleRandomizePrompt}
            className="hidden sm:inline-flex items-center gap-1 text-xs text-[var(--body-muted)] hover:text-white transition-colors cursor-pointer px-2.5 py-1 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10"
            title="Randomize inspiration prompt"
          >
            <Dice5 className="w-3.5 h-3.5" />
            <span>Random</span>
          </button>
        </div>

        {/* Text Input */}
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe your story or video concept in natural language..."
            rows={2}
            className="w-full bg-transparent border-none outline-none text-base sm:text-lg font-normal text-[var(--heading)] placeholder-[var(--body-muted)]/50 resize-none leading-relaxed"
          />
        </div>

        {/* Bottom Toolbar: Style Selector + Advanced Toggle + Generate CTA */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
          {/* Style Pills */}
          <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-full border border-white/10">
            {STYLE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setStyle(opt.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  style === opt.id
                    ? "bg-white text-[#04050c] font-semibold shadow-sm"
                    : "text-[var(--body-muted)] hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            {/* Advanced Settings Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                showAdvanced
                  ? "bg-white/15 border-white/30 text-white"
                  : "bg-white/5 border-white/10 text-[var(--body-muted)] hover:text-white"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Voice & Subtitles</span>
            </button>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isLoading || !text.trim()}
              className="btn-pill-white text-xs sm:text-sm font-medium h-10 px-5 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-cyan-500" />
              <span>{isLoading ? "Generating..." : "Generate Short"}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Settings */}
        {showAdvanced && (
          <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
            {/* Voice Option */}
            <div className="space-y-1.5">
              <label className="text-[var(--body-muted)] flex items-center gap-1 font-medium">
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Neural Voice</span>
              </label>
              <select
                value={selectedVoice.id}
                onChange={(e) => {
                  const found = PRESET_VOICES.find((v) => v.id === e.target.value);
                  if (found) setSelectedVoice(found);
                }}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
              >
                {PRESET_VOICES.map((v) => (
                  <option key={v.id} value={v.id} className="bg-[#0c0e18]">
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            {/* Subtitle Style */}
            <div className="space-y-1.5">
              <label className="text-[var(--body-muted)] flex items-center gap-1 font-medium">
                <Type className="w-3.5 h-3.5 text-cyan-400" />
                <span>Subtitle Style</span>
              </label>
              <select
                value={captionStyle}
                onChange={(e) =>
                  setCaptionStyle(e.target.value as "neon-cyan" | "tiktok-yellow" | "pure-white")
                }
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
              >
                <option value="neon-cyan" className="bg-[#0c0e18]">Neon Cyan Glow</option>
                <option value="tiktok-yellow" className="bg-[#0c0e18]">TikTok Yellow</option>
                <option value="pure-white" className="bg-[#0c0e18]">Minimal White</option>
              </select>
            </div>

            {/* Ambient Music */}
            <div className="space-y-1.5">
              <label className="text-[var(--body-muted)] flex items-center gap-1 font-medium">
                <Music className="w-3.5 h-3.5 text-cyan-400" />
                <span>Ambient Soundbed</span>
              </label>
              <select
                value={enableMusic ? musicMood : "off"}
                onChange={(e) => {
                  if (e.target.value === "off") {
                    setEnableMusic(false);
                  } else {
                    setEnableMusic(true);
                    setMusicMood(e.target.value as "cinematic" | "chill" | "cyberpunk");
                  }
                }}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
              >
                <option value="cinematic" className="bg-[#0c0e18]">Cinematic Atmosphere</option>
                <option value="chill" className="bg-[#0c0e18]">Chill Lo-Fi</option>
                <option value="cyberpunk" className="bg-[#0c0e18]">Cyberpunk Drone</option>
                <option value="off" className="bg-[#0c0e18]">Mute (No Music)</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </form>
  );
};

export default VideoForm;
