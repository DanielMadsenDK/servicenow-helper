export interface AgentModel {
  agent: string;
  model: string;
}

export interface ServiceNowRequest {
  question: string;
  type: 'documentation' | 'recommendation' | 'script' | 'troubleshoot';
  sessionkey: string;
  searching: boolean;
  aiModel: string; // Legacy field for backward compatibility
  agentModels?: AgentModel[]; // New field for multi-agent support
  file?: string; // base64 encoded file data
  correlationId?: string; // For debugging and request tracking
}

export interface ServiceNowResponse {
  message: string;
  type?: string;
  timestamp?: string;
  sessionkey?: string;
  status?: string;
}

export interface ApiResponse {
  success: boolean;
  data?: ServiceNowResponse;
  error?: string;
}

export interface ConversationHistoryItem {
  id: number;
  created_at: Date;
  prompt: string;
  response: string | null;
  model: string | null;
  state: string;
  key: string;
  question: string | null;
  type?: string;
  sessionkey?: string;
}

export interface HistoryQueryOptions {
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
  state?: string;
  search?: string;
}

export interface HistoryQueryResult {
  conversations: ConversationHistoryItem[];
  total: number;
  hasMore: boolean;
}

export interface HistoryApiResponse {
  success: boolean;
  data?: HistoryQueryResult;
  error?: string;
}

export interface HistoryFilters {
  search: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  showCompleted: boolean;
  showPending: boolean;
}

export interface UserSetting {
  id: number;
  user_id: string;
  setting_key: string;
  setting_value: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserSettings {
  welcome_section_visible: boolean;
  default_search_mode: boolean;
  default_request_type: 'documentation' | 'recommendation' | 'script' | 'troubleshoot';
  servicenow_instance_url: string;
  default_ai_model: string; // Legacy field for backward compatibility
  agent_models?: Record<string, string>; // New field: { agent_name: model_name }
  selected_provider_id?: number; // New field: selected provider for filtering models
}

export interface Capability {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  created_at: Date;
}

export interface AIModelCapability {
  id: number;
  ai_model_id: number;
  capability_id: number;
  created_at: Date;
}

export interface AIModel {
  id: number;
  user_id: string;
  model_name: string;
  display_name?: string;
  is_free: boolean;
  is_default: boolean;
  provider_id: number;
  provider?: Provider; // Optional populated provider information
  created_at: Date;
  updated_at: Date;
  capabilities?: Capability[];
}

export interface AIModelInput {
  model_name: string;
  display_name?: string;
  is_free: boolean;
  is_default?: boolean;
  provider_id: number;
  capability_ids?: number[];
}

export interface AIModelsApiResponse {
  success: boolean;
  data?: AIModel[];
  error?: string;
}

export interface AIModelApiResponse {
  success: boolean;
  data?: AIModel;
  error?: string;
}

export interface CapabilitiesApiResponse {
  success: boolean;
  data?: Capability[];
  error?: string;
}

export interface SettingsApiResponse {
  success: boolean;
  data?: UserSettings;
  error?: string;
}

// Streaming interfaces
export interface StreamingChunk {
  content: string;
  type: 'connecting' | 'chunk' | 'complete' | 'error';
  timestamp: string;
}

export interface StreamingResponse {
  chunks: StreamingChunk[];
  status: StreamingStatus;
  error?: string;
  totalContent: string;
}

export enum StreamingStatus {
  CONNECTING = 'connecting',
  STREAMING = 'streaming',
  COMPLETE = 'complete',
  ERROR = 'error',
  CANCELLED = 'cancelled'
}

export interface StreamingApiResponse {
  success: boolean;
  error?: string;
  streamUrl?: string;
}

export interface StreamingRequest extends Omit<ServiceNowRequest, 'sessionkey'> {
  sessionkey: string;
}

// Provider-aware streaming configuration
export interface StreamingConfig {
  provider: Provider;
  agentModels: Record<string, string>;
  endpoint: string; // Dynamic endpoint based on provider
}

// Enhanced N8N request with provider support
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

// Agent Models Types
export interface AgentModelRecord {
  id: number;
  user_id: string;
  agent_name: string;
  model_name: string;
  created_at: Date;
  updated_at: Date;
}

export interface AgentModelInput {
  agent_name: string;
  model_name: string;
}

export interface AgentModelsApiResponse {
  success: boolean;
  data?: Record<string, string>; // { agent_name: model_name }
  error?: string;
}

export interface DefaultAgent {
  name: string;
  displayName: string;
  description: string;
  defaultModel: string;
}

// Provider Types
export interface Provider {
  id: number;
  name: string;
  display_name: string;
  endpoint: string;
  is_active: boolean;
  priority: number;
  rate_limit_per_minute?: number;
  created_at: Date;
  updated_at: Date;
}

export interface ProviderInput {
  name: string;
  display_name: string;
  endpoint: string;
  is_active?: boolean;
  priority?: number;
  rate_limit_per_minute?: number;
}

export interface ProvidersApiResponse {
  success: boolean;
  data?: Provider[];
  error?: string;
}

export interface ProviderApiResponse {
  success: boolean;
  data?: Provider;
  error?: string;
}

// Knowledge Store Types
export interface KnowledgeStoreItem {
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

export interface KnowledgeStoreQueryOptions {
  limit?: number;
  offset?: number;
  search?: string;
  category?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface KnowledgeStoreQueryResult {
  items: KnowledgeStoreItem[];
  total: number;
  hasMore: boolean;
}

export interface KnowledgeStoreApiResponse {
  success: boolean;
  data?: KnowledgeStoreQueryResult;
  error?: string;
}

export interface KnowledgeStoreFilters {
  search: string;
  category: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

// Export Types
export type ExportFormat = 'markdown' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  filename: string;
  includeQuestion: boolean;
  question?: string;
  answer: string;
}