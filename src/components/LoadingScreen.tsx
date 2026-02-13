import React from 'react';

const LoadingScreen = () => {
  return (
    <div className="absolute inset-0 z-50 bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

export default LoadingScreen;