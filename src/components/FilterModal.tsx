'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Filter, RotateCcw, Check, DollarSign, Gift, Bot } from 'lucide-react';

export interface FilterOptions {
  showFree: boolean;
  showPaid: boolean;
  showMultimodal: boolean;
}

export interface SortOption {
  type: 'alphabetical' | 'dateAdded';
  label: string;
}

export interface FilterSettings {
  filters: FilterOptions;
  sort: SortOption;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (settings: FilterSettings) => void;
  currentSettings: FilterSettings;
}

const SORT_OPTIONS: SortOption[] = [
  { type: 'alphabetical', label: 'Alphabetical (A-Z)' },
  { type: 'dateAdded', label: 'Date Added (Oldest First)' }
];

export default function FilterModal({ isOpen, onClose, onApply, currentSettings }: FilterModalProps) {
  const [filters, setFilters] = useState<FilterOptions>(currentSettings.filters);
  const [sortOption, setSortOption] = useState<SortOption>(currentSettings.sort);
  const modalRef = useRef<HTMLDivElement>(null);

  // Sync local state with current settings when modal opens
  useEffect(() => {
    if (isOpen) {
      setFilters(currentSettings.filters);
      setSortOption(currentSettings.sort);
    }
  }, [isOpen, currentSettings]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleFilterChange = (filterKey: keyof FilterOptions, value: boolean) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const handleSortChange = (option: SortOption) => {
    setSortOption(option);
  };

  const handleApply = () => {
    onApply({
      filters,
      sort: sortOption
    });
    onClose();
  };

  const handleReset = () => {
    const defaultSettings: FilterSettings = {
      filters: {
        showFree: true,
        showPaid: true,
        showMultimodal: true
      },
      sort: SORT_OPTIONS[0]
    };
    setFilters(defaultSettings.filters);
    setSortOption(defaultSettings.sort);
  };

  const hasActiveFilters = () => {
    return !filters.showFree || !filters.showPaid || !filters.showMultimodal;
  };

  const activeFiltersCount = () => {
    let count = 0;
    if (!filters.showFree) count++;
    if (!filters.showPaid) count++;
    if (!filters.showMultimodal) count++;
    return count;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center p-4 z-50 animate-in fade-in-0 duration-200">
      <div
        ref={modalRef}
        className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/10 border border-gray-200/50 dark:border-gray-700/50 w-full max-w-md animate-in slide-in-from-bottom-4 duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Filter & Sort Models
            </h2>
            {hasActiveFilters() && (
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full font-medium">
                {activeFiltersCount()} active
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Filter Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Show Models
            </h3>
            <div className="space-y-3">
              {/* Free Models Filter */}
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.showFree}
                  onChange={(e) => handleFilterChange('showFree', e.target.checked)}
                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <div className="flex items-center space-x-2">
                  <Gift className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    Free Models
                  </span>
                </div>
              </label>

              {/* Paid Models Filter */}
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.showPaid}
                  onChange={(e) => handleFilterChange('showPaid', e.target.checked)}
                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    Paid Models
                  </span>
                </div>
              </label>

              {/* Multimodal Models Filter */}
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.showMultimodal}
                  onChange={(e) => handleFilterChange('showMultimodal', e.target.checked)}
                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <div className="flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    Multimodal Models
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Sort Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Sort By
            </h3>
            <div className="space-y-2">
              {SORT_OPTIONS.map((option) => (
                <label key={option.type} className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="sortOption"
                    checked={sortOption.type === option.type}
                    onChange={() => handleSortChange(option)}
                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 rounded-b-2xl">
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 font-medium"
            title="Reset all filters and sorting"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 active:scale-95 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-full shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 hover:scale-105 active:scale-95 font-medium"
            >
              <Check className="w-4 h-4" />
              <span>Apply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}