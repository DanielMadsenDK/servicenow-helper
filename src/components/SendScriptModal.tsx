'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, AlertCircle, CheckCircle, Code } from 'lucide-react';

interface ScriptType {
  value: 'business_rule' | 'script_include' | 'client_script';
  label: string;
  targetTable: 'sys_script' | 'sys_script_include' | 'sys_script_client';
}

const SCRIPT_TYPES: ScriptType[] = [
  {
    value: 'business_rule',
    label: 'Business Rule',
    targetTable: 'sys_script'
  },
  {
    value: 'script_include',
    label: 'Script Include',
    targetTable: 'sys_script_include'
  },
  {
    value: 'client_script',
    label: 'Client Script',
    targetTable: 'sys_script_client'
  }
];

interface SendScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (type: ScriptType['value'], targetTable: ScriptType['targetTable']) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
}

export default function SendScriptModal({ 
  isOpen, 
  onClose, 
  onSend, 
  isSubmitting, 
  error, 
  success 
}: SendScriptModalProps) {
  const [selectedType, setSelectedType] = useState<ScriptType['value']>('business_rule');
  const modalRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  // Focus select when modal opens
  useEffect(() => {
    if (isOpen && selectRef.current) {
      selectRef.current.focus();
    }
  }, [isOpen]);

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
    
    const selectedScriptType = SCRIPT_TYPES.find(type => type.value === selectedType);
    if (selectedScriptType) {
      await onSend(selectedScriptType.value, selectedScriptType.targetTable);
    }
  };

  const handleCancel = () => {
    setSelectedType('business_rule');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-md my-8 mx-auto"
        style={{ 
          position: 'relative',
          top: 'auto',
          left: 'auto',
          transform: 'none'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Code className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Send Script to ServiceNow
            </h2>
          </div>
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
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4 flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-green-800 dark:text-green-200 text-sm">
                Script sent successfully to ServiceNow!
              </span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <span className="text-red-800 dark:text-red-200 text-sm">{error}</span>
            </div>
          )}

          {/* Script Type Selection */}
          <div>
            <label htmlFor="scriptType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Script Type <span className="text-red-500">*</span>
            </label>
            <select
              ref={selectRef}
              id="scriptType"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as ScriptType['value'])}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              disabled={isSubmitting}
            >
              {SCRIPT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Choose the type of ServiceNow script to create
            </p>
          </div>

          {/* Target Table Info */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Target Table:</span>{' '}
              {SCRIPT_TYPES.find(type => type.value === selectedType)?.targetTable}
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
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send to ServiceNow</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}