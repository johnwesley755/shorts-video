import { useState } from 'react';
import VideoForm from '../components/video/VideoForm';
import VideoPlayer from '../components/video/VideoPlayer';
import { useVideoGeneration } from '../hooks/useVideoGeneration';

const Create = () => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const { generateVideo, loading, error } = useVideoGeneration();

  const handleSubmit = async (text: string) => {
    const result = await generateVideo(text);
    if (result) {
      setVideoUrl(result);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Create New Video</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <VideoForm onSubmit={handleSubmit} isLoading={loading} />
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>
        
        <div>
          {loading ? (
            <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Generating your video...</p>
              </div>
            </div>
          ) : videoUrl ? (
            <VideoPlayer src={videoUrl} />
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
              <p className="text-gray-500">Your video will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Create;