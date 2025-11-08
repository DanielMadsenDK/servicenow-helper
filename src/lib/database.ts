import { Pool, PoolClient } from 'pg';
import { DEFAULT_VISIBLE_MODES } from './constants';

// Database row interfaces for type safety
interface ServiceNowSupportToolRow {
  id: number;
  created_at: string;
  prompt: string;
  response: string | null;
  model: string | null;
  state: string;
  key: string;
  question: string | null;
}

interface CountQueryRow {
  total: string;
}

interface UserSettingsRow {
  setting_key: string;
  setting_value: string;
}

interface UserSettingRow {
  setting_value: string;
}

interface AgentModelRow {
  agent_name: string;
  model_name: string;
}

interface ModelNameRow {
  model_name: string;
}

interface AgentPromptRow {
  agent_name: string;
  prompt_type: string;
  prompt_content: string;
  is_active: boolean;
  updated_at: string;
}

interface PromptContentRow {
  prompt_content: string;
}

interface ActiveAgentPromptRow {
  agent_name: string;
  prompt_type: string;
  prompt_content: string;
}

interface DatabaseConfig {
  connectionString: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

class DatabaseConnection {
  private pool: Pool;
  private static instance: DatabaseConnection;

  private constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      connectionString: config.connectionString,
      max: config.max || 10,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 10000,
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Database pool error:', err);
    });
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set');
      }
      
      DatabaseConnection.instance = new DatabaseConnection({
        connectionString,
      });
    }
    return DatabaseConnection.instance;
  }

  public async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  public async query(text: string, params?: unknown[]): Promise<{ rows: unknown[]; rowCount: number | null }> {
    const client = await this.getClient();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }
}

import type {
  ConversationHistoryItem,
  HistoryQueryOptions,
  HistoryQueryResult,
  UserSettings
} from '../types/index';


export class ConversationHistory {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  async getConversations(options: HistoryQueryOptions = {}): Promise<HistoryQueryResult> {
    const {
      limit = 20,
      offset = 0,
      startDate,
      endDate,
      state = 'done'
    } = options;

    let whereClause = 'WHERE state = $1';
    const params: unknown[] = [state];
    let paramIndex = 2;

    if (startDate) {
      whereClause += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereClause += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM "ServiceNowSupportTool"
      ${whereClause}
    `;
    const countResult = await this.db.query(countQuery, params);
    const total = parseInt((countResult.rows[0] as CountQueryRow).total || '0');

    // Get conversations
    const query = `
      SELECT id, created_at, prompt, response, model, state, key, question
      FROM "ServiceNowSupportTool"
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const result = await this.db.query(query, params);
    
    const conversations: ConversationHistoryItem[] = result.rows.map((row: unknown) => {
      const r = row as ServiceNowSupportToolRow;
      return {
        id: r.id,
        created_at: new Date(r.created_at),
        prompt: r.prompt,
        response: r.response,
        model: r.model,
        state: r.state,
        key: r.key,
        question: r.question,
      };
    });

    return {
      conversations,
      total,
      hasMore: offset + conversations.length < total,
    };
  }

  async getConversationById(id: number): Promise<ConversationHistoryItem | null> {
    const query = `
      SELECT id, created_at, prompt, response, model, state, key, question
      FROM "ServiceNowSupportTool"
      WHERE id = $1
    `;
    
    const result = await this.db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0] as ServiceNowSupportToolRow;
    return {
      id: row.id,
      created_at: new Date(row.created_at),
      prompt: row.prompt,
      response: row.response,
      model: row.model,
      state: row.state,
      key: row.key,
      question: row.question,
    };
  }

  async searchConversations(searchTerm: string, options: HistoryQueryOptions = {}): Promise<HistoryQueryResult> {
    const {
      limit = 20,
      offset = 0,
      startDate,
      endDate,
      state = 'done'
    } = options;

    let whereClause = 'WHERE state = $1 AND (prompt ILIKE $2 OR response ILIKE $2)';
    const params: unknown[] = [state, `%${searchTerm}%`];
    let paramIndex = 3;

    if (startDate) {
      whereClause += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereClause += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM "ServiceNowSupportTool"
      ${whereClause}
    `;
    const countResult = await this.db.query(countQuery, params);
    const total = parseInt((countResult.rows[0] as CountQueryRow).total || '0');

    // Get conversations
    const query = `
      SELECT id, created_at, prompt, response, model, state, key, question
      FROM "ServiceNowSupportTool"
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const result = await this.db.query(query, params);
    
    const conversations: ConversationHistoryItem[] = result.rows.map((row: unknown) => {
      const r = row as ServiceNowSupportToolRow;
      return {
        id: r.id,
        created_at: new Date(r.created_at),
        prompt: r.prompt,
        response: r.response,
        model: r.model,
        state: r.state,
        key: r.key,
        question: r.question,
      };
    });

    return {
      conversations,
      total,
      hasMore: offset + conversations.length < total,
    };
  }

  async deleteConversation(id: number): Promise<boolean> {
    const query = 'DELETE FROM "ServiceNowSupportTool" WHERE id = $1';
    const result = await this.db.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  async getRecentConversations(limit: number = 10): Promise<ConversationHistoryItem[]> {
    const query = `
      SELECT id, created_at, prompt, response, model, state, key, question
      FROM "ServiceNowSupportTool"
      WHERE state = 'done'
      ORDER BY created_at DESC
      LIMIT $1
    `;
    
    const result = await this.db.query(query, [limit]);
    
    return result.rows.map((row: unknown) => {
      const r = row as ServiceNowSupportToolRow;
      return {
        id: r.id,
        created_at: new Date(r.created_at),
        prompt: r.prompt,
        response: r.response,
        model: r.model,
        state: r.state,
        key: r.key,
        question: r.question,
      };
    });
  }
}


export class UserSettingsManager {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  private parseSettingValue(value: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  private stringifySettingValue(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value);
  }

  async getSetting(userId: string, settingKey: string): Promise<unknown | null> {
    const query = `
      SELECT setting_value
      FROM "user_settings"
      WHERE user_id = $1 AND setting_key = $2
    `;
    
    const result = await this.db.query(query, [userId, settingKey]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0] as UserSettingRow;
    return this.parseSettingValue(row.setting_value);
  }

  async setSetting(userId: string, settingKey: string, settingValue: unknown): Promise<void> {
    const value = this.stringifySettingValue(settingValue);
    
    const query = `
      INSERT INTO "user_settings" (user_id, setting_key, setting_value, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, setting_key)
      DO UPDATE SET 
        setting_value = EXCLUDED.setting_value,
        updated_at = CURRENT_TIMESTAMP
    `;
    
    await this.db.query(query, [userId, settingKey, value]);
  }

  async getAllSettings(userId: string): Promise<UserSettings> {
    const query = `
      SELECT setting_key, setting_value
      FROM "user_settings"
      WHERE user_id = $1
    `;
    
    const result = await this.db.query(query, [userId]);
    
    const defaults: UserSettings = {
      welcome_section_visible: true,
      default_search_mode: false,
      default_request_type: 'recommendation',
      servicenow_instance_url: '',
      default_ai_model: 'anthropic/claude-sonnet-4',
      visible_request_types: DEFAULT_VISIBLE_MODES
    };

    if (result.rows.length === 0) {
      return defaults;
    }

    const settings = { ...defaults };
    
    for (const row of result.rows) {
      const r = row as UserSettingsRow;
      const value = this.parseSettingValue(r.setting_value);
      
      if (r.setting_key in settings) {
        (settings as Record<string, unknown>)[r.setting_key] = value;
      }
    }

    return settings;
  }

  async updateSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
    const client = await this.db.getClient();
    
    try {
      await client.query('BEGIN');
      
      for (const [key, value] of Object.entries(settings)) {
        if (value !== undefined) {
          await this.setSetting(userId, key, value);
        }
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteSetting(userId: string, settingKey: string): Promise<boolean> {
    const query = 'DELETE FROM "user_settings" WHERE user_id = $1 AND setting_key = $2';
    const result = await this.db.query(query, [userId, settingKey]);
    return (result.rowCount || 0) > 0;
  }

  async deleteAllUserSettings(userId: string): Promise<boolean> {
    const query = 'DELETE FROM "user_settings" WHERE user_id = $1';
    const result = await this.db.query(query, [userId]);
    return (result.rowCount || 0) > 0;
  }
}


export class AgentModelManager {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  async getUserAgentModels(userId: string): Promise<Record<string, string>> {
    const query = `
      SELECT agent_name, model_name
      FROM "agent_models"
      WHERE user_id = $1
      ORDER BY agent_name
    `;

    const result = await this.db.query(query, [userId]);

    const agentModels: Record<string, string> = {};
    for (const row of result.rows) {
      const r = row as AgentModelRow;
      agentModels[r.agent_name] = r.model_name;
    }

    // If no agent models found, set up defaults
    if (Object.keys(agentModels).length === 0) {
      const defaultModels = {
        orchestration: 'anthropic/claude-sonnet-4',
        planner_large: 'anthropic/claude-sonnet-4',
        planner_small: 'anthropic/claude-sonnet-4',
        coder_large: 'anthropic/claude-sonnet-4',
        coder_small: 'anthropic/claude-sonnet-4',
        architect_large: 'anthropic/claude-sonnet-4',
        architect_small: 'anthropic/claude-sonnet-4',
        process_sme_large: 'anthropic/claude-sonnet-4',
        process_sme_small: 'anthropic/claude-sonnet-4'
      };

      await this.updateUserAgentModels(userId, defaultModels);
      return defaultModels;
    }

    return agentModels;
  }

  async setAgentModel(userId: string, agentName: string, modelName: string): Promise<void> {
    const query = `
      INSERT INTO "agent_models" (user_id, agent_name, model_name, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, agent_name)
      DO UPDATE SET 
        model_name = EXCLUDED.model_name,
        updated_at = CURRENT_TIMESTAMP
    `;
    
    await this.db.query(query, [userId, agentName, modelName]);
  }

  async updateUserAgentModels(userId: string, agentModels: Record<string, string>): Promise<void> {
    const client = await this.db.getClient();
    
    try {
      await client.query('BEGIN');
      
      for (const [agentName, modelName] of Object.entries(agentModels)) {
        await this.setAgentModel(userId, agentName, modelName);
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getAgentModel(userId: string, agentName: string): Promise<string | null> {
    const query = `
      SELECT model_name
      FROM "agent_models"
      WHERE user_id = $1 AND agent_name = $2
    `;
    
    const result = await this.db.query(query, [userId, agentName]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0] as ModelNameRow;
    return row.model_name;
  }

  async deleteAgentModel(userId: string, agentName: string): Promise<boolean> {
    const query = 'DELETE FROM "agent_models" WHERE user_id = $1 AND agent_name = $2';
    const result = await this.db.query(query, [userId, agentName]);
    return (result.rowCount || 0) > 0;
  }

  async deleteAllUserAgentModels(userId: string): Promise<boolean> {
    const query = 'DELETE FROM "agent_models" WHERE user_id = $1';
    const result = await this.db.query(query, [userId]);
    return (result.rowCount || 0) > 0;
  }

  getDefaultAgents(): Array<{ name: string; displayName: string; description: string; typeDescription?: string; defaultModel: string }> {
    return [
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
        typeDescription: 'Analyzes requirements, designs solutions, and creates implementation strategies',
        defaultModel: 'anthropic/claude-sonnet-4'
      },
      {
        name: 'planner_small',
        displayName: 'Planner Agent (Small)',
        description: 'For well-defined tasks. Faster and more cost-effective.',
        typeDescription: 'Analyzes requirements, designs solutions, and creates implementation strategies',
        defaultModel: 'anthropic/claude-sonnet-4'
      },
      {
        name: 'coder_large',
        displayName: 'Coder Agent (Large)',
        description: 'For complex tasks requiring deep thought and analysis. Slower and more expensive.',
        typeDescription: 'Generates scripts, code snippets, and technical implementations',
        defaultModel: 'anthropic/claude-sonnet-4'
      },
      {
        name: 'coder_small',
        displayName: 'Coder Agent (Small)',
        description: 'For well-defined tasks. Faster and more cost-effective.',
        typeDescription: 'Generates scripts, code snippets, and technical implementations',
        defaultModel: 'anthropic/claude-sonnet-4'
      },
      {
        name: 'architect_large',
        displayName: 'Architect Agent (Large)',
        description: 'For complex tasks requiring deep thought and analysis. Slower and more expensive.',
        typeDescription: 'Designs system architecture, data models, and technical frameworks',
        defaultModel: 'anthropic/claude-sonnet-4'
      },
      {
        name: 'architect_small',
        displayName: 'Architect Agent (Small)',
        description: 'For well-defined tasks. Faster and more cost-effective.',
        typeDescription: 'Designs system architecture, data models, and technical frameworks',
        defaultModel: 'anthropic/claude-sonnet-4'
      },
      {
        name: 'process_sme_large',
        displayName: 'Process SME Agent (Large)',
        description: 'For complex tasks requiring deep thought and analysis. Slower and more expensive.',
        typeDescription: 'Provides expertise on ServiceNow workflows, business processes, and platform configuration',
        defaultModel: 'anthropic/claude-sonnet-4'
      },
      {
        name: 'process_sme_small',
        displayName: 'Process SME Agent (Small)',
        description: 'For well-defined tasks. Faster and more cost-effective.',
        typeDescription: 'Provides expertise on ServiceNow workflows, business processes, and platform configuration',
        defaultModel: 'anthropic/claude-sonnet-4'
      }
    ];
  }
}


export class AgentPromptManager {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  async getAgentPrompt(agentName: string, promptType: string = 'system'): Promise<string | null> {
    const query = `
      SELECT prompt_content
      FROM "agent_prompts"
      WHERE agent_name = $1 AND prompt_type = $2 AND is_active = TRUE
    `;
    
    const result = await this.db.query(query, [agentName, promptType]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0] as PromptContentRow;
    return row.prompt_content;
  }

  async setAgentPrompt(agentName: string, promptType: string, promptContent: string): Promise<void> {
    const query = `
      INSERT INTO "agent_prompts" (agent_name, prompt_type, prompt_content, is_active, updated_at)
      VALUES ($1, $2, $3, TRUE, CURRENT_TIMESTAMP)
      ON CONFLICT (agent_name, prompt_type)
      DO UPDATE SET 
        prompt_content = EXCLUDED.prompt_content,
        updated_at = CURRENT_TIMESTAMP
    `;
    
    await this.db.query(query, [agentName, promptType, promptContent]);
  }

  async getAllAgentPrompts(): Promise<Array<{ agentName: string; promptType: string; promptContent: string; isActive: boolean; updatedAt: Date }>> {
    const query = `
      SELECT agent_name, prompt_type, prompt_content, is_active, updated_at
      FROM "agent_prompts"
      ORDER BY agent_name, prompt_type
    `;
    
    const result = await this.db.query(query);
    
    return result.rows.map((row: unknown) => {
      const r = row as AgentPromptRow;
      return {
        agentName: r.agent_name,
        promptType: r.prompt_type,
        promptContent: r.prompt_content,
        isActive: r.is_active,
        updatedAt: new Date(r.updated_at)
      };
    });
  }

  async getActiveAgentPrompts(): Promise<Record<string, Record<string, string>>> {
    const query = `
      SELECT agent_name, prompt_type, prompt_content
      FROM "agent_prompts"
      WHERE is_active = TRUE
      ORDER BY agent_name, prompt_type
    `;
    
    const result = await this.db.query(query);
    
    const prompts: Record<string, Record<string, string>> = {};
    for (const row of result.rows) {
      const r = row as ActiveAgentPromptRow;
      
      if (!prompts[r.agent_name]) {
        prompts[r.agent_name] = {};
      }
      prompts[r.agent_name][r.prompt_type] = r.prompt_content;
    }

    return prompts;
  }

  async deactivateAgentPrompt(agentName: string, promptType: string): Promise<boolean> {
    const query = `
      UPDATE "agent_prompts"
      SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
      WHERE agent_name = $1 AND prompt_type = $2
    `;
    
    const result = await this.db.query(query, [agentName, promptType]);
    return (result.rowCount || 0) > 0;
  }

  async activateAgentPrompt(agentName: string, promptType: string): Promise<boolean> {
    const query = `
      UPDATE "agent_prompts"
      SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE agent_name = $1 AND prompt_type = $2
    `;
    
    const result = await this.db.query(query, [agentName, promptType]);
    return (result.rowCount || 0) > 0;
  }

  async deleteAgentPrompt(agentName: string, promptType: string): Promise<boolean> {
    const query = 'DELETE FROM "agent_prompts" WHERE agent_name = $1 AND prompt_type = $2';
    const result = await this.db.query(query, [agentName, promptType]);
    return (result.rowCount || 0) > 0;
  }

  getAvailableAgents(): Array<{ name: string; displayName: string; description: string }> {
    return [
      {
        name: 'orchestration',
        displayName: 'Orchestration Agent',
        description: 'Coordinates overall response and routing between different specialized agents'
      },
      {
        name: 'business_rule',
        displayName: 'Business Rule Agent',
        description: 'Specializes in ServiceNow business rules, server-side scripts, and workflow logic'
      },
      {
        name: 'client_script',
        displayName: 'Client Script Agent',
        description: 'Handles ServiceNow client scripts, UI policies, and front-end customizations'
      }
    ];
  }

  getAvailablePromptTypes(): Array<{ type: string; displayName: string; description: string }> {
    return [
      {
        type: 'system',
        displayName: 'System Prompt',
        description: 'Core system prompt that defines agent behavior and capabilities'
      },
      {
        type: 'base',
        displayName: 'Base Prompt',
        description: 'Base prompt template for dynamic content generation'
      }
    ];
  }
}

export default ConversationHistory;