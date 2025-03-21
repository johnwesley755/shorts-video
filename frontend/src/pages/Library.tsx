import { useEffect, useState } from 'react';
import VideoCard from '../components/video/VideoCard';
import { getVideos } from '../services/videoService';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardContent
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../components/ui/select";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

import { Skeleton } from "../components/ui/skeleton";
import { 
  Library as LibraryIcon, 
  Search, 

  Plus, 
  SortDesc, 
  Grid, 
  List, 
  Video, 
  Clock, 
  
  Sparkles,

  AlertCircle,
  Star
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Video {
  id: string;
  title: string;
  url: string;
  createdAt: string;
}

const Library = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("newest");

  // Force dark theme on mount and keep it that way
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const data = await getVideos();
        setVideos(data);
      } catch (err) {
        setError("Failed to load videos");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  // Filter videos based on search term
  const filteredVideos = videos.filter((video) =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort videos based on selected option
  const sortedVideos = [...filteredVideos].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortBy === "title") {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  // Remove the unused formatDate function

  const renderSkeletons = () => {
    return Array(6)
      .fill(0)
      .map((_, index) => (
        <Card
          key={index}
          className="shadow-xl border border-purple-900 backdrop-blur-sm bg-slate-900/80"
        >
          <CardContent className="p-0">
            <Skeleton className="h-[200px] w-full rounded-t-lg bg-purple-900/20" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-6 w-3/4 bg-purple-900/20" />
              <Skeleton className="h-4 w-1/2 bg-purple-900/20" />
            </div>
          </CardContent>
        </Card>
      ));
  };

  return (
    <div className="min-h-screen bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10"></div>

      <div className="container mx-auto px-4 py-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="relative mr-3">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur opacity-70"></div>
                <div className="relative">
                  <LibraryIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                Video Library
              </h1>
            </div>

            <Button
              asChild
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0"
            >
              <Link to="/create" className="flex items-center text-white font-bold">
                <Plus className="mr-2 h-4 w-4" />
                Create New
              </Link>
            </Button>
          </div>

          <Card className="shadow-xl border border-indigo-900 bg-black mb-8">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search videos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-indigo-900/50 text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="flex gap-2">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px] bg-black border-indigo-900/50 text-white">
                      <div className="flex items-center">
                        <SortDesc className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Sort by" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-gradient-to-br from-indigo-900 to-violet-900 border-indigo-900 text-white">
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="title">Title (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex border border-indigo-900/50 rounded-md overflow-hidden">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="icon"
                      onClick={() => setViewMode("grid")}
                      className={
                        viewMode === "grid"
                          ? "bg-purple-900/50 border-0 rounded-none"
                          : "bg-transparent border-0 rounded-none text-gray-400 hover:text-white hover:bg-indigo-900/30"
                      }
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="icon"
                      onClick={() => setViewMode("list")}
                      className={
                        viewMode === "list"
                          ? "bg-purple-900/50 border-0 rounded-none"
                          : "bg-transparent border-0 rounded-none text-gray-400 hover:text-white hover:bg-purple-900/30"
                      }
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs defaultValue="all" className="mb-6">
          <TabsList className="bg-black/20 border border-purple-900/50">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-purple-900"
            >
              All Videos
            </TabsTrigger>
            <TabsTrigger
              value="recent"
              className="data-[state=active]:bg-purple-900"
            >
              Recently Added
            </TabsTrigger>
            <TabsTrigger
              value="favorites"
              className="data-[state=active]:bg-purple-900"
            >
              Favorites
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`grid ${
                  viewMode === "grid"
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                    : "grid-cols-1"
                } gap-6`}
              >
                {renderSkeletons()}
              </motion.div>
            ) : error ? (
              <Card className="shadow-xl border border-red-900 backdrop-blur-sm bg-red-900/20">
                <CardContent className="p-6 flex items-center">
                  <div className="rounded-full bg-red-900/50 p-3 mr-4">
                    <AlertCircle className="h-6 w-6 text-red-300" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-red-300">
                      Error Loading Videos
                    </h3>
                    <p className="text-red-200/70">{error}</p>
                  </div>
                </CardContent>
              </Card>
            ) : sortedVideos.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="bg-purple-900/20 rounded-full p-4 inline-block mb-4">
                  <Video className="h-12 w-12 text-purple-400 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  No videos found
                </h3>
                <p className="text-gray-400 max-w-md mx-auto mb-6">
                  {searchTerm
                    ? "No videos match your search criteria."
                    : "Your library is empty. Create your first AI-powered video!"}
                </p>
                <Button
                  asChild
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0"
                >
                  <Link to="/create" className="flex items-center">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create New Video
                  </Link>
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "space-y-4"
                }
              >
                {sortedVideos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="recent" className="mt-4">
            <Card className="shadow-xl border border-purple-900 backdrop-blur-sm bg-slate-900/80">
              <CardContent className="p-6 text-center">
                <div className="bg-purple-900/20 rounded-full p-4 inline-block mb-4">
                  <Clock className="h-8 w-8 text-purple-400 mx-auto" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Recent Videos
                </h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  This feature will be available soon. Stay tuned for updates!
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites" className="mt-4">
            <Card className="shadow-xl border border-purple-900 backdrop-blur-sm bg-black">
              <CardContent className="p-6 text-center">
                <div className="bg-purple-900/20 rounded-full p-4 inline-block mb-4">
                  <Star className="h-8 w-8 text-purple-400 mx-auto" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Favorites</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  This feature will be available soon. Stay tuned for updates!
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-16"
        >
          <div className="p-4 bg-black rounded-md border border-purple-800/50 max-w-lg mx-auto">
            <div className="flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-purple-400 mr-2" />
              <p className="text-sm text-purple-300">
                Powered by advanced AI technology to create stunning videos from
                text
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Library;