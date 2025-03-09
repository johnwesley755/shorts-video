import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-card shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-primary">
            AI Shorts
          </Link>
          
          <nav className="flex space-x-6">
            <Link 
              to="/" 
              className={`${isActive('/') ? 'text-primary font-medium' : 'text-muted-foreground hover:text-primary'}`}
            >
              Home
            </Link>
            <Link 
              to="/create" 
              className={`${isActive('/create') ? 'text-primary font-medium' : 'text-muted-foreground hover:text-primary'}`}
            >
              Create
            </Link>
            <Link 
              to="/library" 
              className={`${isActive('/library') ? 'text-primary font-medium' : 'text-muted-foreground hover:text-primary'}`}
            >
              Library
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;