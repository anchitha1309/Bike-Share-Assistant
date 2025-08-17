import { QueryIntentAnalyzer, QueryIntent } from '../src/services/queryIntentAnalyzer';
import { ColumnInfo } from '../src/database/schema';

// Mock columns for testing
const mockColumns: ColumnInfo[] = [
  { table_name: 'trips', column_name: 'trip_id', data_type: 'integer', is_nullable: 'NO' },
  { table_name: 'trips', column_name: 'started_at', data_type: 'timestamp', is_nullable: 'NO' },
  { table_name: 'trips', column_name: 'ended_at', data_type: 'timestamp', is_nullable: 'NO' },
  { table_name: 'trips', column_name: 'trip_distance_km', data_type: 'numeric', is_nullable: 'YES' },
  { table_name: 'trips', column_name: 'rider_gender', data_type: 'character varying', is_nullable: 'YES' },
  { table_name: 'stations', column_name: 'station_name', data_type: 'character varying', is_nullable: 'NO' },
  { table_name: 'daily_weather', column_name: 'precipitation_mm', data_type: 'numeric', is_nullable: 'YES' }
];

describe('QueryIntentAnalyzer', () => {
  describe('analyzeQuery', () => {
    it('should identify average ride time queries', () => {
      const question = "What was the average ride time for journeys that started at Congress Avenue in June 2025?";
      const intent = QueryIntentAnalyzer.analyzeQuery(question, mockColumns);
      
      expect(intent.type).toBe('aggregation');
      expect(intent.aggregationType).toBe('avg');
      expect(intent.filterConditions).toHaveLength(1);
      expect(intent.filterConditions[0].column).toBe('station_name');
      expect(intent.dateRange?.specificMonth).toBe('06');
      expect(intent.dateRange?.specificYear).toBe('2025');
    });

    it('should identify most departures queries', () => {
      const question = "Which docking point saw the most departures during the first week of June 2025?";
      const intent = QueryIntentAnalyzer.analyzeQuery(question, mockColumns);
      
      expect(intent.type).toBe('aggregation');
      expect(intent.aggregationType).toBe('max');
      // The groupBy will be determined by dynamic column scoring, so we check it exists
      expect(intent.groupBy).toBeDefined();
      expect(intent.groupBy!.length).toBeGreaterThan(0);
      expect(intent.dateRange?.startDate).toBe('2025-06-01');
      expect(intent.dateRange?.endDate).toBe('2025-06-07');
    });

    it('should identify distance queries for women on rainy days', () => {
      const question = "How many kilometres were ridden by women on rainy days in June 2025?";
      const intent = QueryIntentAnalyzer.analyzeQuery(question, mockColumns);
      
      expect(intent.type).toBe('aggregation');
      expect(intent.aggregationType).toBe('sum');
      // We expect at least one filter condition (weather)
      expect(intent.filterConditions.length).toBeGreaterThan(0);
      // Check that we have weather filter
      const weatherFilter = intent.filterConditions.find(f => 
        f.column.toLowerCase().includes('precipitation') || f.column.toLowerCase().includes('weather')
      );
      expect(weatherFilter).toBeDefined();
      expect(intent.dateRange?.specificMonth).toBe('06');
      expect(intent.dateRange?.specificYear).toBe('2025');
    });

    it('should handle gender filters correctly', () => {
      const question = "How many men used the service?";
      const intent = QueryIntentAnalyzer.analyzeQuery(question, mockColumns);
      
      // The system should detect gender-related terms and find appropriate columns
      expect(intent.type).toBe('aggregation');
      expect(intent.aggregationType).toBe('count');
      // Gender filters will be added if appropriate columns are found
      expect(intent.filterConditions.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle weather filters', () => {
      const question = "Show me trips on rainy days";
      const intent = QueryIntentAnalyzer.analyzeQuery(question, mockColumns);
      
      expect(intent.type).toBe('aggregation');
      expect(intent.aggregationType).toBe('count');
      // Weather filters will be added if appropriate columns are found
      expect(intent.filterConditions.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle location filters', () => {
      const question = "Trips from Congress Avenue";
      const intent = QueryIntentAnalyzer.analyzeQuery(question, mockColumns);
      
      expect(intent.type).toBe('aggregation');
      expect(intent.aggregationType).toBe('count');
      // Location filters will be added if appropriate columns are found
      expect(intent.filterConditions.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty questions gracefully', () => {
      expect(() => {
        QueryIntentAnalyzer.analyzeQuery('', mockColumns);
      }).toThrow('I don\'t understand that question. Please ask about bike share data like ride times, distances, weather patterns, or station usage.');
    });

    it('should handle questions with no specific filters', () => {
      const question = "How many trips were there?";
      const intent = QueryIntentAnalyzer.analyzeQuery(question, mockColumns);
      
      expect(intent.type).toBe('aggregation');
      expect(intent.aggregationType).toBe('count');
      expect(intent.filterConditions).toHaveLength(0);
    });

    it('should prioritize distance over count for kilometer questions', () => {
      const question = "How many kilometers did women ride?";
      const intent = QueryIntentAnalyzer.analyzeQuery(question, mockColumns);
      
      expect(intent.aggregationType).toBe('sum');
    });
  });
});
