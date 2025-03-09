import { useState } from 'react';
import VideoPlayer from './VideoPlayer';

interface Video {
  id: string;
  title: string;
  url: string;
  createdAt: string;
}

interface VideoCardProps {
  video: Video;
}

const VideoCard = ({ video }: VideoCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  const formattedDate = new Date(video.createdAt).toLocaleDateString();
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="relative">
        {isPlaying ? (
          <VideoPlayer src={video.url} />
        ) : (
          <div 
            className="aspect-video bg-gray-200 flex items-center justify-center cursor-pointer"
            onClick={() => setIsPlaying(true)}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1">{video.title}</h3>
        <p className="text-gray-500 text-sm">Created on {formattedDate}</p>
      </div>
    </div>
  );
};

export default VideoCard;