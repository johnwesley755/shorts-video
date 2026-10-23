// src/services/voiceService.ts

export interface VoiceOption {
  id: string;
  name: string;
  gender: "male" | "female";
  lang: string;
  description: string;
  pitch: number;
  rate: number;
}

export interface WordTimestamp {
  word: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
}

export interface NarrationResult {
  text: string;
  audioUrl?: string;
  audioBuffer?: AudioBuffer;
  duration: number; // in seconds
  words: WordTimestamp[];
}

export const PRESET_VOICES: VoiceOption[] = [
  {
    id: "voice-female-1",
    name: "Aria (Narrator)",
    gender: "female",
    lang: "en-US",
    description: "Clear, engaging and natural documentary voice",
    pitch: 1.05,
    rate: 0.95,
  },
  {
    id: "voice-male-1",
    name: "Marcus (Deep & Inspiring)",
    gender: "male",
    lang: "en-US",
    description: "Deep, cinematic and authoritative storyteller",
    pitch: 0.85,
    rate: 0.92,
  },
  {
    id: "voice-male-2",
    name: "Leo (Energetic / Tech)",
    gender: "male",
    lang: "en-US",
    description: "Upbeat, modern and fast-paced Shorts creator",
    pitch: 1.0,
    rate: 1.08,
  },
  {
    id: "voice-female-2",
    name: "Luna (Calm & Stoic)",
    gender: "female",
    lang: "en-GB",
    description: "Thoughtful, atmospheric and soothing tone",
    pitch: 0.95,
    rate: 0.9,
  },
];

/**
 * Splits text into words with calculated timestamps based on syllable weights and reading speeds
 */
export const calculateWordTimestamps = (text: string, totalDuration: number): WordTimestamp[] => {
  const words = text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  if (words.length === 0) return [];

  // Estimate relative duration by word length + punctuation pauses
  const weights = words.map((word) => {
    let weight = Math.max(1, word.length);
    if (/[.!?]$/.test(word)) weight += 3; // sentence boundary pause
    else if (/[,;:]$/.test(word)) weight += 1.5; // clause pause
    return weight;
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let currentTime = 0;

  return words.map((word, i) => {
    const wordDuration = (weights[i] / totalWeight) * totalDuration;
    const start = currentTime;
    const end = currentTime + wordDuration;
    currentTime = end;
    return {
      word: word.replace(/[^\w\s'-]/g, ""),
      startTime: Number(start.toFixed(2)),
      endTime: Number(end.toFixed(2)),
    };
  });
};

/**
 * Estimates natural speech duration in seconds
 */
export const estimateSpeechDuration = (text: string, rate: number = 1.0): number => {
  const wordCount = text.trim().split(/\s+/).length;
  // Average reading rate: ~140 words per minute (2.33 words/sec)
  const baseSeconds = (wordCount / 2.33) / rate;
  // Add small cushion for sentence end punctuation pauses
  const punctuationCount = (text.match(/[.!?]/g) || []).length;
  return Math.max(3, Number((baseSeconds + punctuationCount * 0.4).toFixed(1)));
};

/**
 * Synthesizes speech using the browser Web Speech Synthesis API
 */
export const speakTextWithTimings = (
  text: string,
  voiceOption: VoiceOption,
  onWord?: (currentWordIndex: number, word: string) => void,
  onEnd?: () => void
): { stop: () => void } => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.warn("Web Speech API not supported in this browser");
    return { stop: () => {} };
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.pitch = voiceOption.pitch;
  utterance.rate = voiceOption.rate;

  // Attempt to match system voices
  const availableVoices = window.speechSynthesis.getVoices();
  const matchedVoice = availableVoices.find(
    (v) =>
      v.lang.startsWith(voiceOption.lang.split("-")[0]) &&
      ((voiceOption.gender === "female" && /female|girl|zira|samantha|karen|victoria/i.test(v.name)) ||
        (voiceOption.gender === "male" && /male|david|alex|george|daniel|guy/i.test(v.name)))
  ) || availableVoices.find((v) => v.lang.startsWith("en"));

  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  const words = text.trim().split(/\s+/);
  let wordIndex = 0;

  utterance.onboundary = (e) => {
    if (e.name === "word") {
      if (onWord && wordIndex < words.length) {
        onWord(wordIndex, words[wordIndex]);
        wordIndex++;
      }
    }
  };

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    console.error("SpeechSynthesis error:", e);
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);

  return {
    stop: () => {
      window.speechSynthesis.cancel();
    },
  };
};

/**
 * Synthesizes an ambient background music track using Web Audio API (100% free, zero external asset dependency)
 */
export const createAmbientAudioBuffer = (
  ctx: AudioContext,
  durationSec: number,
  mood: "cinematic" | "chill" | "cyberpunk" = "cinematic"
): AudioBuffer => {
  const sampleRate = ctx.sampleRate;
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = ctx.createBuffer(2, numSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  // Root frequencies based on mood
  const rootFreqs = mood === "cyberpunk" ? [55, 110, 164.8, 220] : mood === "chill" ? [65.4, 130.8, 196.0, 261.6] : [73.4, 146.8, 220.0, 293.7]; // D minor cinematic

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Ambient pad synth layers with gentle low-frequency oscillation (LFO)
    const lfo = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.2 * t);
    let sample = 0;

    for (let f = 0; f < rootFreqs.length; f++) {
      const freq = rootFreqs[f];
      sample += Math.sin(2 * Math.PI * freq * t) * (0.04 / (f + 1));
      sample += Math.sin(2 * Math.PI * (freq * 1.5) * t) * (0.02 / (f + 1));
    }

    // Apply envelope: gentle fade in & fade out
    const fadeIn = Math.min(1, t / 1.5);
    const fadeOut = Math.min(1, (durationSec - t) / 2.0);
    const envelope = fadeIn * fadeOut * lfo;

    left[i] = sample * envelope;
    right[i] = sample * envelope * 0.95; // Slight stereo widening
  }

  return buffer;
};
