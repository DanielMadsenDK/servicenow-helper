import axios from 'axios';

import { StreamingRequest, AgentModel, Provider } from '@/types';
import { generateSessionId } from '@/lib/session-utils';
import { ProviderManager } from '@/lib/providers';

const DEFAULT_API_BASE_URL = process.env.N8N_WEBHOOK_URL!;
const DEFAULT_API_KEY = process.env.N8N_API_KEY!;

export interface N8nStreamingRequest {
  action: string;
  sessionId: string;
  chatInput: string;
  metadata: {
    type: string;
    aiModel: string;
    agentModels?: AgentModel[];
    file?: string;
    searching: boolean;
    userId: string;
    provider?: Provider; // Provider information for N8N processing
  };
}

export class N8NStreamingClient {
  private static async getProviderConfig(providerId?: number): Promise<{ endpoint: string; apiKey: string; provider?: Provider }> {
    if (!providerId) {
      // Fallback to default configuration
      if (!DEFAULT_API_BASE_URL || !DEFAULT_API_KEY) {
        throw new Error('Server configuration error: Missing N8N_WEBHOOK_URL or N8N_API_KEY');
      }
      return {
        endpoint: DEFAULT_API_BASE_URL,
        apiKey: DEFAULT_API_KEY
      };
    }

    try {
      const providerManager = new ProviderManager();
      const provider = await providerManager.getProviderById(providerId);

      if (!provider) {
        throw new Error(`Provider with ID ${providerId} not found`);
      }

      if (!provider.is_active) {
        throw new Error(`Provider ${provider.display_name} is not active`);
      }

      if (!provider.endpoint || provider.endpoint.trim() === '') {
        throw new Error(`Provider ${provider.display_name} has no endpoint configured`);
      }

      // Get provider-specific API key using naming convention
      const providerApiKey = ProviderManager.getProviderApiKey(provider.name);
      const apiKey = providerApiKey || DEFAULT_API_KEY; // Fallback to default

      if (!providerApiKey) {
        console.warn(`API key environment variable ${provider.name.toUpperCase()}_API_KEY not found for provider ${provider.name}, using default`);
      }

      return {
        endpoint: provider.endpoint,
        apiKey,
        provider
      };
    } catch (error) {
      console.error(`Failed to get provider configuration for ID ${providerId}:`, error);
      // Fallback to default configuration
      if (!DEFAULT_API_BASE_URL || !DEFAULT_API_KEY) {
        throw new Error('Server configuration error: Missing N8N_WEBHOOK_URL or N8N_API_KEY and provider configuration failed');
      }
      return {
        endpoint: DEFAULT_API_BASE_URL,
        apiKey: DEFAULT_API_KEY
      };
    }
  }

  public static async createStreamingConnection(body: StreamingRequest, providerId?: number): Promise<NodeJS.ReadableStream> {
    const config = await this.getProviderConfig(providerId);

    const n8nStreamingRequest: N8nStreamingRequest = {
      action: 'sendMessage',
      sessionId: body.sessionkey || generateSessionId(),
      chatInput: body.question,
      metadata: {
        type: body.type,
        aiModel: body.aiModel || '',
        agentModels: body.agentModels,
        file: body.file,
        searching: body.searching,
        userId: 'streaming_user',
        provider: config.provider
      }
    };

    console.log(`Making streaming request to: ${config.endpoint}`);
    if (config.provider) {
      console.log(`Using provider: ${config.provider.display_name} (${config.provider.name})`);
    }

    const response = await axios.post(config.endpoint, n8nStreamingRequest, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.apiKey,
        'Accept': 'text/event-stream',
        'X-Client-Type': 'streaming',
        'X-Provider': config.provider?.name || 'default',
      },
      responseType: 'stream',
      timeout: 480000, // 8 minutes
    });

    return response.data;
  }
}