// src/components/video/VideoCard.tsx
import { useState } from "react";
import VideoPlayer from "./VideoPlayer";
import { ShortsCanvasRenderer } from "./ShortsCanvasRenderer";
import { Calendar, Download, Play, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VideoData } from "../../services/videoService";

interface VideoCardProps {
  video: VideoData;
}

export const VideoCard = ({ video }: VideoCardProps) => {
  const [isPlayingModal, setIsPlayingModal] = useState(false);
  const formattedDate = video.createdAt ? new Date(video.createdAt).toLocaleDateString() : "Recent";
  const thumbnail = video.thumbnailUrl || video.shortData?.scenes[0]?.mediaUrl || video.url;

  return (
    <>
      <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
        <div className="overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-fill)] backdrop-blur-xl hover:border-white/30 transition-all shadow-lg flex flex-col justify-between group select-none">
          <div className="relative">
            <div
              className="aspect-[9/16] max-h-72 w-full bg-black/40 flex items-center justify-center cursor-pointer relative overflow-hidden"
              onClick={() => setIsPlayingModal(true)}
            >
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-white/10 via-black to-black" />
              )}

              {/* Play Overlay on Hover */}
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                <div className="size-11 rounded-full bg-white text-[#2f2f33] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="w-4 h-4 ml-0.5 fill-current" />
                </div>
              </div>

              {/* Aspect Ratio Badge */}
              <div className="absolute top-2.5 right-2.5">
                <span className="bg-black/70 backdrop-blur-md border border-white/10 text-white text-[10px] font-sans px-2.5 py-0.5 rounded-full">
                  9:16 VERTICAL
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 space-y-1">
            <h3 className="font-medium text-xs text-[var(--heading)] tracking-tight line-clamp-1">
              {video.title}
            </h3>
            <div className="flex items-center justify-between text-[11px] font-sans text-[var(--body-muted)] pt-1">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 opacity-60" />
                {formattedDate}
              </span>
              <span className="text-cyan-400 font-medium">FLOWSTATE AI</span>
            </div>
          </div>

          <div className="p-3 pt-0 flex justify-between items-center border-t border-white/10 mt-auto bg-black/20">
            <button
              className="text-xs font-sans text-cyan-300 hover:text-white transition-colors cursor-pointer"
              onClick={() => setIsPlayingModal(true)}
            >
              Inspect Short
            </button>

            <a
              href={video.url}
              download={`${video.title.replace(/[^a-z0-9]/gi, "_")}.mp4`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 text-xs font-sans transition-colors"
            >
              <Download className="h-3 w-3" />
              <span>MP4</span>
            </a>
          </div>
        </div>
      </motion.div>

      {/* Fullscreen Video Inspection Modal */}
      <AnimatePresence>
        {isPlayingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-2xl p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm rounded-3xl overflow-hidden border border-white/15 bg-[#04050c] shadow-2xl flex flex-col"
            >
              <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-white/5">
                <h4 className="text-xs font-medium text-white truncate max-w-[220px]">
                  {video.title}
                </h4>
                <button
                  onClick={() => setIsPlayingModal(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 flex justify-center bg-black">
                {video.shortData ? (
                  <ShortsCanvasRenderer short={video.shortData} />
                ) : (
                  <VideoPlayer src={video.url} />
                )}
              </div>

              <div className="p-3.5 border-t border-white/10 flex items-center justify-between text-xs font-sans bg-white/5">
                <span className="text-[var(--body-muted)]">60 FPS Ken Burns Compositor</span>
                <a
                  href={video.url}
                  download
                  className="btn-pill-white text-xs h-7 px-3 flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VideoCard;