'use client';

import { useSettings } from '../contexts/SettingsContext';

interface UseServiceNowUrlReturn {
  serviceNowUrl: string;
  hasValidUrl: boolean;
  isLoading: boolean;
}

export function useServiceNowUrl(): UseServiceNowUrlReturn {
  const { settings, isLoading } = useSettings();
  
  const serviceNowUrl = settings.servicenow_instance_url;
  const hasValidUrl = Boolean(serviceNowUrl && serviceNowUrl.trim().length > 0);
  
  return {
    serviceNowUrl,
    hasValidUrl,
    isLoading
  };
}