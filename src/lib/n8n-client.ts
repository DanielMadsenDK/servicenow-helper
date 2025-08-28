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

interface CreateTaskRequest {
  payload: string;
  type: 'business_rule' | 'script_include' | 'client_script';
  target_table: 'sys_script' | 'sys_script_include' | 'sys_script_client';
}

interface CreateTaskResponse {
  success: boolean;
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
      const baseUrl = process.env.N8N_WEBHOOK_BASE_URL || 'http://n8n:5678';
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
          'apikey': this.config.apiKey
        },
        timeout: 30000 // 30 second timeout
      });
      
      // For create_task endpoint, log the status code for debugging
      if (endpoint === 'create_task') {
        console.log(`N8N webhook for ${endpoint} returned status: ${response.status}`);
      }
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`N8N webhook error for ${endpoint}:`, error);
      return {
        success: false,
        error: endpoint === 'create_task' ? 'Task creation failed' : (error instanceof Error ? error.message : 'Unknown error')
      };
    }
  }

  /**
   * Helper method to check webhook response success for delete operations
   * @param result The webhook response
   * @param errorMessage Error message to log if operation fails
   * @returns boolean indicating success
   */
  private checkDeleteOperationSuccess(result: N8NWebhookResponse, errorMessage: string): boolean {
    if (!result.success) {
      console.error(errorMessage, result.error);
      return false;
    }
    
    // Check if the webhook response itself indicates failure
    if (result.data && typeof result.data === 'object' && 'success' in result.data) {
      const responseData = result.data as { success: boolean; error?: string };
      if (!responseData.success) {
        console.error(errorMessage, responseData.error);
        return false;
      }
    }
    
    return true;
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
    return this.checkDeleteOperationSuccess(result, 'Failed to delete QA pair:');
  }

  async deleteMultipleQAPairs(ids: number[]): Promise<boolean> {
    try {
      const result = await this.callWebhook('deleteKnowledgeStoreIds', { ids });
      return this.checkDeleteOperationSuccess(result, 'Failed to delete multiple QA pairs:');
    } catch (error) {
      console.error('Failed to delete multiple QA pairs:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  async createTask(request: CreateTaskRequest): Promise<CreateTaskResponse> {
    const result = await this.callWebhook('create_task', request);
    
    if (!result.success) {
      console.error('Failed to create task:', result.error);
      return {
        success: false,
        error: result.error || 'Unknown error occurred'
      };
    }
    
    // Check if N8N workflow response contains sys_id (indicates successful creation)
    if (result.data && typeof result.data === 'object') {
      const responseData = result.data as { sys_id?: string; error?: string };
      
      // If N8N returned a sys_id, the task was created successfully
      if (responseData.sys_id) {
        console.log('Task created successfully with sys_id:', responseData.sys_id);
        return {
          success: true
        };
      }
      
      // If no sys_id but there's an error field, return the error
      if (responseData.error) {
        console.error('N8N workflow failed:', responseData.error);
        return {
          success: false,
          error: responseData.error
        };
      }
    }
    
    // If we get here, the response format was unexpected
    console.error('N8N response missing sys_id field, response:', result.data);
    return {
      success: false,
      error: 'Task creation failed'
    };
  }
}

export default N8NClient;