import { Pool, PoolClient } from 'pg';

interface DatabaseRow {
  id: number;
  created_at: string;
  prompt: string;
  response: string | null;
  model: string | null;
  state: string;
  key: string;
  question: string | null;
  total?: string;
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
    const total = parseInt((countResult.rows[0] as DatabaseRow).total || '0');

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
      const r = row as DatabaseRow;
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

    const row = result.rows[0] as DatabaseRow;
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
    const total = parseInt((countResult.rows[0] as DatabaseRow).total || '0');

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
      const r = row as DatabaseRow;
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
      const r = row as DatabaseRow;
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

    const row = result.rows[0] as { setting_value: string };
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
      default_ai_model: 'anthropic/claude-sonnet-4'
    };

    if (result.rows.length === 0) {
      return defaults;
    }

    const settings = { ...defaults };
    
    for (const row of result.rows) {
      const r = row as { setting_key: string; setting_value: string };
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


export default ConversationHistory;