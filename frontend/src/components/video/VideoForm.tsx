import { useState, useEffect } from "react";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import { Sparkles, Video, Wand2, Volume2 } from "lucide-react";
import { Switch } from "../ui/switch";

interface VideoFormProps {
  onSubmit: (text: string, options: { enableAudio: boolean }) => Promise<void>;
  isLoading: boolean;
}

const VideoForm = ({ onSubmit, isLoading }: VideoFormProps) => {
  // Initialize state from localStorage if available
  const [text, setText] = useState(() => {
    const savedPrompt = localStorage.getItem("videoPrompt");
    return savedPrompt || "";
  });
  
  // Add state for audio toggle
  const [enableAudio, setEnableAudio] = useState(() => {
    const savedAudioPref = localStorage.getItem("enableAudio");
    return savedAudioPref !== "false"; // Default to true
  });

  // Save prompt to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("videoPrompt", text);
  }, [text]);
  
  // Save audio preference to localStorage
  useEffect(() => {
    localStorage.setItem("enableAudio", String(enableAudio));
  }, [enableAudio]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text, { enableAudio });
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
              Try to be descriptive. For example: "A serene mountain lake at
              sunset with birds flying overhead"
            </p>
          </div>
          
          {/* Audio narration toggle */}
          <div className="flex items-center justify-between bg-white/50 dark:bg-gray-800/50 p-3 rounded-md border border-blue-200 dark:border-blue-900/30">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-blue-600" />
              <Label htmlFor="enable-audio" className="text-sm cursor-pointer">
                Generate audio narration
              </Label>
            </div>
            <Switch
              id="enable-audio"
              checked={enableAudio}
              onCheckedChange={setEnableAudio}
              className="data-[state=checked]:bg-blue-600"
            />
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
