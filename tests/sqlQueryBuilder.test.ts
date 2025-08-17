import { SQLQueryBuilder, GeneratedSQL } from '../src/services/sqlQueryBuilder';
import { QueryIntent, FilterCondition, DateRange } from '../src/services/queryIntentAnalyzer';
import { ColumnInfo } from '../src/database/schema';

describe('SQLQueryBuilder', () => {
  const mockColumns: ColumnInfo[] = [
    { table_name: 'trips', column_name: 'trip_id', data_type: 'integer', is_nullable: 'NO' },
    { table_name: 'trips', column_name: 'started_at', data_type: 'timestamp', is_nullable: 'NO' },
    { table_name: 'trips', column_name: 'ended_at', data_type: 'timestamp', is_nullable: 'NO' },
    { table_name: 'trips', column_name: 'trip_distance_km', data_type: 'numeric', is_nullable: 'YES' },
    { table_name: 'trips', column_name: 'rider_gender', data_type: 'character varying', is_nullable: 'YES' },
    { table_name: 'stations', column_name: 'station_name', data_type: 'character varying', is_nullable: 'NO' },
    { table_name: 'daily_weather', column_name: 'precipitation_mm', data_type: 'numeric', is_nullable: 'YES' }
  ];

  describe('buildQuery', () => {
    it('should build average ride time query', () => {
      const intent: QueryIntent = {
        type: 'aggregation',
        aggregationType: 'avg',
        filterConditions: [
          { column: 'station_name', operator: 'LIKE', value: '%Congress Avenue%', isParameterized: true }
        ],
        dateRange: { specificMonth: '06', specificYear: '2025' },
        groupBy: []
      };

      const result = SQLQueryBuilder.buildQuery(intent, mockColumns);
      
      expect(result.sql).toContain('SELECT AVG(EXTRACT(EPOCH FROM (t.ended_at - t.started_at))/60)');
      expect(result.sql).toContain('FROM trips t');
      expect(result.sql).toContain('JOIN stations s');
      expect(result.sql).toContain('WHERE s.station_name LIKE $1');
      expect(result.parameters).toEqual(['%Congress Avenue%']);
    });

    it('should build most departures query', () => {
      const intent: QueryIntent = {
        type: 'aggregation',
        aggregationType: 'max',
        filterConditions: [],
        dateRange: { specificMonth: '06', specificYear: '2025' },
        groupBy: ['station_name']
      };

      const result = SQLQueryBuilder.buildQuery(intent, mockColumns);
      
      expect(result.sql).toContain('SELECT s.station_name, COUNT(*) as departure_count');
      expect(result.sql).toContain('GROUP BY station_name');
      expect(result.sql).toContain('ORDER BY departure_count DESC');
      expect(result.sql).toContain('LIMIT 1');
    });

    it('should build distance sum query for women on rainy days', () => {
      const intent: QueryIntent = {
        type: 'aggregation',
        aggregationType: 'sum',
        filterConditions: [
          { column: 'rider_gender', operator: '=', value: 'female', isParameterized: true },
          { column: 'precipitation_mm', operator: '>', value: 0, isParameterized: true }
        ],
        dateRange: { specificMonth: '06', specificYear: '2025' },
        groupBy: []
      };

      const result = SQLQueryBuilder.buildQuery(intent, mockColumns);
      
      expect(result.sql).toContain('SELECT SUM(t.trip_distance_km) as total_kilometers');
      expect(result.sql).toContain('JOIN daily_weather w');
      expect(result.sql).toContain('WHERE t.rider_gender = $1');
      expect(result.sql).toContain('AND w.precipitation_mm > $2');
      expect(result.parameters).toEqual(['female', 0]);
    });

    it('should handle queries without filters', () => {
      const intent: QueryIntent = {
        type: 'aggregation',
        aggregationType: 'count',
        filterConditions: [],
        groupBy: []
      };

      const result = SQLQueryBuilder.buildQuery(intent, mockColumns);
      
      expect(result.sql).toContain('SELECT COUNT(*) as total_count');
      expect(result.sql).toContain('FROM trips t');
      expect(result.sql).not.toContain('WHERE');
    });

    it('should handle date range filters', () => {
      const intent: QueryIntent = {
        type: 'aggregation',
        aggregationType: 'count',
        filterConditions: [],
        dateRange: { startDate: '2025-06-01', endDate: '2025-06-07' },
        groupBy: []
      };

      const result = SQLQueryBuilder.buildQuery(intent, mockColumns);
      
      expect(result.sql).toContain('t.started_at >= \'2025-06-01\'');
      expect(result.sql).toContain('t.started_at < \'2025-06-07\'');
    });
  });

  describe('error handling', () => {
    it('should handle invalid intent gracefully', () => {
      const invalidIntent = {} as QueryIntent;
      
      expect(() => {
        SQLQueryBuilder.buildQuery(invalidIntent, mockColumns);
      }).toThrow();
    });
  });
});
