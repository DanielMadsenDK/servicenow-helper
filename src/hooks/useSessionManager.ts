import { useState, useCallback } from 'react';

import { generateSessionId } from '@/lib/session-utils';

export function useSessionManager() {
  const [currentSessionKey, setCurrentSessionKey] = useState<string | null>(null);
  const [continueMode, setContinueMode] = useState(false);

  const generateSessionKey = useCallback(() => {
    return generateSessionId();
  }, []);

  const handleContinueModeChange = useCallback((newContinueMode: boolean) => {
    setContinueMode(newContinueMode);
    if (newContinueMode && !currentSessionKey) {
      setCurrentSessionKey(generateSessionKey());
    } else if (!newContinueMode) {
      setCurrentSessionKey(null);
    }
  }, [currentSessionKey, generateSessionKey]);

  const getSessionKey = useCallback(() => {
    if (continueMode) {
      // Continue mode is ON: reuse existing session key or create one if none exists
      if (currentSessionKey) {
        return currentSessionKey;
      } else {
        const newKey = generateSessionKey();
        setCurrentSessionKey(newKey);
        return newKey;
      }
    } else {
      // Continue mode is OFF: always generate a new session key
      const newKey = generateSessionKey();
      setCurrentSessionKey(newKey);
      return newKey;
    }
  }, [continueMode, currentSessionKey, generateSessionKey]);

  return {
    currentSessionKey,
    continueMode,
    setContinueMode: handleContinueModeChange,
    getSessionKey,
    setCurrentSessionKey
  };
}