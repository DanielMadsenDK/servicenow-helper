'use client';

import React from 'react';
import { TYPE_OPTIONS, RequestType, DEFAULT_VISIBLE_MODES } from '@/lib/constants';

interface TypeSelectorProps {
  selectedType: RequestType;
  onTypeChange: (type: RequestType) => void;
  disabled: boolean;
  visibleTypes?: RequestType[];
}

export default function TypeSelector({
  selectedType,
  onTypeChange,
  disabled,
  visibleTypes = DEFAULT_VISIBLE_MODES
}: TypeSelectorProps) {
  // Filter to only show visible types
  const filteredOptions = TYPE_OPTIONS.filter(opt =>
    visibleTypes.includes(opt.value)
  );

  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3" role="radiogroup" aria-label="Request type selection">
      {filteredOptions.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={selectedType === value}
          aria-label={`${label} mode`}
          onClick={() => onTypeChange(value)}
          disabled={disabled}
          className={`
            min-h-[44px] px-4 py-2.5 sm:px-5 sm:py-3
            rounded-full border-2 transition-all duration-200
            flex items-center justify-center gap-2
            font-medium text-sm sm:text-base
            ${disabled
              ? 'opacity-60 cursor-not-allowed'
              : 'hover:shadow-md hover:scale-105 active:scale-95'
            }
            ${selectedType === value
              ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 shadow-md'
              : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-400 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }
          `}
        >
          <Icon className="h-5 w-5 flex-shrink-0" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
