// src/api/video.ts
import axios from "axios";

export interface VideoData {
  id: string;
  title: string;
  url: string;
  createdAt: string;
}

const API_PROXY = import.meta.env.VITE_API_PROXY_URL || "/api/proxy";

export const generateVideo = async (
  text: string,
  enableAudio: boolean = true
): Promise<string> => {
  try {
    const response = await axios.post(`${API_PROXY}?endpoint=videos/generate`, {
      text,
      enableAudio,
    });

    return response.data.videoUrl;
  } catch (error: any) {
    console.error("Error generating video:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || "Failed to generate video");
    }
    throw new Error("Failed to connect to the video generation service");
  }
};

export const getVideos = async (): Promise<VideoData[]> => {
  try {
    const response = await axios.get(`${API_PROXY}?endpoint=videos`);
    return response.data;
  } catch (error) {
    console.error("Error fetching videos:", error);
    throw error;
  }
};

export const getVideo = async (id: string): Promise<VideoData> => {
  try {
    const response = await axios.get(`${API_PROXY}?endpoint=videos/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching video ${id}:`, error);
    throw error;
  }
};
