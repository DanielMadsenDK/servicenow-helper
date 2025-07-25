import { Pool, PoolClient } from 'pg';
import type { AIModel, AIModelInput } from '@/types/index';

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

export class AIModelManager {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  async getUserModels(userId: string): Promise<AIModel[]> {
    const query = `
      SELECT id, user_id, model_name, display_name, is_free, is_default, created_at, updated_at
      FROM "ai_models"
      WHERE user_id = $1
      ORDER BY is_default DESC, created_at ASC
    `;
    
    const result = await this.db.query(query, [userId]);
    
    return result.rows.map((row: unknown) => {
      const r = row as {
        id: number;
        user_id: string;
        model_name: string;
        display_name?: string;
        is_free: boolean;
        is_default: boolean;
        created_at: string;
        updated_at: string;
      };
      return {
        id: r.id,
        user_id: r.user_id,
        model_name: r.model_name,
        display_name: r.display_name,
        is_free: r.is_free,
        is_default: r.is_default,
        created_at: new Date(r.created_at),
        updated_at: new Date(r.updated_at),
      };
    });
  }

  async addModel(userId: string, modelInput: AIModelInput): Promise<AIModel> {
    const client = await this.db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // If this is set as default, unset other defaults
      if (modelInput.is_default) {
        await client.query(
          'UPDATE "ai_models" SET is_default = false, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1',
          [userId]
        );
      }
      
      const query = `
        INSERT INTO "ai_models" (user_id, model_name, display_name, is_free, is_default, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, user_id, model_name, display_name, is_free, is_default, created_at, updated_at
      `;
      
      const result = await client.query(query, [
        userId,
        modelInput.model_name,
        modelInput.display_name || null,
        modelInput.is_free,
        modelInput.is_default || false
      ]);
      
      await client.query('COMMIT');
      
      const row = result.rows[0] as {
        id: number;
        user_id: string;
        model_name: string;
        display_name?: string;
        is_free: boolean;
        is_default: boolean;
        created_at: string;
        updated_at: string;
      };
      
      return {
        id: row.id,
        user_id: row.user_id,
        model_name: row.model_name,
        display_name: row.display_name,
        is_free: row.is_free,
        is_default: row.is_default,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteModel(userId: string, modelId: number): Promise<boolean> {
    const query = 'DELETE FROM "ai_models" WHERE id = $1 AND user_id = $2';
    const result = await this.db.query(query, [modelId, userId]);
    return (result.rowCount || 0) > 0;
  }

  async setDefaultModel(userId: string, modelId: number): Promise<boolean> {
    const client = await this.db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Unset all defaults for this user
      await client.query(
        'UPDATE "ai_models" SET is_default = false, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1',
        [userId]
      );
      
      // Set new default
      const result = await client.query(
        'UPDATE "ai_models" SET is_default = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2',
        [modelId, userId]
      );
      
      await client.query('COMMIT');
      
      return (result.rowCount || 0) > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getDefaultModel(userId: string): Promise<AIModel | null> {
    const query = `
      SELECT id, user_id, model_name, display_name, is_free, is_default, created_at, updated_at
      FROM "ai_models"
      WHERE user_id = $1 AND is_default = true
      LIMIT 1
    `;
    
    const result = await this.db.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0] as {
      id: number;
      user_id: string;
      model_name: string;
      display_name?: string;
      is_free: boolean;
      is_default: boolean;
      created_at: string;
      updated_at: string;
    };
    
    return {
      id: row.id,
      user_id: row.user_id,
      model_name: row.model_name,
      display_name: row.display_name,
      is_free: row.is_free,
      is_default: row.is_default,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }

}