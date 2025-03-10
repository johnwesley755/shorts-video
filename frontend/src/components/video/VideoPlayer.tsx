interface VideoPlayerProps {
  src: string;
}

const VideoPlayer = ({ src }: VideoPlayerProps) => {
  return (
    <div className="bg-gradient-to-b from-gray-900 to-black rounded-lg overflow-hidden shadow-xl">
      <div className="p-2">
        <video 
          src={src} 
          controls 
          className="w-full h-auto rounded-md"
          controlsList="download"
          poster="/video-placeholder.png"
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
      </div>
      <div className="px-4 py-3 flex justify-between items-center">
        <div className="text-white text-sm font-medium">Generated Video</div>
        <a 
          href={src} 
          download="generated-video.mp4"
          className="text-blue-400 hover:text-blue-300 text-sm flex items-center transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </a>
      </div>
    </div>
  );
};

export default VideoPlayer;