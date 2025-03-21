import { useState } from 'react';
import { generateVideo } from '../services/videoService';

export const useVideoGeneration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateVideoFromText = async (text: string, enableAudio: boolean = true): Promise<string | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const videoUrl = await generateVideo(text, enableAudio);
      return videoUrl;
    } catch (err) {
      setError('Failed to generate video. Please try again.');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    generateVideo: generateVideoFromText,
    loading,
    error
  };
};