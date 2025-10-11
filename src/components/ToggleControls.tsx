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
      active: 'border-purple-500 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 text-purple-700 dark:text-purple-300 shadow-md',
      inactive: 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-900/20',
      toggle: 'bg-purple-500'
    },
    green: {
      active: 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 shadow-md',
      inactive: 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-green-300 dark:hover:border-green-400 hover:bg-green-50/50 dark:hover:bg-green-900/20',
      toggle: 'bg-green-500'
    },
    blue: {
      active: 'border-blue-500 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-blue-300 shadow-md',
      inactive: 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20',
      toggle: 'bg-blue-500'
    }
  };

  const styles = colorClasses[color];

  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      disabled={disabled}
      title={title}
      className={`
        min-h-[44px] px-4 py-2.5 sm:px-5 sm:py-3
        rounded-full border-2 transition-all duration-200
        flex items-center justify-center gap-3
        font-medium text-sm sm:text-base
        ${disabled
          ? 'opacity-60 cursor-not-allowed'
          : 'hover:shadow-md hover:scale-105 active:scale-95'
        }
        ${value ? styles.active : styles.inactive}
      `}
    >
      {/* Toggle Switch */}
      <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 flex-shrink-0 ${
        value ? styles.toggle : 'bg-gray-300 dark:bg-gray-600'
      }`}>
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </div>
      <span>
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
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
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
