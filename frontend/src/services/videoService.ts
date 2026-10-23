// src/services/videoService.ts
import axios from "axios";
import { GeneratedShort, AiVisualArtStyle } from "./aiStoryService";

export interface VideoData {
  id: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
  createdAt: string;
  style?: AiVisualArtStyle;
  shortData?: GeneratedShort;
  scenesCount?: number;
}

export interface BackendGenerateResponse {
  id: string;
  videoUrl: string;
  title: string;
  hasAudio: boolean;
  scenes?: {
    order: number;
    text: string;
    visualPrompt: string;
    imageFilename?: string;
    imageUrl?: string;
  }[];
}

const LOCAL_STORAGE_KEY = "stored_shorts_library";
const LOCAL_BACKEND = "http://localhost:5000/api";
const REMOTE_BACKEND = "https://johnwesley756-shorts-video.hf.space/api";

export const getApiBase = (): string => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.DEV) return LOCAL_BACKEND;
  return REMOTE_BACKEND;
};

export const getApiUrl = (endpoint: string): string => {
  const base = getApiBase();
  const clean = endpoint.replace(/^\/+/, "");
  return clean === "videos" ? `${base}/videos/` : `${base}/${clean}`;
};

/**
 * Retrieves all saved shorts from client-side storage
 */
export const getLocalShorts = (): VideoData[] => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Error reading local shorts library:", err);
    return [];
  }
};

/**
 * Saves a new short to the client-side library
 */
export const saveShortToLibrary = (short: GeneratedShort, serverVideoUrl?: string): VideoData => {
  const item: VideoData = {
    id: short.id,
    title: short.title,
    url: serverVideoUrl || short.scenes[0]?.mediaUrl || "",
    thumbnailUrl: short.scenes[0]?.mediaUrl || "",
    createdAt: short.createdAt,
    style: short.style,
    shortData: short,
    scenesCount: short.scenes.length,
  };

  const existing = getLocalShorts();
  const updated = [item, ...existing.filter((v) => v.id !== short.id)];
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  return item;
};

/**
 * Deletes a short from the library
 */
export const deleteShortFromLibrary = (id: string): void => {
  const existing = getLocalShorts();
  const filtered = existing.filter((v) => v.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
};

/**
 * Calls the backend to synthesize a full AI Short video (.mp4)
 */
export const generateVideo = async (
  text: string,
  enableAudio: boolean = true
): Promise<BackendGenerateResponse> => {
  try {
    const response = await axios.post<BackendGenerateResponse>(
      getApiUrl("videos/generate"),
      {
        text,
        enableAudio,
      },
      { timeout: 120000 } // 2 min timeout for AI video rendering
    );

    return response.data;
  } catch (error) {
    console.warn("Backend video generation error:", error);
    if (axios.isAxiosError(error) && error.response) {
      const responseData = error.response.data as { detail?: string; error?: string } | undefined;
      throw new Error(responseData?.detail || responseData?.error || "Failed to generate video on backend");
    }
    throw new Error("Failed to connect to the video generation backend service");
  }
};

/**
 * Retrieves all videos from both the backend API and client storage
 */
export const getVideos = async (): Promise<VideoData[]> => {
  const localVideos = getLocalShorts();

  try {
    const response = await axios.get(getApiUrl("videos"), { timeout: 4000 });
    if (Array.isArray(response.data)) {
      const remoteVideos: VideoData[] = response.data.map((r) => ({
        id: r.id,
        title: r.title,
        url: r.url,
        thumbnailUrl: r.thumbnailUrl || (r.scenes && r.scenes[0]?.imageUrl) || "",
        createdAt: r.createdAt,
        scenesCount: r.scenesCount || 3,
      }));

      // Merge remote and local videos uniquely by id
      const remoteIds = new Set(remoteVideos.map((v) => v.id));
      const nonDuplicateLocal = localVideos.filter((v) => !remoteIds.has(v.id));
      return [...remoteVideos, ...nonDuplicateLocal];
    }
  } catch (error) {
    console.log("Remote video backend unreachable, returning local shorts library:", error);
  }

  return localVideos;
};

/**
 * Retrieves a single video by ID
 */
export const getVideo = async (id: string): Promise<VideoData> => {
  const local = getLocalShorts().find((v) => v.id === id);
  if (local) return local;

  try {
    const response = await axios.get(getApiUrl(`videos/${id}`));
    return response.data;
  } catch (error) {
    console.error(`Error fetching video ${id}:`, error);
    throw error;
  }
};
