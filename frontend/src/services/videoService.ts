import axios from 'axios';

// Detect if running locally and use appropriate API URL
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isLocalhost
  ? "http://localhost:5000/api"
  : import.meta.env.VITE_API_URL ||
    "https://shorts-video-0mo7.onrender.com/api";

export interface VideoData {
  id: string;
  title: string;
  url: string;
  createdAt: string;
}

// Update the generateVideo function to use the correct API URL
export const generateVideo = async (text: string, enableAudio: boolean = true): Promise<string> => {
  try {
    const response = await axios.post(`${API_URL}/videos/generate`, {
      text,
      enableAudio
    });
    
    return response.data.videoUrl;
  } catch (error) {
    console.error('Error generating video:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Failed to generate video');
    }
    throw new Error('Failed to connect to the video generation service');
  }
};

export const getVideos = async (): Promise<VideoData[]> => {
  try {
    const response = await axios.get(`${API_URL}/videos`);
    return response.data;
  } catch (error) {
    console.error('Error fetching videos:', error);
    throw error;
  }
};

export const getVideo = async (id: string): Promise<VideoData> => {
  try {
    const response = await axios.get(`${API_URL}/videos/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching video ${id}:`, error);
    throw error;
  }
};