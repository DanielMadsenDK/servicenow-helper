'use client';

import React, { forwardRef } from 'react';
import { Pen } from 'lucide-react';

interface QuestionInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  disabled: boolean;
  isLoadedFromHistory: boolean;
  onClearHistory: () => void;
}

const QuestionInput = forwardRef<HTMLTextAreaElement, QuestionInputProps>(
  ({ value, onChange, onKeyDown, placeholder, disabled, isLoadedFromHistory, onClearHistory }, ref) => {
    return (
      <div className="relative group">
        <div className="absolute top-3 sm:top-4 left-0 pl-3 sm:pl-4 flex items-start pointer-events-none transition-colors duration-200">
          <Pen className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400" />
        </div>
        <div className="hidden sm:block absolute bottom-2 sm:bottom-3 right-2 sm:right-3 text-xs text-gray-400 dark:text-gray-500 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity duration-200">
          <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">Ctrl</kbd>
          <span className="mx-1">+</span>
          <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">Enter</kbd>
          <span className="ml-1">to submit</span>
        </div>
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            // Clear history indicator when user starts typing a new question
            if (isLoadedFromHistory) {
              onClearHistory();
            }
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          rows={4}
          className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 text-base sm:text-lg border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all resize-vertical min-h-[100px] sm:min-h-[120px] text-gray-900 dark:text-gray-100 dark:bg-gray-700 placeholder:text-gray-500 dark:placeholder:text-gray-400"
          disabled={disabled}
        />
      </div>
    );
  }
);

QuestionInput.displayName = 'QuestionInput';

export default QuestionInput;