import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { motion } from "framer-motion";
import { Sparkles, Plus, Library, ArrowRight } from "lucide-react";
import { useEffect } from "react";

const Home = () => {
  // Force dark theme on mount
  useEffect(() => {
    // Add dark class to html element
    document.documentElement.classList.add("dark");
    // No cleanup function - we want to keep dark theme
  }, []);

  return (
    <div className="min-h-screen bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10"></div>

      <div className="container mx-auto px-4 py-24 relative z-10">
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
           
            <h1 className="relative text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              AI Text to Video Shorts Generator
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <p className="text-xl mb-10 max-w-2xl text-gray-300">
              Transform your text into engaging short videos with the power of
              AI. Create professional-looking content in minutes!
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl"
          >
            <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border border-purple-900 backdrop-blur-sm bg-slate-900/80 overflow-hidden group">
              <CardContent className="p-8 relative">
                <div className="absolute -right-12 -top-12 w-24 h-24 bg-blue-600/10 rounded-full"></div>
                <div className="absolute -left-12 -bottom-12 w-24 h-24 bg-purple-600/10 rounded-full"></div>

                <div className="mb-6 text-purple-400 relative">
                  
                  <div className="relative bg-slate-900 rounded-full p-3 inline-block">
                    <Plus className="h-8 w-8" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold mb-3 text-white">
                  Create New Video
                </h2>
                <p className="text-gray-300 mb-6">
                  Generate a new AI-powered video from your text prompt.
                </p>

                <Button
                  asChild
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 text-white font-bold"
                >
                  <Link
                    to="/create"
                    className="flex items-center justify-center"
                  >
                    <Sparkles className="mr-2 h-4 w-4 text-white" />
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4 text-white" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border border-purple-900 backdrop-blur-sm bg-slate-900/80 overflow-hidden group">
              <CardContent className="p-8 relative">
                <div className="absolute -right-12 -top-12 w-24 h-24 bg-purple-600/10 rounded-full"></div>
                <div className="absolute -left-12 -bottom-12 w-24 h-24 bg-blue-600/10 rounded-full"></div>

                <div className="mb-6 text-blue-400 relative">
                  
                  <div className="relative bg-slate-900 rounded-full p-3 inline-block">
                    <Library className="h-8 w-8" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold mb-3 text-white">
                  View Library
                </h2>
                <p className="text-gray-300 mb-6">
                  Browse and manage your previously generated videos.
                </p>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full border-purple-700 bg-transparent hover:bg-purple-900/30 text-white"
                >
                  <Link
                    to="/library"
                    className="flex items-center justify-center"
                  >
                    <Library className="mr-2 h-4 w-4" />
                    View Library
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-16"
          >
            <div className="p-4 bg-purple-950/30 rounded-md border border-purple-800/50 max-w-lg mx-auto">
              <div className="flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-purple-400 mr-2" />
                <p className="text-sm text-purple-300">
                  Powered by advanced AI technology to create stunning videos
                  from text
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Home;
