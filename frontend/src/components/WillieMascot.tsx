import React from 'react';

interface WillieMascotProps {
  mood?: 'happy' | 'thinking' | 'concerned' | 'excited';
  message?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const WillieMascot: React.FC<WillieMascotProps> = ({ 
  mood = 'happy', 
  message,
  size = 'medium',
  className = ''
}) => {
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  };

  const getMoodEmoji = () => {
    switch (mood) {
      case 'happy': return '😊';
      case 'thinking': return '🤔';
      case 'concerned': return '😟';
      case 'excited': return '🤩';
      default: return '😊';
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Willie's Avatar - Placeholder for PNG */}
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg border-4 border-green-300 relative`}>
        <span className="text-4xl">🌾</span>
        
        {/* Willie's Hat */}
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-16 h-8 bg-amber-600 rounded-t-full border-2 border-amber-700"></div>
        
        {/* Willie's Face */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl">{getMoodEmoji()}</span>
        </div>
        
        {/* Willie's Overalls */}
        <div className="absolute bottom-0 w-full h-1/3 bg-blue-600 rounded-b-full"></div>
      </div>
      
      {/* Willie's Name */}
      <div className="mt-2 text-center">
        <h3 className="font-bold text-green-800 text-sm">Willie</h3>
        <p className="text-xs text-green-600">Your Farming Buddy</p>
      </div>
      
      {/* Willie's Message */}
      {message && (
        <div className="mt-3 max-w-xs">
          <div className="bg-yellow-100 border-2 border-yellow-300 rounded-lg p-3 relative">
            <div className="absolute -top-2 left-4 w-4 h-4 bg-yellow-100 border-l-2 border-t-2 border-yellow-300 transform rotate-45"></div>
            <p className="text-sm text-gray-800 font-medium">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WillieMascot;
