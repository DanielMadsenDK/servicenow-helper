'use client';

import React from 'react';

interface ToggleControlsProps {
  continueMode: boolean;
  onContinueModeChange: (value: boolean) => void;
  searchMode: boolean;
  onSearchModeChange: (value: boolean) => void;
  disabled: boolean;
}

interface ToggleProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled: boolean;
  title: string;
  color: 'purple' | 'green' | 'blue';
}

function Toggle({ label, value, onChange, disabled, title, color }: ToggleProps) {
  const colorClasses = {
    purple: {
      active: 'bg-purple-500',
      hover: 'hover:border-purple-300 dark:hover:border-purple-400',
      text: value ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'
    },
    green: {
      active: 'bg-green-500',
      hover: 'hover:border-green-300 dark:hover:border-green-400',
      text: value ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'
    },
    blue: {
      active: 'bg-blue-500',
      hover: 'hover:border-blue-300 dark:hover:border-blue-400',
      text: value ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
    }
  };

  const styles = colorClasses[color];

  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      disabled={disabled}
      title={title}
      className={`flex items-center px-4 py-2 sm:px-6 sm:py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 transition-all duration-200 shadow-sm w-full transform ${
        disabled 
          ? 'opacity-60 cursor-not-allowed scale-95' 
          : `${styles.hover} hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md hover:scale-102 hover:-translate-y-0.5`
      }`}
    >
      {/* Toggle Switch */}
      <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
        value ? styles.active : 'bg-gray-300 dark:bg-gray-600'
      }`}>
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </div>
      <span className={`font-medium transition-colors duration-200 ml-2 sm:ml-3 text-sm sm:text-base ${styles.text}`}>
        {label}
      </span>
    </button>
  );
}

export default function ToggleControls({ 
  continueMode, 
  onContinueModeChange, 
  searchMode, 
  onSearchModeChange, 
  disabled 
}: ToggleControlsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      <Toggle
        label="Continue Session"
        value={continueMode}
        onChange={onContinueModeChange}
        disabled={disabled}
        title="Continue Session maintains context between multiple questions for follow-up conversations"
        color="green"
      />
      
      <Toggle
        label="Search"
        value={searchMode}
        onChange={onSearchModeChange}
        disabled={disabled}
        title="Search Mode enables web searches to find the most current ServiceNow documentation and information"
        color="blue"
      />
    </div>
  );
}