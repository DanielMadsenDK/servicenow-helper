'use client';

import { createContext, useContext, ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import type { Provider, ProvidersApiResponse } from '../types/index';

interface ProviderContextType {
  providers: Provider[];
  selectedProvider: Provider | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  setSelectedProvider: (provider: Provider) => void;
  refreshProviders: () => Promise<void>;
  getProviderById: (id: number) => Provider | null;
  clearSelection: () => void;
}

const ProviderContext = createContext<ProviderContextType | undefined>(undefined);

export function ProviderProvider({ children }: { children: ReactNode }) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProviderState] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const isInitializing = useRef(false);

  // Storage keys for persistence
  const STORAGE_KEY = 'selectedProvider';

  const fetchProviders = useCallback(async (): Promise<Provider[]> => {
    const response = await fetch('/api/providers', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        setIsAuthenticated(false);
        return [];
      }
      throw new Error(`Failed to fetch providers: ${response.status} ${response.statusText}`);
    }

    const data: ProvidersApiResponse = await response.json();
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Invalid response format');
    }

    setIsAuthenticated(true);
    return data.data;
  }, []);

  const refreshProviders = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const fetchedProviders = await fetchProviders();
      setProviders(fetchedProviders);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load providers';
      setError(errorMessage);
      console.error('Failed to fetch providers:', err);
      setProviders([]);
      setSelectedProviderState(null);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, [fetchProviders]);

  const setSelectedProvider = useCallback((provider: Provider) => {
    setSelectedProviderState(provider);
    localStorage.setItem(STORAGE_KEY, provider.id.toString());
  }, []);

  const getProviderById = useCallback((id: number): Provider | null => {
    return providers.find(p => p.id === id) || null;
  }, [providers]);

  const clearSelection = useCallback(() => {
    setSelectedProviderState(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Initialize on mount
  useEffect(() => {
    refreshProviders();
  }, []); // Remove dependency on refreshProviders to prevent loops

  // Handle provider selection logic when providers change
  useEffect(() => {
    if (providers.length === 0 || isInitializing.current) return;

    isInitializing.current = true;

    // If no provider is selected, try to restore from localStorage or select first
    if (!selectedProvider) {
      const storedProviderId = localStorage.getItem(STORAGE_KEY);
      if (storedProviderId) {
        const storedProvider = providers.find(p => p.id === parseInt(storedProviderId));
        if (storedProvider && storedProvider.is_active) {
          setSelectedProviderState(storedProvider);
          isInitializing.current = false;
          return;
        }
      }
      // No stored provider or stored provider not found, select first available
      const firstActive = providers.find(p => p.is_active);
      if (firstActive) {
        setSelectedProviderState(firstActive);
        localStorage.setItem(STORAGE_KEY, firstActive.id.toString());
      }
    } else {
      // Validate that selected provider is still available and active
      const currentProvider = providers.find(p => p.id === selectedProvider.id);
      if (!currentProvider || !currentProvider.is_active) {
        // Selected provider is no longer available or inactive, select first available
        const firstActive = providers.find(p => p.is_active);
        if (firstActive) {
          setSelectedProviderState(firstActive);
          localStorage.setItem(STORAGE_KEY, firstActive.id.toString());
        } else {
          setSelectedProviderState(null);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    }

    isInitializing.current = false;
  }, [providers, selectedProvider]); // Add selectedProvider back but use ref to prevent loops

  // Auto-refresh providers every 5 minutes when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      // Call refreshProviders directly without depending on the callback
      fetchProviders().then(fetchedProviders => {
        setProviders(fetchedProviders);
      }).catch(err => {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load providers';
        setError(errorMessage);
        console.error('Failed to fetch providers:', err);
      });
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchProviders]);

  const contextValue: ProviderContextType = {
    providers,
    selectedProvider,
    isLoading,
    error,
    isAuthenticated,
    setSelectedProvider,
    refreshProviders,
    getProviderById,
    clearSelection,
  };

  return (
    <ProviderContext.Provider value={contextValue}>
      {children}
    </ProviderContext.Provider>
  );
}

export function useProviders(): ProviderContextType {
  const context = useContext(ProviderContext);
  if (context === undefined) {
    throw new Error('useProviders must be used within a ProviderProvider');
  }
  return context;
}

export default ProviderContext;