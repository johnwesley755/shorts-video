interface VideoPlayerProps {
  src: string;
}

const VideoPlayer = ({ src }: VideoPlayerProps) => {
  return (
    <div className="bg-black rounded-lg overflow-hidden">
      <video 
        src={src} 
        controls 
        className="w-full h-auto"
        controlsList="nodownload"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;