import { ColumnScorer, ScoredColumn } from '../src/services/columnScorer';
import { ColumnInfo } from '../src/database/schema';

describe('ColumnScorer', () => {
  const mockColumns: ColumnInfo[] = [
    { table_name: 'trips', column_name: 'trip_id', data_type: 'integer', is_nullable: 'NO' },
    { table_name: 'trips', column_name: 'started_at', data_type: 'timestamp', is_nullable: 'NO' },
    { table_name: 'trips', column_name: 'ended_at', data_type: 'timestamp', is_nullable: 'NO' },
    { table_name: 'trips', column_name: 'trip_distance_km', data_type: 'numeric', is_nullable: 'YES' },
    { table_name: 'trips', column_name: 'rider_gender', data_type: 'character varying', is_nullable: 'YES' },
    { table_name: 'stations', column_name: 'station_name', data_type: 'character varying', is_nullable: 'NO' },
    { table_name: 'daily_weather', column_name: 'precipitation_mm', data_type: 'numeric', is_nullable: 'YES' }
  ];

  describe('scoreColumn', () => {
    it('should score exact column name matches with 100 points', () => {
      const userText = 'rider_gender';
      const genderColumn = mockColumns.find(col => col.column_name === 'rider_gender')!;
      
      const result = ColumnScorer.scoreColumn(userText, genderColumn);
      
      expect(result.score).toBeGreaterThanOrEqual(100);
      expect(result.reason).toContain('Exact column name match');
    });

    it('should score partial matches with 50 points', () => {
      const userText = 'station';
      const stationColumn = mockColumns.find(col => col.column_name === 'station_name')!;
      
      const result = ColumnScorer.scoreColumn(userText, stationColumn);
      
      expect(result.score).toBeGreaterThanOrEqual(50);
      expect(result.reason).toContain('Partial match');
    });

    it('should score table matches with 30 points', () => {
      const userText = 'weather';
      const weatherColumn = mockColumns.find(col => col.table_name === 'daily_weather')!;
      
      const result = ColumnScorer.scoreColumn(userText, weatherColumn);
      
      expect(result.score).toBeGreaterThanOrEqual(30);
      expect(result.reason).toContain('Table match');
    });

    it('should score data type relevance correctly', () => {
      const userText = 'time';
      const timeColumn = mockColumns.find(col => col.column_name === 'started_at')!;
      
      const result = ColumnScorer.scoreColumn(userText, timeColumn);
      
      expect(result.score).toBeGreaterThanOrEqual(20);
      expect(result.reason).toContain('Data type relevance');
    });

    it('should score naming patterns correctly', () => {
      const userText = 'name';
      const nameColumn = mockColumns.find(col => col.column_name === 'station_name')!;
      
      const result = ColumnScorer.scoreColumn(userText, nameColumn);
      
      expect(result.score).toBeGreaterThanOrEqual(25);
      expect(result.reason).toContain('Naming pattern match');
    });

    it('should score contextual relevance correctly', () => {
      const userText = 'station';
      const stationColumn = mockColumns.find(col => col.column_name === 'station_name')!;
      
      const result = ColumnScorer.scoreColumn(userText, stationColumn);
      
      expect(result.score).toBeGreaterThanOrEqual(15);
      expect(result.reason).toContain('Contextual relevance');
    });
  });

  describe('findBestMatches', () => {
    it('should return scored columns sorted by score', () => {
      const userText = 'women on rainy days';
      
      const results = ColumnScorer.findBestMatches(userText, mockColumns);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].score).toBeGreaterThanOrEqual(results[1]?.score || 0);
    });

    it('should filter out columns with zero score', () => {
      const userText = 'completely unrelated text';
      
      const results = ColumnScorer.findBestMatches(userText, mockColumns);
      
      expect(results.every(result => result.score > 0)).toBe(true);
    });
  });

  describe('findBestMatch', () => {
    it('should return the highest scoring column', () => {
      const userText = 'gender';
      
      const result = ColumnScorer.findBestMatch(userText, mockColumns);
      
      expect(result).not.toBeNull();
      expect(result!.column.column_name).toBe('rider_gender');
    });

    it('should return null for no matches', () => {
      const userText = 'completely unrelated text';
      
      const result = ColumnScorer.findBestMatch(userText, mockColumns);
      
      expect(result).toBeNull();
    });
  });

  describe('findColumnsForQueryType', () => {
    it('should filter columns for aggregation queries', () => {
      const userText = 'count total';
      
      const results = ColumnScorer.findColumnsForQueryType(userText, mockColumns, 'aggregation');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(result => 
        result.column.data_type.includes('numeric') || 
        result.column.data_type.includes('integer') ||
        result.column.data_type.includes('decimal')
      )).toBe(true);
    });

    it('should filter columns for filter queries', () => {
      const userText = 'filter by gender';
      
      const results = ColumnScorer.findColumnsForQueryType(userText, mockColumns, 'filter');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(result => 
        result.column.data_type.includes('character') ||
        result.column.data_type.includes('timestamp') ||
        result.column.data_type.includes('date') ||
        result.column.data_type.includes('boolean')
      )).toBe(true);
    });

    it('should filter columns for group by queries', () => {
      const userText = 'group by station';
      
      const results = ColumnScorer.findColumnsForQueryType(userText, mockColumns, 'group_by');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(result => 
        result.column.data_type.includes('character') ||
        result.column.data_type.includes('text') ||
        result.column.data_type.includes('varchar')
      )).toBe(true);
    });
  });

  describe('scoring accuracy', () => {
    it('should score gender-related queries correctly', () => {
      const userText = 'women';
      const genderColumn = mockColumns.find(col => col.column_name === 'rider_gender')!;
      
      const result = ColumnScorer.scoreColumn(userText, genderColumn);
      
      // Should have a high score due to semantic relevance
      expect(result.score).toBeGreaterThanOrEqual(40);
    });

    it('should score weather-related queries correctly', () => {
      const userText = 'rainy';
      const weatherColumn = mockColumns.find(col => col.column_name === 'precipitation_mm')!;
      
      const result = ColumnScorer.scoreColumn(userText, weatherColumn);
      
      // Should have a score due to table context
      expect(result.score).toBeGreaterThan(0);
    });

    it('should score location-related queries correctly', () => {
      const userText = 'Congress Avenue';
      const stationColumn = mockColumns.find(col => col.column_name === 'station_name')!;
      
      const result = ColumnScorer.scoreColumn(userText, stationColumn);
      
      // Should have a score due to table context
      expect(result.score).toBeGreaterThan(0);
    });
  });
});
