'use client';

import React from 'react';
import { Bot, X } from 'lucide-react';

interface SubmitButtonProps {
  isLoading: boolean;
  hasQuestion: boolean;
  onSubmit: () => void;
  onStop: () => void;
}

export default function SubmitButton({ isLoading, hasQuestion, onSubmit, onStop }: SubmitButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isLoading) {
      e.preventDefault();
      e.stopPropagation();
      onStop();
    } else {
      onSubmit();
    }
  };

  return (
    <button
      type={isLoading ? "button" : "submit"}
      onClick={isLoading ? handleClick : undefined}
      disabled={isLoading ? false : !hasQuestion}
      className={`group relative w-full overflow-hidden rounded-xl font-semibold py-3 px-4 sm:py-4 sm:px-6 transition-all duration-300 flex items-center justify-center space-x-2 transform hover:-translate-y-1 disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed relative z-20 ${
        isLoading 
          ? 'bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 hover:from-orange-600 hover:via-red-600 hover:to-pink-700 shadow-lg hover:shadow-orange-500/25' 
          : hasQuestion
          ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-blue-500/25'
          : 'bg-gradient-to-r from-gray-400 to-gray-500'
      } text-white hover:shadow-2xl`}
    >
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
      <div className="relative z-10 flex items-center space-x-2">
        {isLoading ? (
          <>
            <X className="h-5 w-5" />
            <span>Stop Processing</span>
          </>
        ) : (
          <>
            <Bot className="h-5 w-5" />
            <span>Get Help</span>
          </>
        )}
      </div>
    </button>
  );
}