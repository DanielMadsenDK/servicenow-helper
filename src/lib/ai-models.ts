import { Pool, PoolClient } from 'pg';
import type { AIModel, AIModelInput, Capability } from '@/types/index';

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
      SELECT 
        am.id, am.user_id, am.model_name, am.display_name, am.is_free, am.is_default, 
        am.created_at, am.updated_at,
        COALESCE(
          JSON_AGG(
            CASE WHEN c.id IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', c.id,
                'name', c.name,
                'display_name', c.display_name,
                'description', c.description,
                'created_at', c.created_at
              )
            END
          ) FILTER (WHERE c.id IS NOT NULL), '[]'
        ) as capabilities
      FROM "ai_models" am
      LEFT JOIN "ai_model_capabilities" amc ON am.id = amc.ai_model_id
      LEFT JOIN "capabilities" c ON amc.capability_id = c.id
      WHERE am.user_id = $1
      GROUP BY am.id, am.user_id, am.model_name, am.display_name, am.is_free, am.is_default, am.created_at, am.updated_at
      ORDER BY am.is_default DESC, am.created_at ASC
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
        capabilities: Capability[] | string;
      };
      
      let capabilities: Capability[] = [];
      if (typeof r.capabilities === 'string') {
        try {
          capabilities = JSON.parse(r.capabilities);
        } catch {
          capabilities = [];
        }
      } else if (Array.isArray(r.capabilities)) {
        capabilities = r.capabilities.map(cap => ({
          ...cap,
          created_at: new Date(cap.created_at)
        }));
      }
      
      return {
        id: r.id,
        user_id: r.user_id,
        model_name: r.model_name,
        display_name: r.display_name,
        is_free: r.is_free,
        is_default: r.is_default,
        created_at: new Date(r.created_at),
        updated_at: new Date(r.updated_at),
        capabilities: capabilities,
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
      
      // Add capabilities if provided
      if (modelInput.capability_ids && modelInput.capability_ids.length > 0) {
        for (const capabilityId of modelInput.capability_ids) {
          await client.query(
            'INSERT INTO "ai_model_capabilities" (ai_model_id, capability_id, created_at) VALUES ($1, $2, CURRENT_TIMESTAMP)',
            [row.id, capabilityId]
          );
        }
      }
      
      await client.query('COMMIT');
      
      // Fetch the model with capabilities
      const modelWithCapabilities = await this.getModelById(userId, row.id);
      return modelWithCapabilities || {
        id: row.id,
        user_id: row.user_id,
        model_name: row.model_name,
        display_name: row.display_name,
        is_free: row.is_free,
        is_default: row.is_default,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
        capabilities: [],
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

  async getAllCapabilities(): Promise<Capability[]> {
    const query = `
      SELECT id, name, display_name, description, created_at
      FROM "capabilities"
      ORDER BY name ASC
    `;
    
    const result = await this.db.query(query);
    
    return result.rows.map((row: unknown) => {
      const r = row as {
        id: number;
        name: string;
        display_name: string;
        description?: string;
        created_at: string;
      };
      return {
        id: r.id,
        name: r.name,
        display_name: r.display_name,
        description: r.description,
        created_at: new Date(r.created_at),
      };
    });
  }

  async getModelById(userId: string, modelId: number): Promise<AIModel | null> {
    const query = `
      SELECT 
        am.id, am.user_id, am.model_name, am.display_name, am.is_free, am.is_default, 
        am.created_at, am.updated_at,
        COALESCE(
          JSON_AGG(
            CASE WHEN c.id IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', c.id,
                'name', c.name,
                'display_name', c.display_name,
                'description', c.description,
                'created_at', c.created_at
              )
            END
          ) FILTER (WHERE c.id IS NOT NULL), '[]'
        ) as capabilities
      FROM "ai_models" am
      LEFT JOIN "ai_model_capabilities" amc ON am.id = amc.ai_model_id
      LEFT JOIN "capabilities" c ON amc.capability_id = c.id
      WHERE am.user_id = $1 AND am.id = $2
      GROUP BY am.id, am.user_id, am.model_name, am.display_name, am.is_free, am.is_default, am.created_at, am.updated_at
    `;
    
    const result = await this.db.query(query, [userId, modelId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const r = result.rows[0] as {
      id: number;
      user_id: string;
      model_name: string;
      display_name?: string;
      is_free: boolean;
      is_default: boolean;
      created_at: string;
      updated_at: string;
      capabilities: Capability[] | string;
    };
    
    let capabilities: Capability[] = [];
    if (typeof r.capabilities === 'string') {
      try {
        capabilities = JSON.parse(r.capabilities);
      } catch {
        capabilities = [];
      }
    } else if (Array.isArray(r.capabilities)) {
      capabilities = r.capabilities.map(cap => ({
        ...cap,
        created_at: new Date(cap.created_at)
      }));
    }
    
    return {
      id: r.id,
      user_id: r.user_id,
      model_name: r.model_name,
      display_name: r.display_name,
      is_free: r.is_free,
      is_default: r.is_default,
      created_at: new Date(r.created_at),
      updated_at: new Date(r.updated_at),
      capabilities: capabilities,
    };
  }

  async setModelCapabilities(userId: string, modelId: number, capabilityIds: number[]): Promise<boolean> {
    const client = await this.db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // First, verify the model belongs to the user
      const modelCheck = await client.query(
        'SELECT id FROM "ai_models" WHERE id = $1 AND user_id = $2',
        [modelId, userId]
      );
      
      if (modelCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }
      
      // Remove existing capabilities
      await client.query(
        'DELETE FROM "ai_model_capabilities" WHERE ai_model_id = $1',
        [modelId]
      );
      
      // Add new capabilities
      for (const capabilityId of capabilityIds) {
        await client.query(
          'INSERT INTO "ai_model_capabilities" (ai_model_id, capability_id, created_at) VALUES ($1, $2, CURRENT_TIMESTAMP)',
          [modelId, capabilityId]
        );
      }
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getModelCapabilities(modelId: number): Promise<Capability[]> {
    const query = `
      SELECT c.id, c.name, c.display_name, c.description, c.created_at
      FROM "capabilities" c
      JOIN "ai_model_capabilities" amc ON c.id = amc.capability_id
      WHERE amc.ai_model_id = $1
      ORDER BY c.name ASC
    `;
    
    const result = await this.db.query(query, [modelId]);
    
    return result.rows.map((row: unknown) => {
      const r = row as {
        id: number;
        name: string;
        display_name: string;
        description?: string;
        created_at: string;
      };
      return {
        id: r.id,
        name: r.name,
        display_name: r.display_name,
        description: r.description,
        created_at: new Date(r.created_at),
      };
    });
  }

}