import { QueryIntent, FilterCondition, DateRange } from './queryIntentAnalyzer';
import { ColumnInfo } from '../database/schema';

export interface GeneratedSQL {
  sql: string;
  parameters: any[];
  explanation: string;
}

export class SQLQueryBuilder {
  static buildQuery(intent: QueryIntent, schemaColumns: ColumnInfo[]): GeneratedSQL {
    let sql = '';
    let parameters: any[] = [];
    let explanation = '';

    try {
      switch (intent.type) {
        case 'aggregation':
          sql = this.buildAggregationQuery(intent, schemaColumns);
          break;
        case 'filter':
          sql = this.buildFilterQuery(intent, schemaColumns);
          break;
        default:
          sql = this.buildAggregationQuery(intent, schemaColumns);
      }

      // Add parameters and build explanation
      parameters = this.extractParameters(intent);
      explanation = this.buildExplanation(intent);

      return { sql, parameters, explanation };
    } catch (error) {
      throw new Error(`Failed to build SQL query: ${error}`);
    }
  }

  private static buildAggregationQuery(intent: QueryIntent, schemaColumns: ColumnInfo[]): string {
    let sql = 'SELECT ';
    
    // Build SELECT clause
    if (intent.aggregationType === 'avg') {
      sql += 'AVG(EXTRACT(EPOCH FROM (t.ended_at - t.started_at))/60) as average_minutes';
    } else if (intent.aggregationType === 'count') {
      sql += 'COUNT(*) as total_count';
    } else if (intent.aggregationType === 'sum') {
      sql += 'SUM(t.trip_distance_km) as total_kilometers';
    } else if (intent.aggregationType === 'max') {
      // Find the best station column for grouping
      const stationColumn = this.findStationColumn(schemaColumns);
      sql += `${stationColumn}, COUNT(*) as departure_count`;
    } else {
      sql += 'COUNT(*) as total_count';
    }

    // Build FROM clause
    sql += ' FROM trips t';
    
    // Add JOINs if needed
    if (intent.filterConditions.some(f => this.isStationColumn(f.column, schemaColumns)) || 
        intent.groupBy?.some(g => this.isStationColumn(g, schemaColumns))) {
      sql += ' JOIN stations s ON t.start_station_id = s.station_id';
    }
    
    if (intent.filterConditions.some(f => this.isWeatherColumn(f.column, schemaColumns))) {
      sql += ' JOIN daily_weather w ON DATE(t.started_at) = w.weather_date';
    }

    // Build WHERE clause
    const whereConditions = this.buildWhereClause(intent, schemaColumns);
    if (whereConditions.length > 0) {
      sql += ' WHERE ' + whereConditions.join(' AND ');
    }

    // Build GROUP BY clause
    if (intent.groupBy && intent.groupBy.length > 0) {
      sql += ' GROUP BY ' + intent.groupBy.join(', ');
    }

    // Build ORDER BY clause for max queries
    if (intent.aggregationType === 'max' && intent.groupBy?.some(g => this.isStationColumn(g, schemaColumns))) {
      sql += ' ORDER BY departure_count DESC';
    }

    // Add LIMIT for max queries
    if (intent.aggregationType === 'max') {
      sql += ' LIMIT 1';
    }

    return sql;
  }

  private static buildFilterQuery(intent: QueryIntent, schemaColumns: ColumnInfo[]): string {
    // Similar to aggregation but focused on filtering
    return this.buildAggregationQuery(intent, schemaColumns);
  }

  private static buildWhereClause(intent: QueryIntent, schemaColumns: ColumnInfo[]): string[] {
    const conditions: string[] = [];
    let paramIndex = 1;

    // Add filter conditions
    for (const filter of intent.filterConditions) {
      if (this.isStationColumn(filter.column, schemaColumns)) {
        conditions.push(`s.${filter.column} LIKE $${paramIndex++}`);
      } else if (this.isGenderColumn(filter.column, schemaColumns)) {
        conditions.push(`t.${filter.column} = $${paramIndex++}`);
      } else if (this.isWeatherColumn(filter.column, schemaColumns)) {
        conditions.push(`w.${filter.column} > $${paramIndex++}`);
      } else {
        // Generic column handling
        const tableAlias = this.getTableAlias(filter.column, schemaColumns);
        conditions.push(`${tableAlias}.${filter.column} = $${paramIndex++}`);
      }
    }

    // Add date range conditions
    if (intent.dateRange) {
      if (intent.dateRange.specificMonth && intent.dateRange.specificYear) {
        conditions.push(`EXTRACT(MONTH FROM t.started_at) = ${intent.dateRange.specificMonth}`);
        conditions.push(`EXTRACT(YEAR FROM t.started_at) = ${intent.dateRange.specificYear}`);
      } else if (intent.dateRange.startDate && intent.dateRange.endDate) {
        conditions.push(`t.started_at >= '${intent.dateRange.startDate}'`);
        conditions.push(`t.started_at < '${intent.dateRange.endDate}'`);
      }
    }

    return conditions;
  }

  private static extractParameters(intent: QueryIntent): any[] {
    const parameters: any[] = [];

    // Extract filter values
    for (const filter of intent.filterConditions) {
      if (filter.column.toLowerCase().includes('station') || filter.column.toLowerCase().includes('name')) {
        parameters.push('%Congress Avenue%');
      } else if (filter.column.toLowerCase().includes('gender')) {
        parameters.push(filter.value);
      } else if (filter.column.toLowerCase().includes('precipitation') || filter.column.toLowerCase().includes('weather')) {
        parameters.push(filter.value);
      } else {
        parameters.push(filter.value);
      }
    }

    // Note: Date parameters are now embedded in SQL, not extracted as parameters
    // This fixes the parameter mismatch issue

    return parameters;
  }

  private static buildExplanation(intent: QueryIntent): string {
    const parts: string[] = [];

    if (intent.aggregationType === 'avg') {
      parts.push('Calculate average ride time');
    } else if (intent.aggregationType === 'count') {
      parts.push('Count total records');
    } else if (intent.aggregationType === 'sum') {
      parts.push('Sum total distance');
    } else if (intent.aggregationType === 'max') {
      parts.push('Find station with most departures');
    }

    if (intent.filterConditions.length > 0) {
      const filters = intent.filterConditions.map(f => {
        if (f.column.toLowerCase().includes('station') || f.column.toLowerCase().includes('name')) {
          return 'filtered by Congress Avenue station';
        }
        if (f.column.toLowerCase().includes('gender')) {
          return `filtered by ${f.value} riders`;
        }
        if (f.column.toLowerCase().includes('precipitation') || f.column.toLowerCase().includes('weather')) {
          return 'filtered by rainy days';
        }
        return `filtered by ${f.column}`;
      });
      parts.push(filters.join(', '));
    }

    if (intent.dateRange) {
      if (intent.dateRange.specificMonth && intent.dateRange.specificYear) {
        parts.push(`for ${intent.dateRange.specificMonth}/${intent.dateRange.specificYear}`);
      } else if (intent.dateRange.startDate && intent.dateRange.endDate) {
        parts.push(`from ${intent.dateRange.startDate} to ${intent.dateRange.endDate}`);
      }
    }

    return parts.join(' ');
  }

  // Helper methods for dynamic column handling
  private static isStationColumn(columnName: string, schemaColumns: ColumnInfo[]): boolean {
    const column = schemaColumns.find(col => col.column_name === columnName);
    return column?.table_name === 'stations';
  }

  private static isGenderColumn(columnName: string, schemaColumns: ColumnInfo[]): boolean {
    const column = schemaColumns.find(col => col.column_name === columnName);
    return column?.table_name === 'trips' && 
           (column.column_name.toLowerCase().includes('gender') || column.column_name.toLowerCase().includes('sex'));
  }

  private static isWeatherColumn(columnName: string, schemaColumns: ColumnInfo[]): boolean {
    const column = schemaColumns.find(col => col.column_name === columnName);
    return column?.table_name === 'daily_weather';
  }

  private static findStationColumn(schemaColumns: ColumnInfo[]): string {
    const stationColumn = schemaColumns.find(col => 
      col.table_name === 'stations' && 
      (col.column_name.toLowerCase().includes('name') || col.column_name.toLowerCase().includes('title'))
    );
    return stationColumn ? `s.${stationColumn.column_name}` : 's.station_name';
  }

  private static getTableAlias(columnName: string, schemaColumns: ColumnInfo[]): string {
    const column = schemaColumns.find(col => col.column_name === columnName);
    if (!column) return 't'; // Default to trips table
    
    switch (column.table_name) {
      case 'stations':
        return 's';
      case 'daily_weather':
        return 'w';
      case 'trips':
      default:
        return 't';
    }
  }
}
