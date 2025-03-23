import { Link, useLocation } from "react-router-dom";
import { Zap, Video, Library, Home, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";

const Header = () => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const NavLinks = () => (
    <>
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
    </>
  );

  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center group">
            <div className="relative">
              <div className="absolute -inset-1 bg-black rounded-full blur opacity-70 group-hover:opacity-100 transition duration-200"></div>
              <div className="relative">
                <Zap className="h-6 w-6 text-white" />
              </div>
            </div>
            <span className="ml-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              AI Shorts
            </span>
          </Link>

          {isMobile ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white cursor-pointer">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-black border-purple-900 text-white p-0">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-purple-900/50">
                    <div className="flex items-center">
                      <div className="relative mr-2">
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur opacity-70"></div>
                        <div className="relative">
                          <Zap className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        AI Shorts
                      </span>
                    </div>
                  </div>
                  <nav className="flex flex-col space-y-2 p-4">
                    <NavLinks />
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <nav className="flex space-x-2">
              <NavLinks />
            </nav>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
