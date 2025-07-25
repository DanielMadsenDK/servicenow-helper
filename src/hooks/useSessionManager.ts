import { useState, useCallback } from 'react';

export function useSessionManager() {
  const [currentSessionKey, setCurrentSessionKey] = useState<string | null>(null);
  const [continueMode, setContinueMode] = useState(false);

  const generateSessionKey = useCallback(() => {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }, []);

  const handleContinueModeChange = useCallback((newContinueMode: boolean) => {
    setContinueMode(newContinueMode);
    if (newContinueMode && !currentSessionKey) {
      setCurrentSessionKey(generateSessionKey());
    } else if (!newContinueMode) {
      setCurrentSessionKey(null);
    }
  }, [currentSessionKey, generateSessionKey]);

  const getSessionKey = useCallback((isNewRequest: boolean = false) => {
    if (continueMode && currentSessionKey && !isNewRequest) {
      return currentSessionKey;
    } else {
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