// src/api/video.ts
import axios from "axios";

export interface VideoData {
  id: string;
  title: string;
  url: string;
  createdAt: string;
}

const BACKEND_BASE = "https://johnwesley756-shorts-video.hf.space/api";

const getApiUrl = (endpoint: string): string => {
  if (import.meta.env.VITE_API_PROXY_URL) {
    return `${import.meta.env.VITE_API_PROXY_URL}?endpoint=${endpoint}`;
  }
  // In development, query Hugging Face Space backend directly (CORS is preconfigured for localhost:5173)
  if (import.meta.env.DEV) {
    const clean = endpoint.replace(/^\/+/, "");
    return clean === "videos" ? `${BACKEND_BASE}/videos/` : `${BACKEND_BASE}/${clean}`;
  }
  return `/api/proxy?endpoint=${endpoint}`;
};

export const generateVideo = async (
  text: string,
  enableAudio: boolean = true
): Promise<string> => {
  try {
    const response = await axios.post(getApiUrl("videos/generate"), {
      text,
      enableAudio,
    });

    return response.data.videoUrl;
  } catch (error) {
    console.error("Error generating video:", error);
    if (axios.isAxiosError(error) && error.response) {
      const responseData = error.response.data as { error?: string } | undefined;
      throw new Error(responseData?.error || "Failed to generate video");
    }
    throw new Error("Failed to connect to the video generation service");
  }
};

export const getVideos = async (): Promise<VideoData[]> => {
  try {
    const response = await axios.get(getApiUrl("videos"));
    if (!Array.isArray(response.data)) {
      throw new Error("Invalid response from video service: expected an array");
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching videos:", error);
    throw error;
  }
};

export const getVideo = async (id: string): Promise<VideoData> => {
  try {
    const response = await axios.get(getApiUrl(`videos/${id}`));
    return response.data;
  } catch (error) {
    console.error(`Error fetching video ${id}:`, error);
    throw error;
  }
};
