import { pool } from './connection';

export interface ColumnInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default?: string;
}

export interface TableInfo {
  table_name: string;
  columns: ColumnInfo[];
}

export class SchemaDiscovery {
  private static instance: SchemaDiscovery;
  private schemaCache: Map<string, TableInfo> = new Map();
  private lastRefresh: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): SchemaDiscovery {
    if (!SchemaDiscovery.instance) {
      SchemaDiscovery.instance = new SchemaDiscovery();
    }
    return SchemaDiscovery.instance;
  }

  async getSchema(): Promise<Map<string, TableInfo>> {
    const currentTime = Date.now();
    if (currentTime - this.lastRefresh > this.CACHE_TTL) {
      await this.refreshSchema(currentTime);
    }
    return this.schemaCache;
  }

  private async refreshSchema(currentTime: number): Promise<void> {
    try {
      const query = `
        SELECT 
          c.table_name,
          c.column_name,
          c.data_type,
          c.is_nullable,
          c.column_default
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
        ORDER BY c.table_name, c.ordinal_position
      `;

      const result = await pool.query(query);
      
      // Group columns by table
      const tableMap = new Map<string, TableInfo>();
      
      for (const row of result.rows) {
        const { table_name, column_name, data_type, is_nullable, column_default } = row;
        
        if (!tableMap.has(table_name)) {
          tableMap.set(table_name, { table_name, columns: [] });
        }
        
        tableMap.get(table_name)!.columns.push({
          table_name,
          column_name,
          data_type,
          is_nullable,
          column_default
        });
      }

      this.schemaCache = tableMap;
      this.lastRefresh = currentTime;
      
      console.log(`📊 Schema refreshed: ${tableMap.size} tables discovered`);
      
      // Log table structure for debugging
      for (const [tableName, tableInfo] of tableMap) {
        console.log(`\n📋 Table: ${tableName}`);
        tableInfo.columns.forEach(col => {
          console.log(`  - ${col.column_name} (${col.data_type})`);
        });
      }
      
    } catch (error) {
      console.error('❌ Failed to refresh schema:', error);
      throw error;
    }
  }

  async getTableNames(): Promise<string[]> {
    const schema = await this.getSchema();
    return Array.from(schema.keys());
  }

  async getColumnsForTable(tableName: string): Promise<ColumnInfo[]> {
    const schema = await this.getSchema();
    return schema.get(tableName)?.columns || [];
  }

  async getAllColumns(): Promise<ColumnInfo[]> {
    const schema = await this.getSchema();
    const allColumns: ColumnInfo[] = [];
    for (const tableInfo of schema.values()) {
      allColumns.push(...tableInfo.columns);
    }
    return allColumns;
  }
}
