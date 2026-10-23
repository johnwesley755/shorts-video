// src/services/aiStoryService.ts
import { calculateWordTimestamps, estimateSpeechDuration, WordTimestamp } from "./voiceService";

export type AiVisualArtStyle = "photoreal" | "cyberpunk" | "anime" | "fantasy";

export interface StoryScene {
  id: string;
  order: number;
  text: string;
  visualPrompt: string;
  mediaUrl: string;
  mediaType: "image";
  duration: number; // in seconds
  words: WordTimestamp[];
}

export interface GeneratedShort {
  id: string;
  title: string;
  prompt: string;
  fullScript: string;
  style: AiVisualArtStyle;
  totalDuration: number;
  scenes: StoryScene[];
  createdAt: string;
  serverVideoUrl?: string;
}

const STYLE_PROMPTS: Record<AiVisualArtStyle, string> = {
  photoreal: "cinematic 35mm photography, 8k, photorealistic, dramatic natural lighting, hyperdetailed, masterpiece",
  cyberpunk: "cyberpunk aesthetic, vibrant neon cyan and magenta highlights, volumetric rain reflections, futuristic megacity, 8k",
  anime: "Studio Ghibli inspired anime artstyle, vibrant lush colors, hand-painted aesthetic, emotive lighting, Makoto Shinkai sky",
  fantasy: "dark fantasy concept art, ethereal golden hour glow, intricate mythical atmosphere, Unreal Engine 5 render, cinematic"
};

/**
 * Splits input text or user prompt into 3-4 structured Shorts narrative scenes
 */
export const decomposeIntoScenes = (
  prompt: string,
  style: AiVisualArtStyle = "photoreal"
): { sceneText: string; visualPrompt: string }[] => {
  const trimmed = prompt.trim();
  const styleModifier = STYLE_PROMPTS[style] || STYLE_PROMPTS.photoreal;
  
  // If user provided a multiline or multi-sentence script, use their sentences
  const rawSentences = trimmed
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  if (rawSentences.length >= 3) {
    return rawSentences.slice(0, 4).map((sentence, index) => ({
      sceneText: sentence,
      visualPrompt: `${sentence}, ${styleModifier}, vertical 9:16 aspect ratio, dramatic shot ${index + 1}, sharp focus, no watermark`,
    }));
  }

  // Otherwise, auto-storyboard into a 3-scene viral Shorts narrative arc: Hook -> Core Reveal -> Climax
  return [
    {
      sceneText: `Did you know? ${trimmed}`,
      visualPrompt: `Dramatic establishing cinematic visual of ${trimmed}, ${styleModifier}, vertical 9:16 aspect ratio, sharp focus`,
    },
    {
      sceneText: `As reality unfolds, the hidden truth behind ${trimmed} is far deeper than anyone expected.`,
      visualPrompt: `Intense close-up cinematic reveal of ${trimmed}, ${styleModifier}, intricate details, vertical 9:16 format`,
    },
    {
      sceneText: `This changes everything we thought we knew about ${trimmed}.`,
      visualPrompt: `Epic wide-angle conclusion visual of ${trimmed}, ${styleModifier}, awe-inspiring composition, vertical 9:16`,
    },
  ];
};

/**
 * Generates an AI image URL via high-performance free serverless pre-trained diffusion model
 */
export const generateAiImageUrl = (visualPrompt: string, seed: number = 42): string => {
  const cleanPrompt = encodeURIComponent(
    `${visualPrompt}, vertical 9:16 aspect ratio, ultra-detailed, photorealistic, no text watermark`
  );
  return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=576&height=1024&seed=${seed}&nologo=true`;
};

/**
 * Orchestrates the full AI Shorts creation pipeline (100% custom generated images, no static stock clips)
 */
export const generateShortsStory = async (
  prompt: string,
  style: AiVisualArtStyle = "photoreal",
  speechRate: number = 1.0
): Promise<GeneratedShort> => {
  const sceneDrafts = decomposeIntoScenes(prompt, style);
  const fullScript = sceneDrafts.map((s) => s.sceneText).join(" ");
  const shortId = `short-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  let accumulatedTime = 0;
  const scenes: StoryScene[] = [];

  for (let i = 0; i < sceneDrafts.length; i++) {
    const draft = sceneDrafts[i];
    const duration = estimateSpeechDuration(draft.sceneText, speechRate);
    const words = calculateWordTimestamps(draft.sceneText, duration);

    // Shift word timestamps by the accumulated time of previous scenes
    const globalWords = words.map((w) => ({
      ...w,
      startTime: Number((w.startTime + accumulatedTime).toFixed(2)),
      endTime: Number((w.endTime + accumulatedTime).toFixed(2)),
    }));

    const mediaUrl = generateAiImageUrl(draft.visualPrompt, 100 * (i + 1) + 42);

    scenes.push({
      id: `scene-${i + 1}`,
      order: i + 1,
      text: draft.sceneText,
      visualPrompt: draft.visualPrompt,
      mediaUrl,
      mediaType: "image",
      duration,
      words: globalWords,
    });

    accumulatedTime += duration;
  }

  const title = prompt.length > 50 ? `${prompt.substring(0, 47)}...` : prompt;

  return {
    id: shortId,
    title,
    prompt,
    fullScript,
    style,
    totalDuration: Number(accumulatedTime.toFixed(1)),
    scenes,
    createdAt: new Date().toISOString(),
  };
};
