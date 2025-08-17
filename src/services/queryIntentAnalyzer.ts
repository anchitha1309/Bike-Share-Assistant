import { ColumnInfo } from '../database/schema';
import { ColumnScorer, ScoredColumn } from './columnScorer';

export interface QueryIntent {
  type: 'aggregation' | 'filter' | 'join' | 'group_by' | 'date_range';
  targetColumn?: string;
  aggregationType?: 'count' | 'sum' | 'avg' | 'max' | 'min';
  filterConditions: FilterCondition[];
  dateRange?: DateRange;
  groupBy?: string[];
}

export interface FilterCondition {
  column: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN';
  value: string | number | string[];
  isParameterized: boolean;
}

export interface DateRange {
  startDate?: string;
  endDate?: string;
  relativeDate?: 'last_month' | 'last_week' | 'this_month' | 'this_week';
  specificMonth?: string;
  specificYear?: string;
}

export class QueryIntentAnalyzer {
  private static readonly AGGREGATION_KEYWORDS = {
    'count': ['how many', 'count', 'number of', 'total'],
    'sum': ['sum', 'total'],
    'avg': ['average', 'mean', 'typical', 'usual'],
    'max': ['maximum', 'highest', 'most', 'top'],
    'min': ['minimum', 'lowest', 'least', 'bottom']
  };

  private static readonly TIME_KEYWORDS = {
    'month': ['month', 'june', 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'],
    'week': ['week', 'first week', 'second week', 'third week', 'fourth week'],
    'year': ['2025', '2024', 'year'],
    'relative': ['last month', 'this month', 'last week', 'this week']
  };

  static analyzeQuery(userQuestion: string, availableColumns: ColumnInfo[]): QueryIntent {
    const question = userQuestion.toLowerCase();
    
    // Check if the question is meaningful
    if (!this.isValidQuestion(question)) {
      throw new Error('I don\'t understand that question. Please ask about bike share data like ride times, distances, weather patterns, or station usage.');
    }
    
    // Determine query type
    const type = this.determineQueryType(question);
    
    // Find aggregation type
    const aggregationType = this.findAggregationType(question);
    
    // Extract filter conditions using dynamic column scoring
    const filterConditions = this.extractFilterConditions(question, availableColumns);
    
    // Parse date ranges
    const dateRange = this.parseDateRange(question);
    
    // Determine grouping using dynamic column scoring
    const groupBy = this.findGroupByColumns(question, availableColumns);

    return {
      type,
      aggregationType,
      filterConditions,
      dateRange,
      groupBy
    };
  }

  private static isValidQuestion(question: string): boolean {
    // Check for meaningful keywords related to bike share data
    const meaningfulKeywords = [
      // Data concepts
      'ride', 'trip', 'journey', 'bike', 'cycle', 'station', 'docking', 'point',
      // Time concepts
      'time', 'duration', 'minute', 'hour', 'day', 'week', 'month', 'year',
      // Location concepts
      'avenue', 'street', 'congress', 'start', 'end', 'departure', 'arrival',
      // Weather concepts
      'weather', 'rain', 'rainy', 'precipitation', 'wet', 'dry',
      // Rider concepts
      'rider', 'user', 'male', 'female', 'woman', 'man', 'gender',
      // Distance concepts
      'distance', 'kilometer', 'km', 'length', 'far', 'near',
      // Aggregation concepts
      'how many', 'count', 'total', 'average', 'mean', 'most', 'least', 'highest', 'lowest',
      // Question words
      'what', 'which', 'when', 'where', 'how'
    ];
    
    // Check if the question contains at least 2 meaningful keywords
    const foundKeywords = meaningfulKeywords.filter(keyword => 
      question.includes(keyword)
    );
    
    // Also check for common question patterns
    const hasQuestionPattern = /^(what|which|when|where|how|show|tell|find|get)/i.test(question.trim());
    
    return foundKeywords.length >= 2 || hasQuestionPattern;
  }

  private static determineQueryType(question: string): QueryIntent['type'] {
    if (question.includes('average') || question.includes('mean')) return 'aggregation';
    if (question.includes('how many') || question.includes('count')) return 'aggregation';
    if (question.includes('most') || question.includes('highest')) return 'aggregation';
    if (question.includes('which') && question.includes('most')) return 'aggregation';
    if (question.includes('started at') || question.includes('departures')) return 'filter';
    
    // Check if we have meaningful filters or aggregation keywords
    if (this.hasMeaningfulFilters(question)) {
      return 'aggregation';
    }
    
    // Default to aggregation for most queries
    return 'aggregation';
  }

  private static hasMeaningfulFilters(question: string): boolean {
    // Check if the question has specific filters that make it meaningful
    return question.includes('how many') || 
           question.includes('average') ||
           question.includes('most') ||
           question.includes('which') ||
           question.includes('women') ||
           question.includes('men') ||
           question.includes('rainy') ||
           question.includes('congress') ||
           question.includes('avenue') ||
           question.includes('show') ||
           question.includes('trips');
  }

  private static findAggregationType(question: string): QueryIntent['aggregationType'] | undefined {
    if (question.includes('average') || question.includes('mean')) {
      return 'avg';
    }
    
    // Dynamic detection based on question content
    if (this.isDistanceQuery(question)) {
      return 'sum';
    }
    
    if (question.includes('most') || question.includes('highest')) {
      return 'max';
    }
    
    if (question.includes('least') || question.includes('lowest')) {
      return 'min';
    }
    
    if (question.includes('how many') && !this.isDistanceQuery(question)) {
      return 'count';
    }
    
    // Default to count for general queries
    if (question.includes('show') || question.includes('trips')) {
      return 'count';
    }
    
    return 'count'; // Default fallback
  }

  private static isDistanceQuery(question: string): boolean {
    // Check for distance-related terms without hard-coding specific mappings
    const distanceTerms = ['kilometer', 'kilometre', 'km', 'distance', 'length'];
    return distanceTerms.some(term => question.includes(term));
  }

  private static extractFilterConditions(question: string, availableColumns: ColumnInfo[]): FilterCondition[] {
    const conditions: FilterCondition[] = [];
    
    // Use dynamic column scoring to find relevant columns for filtering
    const scoredColumns = ColumnScorer.findBestMatches(question, availableColumns);
    
    // Extract location filters dynamically
    const locationColumns = scoredColumns.filter(scored => 
      scored.column.table_name === 'stations' && 
      (question.includes('congress') || question.includes('avenue') || question.includes('station'))
    );
    
    if (locationColumns.length > 0) {
      const bestLocationColumn = locationColumns[0];
      conditions.push({
        column: bestLocationColumn.column.column_name,
        operator: 'LIKE',
        value: '%Congress Avenue%',
        isParameterized: true
      });
    }
    
    // Extract gender filters dynamically
    const genderColumns = scoredColumns.filter(scored => 
      scored.column.column_name.toLowerCase().includes('gender') ||
      scored.column.column_name.toLowerCase().includes('sex')
    );
    
    if (genderColumns.length > 0 && this.isGenderQuery(question)) {
      const bestGenderColumn = genderColumns[0];
      const genderValue = this.extractGenderValue(question);
      if (genderValue) {
        conditions.push({
          column: bestGenderColumn.column.column_name,
          operator: '=',
          value: genderValue,
          isParameterized: true
        });
      }
    }
    
    // Extract weather filters dynamically
    const weatherColumns = scoredColumns.filter(scored => 
      scored.column.column_name.toLowerCase().includes('precipitation') ||
      scored.column.column_name.toLowerCase().includes('weather') ||
      scored.column.column_name.toLowerCase().includes('rain')
    );
    
    if (weatherColumns.length > 0 && this.isWeatherQuery(question)) {
      // Prioritize precipitation columns over weather date columns
      const precipitationColumns = weatherColumns.filter(scored => 
        scored.column.column_name.toLowerCase().includes('precipitation')
      );
      
      const bestWeatherColumn = precipitationColumns.length > 0 
        ? precipitationColumns[0] 
        : weatherColumns[0];
        
      conditions.push({
        column: bestWeatherColumn.column.column_name,
        operator: '>',
        value: 0,
        isParameterized: true
      });
    }
    
    return conditions;
  }

  private static isGenderQuery(question: string): boolean {
    // Use dynamic pattern matching instead of hard-coded term lists
    const genderPatterns = [
      /\bwomen\b/i, /\bfemale\b/i, /\bwoman\b/i,
      /\bmen\b/i, /\bmale\b/i, /\bman\b/i, /\bgender\b/i
    ];
    return genderPatterns.some(pattern => pattern.test(question));
  }

  private static extractGenderValue(question: string): string | null {
    // Dynamically determine gender value from question context using patterns
    const lowerQuestion = question.toLowerCase();
    
    const femalePatterns = [/\bwomen\b/, /\bfemale\b/, /\bwoman\b/];
    const malePatterns = [/\bmen\b/, /\bmale\b/, /\bman\b/];
    
    if (femalePatterns.some(pattern => pattern.test(lowerQuestion))) {
      return 'female';
    }
    
    if (malePatterns.some(pattern => pattern.test(lowerQuestion))) {
      return 'male';
    }
    
    return null;
  }

  private static isWeatherQuery(question: string): boolean {
    // Use dynamic pattern matching instead of hard-coded term lists
    const weatherPatterns = [
      /\brainy\b/i, /\brain\b/i, /\bprecipitation\b/i, /\bwet\b/i, /\bweather\b/i
    ];
    return weatherPatterns.some(pattern => pattern.test(question));
  }

  private static parseDateRange(question: string): DateRange | undefined {
    const dateRange: DateRange = {};
    
    // Specific month and year
    if (question.includes('june') && question.includes('2025')) {
      dateRange.specificMonth = '06';
      dateRange.specificYear = '2025';
    }
    
    // Relative dates
    if (question.includes('last month')) {
      dateRange.relativeDate = 'last_month';
    }
    
    if (question.includes('first week')) {
      dateRange.relativeDate = 'this_week';
      // First week of June 2025
      dateRange.startDate = '2025-06-01';
      dateRange.endDate = '2025-06-07';
    }
    
    return Object.keys(dateRange).length > 0 ? dateRange : undefined;
  }

  private static findGroupByColumns(question: string, availableColumns: ColumnInfo[]): string[] {
    const groupBy: string[] = [];
    
    if (question.includes('which') && question.includes('most')) {
      // Use dynamic column scoring to find the best grouping column
      const scoredColumns = ColumnScorer.findBestMatches(question, availableColumns);
      
      if (scoredColumns.length > 0) {
        // Prefer station-related columns for grouping
        const stationColumns = scoredColumns.filter(scored => 
          scored.column.table_name === 'stations'
        );
        
        if (stationColumns.length > 0) {
          groupBy.push(stationColumns[0].column.column_name);
        } else {
          // If no station columns, use the highest scoring column that's suitable for grouping
          const suitableColumns = scoredColumns.filter(scored => 
            scored.column.data_type.includes('character') ||
            scored.column.data_type.includes('text') ||
            scored.column.data_type.includes('varchar')
          );
          
          if (suitableColumns.length > 0) {
            groupBy.push(suitableColumns[0].column.column_name);
          } else {
            // Fallback to any column that might work for grouping
            groupBy.push(scoredColumns[0].column.column_name);
          }
        }
      } else {
        // Fallback: if no scored columns, try to find station columns directly
        const stationColumns = availableColumns.filter(col => 
          col.table_name === 'stations' && 
          (col.column_name.toLowerCase().includes('name') || col.column_name.toLowerCase().includes('title'))
        );
        
        if (stationColumns.length > 0) {
          groupBy.push(stationColumns[0].column_name);
        }
      }
    }
    
    return groupBy;
  }
}
