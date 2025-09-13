'use client';

import React from 'react';

import { TYPE_OPTIONS, RequestType } from '@/lib/constants';

interface TypeSelectorProps {
  selectedType: RequestType;
  onTypeChange: (type: RequestType) => void;
  disabled: boolean;
}

export default function TypeSelector({ selectedType, onTypeChange, disabled }: TypeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {TYPE_OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => onTypeChange(value)}
          className={`p-2 sm:p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-center space-x-2 sm:space-x-3 shadow-sm transform ${
            disabled 
              ? 'opacity-60 cursor-not-allowed scale-95' 
              : 'hover:shadow-md hover:scale-102 hover:-translate-y-0.5'
          } ${
            selectedType === value
              ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 shadow-md scale-102'
              : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-400 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
          disabled={disabled}
        >
          <Icon className="h-5 w-5 flex-shrink-0" style={{ width: '20px', height: '20px' }} />
          <span className="font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}

