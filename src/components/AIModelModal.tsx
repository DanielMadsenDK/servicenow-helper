'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Save, AlertCircle, DollarSign, Gift, FileText, Image, Headphones } from 'lucide-react';

import { useAIModels } from '@/contexts/AIModelContext';
import type { Capability } from '@/types/index';

interface AIModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AIModelModal({ isOpen, onClose, onSuccess }: AIModelModalProps) {
  const { addModel } = useAIModels();
  const [modelName, setModelName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [selectedCapabilities, setSelectedCapabilities] = useState<number[]>([]);
  const [availableCapabilities, setAvailableCapabilities] = useState<Capability[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingCapabilities, setIsLoadingCapabilities] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens and fetch capabilities
  useEffect(() => {
    if (isOpen) {
      if (inputRef.current) {
        inputRef.current.focus();
      }
      fetchCapabilities();
    }
  }, [isOpen]);

  const fetchCapabilities = async () => {
    setIsLoadingCapabilities(true);
    setError(null);
    
    try {
      const response = await fetch('/api/capabilities', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch capabilities');
      }

      const data = await response.json();
      if (data.success && data.data) {
        setAvailableCapabilities(data.data);
      } else {
        throw new Error(data.error || 'Invalid response format');
      }
    } catch (err) {
      console.error('Failed to fetch capabilities:', err);
      setError('Failed to load capabilities');
    } finally {
      setIsLoadingCapabilities(false);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!modelName.trim()) {
      setError('Model name is required');
      return;
    }

    if (modelName.trim().length > 500) {
      setError('Model name is too long (max 500 characters)');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addModel({
        model_name: modelName.trim(),
        display_name: displayName.trim() || undefined,
        is_free: isFree,
        is_default: false,
        capability_ids: selectedCapabilities
      });
      
      // Reset form
      setModelName('');
      setDisplayName('');
      setIsFree(false);
      setSelectedCapabilities([]);
      setError(null);
      
      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add model';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setModelName('');
    setDisplayName('');
    setIsFree(false);
    setSelectedCapabilities([]);
    setError(null);
    onClose();
  };

  const toggleCapability = (capabilityId: number) => {
    setSelectedCapabilities(prev => 
      prev.includes(capabilityId)
        ? prev.filter(id => id !== capabilityId)
        : [...prev, capabilityId]
    );
  };

  const getCapabilityIcon = (capabilityName: string) => {
    switch (capabilityName) {
      case 'text':
        return FileText;
      case 'images':
        return Image;
      case 'audio':
        return Headphones;
      default:
        return FileText;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Add AI Model
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <span className="text-red-800 dark:text-red-200 text-sm">{error}</span>
            </div>
          )}

          {/* Model Name Input */}
          <div>
            <label htmlFor="modelName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Model Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              id="modelName"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="e.g., anthropic/claude-sonnet-4"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              disabled={isSubmitting}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enter the full model identifier (e.g., anthropic/claude-sonnet-4, gpt-4o)
            </p>
          </div>

          {/* Display Name Input */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Display Name <span className="text-gray-400">(Optional)</span>
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., Claude Sonnet 4"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              disabled={isSubmitting}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              A friendly name to display in the dropdown (falls back to model name if not provided)
            </p>
          </div>

          {/* Free Model Checkbox */}
          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isFree}
                onChange={(e) => setIsFree(e.target.checked)}
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                disabled={isSubmitting}
              />
              <div className="flex items-center space-x-2">
                {isFree ? (
                  <Gift className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <DollarSign className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                )}
                <span className="text-gray-700 dark:text-gray-300 text-sm">
                  Free to use
                </span>
              </div>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-8">
              Check if this model is free to use, uncheck if it costs money
            </p>
          </div>

          {/* Capabilities Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Capabilities <span className="text-gray-400">(Optional)</span>
            </label>
            {isLoadingCapabilities ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full"></div>
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading capabilities...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {availableCapabilities.map((capability) => {
                  const IconComponent = getCapabilityIcon(capability.name);
                  const isSelected = selectedCapabilities.includes(capability.id);
                  
                  return (
                    <label
                      key={capability.id}
                      className="flex items-center space-x-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCapability(capability.id)}
                        className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        disabled={isSubmitting}
                      />
                      <div className={`flex items-center space-x-2 transition-colors ${
                        isSelected 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                      }`}>
                        <IconComponent className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {capability.display_name}
                        </span>
                      </div>
                    </label>
                  );
                })}
                {availableCapabilities.length === 0 && !isLoadingCapabilities && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                    No capabilities available
                  </div>
                )}
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Select the types of content this model can process (text, images, audio)
            </p>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !modelName.trim()}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}