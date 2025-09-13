import axios from 'axios';

import { StreamingRequest, AgentModel } from '@/types';
import { generateSessionId } from '@/lib/session-utils';

const API_BASE_URL = process.env.N8N_WEBHOOK_URL!;
const API_KEY = process.env.N8N_API_KEY!;

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
  };
}

export class N8NStreamingClient {
  private static checkEnvironmentVariables(): void {
    if (!API_BASE_URL || !API_KEY) {
      throw new Error('Server configuration error: Missing N8N_WEBHOOK_URL or N8N_API_KEY');
    }
  }

  public static async createStreamingConnection(body: StreamingRequest): Promise<NodeJS.ReadableStream> {
    this.checkEnvironmentVariables();

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
        userId: 'streaming_user'
      }
    };

    const response = await axios.post(API_BASE_URL, n8nStreamingRequest, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
        'Accept': 'text/event-stream',
        'X-Client-Type': 'streaming',
      },
      responseType: 'stream',
      timeout: 480000, // 8 minutes
    });

    return response.data;
  }
}