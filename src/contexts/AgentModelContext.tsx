'use client';

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';

import type { AgentModelsApiResponse, DefaultAgent } from '../types/index';

interface AgentModelContextType {
  agentModels: Record<string, string>;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  updateAgentModel: (agentName: string, modelName: string) => Promise<void>;
  updateAgentModels: (agentModels: Record<string, string>) => Promise<void>;
  getAgentModel: (agentName: string) => string | null;
  getDefaultAgents: () => DefaultAgent[];
  refreshAgentModels: () => Promise<void>;
  hasAgentModel: (agentName: string) => boolean;
}

const defaultAgents: DefaultAgent[] = [
  {
    name: 'orchestration',
    displayName: 'Orchestration Agent',
    description: 'Coordinates overall response and routing between different specialized agents',
    defaultModel: 'anthropic/claude-sonnet-4'
  },
  {
    name: 'planner_large',
    displayName: 'Planner Agent (Large)',
    description: 'For complex tasks requiring deep thought and analysis. Slower and more expensive.',
    defaultModel: 'anthropic/claude-sonnet-4'
  },
  {
    name: 'planner_small',
    displayName: 'Planner Agent (Small)',
    description: 'For well-defined tasks. Faster and more cost-effective.',
    defaultModel: 'anthropic/claude-sonnet-4'
  },
  {
    name: 'coder_large',
    displayName: 'Coder Agent (Large)',
    description: 'For complex tasks requiring deep thought and analysis. Slower and more expensive.',
    defaultModel: 'anthropic/claude-sonnet-4'
  },
  {
    name: 'coder_small',
    displayName: 'Coder Agent (Small)',
    description: 'For well-defined tasks. Faster and more cost-effective.',
    defaultModel: 'anthropic/claude-sonnet-4'
  },
  {
    name: 'architect_large',
    displayName: 'Architect Agent (Large)',
    description: 'For complex tasks requiring deep thought and analysis. Slower and more expensive.',
    defaultModel: 'anthropic/claude-sonnet-4'
  },
  {
    name: 'architect_small',
    displayName: 'Architect Agent (Small)',
    description: 'For well-defined tasks. Faster and more cost-effective.',
    defaultModel: 'anthropic/claude-sonnet-4'
  },
  {
    name: 'process_sme_large',
    displayName: 'Process SME Agent (Large)',
    description: 'For complex tasks requiring deep thought and analysis. Slower and more expensive.',
    defaultModel: 'anthropic/claude-sonnet-4'
  },
  {
    name: 'process_sme_small',
    displayName: 'Process SME Agent (Small)',
    description: 'For well-defined tasks. Faster and more cost-effective.',
    defaultModel: 'anthropic/claude-sonnet-4'
  }
];

const AgentModelContext = createContext<AgentModelContextType | undefined>(undefined);

export function AgentModelProvider({ children }: { children: ReactNode }) {
  const [agentModels, setAgentModels] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const getDefaultAgentModels = useCallback((): Record<string, string> => {
    const models: Record<string, string> = {};
    defaultAgents.forEach(agent => {
      models[agent.name] = agent.defaultModel;
    });
    return models;
  }, []);

  const fetchAgentModels = useCallback(async (): Promise<Record<string, string>> => {
    const response = await fetch('/api/agent-models', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        // User is not authenticated, return defaults without throwing error
        console.log('User not authenticated, using default agent models');
        setIsAuthenticated(false);
        return getDefaultAgentModels();
      }
      throw new Error('Failed to fetch agent models');
    }

    const data: AgentModelsApiResponse = await response.json();
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Invalid response format');
    }

    setIsAuthenticated(true);
    return data.data;
  }, [getDefaultAgentModels]);

  const saveAgentModels = useCallback(async (newAgentModels: Record<string, string>): Promise<Record<string, string>> => {
    const response = await fetch('/api/agent-models', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(newAgentModels),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      throw new Error('Failed to save agent models');
    }

    const data: AgentModelsApiResponse = await response.json();
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Invalid response format');
    }

    return data.data;
  }, []);

  const updateAgentModel = useCallback(async (agentName: string, modelName: string): Promise<void> => {
    try {
      setError(null);
      const updatedAgentModels = await saveAgentModels({ 
        ...agentModels, 
        [agentName]: modelName 
      });
      setAgentModels(updatedAgentModels);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update agent model';
      setError(errorMessage);
      throw err;
    }
  }, [agentModels, saveAgentModels]);

  const updateAgentModels = useCallback(async (newAgentModels: Record<string, string>): Promise<void> => {
    try {
      setError(null);
      const updatedAgentModels = await saveAgentModels(newAgentModels);
      setAgentModels(updatedAgentModels);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update agent models';
      setError(errorMessage);
      throw err;
    }
  }, [saveAgentModels]);

  const getAgentModel = useCallback((agentName: string): string | null => {
    return agentModels[agentName] || null;
  }, [agentModels]);

  const hasAgentModel = useCallback((agentName: string): boolean => {
    return agentName in agentModels;
  }, [agentModels]);

  const getDefaultAgents = useCallback((): DefaultAgent[] => {
    return defaultAgents;
  }, []);

  const refreshAgentModels = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedAgentModels = await fetchAgentModels();
      setAgentModels(fetchedAgentModels);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load agent models';
      // Only set error for non-auth issues
      if (!(err instanceof Error && err.message === 'Unauthorized')) {
        setError(errorMessage);
      }
      console.error('Failed to fetch agent models:', err);
      // Use default agent models if we can't fetch them
      setAgentModels(getDefaultAgentModels());
    } finally {
      setIsLoading(false);
    }
  }, [fetchAgentModels, getDefaultAgentModels]);

  // Initialize agent models on mount
  useEffect(() => {
    refreshAgentModels();
  }, [refreshAgentModels]);

  return (
    <AgentModelContext.Provider 
      value={{ 
        agentModels,
        isLoading, 
        error, 
        isAuthenticated,
        updateAgentModel,
        updateAgentModels,
        getAgentModel,
        getDefaultAgents,
        refreshAgentModels,
        hasAgentModel
      }}
    >
      {children}
    </AgentModelContext.Provider>
  );
}

export function useAgentModels(): AgentModelContextType {
  const context = useContext(AgentModelContext);
  if (context === undefined) {
    throw new Error('useAgentModels must be used within an AgentModelProvider');
  }
  return context;
}