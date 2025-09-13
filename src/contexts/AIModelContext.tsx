'use client';

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';

import type { AIModel, AIModelsApiResponse, AIModelApiResponse, AIModelInput } from '../types/index';

interface AIModelContextType {
  models: AIModel[];
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  addModel: (model: AIModelInput) => Promise<void>;
  deleteModel: (modelId: number) => Promise<void>;
  setDefaultModel: (modelId: number) => Promise<void>;
  getDefaultModel: () => AIModel | null;
  refreshModels: () => Promise<void>;
}

const AIModelContext = createContext<AIModelContextType | undefined>(undefined);

export function AIModelProvider({ children }: { children: ReactNode }) {
  const [models, setModels] = useState<AIModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchModels = useCallback(async (): Promise<AIModel[]> => {
    const response = await fetch('/api/ai-models', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        // User is not authenticated, return empty array
        console.log('User not authenticated, no AI models available');
        setIsAuthenticated(false);
        return [];
      }
      throw new Error('Failed to fetch AI models');
    }

    const data: AIModelsApiResponse = await response.json();
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Invalid response format');
    }

    setIsAuthenticated(true);
    return data.data;
  }, []);

  const refreshModels = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedModels = await fetchModels();
      setModels(fetchedModels);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load AI models';
      // Only set error for non-auth issues
      if (!(err instanceof Error && err.message === 'Unauthorized')) {
        setError(errorMessage);
      }
      console.error('Failed to fetch AI models:', err);
      // Use empty array if we can't fetch them
      setModels([]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchModels]);

  const addModel = useCallback(async (model: AIModelInput): Promise<void> => {
    try {
      setError(null);
      const response = await fetch('/api/ai-models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(model),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized');
        }
        if (response.status === 409) {
          throw new Error('Model already exists');
        }
        throw new Error('Failed to add model');
      }

      const data: AIModelApiResponse = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Invalid response format');
      }

      // Refresh models to get the updated list
      await refreshModels();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add model';
      setError(errorMessage);
      throw err;
    }
  }, [refreshModels]);

  const deleteModel = useCallback(async (modelId: number): Promise<void> => {
    try {
      setError(null);
      const response = await fetch(`/api/ai-models/${modelId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized');
        }
        if (response.status === 404) {
          throw new Error('Model not found');
        }
        throw new Error('Failed to delete model');
      }

      // Remove the model from the local state
      setModels(prev => prev.filter(model => model.id !== modelId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete model';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const setDefaultModel = useCallback(async (modelId: number): Promise<void> => {
    try {
      setError(null);
      const response = await fetch(`/api/ai-models/${modelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ is_default: true }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized');
        }
        if (response.status === 404) {
          throw new Error('Model not found');
        }
        throw new Error('Failed to set default model');
      }

      // Refresh models to get the updated default status
      await refreshModels();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set default model';
      setError(errorMessage);
      throw err;
    }
  }, [refreshModels]);

  const getDefaultModel = useCallback((): AIModel | null => {
    return models.find(model => model.is_default) || null;
  }, [models]);

  // Initialize models on mount
  useEffect(() => {
    refreshModels();
  }, [refreshModels]);

  return (
    <AIModelContext.Provider 
      value={{ 
        models, 
        isLoading, 
        error, 
        isAuthenticated,
        addModel,
        deleteModel,
        setDefaultModel,
        getDefaultModel,
        refreshModels
      }}
    >
      {children}
    </AIModelContext.Provider>
  );
}

export function useAIModels(): AIModelContextType {
  const context = useContext(AIModelContext);
  if (context === undefined) {
    throw new Error('useAIModels must be used within an AIModelProvider');
  }
  return context;
}