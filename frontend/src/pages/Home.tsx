import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { motion } from "framer-motion";
import { Sparkles, Plus, Library, ArrowRight, Zap } from "lucide-react";
import { useEffect } from "react";

const Home = () => {
  // Force dark theme on mount
  useEffect(() => {
    // Add dark class to html element
    document.documentElement.classList.add("dark");
    // No cleanup function - we want to keep dark theme
  }, []);

  return (
    <div className="min-h-screen bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10"></div>
      
      {/* Animated background patterns */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated circles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/5 rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Floating particles */}
        <div className="absolute top-20 right-40 w-3 h-3 bg-purple-400/30 rounded-full animate-float"></div>
        <div className="absolute top-40 left-20 w-2 h-2 bg-blue-400/30 rounded-full animate-float" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute bottom-40 right-60 w-4 h-4 bg-indigo-400/30 rounded-full animate-float" style={{ animationDelay: '2.2s' }}></div>
        <div className="absolute bottom-20 left-40 w-3 h-3 bg-violet-400/30 rounded-full animate-float" style={{ animationDelay: '3s' }}></div>
        
        {/* Geometric shapes */}
        <div className="absolute top-1/3 right-1/3 w-64 h-64 border border-purple-500/10 rounded-lg rotate-45 animate-spin-slow"></div>
        <div className="absolute bottom-1/3 left-1/3 w-64 h-64 border border-blue-500/10 rounded-lg -rotate-45 animate-spin-slow" style={{ animationDelay: '2s' }}></div>
        
        {/* Gradient wave */}
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path 
            fill="url(#gradient1)" 
            fillOpacity="0.15" 
            d="M0,192L48,176C96,160,192,128,288,133.3C384,139,480,181,576,186.7C672,192,768,160,864,154.7C960,149,1056,171,1152,165.3C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4338ca" />
              <stop offset="100%" stopColor="#7e22ce" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            {/* Glowing icon */}
            <div className="relative mb-6 mx-auto">
              
              <div className="relative bg-slate-900/50 backdrop-blur-sm p-3 rounded-full inline-block">
                <Zap className="h-10 w-10 text-purple-400" />
              </div>
            </div>
           
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
            <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border border-purple-900 backdrop-blur-sm bg-slate-900/80 overflow-hidden group hover:border-purple-600">
              <CardContent className="p-8 relative">
                <div className="absolute -right-12 -top-12 w-24 h-24 bg-blue-600/10 rounded-full"></div>
                <div className="absolute -left-12 -bottom-12 w-24 h-24 bg-purple-600/10 rounded-full"></div>
                
                {/* Animated border glow on hover */}
                <div className="absolute inset-0 border border-purple-500/0 group-hover:border-purple-500/30 rounded-lg transition-all duration-500"></div>

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
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 text-white font-bold relative overflow-hidden group"
                >
                  <Link
                    to="/create"
                    className="flex items-center justify-center"
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600/0 via-white/10 to-blue-600/0 -translate-x-full group-hover:translate-x-full transition-all duration-700"></span>
                    <Sparkles className="mr-2 h-4 w-4 text-white" />
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4 text-white" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border border-purple-900 backdrop-blur-sm bg-slate-900/80 overflow-hidden group hover:border-blue-600">
              <CardContent className="p-8 relative">
                <div className="absolute -right-12 -top-12 w-24 h-24 bg-purple-600/10 rounded-full"></div>
                <div className="absolute -left-12 -bottom-12 w-24 h-24 bg-blue-600/10 rounded-full"></div>
                
                {/* Animated border glow on hover */}
                <div className="absolute inset-0 border border-blue-500/0 group-hover:border-blue-500/30 rounded-lg transition-all duration-500"></div>

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
                  className="w-full border-purple-700 bg-transparent hover:bg-purple-900/30 text-white relative overflow-hidden group"
                >
                  <Link
                    to="/library"
                    className="flex items-center justify-center"
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-600/0 via-white/5 to-purple-600/0 -translate-x-full group-hover:translate-x-full transition-all duration-700"></span>
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
            <div className="p-4 bg-purple-950/30 rounded-md border border-purple-800/50 max-w-lg mx-auto backdrop-blur-sm">
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
