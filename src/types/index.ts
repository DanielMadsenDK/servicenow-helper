export interface ServiceNowRequest {
  question: string;
  type: 'documentation' | 'recommendation' | 'script' | 'troubleshoot';
  sessionkey: string;
  searching: boolean;
  aiModel: string;
  file?: string; // base64 encoded file data
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
  default_ai_model: string;
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
  created_at: Date;
  updated_at: Date;
  capabilities?: Capability[];
}

export interface AIModelInput {
  model_name: string;
  display_name?: string;
  is_free: boolean;
  is_default?: boolean;
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