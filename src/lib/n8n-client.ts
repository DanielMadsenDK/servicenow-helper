import axios from 'axios';

interface N8NConfig {
  baseUrl: string;
  apiKey: string;
}

interface QAKnowledgeBaseItem {
  id: number;
  question: string;
  answer: string;
  question_embedding: number[] | null;
  answer_embedding: number[] | null;
  category: string | null;
  tags: string[] | null;
  quality_score: number;
  usage_count: number;
  created_at: Date;
  updated_at: Date;
}

interface QAFeedbackItem {
  id: number;
  qa_id: number;
  user_session: string | null;
  rating: number;
  feedback_text: string | null;
  created_at: Date;
}

interface SaveQAPairRequest {
  question: string;
  answer: string;
  question_embedding: number[];
  answer_embedding: number[];
  category?: string;
  tags?: string[];
}

interface SimilarQAResult {
  item: QAKnowledgeBaseItem;
  similarity: number;
}

interface N8NWebhookResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export class N8NClient {
  private config: N8NConfig;
  private static instance: N8NClient;

  private constructor(config: N8NConfig) {
    this.config = config;
  }

  public static getInstance(): N8NClient {
    if (!N8NClient.instance) {
      const baseUrl = process.env.N8N_WEBHOOK_URL?.replace(/\/[^/]*$/, '') || 'http://n8n:5678';
      const apiKey = process.env.N8N_API_KEY || process.env.WEBHOOK_API_KEY || '';
      
      N8NClient.instance = new N8NClient({
        baseUrl,
        apiKey
      });
    }
    return N8NClient.instance;
  }

  private async callWebhook(endpoint: string, data: unknown): Promise<N8NWebhookResponse> {
    try {
      const response = await axios.post(`${this.config.baseUrl}/webhook/${endpoint}`, data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        timeout: 30000 // 30 second timeout
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`N8N webhook error for ${endpoint}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async saveQAPair(request: SaveQAPairRequest): Promise<QAKnowledgeBaseItem | null> {
    const result = await this.callWebhook('save-qa-pair', request);
    
    if (!result.success || !result.data) {
      console.error('Failed to save QA pair:', result.error);
      return null;
    }
    
    return result.data as QAKnowledgeBaseItem;
  }

  async findSimilarQuestions(
    queryEmbedding: number[], 
    limit: number = 5, 
    threshold: number = 0.7
  ): Promise<SimilarQAResult[]> {
    const result = await this.callWebhook('find-similar-questions', {
      queryEmbedding,
      limit,
      threshold
    });
    
    if (!result.success || !result.data) {
      console.error('Failed to find similar questions:', result.error);
      return [];
    }
    
    return result.data as SimilarQAResult[];
  }

  async incrementUsageCount(id: number): Promise<boolean> {
    const result = await this.callWebhook('increment-usage-count', { id });
    
    if (!result.success) {
      console.error('Failed to increment usage count:', result.error);
      return false;
    }
    
    return true;
  }

  async getAllQAPairs(limit: number = 50, offset: number = 0): Promise<QAKnowledgeBaseItem[]> {
    const result = await this.callWebhook('get-all-qa-pairs', { limit, offset });
    
    if (!result.success || !result.data) {
      console.error('Failed to get all QA pairs:', result.error);
      return [];
    }
    
    return result.data as QAKnowledgeBaseItem[];
  }

  async saveFeedback(
    qaId: number, 
    userSession: string, 
    rating: number, 
    feedbackText?: string
  ): Promise<QAFeedbackItem | null> {
    const result = await this.callWebhook('save-feedback', {
      qaId,
      userSession,
      rating,
      feedbackText
    });
    
    if (!result.success || !result.data) {
      console.error('Failed to save feedback:', result.error);
      return null;
    }
    
    return result.data as QAFeedbackItem;
  }

  async getQAById(id: number): Promise<QAKnowledgeBaseItem | null> {
    const result = await this.callWebhook('get-qa-by-id', { id });
    
    if (!result.success || !result.data) {
      console.error('Failed to get QA by ID:', result.error);
      return null;
    }
    
    return result.data as QAKnowledgeBaseItem;
  }

  async generateEmbedding(text: string): Promise<number[] | null> {
    const result = await this.callWebhook('generate-embedding', { text });
    
    if (!result.success || !result.data) {
      console.error('Failed to generate embedding:', result.error);
      return null;
    }
    
    return result.data as number[];
  }

  async deleteQAPair(id: number): Promise<boolean> {
    const result = await this.callWebhook('deleteKnowledgeStoreId', { id });
    
    if (!result.success) {
      console.error('N8N webhook error for deleteKnowledgeStoreId:', result.error);
      return false;
    }
    
    // Check if the webhook response itself indicates failure
    if (result.data && typeof result.data === 'object' && 'success' in result.data) {
      const responseData = result.data as { success: boolean; error?: string };
      if (!responseData.success) {
        console.error('Failed to delete QA pair:', responseData.error);
        return false;
      }
    }
    
    return true;
  }

  async deleteMultipleQAPairs(ids: number[]): Promise<boolean> {
    try {
      const result = await this.callWebhook('deleteKnowledgeStoreIds', { ids });
      
      if (!result.success) {
        console.error('Failed to delete multiple QA pairs:', result.error);
        return false;
      }
      
      // Check if the webhook response itself indicates failure
      if (result.data && typeof result.data === 'object' && 'success' in result.data) {
        const responseData = result.data as { success: boolean; error?: string };
        if (!responseData.success) {
          console.error('Failed to delete multiple QA pairs:', responseData.error);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to delete multiple QA pairs:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }
}

export default N8NClient;