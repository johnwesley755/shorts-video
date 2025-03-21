import { useState } from 'react';
import VideoPlayer from './VideoPlayer';
import { Card, CardContent, CardFooter } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Calendar, Download, Play } from "lucide-react";
import { motion } from "framer-motion";

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
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-2 border-blue-100 dark:border-blue-900 bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-black">
        <div className="relative">
          {isPlaying ? (
            <VideoPlayer src={video.url} />
          ) : (
            <div 
              className="aspect-video bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-black dark:to-indigo-900/10 flex items-center justify-center cursor-pointer relative overflow-hidden"
              onClick={() => setIsPlaying(true)}
            >
              {/* Decorative elements */}
              <div className="absolute -right-12 -top-12 w-24 h-24 bg-blue-200/50 dark:bg-blue-800/20 rounded-full"></div>
              <div className="absolute -left-12 -bottom-12 w-24 h-24 bg-indigo-200/50 dark:bg-indigo-800/20 rounded-full"></div>
              
              <motion.div 
                className="absolute inset-0 flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
              </motion.div>
              
              <div className="absolute top-2 right-2">
                <Badge variant="outline" className="bg-white/80 dark:bg-gray-900/80">
                  Video
                </Badge>
              </div>
            </div>
          )}
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-1 line-clamp-1">{video.title}</h3>
          <div className="flex items-center text-gray-500 text-sm">
            <Calendar className="h-3 w-3 mr-1" />
            <span>Created on {formattedDate}</span>
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0 flex justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-blue-600 dark:text-blue-400"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="text-white dark:text-gray-400 font-bold"
            asChild
          >
            <a href={video.url} download>
              <Download className="h-3 w-3 mr-1" />
              Download
            </a>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default VideoCard;