import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <h1 className="text-4xl font-bold mb-6">AI Text to Video Shorts Generator</h1>
      <p className="text-xl mb-8 max-w-2xl">
        Transform your text into engaging short videos with the power of AI.
        Create professional-looking content in minutes!
      </p>
      <div className="flex gap-4">
        <Link 
          to="/create" 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          Create New Video
        </Link>
        <Link 
          to="/library" 
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition-colors"
        >
          View Library
        </Link>
      </div>
    </div>
  );
};

export default Home;