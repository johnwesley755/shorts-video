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
} from "lucide-react";
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
    const saved = localStorage.getItem('videoUrl');
    return saved ? saved : null;
  });
  
  const { generateVideo, loading: apiLoading, error: apiError } = useVideoGeneration();
  
  // Load progress and prompt from localStorage
  const [progress, setProgress] = useState(() => {
    const saved = localStorage.getItem('videoProgress');
    return saved ? parseInt(saved) : 0;
  });
  
  const [promptText, setPromptText] = useState(() => {
    const saved = localStorage.getItem('videoPrompt');
    return saved || '';
  });
  
  // Manage loading state with localStorage
  const [loading, setLoading] = useState(() => {
    const saved = localStorage.getItem('videoLoading');
    return saved === 'true';
  });
  
  const [error, setError] = useState<string | null>(() => {
    const saved = localStorage.getItem('videoError');
    return saved || null;
  });
  
  // Force dark theme on mount and keep it that way
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (videoUrl) {
      localStorage.setItem('videoUrl', videoUrl);
    } else {
      localStorage.removeItem('videoUrl');
    }
  }, [videoUrl]);
  
  useEffect(() => {
    localStorage.setItem('videoProgress', progress.toString());
  }, [progress]);
  
  useEffect(() => {
    localStorage.setItem('videoPrompt', promptText);
  }, [promptText]);
  
  useEffect(() => {
    localStorage.setItem('videoLoading', loading.toString());
  }, [loading]);
  
  useEffect(() => {
    if (error) {
      localStorage.setItem('videoError', error);
    } else {
      localStorage.removeItem('videoError');
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

  const handleSubmit = async (text: string) => {
    setProgress(0);
    setPromptText(text);
    setLoading(true);
    setError(null);
    
    try {
      const result = await generateVideo(text);
      if (result) {
        setVideoUrl(result);
        setProgress(100);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
        <div className="flex items-center justify-center mb-8">
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 border-purple-900 bg-transparent hover:bg-purple-900/30 text-gray-300"
                      >
                        <Share2 className="h-4 w-4" />
                        Share
                      </Button>
                      <Button
                        variant="default"
                        className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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
