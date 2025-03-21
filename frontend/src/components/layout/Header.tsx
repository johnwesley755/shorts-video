import { Link, useLocation } from "react-router-dom";
import { Zap, Video, Library, Home } from "lucide-react";


const Header = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center group">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur opacity-70 group-hover:opacity-100 transition duration-200"></div>
              <div className="relative">
                <Zap className="h-6 w-6 text-white" />
              </div>
            </div>
            <span className="ml-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              AI Shorts
            </span>
          </Link>

          <nav className="flex space-x-2">
            <Link
              to="/"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/")
                  ? "bg-purple-900/50 text-white border border-purple-700/50"
                  : "text-gray-300 hover:text-white hover:bg-purple-900/30"
              }`}
            >
              <Home className="h-4 w-4 mr-1" />
              Home
            </Link>
            <Link
              to="/create"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/create")
                  ? "bg-purple-900/50 text-white border border-purple-700/50"
                  : "text-gray-300 hover:text-white hover:bg-purple-900/30"
              }`}
            >
              <Video className="h-4 w-4 mr-1" />
              Create
            </Link>
            <Link
              to="/library"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/library")
                  ? "bg-purple-900/50 text-white border border-purple-700/50"
                  : "text-gray-300 hover:text-white hover:bg-purple-900/30"
              }`}
            >
              <Library className="h-4 w-4 mr-1" />
              Library
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
