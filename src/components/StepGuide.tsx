'use client';

import React, { memo } from 'react';

type StepType = 'navigation' | 'instruction' | 'process' | 'auto';

interface StepGuideProps {
  steps: string[];
  type?: StepType;
  className?: string;
}

const StepGuide = memo(function StepGuide({ steps, type = 'auto', className = '' }: StepGuideProps) {
  // Auto-detect step type based on content
  const detectStepType = (steps: string[]): StepType => {
    if (type !== 'auto') return type;
    
    const content = steps.join(' ').toLowerCase();
    
    // Navigation patterns
    if (content.includes('system') || content.includes('menu') || content.includes('admin') || 
        content.includes('configuration') || content.includes('settings') || content.includes('navigate') ||
        content.includes('go to') || content.includes('click') || content.includes('select')) {
      return 'navigation';
    }
    
    // Process patterns
    if (content.includes('draft') || content.includes('approved') || content.includes('published') ||
        content.includes('pending') || content.includes('complete') || content.includes('review') ||
        content.includes('status') || content.includes('stage') || content.includes('workflow')) {
      return 'process';
    }
    
    // Default to instruction
    return 'instruction';
  };

  const actualType = detectStepType(steps);

  const getStepStyling = (index: number, total: number) => {
    const progress = index / Math.max(total - 1, 1);
    
    switch (actualType) {
      case 'navigation':
        return {
          card: 'from-slate-50 to-slate-100 border-slate-300 text-slate-700 hover:from-slate-100 hover:to-slate-200',
          connector: 'bg-slate-400',
          arrow: 'border-t-slate-400',
          badge: 'bg-slate-500 text-white'
        };
      
      case 'process':
        if (progress <= 0.33) return {
          card: 'from-amber-50 to-amber-100 border-amber-300 text-amber-800 hover:from-amber-100 hover:to-amber-200',
          connector: 'bg-amber-400',
          arrow: 'border-t-amber-400',
          badge: 'bg-amber-500 text-white'
        };
        if (progress <= 0.66) return {
          card: 'from-blue-50 to-blue-100 border-blue-300 text-blue-800 hover:from-blue-100 hover:to-blue-200',
          connector: 'bg-blue-400',
          arrow: 'border-t-blue-400',
          badge: 'bg-blue-500 text-white'
        };
        return {
          card: 'from-green-50 to-green-100 border-green-300 text-green-800 hover:from-green-100 hover:to-green-200',
          connector: 'bg-green-400',
          arrow: 'border-t-green-400',
          badge: 'bg-green-500 text-white'
        };
      
      default: // instruction
        if (progress <= 0.33) return {
          card: 'from-blue-50 to-blue-100 border-blue-300 text-blue-800 hover:from-blue-100 hover:to-blue-200',
          connector: 'bg-blue-400',
          arrow: 'border-t-blue-400',
          badge: 'bg-blue-500 text-white'
        };
        if (progress <= 0.66) return {
          card: 'from-indigo-50 to-indigo-100 border-indigo-300 text-indigo-800 hover:from-indigo-100 hover:to-indigo-200',
          connector: 'bg-indigo-400',
          arrow: 'border-t-indigo-400',
          badge: 'bg-indigo-500 text-white'
        };
        return {
          card: 'from-purple-50 to-purple-100 border-purple-300 text-purple-800 hover:from-purple-100 hover:to-purple-200',
          connector: 'bg-purple-400',
          arrow: 'border-t-purple-400',
          badge: 'bg-purple-500 text-white'
        };
    }
  };

  const showNumbers = actualType === 'instruction';

  return (
    <div className={`my-8 ${className}`} role="navigation" aria-label={`${actualType} steps`}>
      {/* Vertical Layout for All Screen Sizes */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const styling = getStepStyling(index, steps.length);
          
          return (
            <div key={index} className="relative">
              {/* Step Card */}
              <div
                className={`
                  relative px-4 py-3 rounded-lg border-2 shadow-sm transition-all duration-300
                  hover:shadow-md hover:scale-[1.02] cursor-default
                  bg-gradient-to-br ${styling.card}
                `}
              >
                {/* Step Number Badge (only for instructions) */}
                {showNumbers && (
                  <div className={`absolute -top-2 -left-2 w-6 h-6 ${styling.badge} border-2 border-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm`}>
                    {index + 1}
                  </div>
                )}
                
                {/* Step Content */}
                <div>
                  <span className="text-sm font-medium leading-tight block">
                    {step.trim()}
                  </span>
                </div>
              </div>

              {/* Vertical Connector with Arrow */}
              {index < steps.length - 1 && (
                <div className="flex justify-center py-2">
                  <div className="flex flex-col items-center">
                    <div className={`w-0.5 h-4 ${styling.connector}`}></div>
                    {/* Arrow head pointing down */}
                    <div className={`w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent ${styling.arrow}`}></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default StepGuide;

// Utility function to parse arrow-separated steps from text
export function parseStepSequence(text: string): string[] | null {
  // Clean the text and check for arrows
  const cleanText = text.trim();
  
  // Check if text contains arrows (both regular and special arrow characters)
  if (!cleanText.includes('→') && !cleanText.includes('->')) {
    return null;
  }
  
  // Split by arrows and clean up each step
  const steps = cleanText
    .split(/\s*(?:→|->)\s*/)
    .map(step => step.trim())
    .filter(step => step.length > 0);
  
  // Return null if we don't have at least 2 steps
  return steps.length >= 2 ? steps : null;
}