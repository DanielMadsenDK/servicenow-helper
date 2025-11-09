'use client';

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';

import type { UserSettings, SettingsApiResponse } from '../types/index';
import { DEFAULT_VISIBLE_MODES } from '@/lib/constants';

interface SettingsContextType {
  settings: UserSettings;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => Promise<void>;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: UserSettings = {
  welcome_section_visible: true,
  default_search_mode: false,
  default_request_type: 'recommendation',
  servicenow_instance_url: '',
  default_ai_model: 'anthropic/claude-sonnet-4',
  agent_models: {
    orchestration: 'anthropic/claude-sonnet-4',
    business_rule: 'anthropic/claude-sonnet-4',
    client_script: 'anthropic/claude-sonnet-4',
    script_include: 'anthropic/claude-sonnet-4'
  },
  visible_request_types: DEFAULT_VISIBLE_MODES,
  agent_block_display_mode: 'styled', // Default to styled markdown display
  voice_mode_enabled: true, // Voice input enabled by default
  voice_auto_submit: true, // Auto-submit after transcription by default
  voice_auto_send: false // Show confirmation modal by default (safer UX)
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchSettings = useCallback(async (): Promise<UserSettings> => {
    const response = await fetch('/api/settings', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        // User is not authenticated, return defaults without throwing error
        console.log('User not authenticated, using default settings');
        setIsAuthenticated(false);
        return defaultSettings;
      }
      throw new Error('Failed to fetch settings');
    }

    const data: SettingsApiResponse = await response.json();
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Invalid response format');
    }

    setIsAuthenticated(true);
    return data.data;
  }, []);

  const saveSettings = useCallback(async (newSettings: Partial<UserSettings>): Promise<UserSettings> => {
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(newSettings),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      throw new Error('Failed to save settings');
    }

    const data: SettingsApiResponse = await response.json();
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Invalid response format');
    }

    return data.data;
  }, []);

  const updateSetting = useCallback(async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ): Promise<void> => {
    try {
      setError(null);
      const updatedSettings = await saveSettings({ [key]: value });
      setSettings(updatedSettings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update setting';
      setError(errorMessage);
      throw err;
    }
  }, [saveSettings]);

  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>): Promise<void> => {
    try {
      setError(null);
      const updatedSettings = await saveSettings(newSettings);
      setSettings(updatedSettings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
      setError(errorMessage);
      throw err;
    }
  }, [saveSettings]);

  const refreshSettings = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedSettings = await fetchSettings();
      setSettings(fetchedSettings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load settings';
      // Only set error for non-auth issues
      if (!(err instanceof Error && err.message === 'Unauthorized')) {
        setError(errorMessage);
      }
      console.error('Failed to fetch settings:', err);
      // Use default settings if we can't fetch them
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  }, [fetchSettings]);

  // Initialize settings on mount
  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  return (
    <SettingsContext.Provider 
      value={{ 
        settings, 
        isLoading, 
        error, 
        isAuthenticated,
        updateSetting, 
        updateSettings, 
        refreshSettings 
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}