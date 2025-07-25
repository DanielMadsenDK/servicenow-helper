import { useEffect, useRef } from 'react';
import { PLACEHOLDER_EXAMPLES, PLACEHOLDER_ROTATION_INTERVAL } from '@/lib/constants';

interface UsePlaceholderRotationProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  question: string;
}

export function usePlaceholderRotation({ textareaRef, question }: UsePlaceholderRotationProps) {
  const currentPlaceholderRef = useRef(0);

  // Rotate placeholder examples every 7 seconds without triggering re-renders
  useEffect(() => {
    const interval = setInterval(() => {
      currentPlaceholderRef.current = (currentPlaceholderRef.current + 1) % PLACEHOLDER_EXAMPLES.length;
      if (textareaRef.current && !question) {
        textareaRef.current.placeholder = PLACEHOLDER_EXAMPLES[currentPlaceholderRef.current];
      }
    }, PLACEHOLDER_ROTATION_INTERVAL);
    
    return () => clearInterval(interval);
  }, [textareaRef, question]);

  // Return the current placeholder for initial setup
  return PLACEHOLDER_EXAMPLES[currentPlaceholderRef.current];
}