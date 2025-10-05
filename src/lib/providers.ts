import { Pool, PoolClient } from 'pg';

import type { Provider, ProviderInput } from '@/types/index';

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

export class ProviderManager {
  private db: DatabaseConnection;
  private static providerCache: Map<string, { data: Provider[]; timestamp: number }> = new Map();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  /**
   * Get all active providers, ordered by priority
   */
  async getActiveProviders(): Promise<Provider[]> {
    const cacheKey = 'active_providers';
    const cached = ProviderManager.providerCache.get(cacheKey);

    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < ProviderManager.CACHE_TTL) {
      return cached.data;
    }

    const query = `
      SELECT id, name, display_name, endpoint,
             is_active, priority, rate_limit_per_minute, created_at, updated_at
      FROM "providers"
      WHERE is_active = true
      ORDER BY priority DESC, display_name ASC
    `;

    const result = await this.db.query(query);

    const providers: Provider[] = result.rows.map((row: unknown) => {
      const r = row as {
        id: number;
        name: string;
        display_name: string;
        endpoint: string;
        is_active: boolean;
        priority: number;
        rate_limit_per_minute?: number;
        created_at: string;
        updated_at: string;
      };

      return {
        id: r.id,
        name: r.name,
        display_name: r.display_name,
        endpoint: r.endpoint,
        is_active: r.is_active,
        priority: r.priority,
        rate_limit_per_minute: r.rate_limit_per_minute,
        created_at: new Date(r.created_at),
        updated_at: new Date(r.updated_at),
      };
    });

    // Cache the results
    ProviderManager.providerCache.set(cacheKey, {
      data: providers,
      timestamp: Date.now()
    });

    return providers;
  }

  /**
   * Get all providers (including inactive ones)
   */
  async getAllProviders(): Promise<Provider[]> {
    const query = `
      SELECT id, name, display_name, endpoint,
             is_active, priority, rate_limit_per_minute, created_at, updated_at
      FROM "providers"
      ORDER BY priority DESC, display_name ASC
    `;

    const result = await this.db.query(query);

    return result.rows.map((row: unknown) => {
      const r = row as {
        id: number;
        name: string;
        display_name: string;
        endpoint: string;
        is_active: boolean;
        priority: number;
        rate_limit_per_minute?: number;
        created_at: string;
        updated_at: string;
      };

      return {
        id: r.id,
        name: r.name,
        display_name: r.display_name,
        endpoint: r.endpoint,
        is_active: r.is_active,
        priority: r.priority,
        rate_limit_per_minute: r.rate_limit_per_minute,
        created_at: new Date(r.created_at),
        updated_at: new Date(r.updated_at),
      };
    });
  }

  /**
   * Get provider by ID
   */
  async getProviderById(id: number): Promise<Provider | null> {
    const query = `
      SELECT id, name, display_name, endpoint,
             is_active, priority, rate_limit_per_minute, created_at, updated_at
      FROM "providers"
      WHERE id = $1
    `;

    const result = await this.db.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const r = result.rows[0] as {
      id: number;
      name: string;
      display_name: string;
      endpoint: string;
      is_active: boolean;
      priority: number;
      rate_limit_per_minute?: number;
      created_at: string;
      updated_at: string;
    };

    return {
      id: r.id,
      name: r.name,
      display_name: r.display_name,
      endpoint: r.endpoint,
      is_active: r.is_active,
      priority: r.priority,
      rate_limit_per_minute: r.rate_limit_per_minute,
      created_at: new Date(r.created_at),
      updated_at: new Date(r.updated_at),
    };
  }

  /**
   * Get provider by name
   */
  async getProviderByName(name: string): Promise<Provider | null> {
    const query = `
      SELECT id, name, display_name, endpoint,
             is_active, priority, rate_limit_per_minute, created_at, updated_at
      FROM "providers"
      WHERE name = $1
    `;

    const result = await this.db.query(query, [name]);

    if (result.rows.length === 0) {
      return null;
    }

    const r = result.rows[0] as {
      id: number;
      name: string;
      display_name: string;
      endpoint: string;
      is_active: boolean;
      priority: number;
      rate_limit_per_minute?: number;
      created_at: string;
      updated_at: string;
    };

    return {
      id: r.id,
      name: r.name,
      display_name: r.display_name,
      endpoint: r.endpoint,
      is_active: r.is_active,
      priority: r.priority,
      rate_limit_per_minute: r.rate_limit_per_minute,
      created_at: new Date(r.created_at),
      updated_at: new Date(r.updated_at),
    };
  }

  /**
   * Get default provider (highest priority active provider)
   */
  async getDefaultProvider(): Promise<Provider | null> {
    const providers = await this.getActiveProviders();
    return providers.length > 0 ? providers[0] : null;
  }

  /**
   * Add a new provider
   */
  async addProvider(providerInput: ProviderInput): Promise<Provider> {
    // Clear cache when adding new provider
    ProviderManager.providerCache.clear();

    const query = `
      INSERT INTO "providers" (
        name, display_name, endpoint,
        is_active, priority, rate_limit_per_minute,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, name, display_name, endpoint,
                is_active, priority, rate_limit_per_minute, created_at, updated_at
    `;

    const result = await this.db.query(query, [
      providerInput.name,
      providerInput.display_name,
      providerInput.endpoint,
      providerInput.is_active !== undefined ? providerInput.is_active : true,
      providerInput.priority || 0,
      providerInput.rate_limit_per_minute || null
    ]);

    const r = result.rows[0] as {
      id: number;
      name: string;
      display_name: string;
      endpoint: string;
      is_active: boolean;
      priority: number;
      rate_limit_per_minute?: number;
      created_at: string;
      updated_at: string;
    };

    return {
      id: r.id,
      name: r.name,
      display_name: r.display_name,
      endpoint: r.endpoint,
      is_active: r.is_active,
      priority: r.priority,
      rate_limit_per_minute: r.rate_limit_per_minute,
      created_at: new Date(r.created_at),
      updated_at: new Date(r.updated_at),
    };
  }

  /**
   * Update provider
   */
  async updateProvider(id: number, updates: Partial<ProviderInput>): Promise<Provider | null> {
    // Clear cache when updating provider
    ProviderManager.providerCache.clear();

    const setParts: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    // Build dynamic UPDATE query
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        setParts.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (setParts.length === 0) {
      return this.getProviderById(id);
    }

    setParts.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE "providers"
      SET ${setParts.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, display_name, endpoint,
                is_active, priority, rate_limit_per_minute, created_at, updated_at
    `;

    const result = await this.db.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    const r = result.rows[0] as {
      id: number;
      name: string;
      display_name: string;
      endpoint: string;
      is_active: boolean;
      priority: number;
      rate_limit_per_minute?: number;
      created_at: string;
      updated_at: string;
    };

    return {
      id: r.id,
      name: r.name,
      display_name: r.display_name,
      endpoint: r.endpoint,
      is_active: r.is_active,
      priority: r.priority,
      rate_limit_per_minute: r.rate_limit_per_minute,
      created_at: new Date(r.created_at),
      updated_at: new Date(r.updated_at),
    };
  }

  /**
   * Delete provider (only if no models reference it)
   */
  async deleteProvider(id: number): Promise<boolean> {
    // Clear cache when deleting provider
    ProviderManager.providerCache.clear();

    // Check if any models reference this provider
    const checkQuery = 'SELECT COUNT(*) as count FROM "ai_models" WHERE provider_id = $1';
    const checkResult = await this.db.query(checkQuery, [id]);
    const modelCount = parseInt((checkResult.rows[0] as { count: string }).count);

    if (modelCount > 0) {
      throw new Error(`Cannot delete provider: ${modelCount} models are still using this provider`);
    }

    const query = 'DELETE FROM "providers" WHERE id = $1';
    const result = await this.db.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  /**
   * Toggle provider active status
   */
  async toggleProviderStatus(id: number): Promise<Provider | null> {
    // Clear cache when toggling status
    ProviderManager.providerCache.clear();

    const query = `
      UPDATE "providers"
      SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, name, display_name, endpoint,
                is_active, priority, rate_limit_per_minute, created_at, updated_at
    `;

    const result = await this.db.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const r = result.rows[0] as {
      id: number;
      name: string;
      display_name: string;
      endpoint: string;
      is_active: boolean;
      priority: number;
      rate_limit_per_minute?: number;
      created_at: string;
      updated_at: string;
    };

    return {
      id: r.id,
      name: r.name,
      display_name: r.display_name,
      endpoint: r.endpoint,
      is_active: r.is_active,
      priority: r.priority,
      rate_limit_per_minute: r.rate_limit_per_minute,
      created_at: new Date(r.created_at),
      updated_at: new Date(r.updated_at),
    };
  }

  /**
   * Clear the provider cache manually
   */
  static clearCache(): void {
    ProviderManager.providerCache.clear();
  }

  /**
   * Validate provider endpoint and API key
   */
  async validateProvider(provider: Provider): Promise<boolean> {
    try {
      // Basic endpoint validation (not empty)
      if (!provider.endpoint || provider.endpoint.trim() === '') {
        return false;
      }

      // Check if API key environment variable exists using naming convention
      const apiKeyEnvName = `${provider.name.toUpperCase()}_API_KEY`;
      const apiKey = process.env[apiKeyEnvName];
      if (!apiKey) {
        console.warn(`API key environment variable ${apiKeyEnvName} not found for provider ${provider.name}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Error validating provider ${provider.name}:`, error);
      return false;
    }
  }

  /**
   * Get API key for provider using naming convention
   */
  static getProviderApiKey(providerName: string): string | undefined {
    const apiKeyEnvName = `${providerName.toUpperCase()}_API_KEY`;
    return process.env[apiKeyEnvName];
  }
}