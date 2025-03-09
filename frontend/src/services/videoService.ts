import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export interface VideoData {
  id: string;
  title: string;
  url: string;
  createdAt: string;
}

export const generateVideo = async (text: string): Promise<string> => {
  try {
    const response = await axios.post(`${API_URL}/videos/generate`, { text });
    return response.data.videoUrl;
  } catch (error) {
    console.error('Error generating video:', error);
    throw error;
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