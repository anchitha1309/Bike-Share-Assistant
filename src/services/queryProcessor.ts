import { QueryIntentAnalyzer, QueryIntent } from './queryIntentAnalyzer';
import { SQLQueryBuilder, GeneratedSQL } from './sqlQueryBuilder';
import { SchemaDiscovery } from '../database/schema';
import { pool } from '../database/connection';

export interface QueryResult {
  sql: string;
  result: any;
  error: string | null;
  explanation: string;
  executionTime: number;
}

export class QueryProcessor {
  private static instance: QueryProcessor;
  private schemaDiscovery: SchemaDiscovery;

  private constructor() {
    this.schemaDiscovery = SchemaDiscovery.getInstance();
  }

  static getInstance(): QueryProcessor {
    if (!QueryProcessor.instance) {
      QueryProcessor.instance = new QueryProcessor();
    }
    return QueryProcessor.instance;
  }

  async processQuery(userQuestion: string): Promise<QueryResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Processing query: "${userQuestion}"`);
      
      // Step 1: Get database schema first
      const schema = await this.schemaDiscovery.getSchema();
      const allColumns = await this.schemaDiscovery.getAllColumns();
      
      // Step 2: Analyze the user's intent using dynamic column scoring
      const intent = QueryIntentAnalyzer.analyzeQuery(userQuestion, allColumns);
      console.log('📊 Query intent:', JSON.stringify(intent, null, 2));
      
      // Step 3: Generate SQL query
      const generatedSQL = SQLQueryBuilder.buildQuery(intent, allColumns);
      console.log('🔧 Generated SQL:', generatedSQL.sql);
      console.log('📝 Parameters:', generatedSQL.parameters);
      
      // Step 4: Execute the query
      const result = await this.executeQuery(generatedSQL.sql, generatedSQL.parameters);
      
      const executionTime = Date.now() - startTime;
      
      return {
        sql: generatedSQL.sql,
        result: result,
        error: null,
        explanation: generatedSQL.explanation,
        executionTime
      };
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('❌ Query processing failed:', error);
      
      return {
        sql: '',
        result: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        explanation: '',
        executionTime
      };
    }
  }

  private async executeQuery(sql: string, parameters: any[]): Promise<any> {
    try {
      console.log('🚀 Executing SQL query...');
      
      const client = await pool.connect();
      const result = await client.query(sql, parameters);
      client.release();
      
      console.log(`✅ Query executed successfully. Rows returned: ${result.rows.length}`);
      
      // Format the result based on the query type
      if (result.rows.length === 1 && result.rows[0].average_minutes !== undefined) {
        // Average ride time query
        const minutes = Math.round(result.rows[0].average_minutes);
        return { average_minutes: minutes, formatted_result: `${minutes} minutes` };
      } else if (result.rows.length === 1 && result.rows[0].total_kilometers !== undefined) {
        // Total distance query
        const km = parseFloat(result.rows[0].total_kilometers).toFixed(1);
        return { total_kilometers: km, formatted_result: `${km} km` };
      } else if (result.rows.length === 1 && result.rows[0].station_name !== undefined) {
        // Station with most departures
        return { 
          station_name: result.rows[0].station_name, 
          departure_count: result.rows[0].departure_count,
          formatted_result: result.rows[0].station_name
        };
      } else if (result.rows.length === 1 && result.rows[0].total_count !== undefined) {
        // Count query
        return { total_count: result.rows[0].total_count, formatted_result: result.rows[0].total_count };
      } else {
        // Return raw results
        return result.rows;
      }
      
    } catch (error) {
      console.error('❌ Query execution failed:', error);
      throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper method to test specific queries
  async testSampleQueries(): Promise<void> {
    const testQueries = [
      "What was the average ride time for journeys that started at Congress Avenue in June 2025?",
      "Which docking point saw the most departures during the first week of June 2025?",
      "How many kilometres were ridden by women on rainy days in June 2025?"
    ];

    console.log('🧪 Testing sample queries...\n');

    for (const query of testQueries) {
      try {
        console.log(`\n📝 Testing: "${query}"`);
        const result = await this.processQuery(query);
        
        if (result.error) {
          console.log(`❌ Failed: ${result.error}`);
        } else {
          console.log(`✅ Success: ${JSON.stringify(result.result, null, 2)}`);
          console.log(`🔧 SQL: ${result.sql}`);
          console.log(`📝 Explanation: ${result.explanation}`);
          console.log(`⏱️  Execution time: ${result.executionTime}ms`);
        }
      } catch (error) {
        console.log(`❌ Test failed: ${error}`);
      }
    }
  }
}
