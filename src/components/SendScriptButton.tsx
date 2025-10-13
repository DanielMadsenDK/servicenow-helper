'use client';

import React, { useState } from 'react';
import { Send } from 'lucide-react';

import SendScriptModal from './SendScriptModal';

interface SendScriptButtonProps {
  scriptContent: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function SendScriptButton({ 
  scriptContent, 
  className = '',
  size = 'sm'
}: SendScriptButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSendScript = async (
    type: 'business_rule' | 'script_include' | 'client_script',
    targetTable: 'sys_script' | 'sys_script_include' | 'sys_script_client'
  ) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/send-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          payload: scriptContent,
          type,
          target_table: targetTable
        }),
      });

      const data = await response.json();

      // API returns 201 for successful task creation
      if ((response.status === 201 || response.ok) && data.success) {
        setSuccess(true);
        // Auto-close modal after 2 seconds on success
        setTimeout(() => {
          setIsModalOpen(false);
          setSuccess(false);
        }, 2000);
      } else {
        setError(data.error || 'Failed to send script to ServiceNow');
      }
    } catch (err) {
      console.error('Error sending script:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    if (!isSubmitting) {
      setIsModalOpen(false);
      setError(null);
      setSuccess(false);
    }
  };

  const buttonSizeClasses = {
    sm: 'px-3 py-1.5',
    md: 'px-4 py-2',
    lg: 'px-5 py-3'
  };

  const iconSizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const gapClasses = {
    sm: 'gap-1.5',
    md: 'gap-2',
    lg: 'gap-2.5'
  };

  // Default button styling - can be overridden by className prop
  const defaultButtonClasses = `inline-flex items-center ${gapClasses[size]} ${buttonSizeClasses[size]} bg-white/95 dark:bg-gray-800/95 text-gray-700 dark:text-gray-200 ${textSizeClasses[size]} font-medium rounded-full shadow-sm border border-gray-200/60 dark:border-gray-600/60 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95`;

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={className || defaultButtonClasses}
        title="Send script to ServiceNow"
        disabled={!scriptContent.trim()}
      >
        <Send className={iconSizeClasses[size]} />
        <span className="hidden sm:inline">{size !== 'sm' ? 'Send to ServiceNow' : 'Send'}</span>
      </button>

      <SendScriptModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSend={handleSendScript}
        isSubmitting={isSubmitting}
        error={error}
        success={success}
      />
    </>
  );
}