import { useState, useEffect } from "react";
import VideoForm from "../components/video/VideoForm";
import VideoPlayer from "../components/video/VideoPlayer";
import { useVideoGeneration } from "../hooks/useVideoGeneration";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "../components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import {
  AlertCircle,
  Download,
  Sparkles,
  Video,
  Share2,
  Info,
  Lightbulb,
  Zap,
  Facebook,
  Twitter,
  Instagram,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Skeleton } from "../components/ui/skeleton";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../components/ui/hover-card";

const Create = () => {
  // Load state from localStorage on initial render
  const [videoUrl, setVideoUrl] = useState<string | null>(() => {
    const saved = localStorage.getItem("videoUrl");
    return saved ? saved : null;
  });

  const {
    generateVideo,
    loading: apiLoading,
    error: apiError,
  } = useVideoGeneration();

  // Load progress and prompt from localStorage
  const [progress, setProgress] = useState(() => {
    const saved = localStorage.getItem("videoProgress");
    return saved ? parseInt(saved) : 0;
  });

  const [promptText, setPromptText] = useState(() => {
    const saved = localStorage.getItem("videoPrompt");
    return saved || "";
  });

  // Manage loading state with localStorage
  const [loading, setLoading] = useState(() => {
    const saved = localStorage.getItem("videoLoading");
    return saved === "true";
  });

  const [error, setError] = useState<string | null>(() => {
    const saved = localStorage.getItem("videoError");
    return saved || null;
  });

  // Force dark theme on mount and keep it that way
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (videoUrl) {
      localStorage.setItem("videoUrl", videoUrl);
    } else {
      localStorage.removeItem("videoUrl");
    }
  }, [videoUrl]);

  useEffect(() => {
    localStorage.setItem("videoProgress", progress.toString());
  }, [progress]);

  useEffect(() => {
    localStorage.setItem("videoPrompt", promptText);
  }, [promptText]);

  useEffect(() => {
    localStorage.setItem("videoLoading", loading.toString());
  }, [loading]);

  useEffect(() => {
    if (error) {
      localStorage.setItem("videoError", error);
    } else {
      localStorage.removeItem("videoError");
    }
  }, [error]);

  // Sync with API loading state
  useEffect(() => {
    setLoading(apiLoading);
    if (apiError) {
      setError(apiError);
    }
  }, [apiLoading, apiError]);

  // Simulate progress during loading
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (loading) {
      interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + Math.random() * 10;
          return newProgress >= 95 ? 95 : newProgress;
        });
      }, 1000);
    } else if (!loading && progress > 0 && progress < 100) {
      // If we stopped loading but progress isn't complete, reset it
      setProgress(0);
    }

    return () => clearInterval(interval);
  }, [loading, progress]);

  // Add state for audio preference
  const [enableAudio, setEnableAudio] = useState(() => {
    const saved = localStorage.getItem("enableAudio");
    return saved !== "false"; // Default to true
  });

  const handleSubmit = async (text: string, options?: { enableAudio: boolean }) => {
    setProgress(0);
    setPromptText(text);
    setLoading(true);
    setError(null);
    
    // Update audio preference if provided
    if (options?.enableAudio !== undefined) {
      setEnableAudio(options.enableAudio);
    }

    try {
      // Pass enableAudio to the API
      const result = await generateVideo(text, options?.enableAudio ?? enableAudio);
      if (result) {
        setVideoUrl(result);
        setProgress(100);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-purple-900 to-slate-900 py-12 px-4 text-white">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10"></div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto relative z-10"
      >
        <div className="flex items-center justify-center py-8 mb-8">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur opacity-70"></div>
            <div className="relative">
              <Zap className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-center ml-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Create New Video
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card className="shadow-xl border border-purple-900 backdrop-blur-sm bg-slate-900/80">
              <CardHeader className="border-b border-purple-900/30">
                <div className="flex items-center">
                  <Video className="h-5 w-5 mr-2 text-purple-400" />
                  <CardTitle className="text-2xl text-white">
                    Enter Your Prompt
                  </CardTitle>
                </div>
                <CardDescription className="text-gray-400">
                  Describe the video you want to create with AI
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Tabs defaultValue="basic" className="mb-6">
                  <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                    <TabsTrigger
                      value="basic"
                      className="data-[state=active]:bg-purple-900"
                    >
                      Basic
                    </TabsTrigger>
                    <TabsTrigger
                      value="advanced"
                      className="data-[state=active]:bg-purple-900"
                    >
                      Advanced
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="basic" className="mt-4">
                    <VideoForm onSubmit={handleSubmit} isLoading={loading} />
                  </TabsContent>
                  <TabsContent value="advanced" className="mt-4">
                    <div className="p-4 bg-purple-950/50 rounded-md border border-purple-800/50">
                      <div className="flex items-start">
                        <Lightbulb className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
                        <p className="text-sm text-purple-300">
                          Advanced options coming soon! Stay tuned for more
                          customization features.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <VideoForm onSubmit={handleSubmit} isLoading={loading} />
                    </div>
                  </TabsContent>
                </Tabs>

                {loading && (
                  <div className="mt-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-300">
                        Generating video
                      </span>
                      <Badge
                        variant="outline"
                        className="bg-purple-900/30 border-purple-700"
                      >
                        {Math.round(progress)}%
                      </Badge>
                    </div>
                    <Progress
                      value={progress}
                      className="h-2 bg-slate-800 [&>div]:bg-gradient-to-r [&>div]:from-blue-600 [&>div]:to-purple-600"
                    />
                  </div>
                )}

                {error && (
                  <Alert
                    variant="destructive"
                    className="mt-4 bg-red-900/50 border-red-800"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="border-t border-purple-900/30 flex justify-between pt-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-gray-400 border-purple-900 bg-transparent hover:bg-purple-900/30"
                      >
                        <Info className="h-4 w-4 mr-1" />
                        Tips
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-800 border-purple-900 text-white">
                      <p>Be specific with your prompts for better results</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white hover:bg-transparent"
                    >
                      Need help?
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80 bg-slate-800 border-purple-900">
                    <div className="flex justify-between space-x-4">
                      <div>
                        <h4 className="text-sm font-semibold text-white">
                          Prompt Examples
                        </h4>
                        <ul className="text-xs text-gray-400 mt-1 space-y-1">
                          <li>
                            "A serene mountain lake at sunset with birds flying
                            overhead"
                          </li>
                          <li>
                            "Futuristic city with flying cars and neon lights"
                          </li>
                          <li>"Ocean waves crashing on a tropical beach"</li>
                        </ul>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </CardFooter>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Card className="shadow-xl border border-purple-900 h-full backdrop-blur-sm bg-slate-900/80">
              <CardHeader className="border-b border-purple-900/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Video className="h-5 w-5 mr-2 text-purple-400" />
                    <CardTitle className="text-2xl text-white">
                      Preview
                    </CardTitle>
                  </div>
                  {videoUrl && (
                    <Badge className="bg-green-900/50 text-green-300 border-green-700">
                      Ready
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-gray-400">
                  Your generated video will appear here
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center pt-6">
                {loading ? (
                  <div className="w-full flex flex-col items-center justify-center py-12">
                    <div className="space-y-3 w-full">
                      <Skeleton className="h-[300px] w-full rounded-lg bg-purple-900/20" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-3/4 bg-purple-900/20" />
                        <Skeleton className="h-4 w-1/2 bg-purple-900/20" />
                      </div>
                    </div>
                    <div className="mt-6 flex items-center text-purple-400 animate-pulse">
                      <Sparkles className="h-4 w-4 mr-2" />
                      <p>AI is generating your video...</p>
                    </div>
                  </div>
                ) : videoUrl ? (
                  <div className="w-full">
                    <VideoPlayer src={videoUrl} />
                    <div className="mt-4 flex justify-between">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 border-purple-900 bg-transparent hover:bg-purple-900/30 text-gray-300"
                          >
                            <Share2 className="h-4 w-4" />
                            Share
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-slate-800 border-purple-900 text-white">
                          <DropdownMenuItem 
                            className="flex items-center gap-2 cursor-pointer hover:bg-purple-900/30"
                            onClick={() => window.open(`https://wa.me/?text=Check out this AI-generated video: ${window.location.origin}/video?url=${encodeURIComponent(videoUrl || '')}`, '_blank')}
                          >
                            <div className="bg-green-600 p-1 rounded-full">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.6 6.32A8.86 8.86 0 0 0 12.05 4a8.94 8.94 0 0 0-7.64 13.5L4 22l4.59-.39a8.93 8.93 0 0 0 3.46.67 8.94 8.94 0 0 0 8.94-8.94 8.87 8.87 0 0 0-3.39-7.02zm-5.55 13.7a7.43 7.43 0 0 1-3.81-1.05l-.27-.16-2.83.74.76-2.76-.18-.28a7.43 7.43 0 0 1-1.14-3.99 7.44 7.44 0 0 1 7.45-7.45c1.99 0 3.85.77 5.25 2.17a7.4 7.4 0 0 1 2.17 5.28 7.45 7.45 0 0 1-7.4 7.5zm4.1-5.59c-.22-.11-1.32-.65-1.53-.73-.21-.07-.35-.11-.5.11-.15.22-.57.73-.7.88-.13.14-.26.16-.48.05-.22-.11-.94-.35-1.8-1.1-.66-.6-1.11-1.34-1.24-1.57-.13-.22-.01-.34.1-.45.1-.1.22-.26.33-.39.11-.13.15-.22.22-.37.07-.15.04-.28-.02-.39-.06-.11-.5-1.2-.69-1.65-.18-.43-.37-.37-.5-.38h-.42c-.15 0-.39.06-.59.28-.2.22-.78.77-.78 1.87 0 1.1.8 2.17.92 2.32.12.15 1.65 2.53 4.01 3.54.56.24 1 .39 1.34.5.56.18 1.07.15 1.48.09.45-.07 1.38-.56 1.58-1.11.2-.55.2-1.01.14-1.11-.06-.1-.22-.16-.44-.28z"/>
                              </svg>
                            </div>
                            WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="flex items-center gap-2 cursor-pointer hover:bg-purple-900/30"
                            onClick={() => window.open(`https://www.instagram.com/direct/inbox?text=Check out this AI-generated video: ${window.location.origin}/video?url=${encodeURIComponent(videoUrl || '')}`, '_blank')}
                          >
                            <div className="bg-gradient-to-tr from-yellow-500 via-pink-600 to-purple-700 p-1 rounded-full">
                              <Instagram className="h-3 w-3 text-white" />
                            </div>
                            Instagram
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="flex items-center gap-2 cursor-pointer hover:bg-purple-900/30"
                            onClick={() => window.open(`https://twitter.com/intent/tweet?text=Check out this AI-generated video&url=${window.location.origin}/video?url=${encodeURIComponent(videoUrl || '')}`, '_blank')}
                          >
                            <div className="bg-blue-500 p-1 rounded-full">
                              <Twitter className="h-3 w-3 text-white" />
                            </div>
                            Twitter
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="flex items-center gap-2 cursor-pointer hover:bg-purple-900/30"
                            onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.origin}/video?url=${encodeURIComponent(videoUrl || '')}`, '_blank')}
                          >
                            <div className="bg-blue-700 p-1 rounded-full">
                              <Facebook className="h-3 w-3 text-white" />
                            </div>
                            Facebook
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="default"
                        className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold"
                        asChild
                      >
                        <a href={videoUrl} download>
                          <Download className="h-4 w-4" />
                          Download Video
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 w-full text-center p-8">
                    <div className="rounded-full bg-purple-900/30 p-4 mb-4 relative">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur opacity-30"></div>
                      <div className="relative">
                        <Video className="h-12 w-12 text-purple-400" />
                      </div>
                    </div>
                    <p className="text-gray-300">
                      Enter a prompt and generate your video
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Your creation will appear here
                    </p>
                  </div>
                )}
              </CardContent>
              {!loading && !videoUrl && (
                <CardFooter className="border-t border-purple-900/30 pt-4">
                  <div className="w-full p-3 bg-blue-950/30 rounded-md border border-blue-900/50">
                    <div className="flex">
                      <Lightbulb className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0" />
                      <p className="text-xs text-blue-300">
                        For best results, try to be specific in your
                        description. Include details about the scene, lighting,
                        colors, and mood you want to create.
                      </p>
                    </div>
                  </div>
                </CardFooter>
              )}
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Create;
