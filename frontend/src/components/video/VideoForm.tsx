import { useState, useEffect } from 'react';
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import { Sparkles, Video, Wand2 } from "lucide-react";

interface VideoFormProps {
  onSubmit: (text: string) => Promise<void>;
  isLoading: boolean;
}

const VideoForm = ({ onSubmit, isLoading }: VideoFormProps) => {
  // Initialize state from localStorage if available
  const [text, setText] = useState(() => {
    const savedPrompt = localStorage.getItem('videoPrompt');
    return savedPrompt || '';
  });

  // Save prompt to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('videoPrompt', text);
  }, [text]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text);
    }
  };

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardContent className="p-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text" className="text-base flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-blue-600" />
              Enter your creative prompt
            </Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[150px] bg-white/90 dark:bg-gray-900/90 border-blue-200 dark:border-blue-800 focus:border-blue-400 focus:ring-blue-400"
              placeholder="Describe the video you want to create... Be specific and creative!"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
              Try to be descriptive. For example: "A serene mountain lake at sunset with birds flying overhead"
            </p>
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              <Video className="h-4 w-4 mr-1 text-blue-600" />
              <span>AI-powered video generation</span>
            </div>
            
            <Button 
              type="submit" 
              disabled={isLoading || !text.trim()}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold"
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Video
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default VideoForm;