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
      className={`
        group relative w-full overflow-hidden
        rounded-full font-semibold
        min-h-[56px] px-6 py-4 sm:px-8 sm:py-5
        transition-all duration-200
        flex items-center justify-center gap-3
        text-base sm:text-lg
        ${
          isLoading
            ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 hover:scale-105 active:scale-95'
            : hasQuestion
            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 active:scale-95'
            : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-60'
        }
        text-white
      `}
    >
      {/* Animated background glow */}
      {(isLoading || hasQuestion) && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
      )}

      <div className="relative z-10 flex items-center gap-3">
        {isLoading ? (
          <>
            <X className="h-6 w-6 flex-shrink-0" />
            <span className="font-bold">Stop Processing</span>
          </>
        ) : (
          <>
            <Bot className="h-6 w-6 flex-shrink-0" />
            <span className="font-bold">Get Help</span>
          </>
        )}
      </div>
    </button>
  );
}
