import { useState } from 'react';
import Button from '../common/Button';


interface VideoFormProps {
  onSubmit: (text: string) => Promise<void>;
  isLoading: boolean;
}

const VideoForm = ({ onSubmit, isLoading }: VideoFormProps) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-4">
        <label htmlFor="text" className="block text-gray-700 font-medium mb-2">
          Enter your text
        </label>
        <textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={6}
          placeholder="Enter the text you want to convert to video..."
          required
        />
      </div>
      
      <Button type="submit" disabled={isLoading || !text.trim()}>
        {isLoading ? 'Generating...' : 'Generate Video'}
      </Button>
    </form>
  );
};

export default VideoForm;