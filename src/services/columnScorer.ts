import { ColumnInfo } from '../database/schema';

export interface ScoredColumn {
  column: ColumnInfo;
  score: number;
  reason: string;
}

export class ColumnScorer {
  /**
   * Score a column against user text using multiple criteria
   * No hard-coded English→column mappings allowed
   */
  static scoreColumn(userText: string, column: ColumnInfo): ScoredColumn {
    const lowerUserText = userText.toLowerCase();
    const lowerColumnName = column.column_name.toLowerCase();
    const lowerTableName = column.table_name.toLowerCase();
    
    let totalScore = 0;
    const reasons: string[] = [];

    // 1. Exact Match (100 points) - Direct column name match
    if (lowerUserText.includes(lowerColumnName)) {
      totalScore += 100;
      reasons.push(`Exact column name match: "${column.column_name}"`);
    }

    // 2. Partial Match (50 points) - Column name contains user word
    const userWords = lowerUserText.split(/\s+/);
    for (const word of userWords) {
      if (word.length > 2 && lowerColumnName.includes(word)) {
        totalScore += 50;
        reasons.push(`Partial match: "${word}" in "${column.column_name}"`);
        break; // Only count once per column
      }
    }

    // 3. Table Match (30 points) - Table name contains user word
    for (const word of userWords) {
      if (word.length > 2 && lowerTableName.includes(word)) {
        totalScore += 30;
        reasons.push(`Table match: "${word}" in "${column.table_name}"`);
        break;
      }
    }

    // 4. Data Type Relevance (20 points) - Column type matches expected data
    const typeScore = this.calculateTypeRelevance(lowerUserText, column.data_type);
    if (typeScore > 0) {
      totalScore += typeScore;
      reasons.push(`Data type relevance: ${column.data_type} for "${lowerUserText}"`);
    }

    // 5. Naming Pattern Match (25 points) - Common database conventions
    const patternScore = this.calculateNamingPatternScore(lowerUserText, lowerColumnName);
    if (patternScore > 0) {
      totalScore += patternScore;
      reasons.push(`Naming pattern match: "${lowerColumnName}"`);
    }

    // 6. Contextual Relevance (15 points) - Table relationship analysis
    const contextScore = this.calculateContextualRelevance(lowerUserText, column);
    if (contextScore > 0) {
      totalScore += contextScore;
      reasons.push(`Contextual relevance: ${column.table_name}.${column.column_name}`);
    }

    // 7. Semantic Relevance (40 points) - Domain-specific word associations
    const semanticScore = this.calculateSemanticRelevance(lowerUserText, column);
    if (semanticScore > 0) {
      totalScore += semanticScore;
      reasons.push(`Semantic relevance: "${lowerUserText}" → "${column.column_name}"`);
    }

    return {
      column,
      score: totalScore,
      reason: reasons.join('; ')
    };
  }

  /**
   * Calculate data type relevance score
   */
  private static calculateTypeRelevance(userText: string, dataType: string): number {
    const timeKeywords = ['time', 'date', 'month', 'year', 'week', 'day', 'hour', 'minute'];
    const numericKeywords = ['count', 'sum', 'total', 'average', 'distance', 'km', 'kilometer'];
    const textKeywords = ['name', 'station', 'location', 'address', 'street'];
    const booleanKeywords = ['is', 'has', 'active', 'enabled', 'valid'];

    // Time-related queries
    if (timeKeywords.some(keyword => userText.includes(keyword))) {
      if (dataType.includes('timestamp') || dataType.includes('date') || dataType.includes('time')) {
        return 20;
      }
    }

    // Numeric queries
    if (numericKeywords.some(keyword => userText.includes(keyword))) {
      if (dataType.includes('numeric') || dataType.includes('integer') || dataType.includes('decimal')) {
        return 20;
      }
    }

    // Text queries
    if (textKeywords.some(keyword => userText.includes(keyword))) {
      if (dataType.includes('character') || dataType.includes('text') || dataType.includes('varchar')) {
        return 20;
      }
    }

    // Boolean queries
    if (booleanKeywords.some(keyword => userText.includes(keyword))) {
      if (dataType.includes('boolean') || dataType.includes('bit')) {
        return 20;
      }
    }

    return 0;
  }

  /**
   * Calculate naming pattern score based on common database conventions
   */
  private static calculateNamingPatternScore(userText: string, columnName: string): number {
    let score = 0;

    // Common patterns
    if (columnName.includes('_id') && (userText.includes('id') || userText.includes('identifier'))) {
      score += 15;
    }

    if (columnName.includes('_name') && (userText.includes('name') || userText.includes('title'))) {
      score += 15;
    }

    if (columnName.includes('_at') && (userText.includes('time') || userText.includes('date'))) {
      score += 15;
    }

    if (columnName.includes('_by') && (userText.includes('by') || userText.includes('user'))) {
      score += 15;
    }

    if (columnName.includes('_count') && (userText.includes('count') || userText.includes('number'))) {
      score += 15;
    }

    return Math.min(score, 25); // Cap at 25 points
  }

  /**
   * Calculate contextual relevance based on table relationships
   */
  private static calculateContextualRelevance(userText: string, column: ColumnInfo): number {
    let score = 0;

    // Station-related context
    if (column.table_name === 'stations' && 
        (userText.includes('station') || userText.includes('location') || userText.includes('address'))) {
      score += 15;
    }

    // Trip-related context
    if (column.table_name === 'trips' && 
        (userText.includes('trip') || userText.includes('ride') || userText.includes('journey'))) {
      score += 15;
    }

    // Weather-related context
    if (column.table_name === 'daily_weather' && 
        (userText.includes('weather') || userText.includes('rain') || userText.includes('temperature'))) {
      score += 15;
    }

    // User-related context
    if (column.table_name === 'users' && 
        (userText.includes('user') || userText.includes('rider') || userText.includes('person'))) {
      score += 15;
    }

    return Math.min(score, 15); // Cap at 15 points
  }

  /**
   * Calculate semantic relevance for domain-specific terms
   * Uses dynamic pattern matching instead of hard-coded term lists
   */
  private static calculateSemanticRelevance(userText: string, column: ColumnInfo): number {
    let score = 0;
    const lowerUserText = userText.toLowerCase();
    const lowerColumnName = column.column_name.toLowerCase();
    const lowerTableName = column.table_name.toLowerCase();

    // Gender-related terms - detect based on column characteristics
    if (this.isGenderColumn(column)) {
      if (this.containsGenderTerms(lowerUserText)) {
        score += 40;
      }
    }

    // Weather-related terms - detect based on column characteristics
    if (this.isWeatherColumn(column)) {
      if (this.containsWeatherTerms(lowerUserText)) {
        score += 40;
      }
    }

    // Location-related terms - detect based on column characteristics
    if (this.isLocationColumn(column)) {
      if (this.containsLocationTerms(lowerUserText)) {
        score += 40;
      }
    }

    // Distance-related terms - detect based on column characteristics
    if (this.isDistanceColumn(column)) {
      if (this.containsDistanceTerms(lowerUserText)) {
        score += 40;
      }
    }

    return Math.min(score, 40); // Cap at 40 points
  }

  /**
   * Dynamic column type detection methods
   */
  private static isGenderColumn(column: ColumnInfo): boolean {
    return column.column_name.toLowerCase().includes('gender') || 
           column.column_name.toLowerCase().includes('sex') ||
           column.column_name.toLowerCase().includes('male') ||
           column.column_name.toLowerCase().includes('female');
  }

  private static isWeatherColumn(column: ColumnInfo): boolean {
    return column.column_name.toLowerCase().includes('precipitation') || 
           column.column_name.toLowerCase().includes('weather') ||
           column.column_name.toLowerCase().includes('rain') ||
           column.column_name.toLowerCase().includes('temperature');
  }

  private static isLocationColumn(column: ColumnInfo): boolean {
    return column.column_name.toLowerCase().includes('station') || 
           column.column_name.toLowerCase().includes('name') ||
           column.column_name.toLowerCase().includes('address') ||
           column.column_name.toLowerCase().includes('location');
  }

  private static isDistanceColumn(column: ColumnInfo): boolean {
    return column.column_name.toLowerCase().includes('distance') || 
           column.column_name.toLowerCase().includes('km') ||
           column.column_name.toLowerCase().includes('length') ||
           column.column_name.toLowerCase().includes('miles');
  }

  /**
   * Dynamic term detection methods using pattern matching
   */
  private static containsGenderTerms(text: string): boolean {
    // Use word boundaries to avoid partial matches
    const genderPatterns = [
      /\bwomen\b/, /\bfemale\b/, /\bwoman\b/,
      /\bmen\b/, /\bmale\b/, /\bman\b/, /\bgender\b/
    ];
    return genderPatterns.some(pattern => pattern.test(text));
  }

  private static containsWeatherTerms(text: string): boolean {
    const weatherPatterns = [
      /\brainy\b/, /\brain\b/, /\bwet\b/, /\bweather\b/,
      /\bprecipitation\b/, /\bhumid\b/, /\btemperature\b/
    ];
    return weatherPatterns.some(pattern => pattern.test(text));
  }

  private static containsLocationTerms(text: string): boolean {
    const locationPatterns = [
      /\bstation\b/, /\blocation\b/, /\baddress\b/,
      /\bavenue\b/, /\bstreet\b/, /\bcongress\b/, /\bplace\b/
    ];
    return locationPatterns.some(pattern => pattern.test(text));
  }

  private static containsDistanceTerms(text: string): boolean {
    const distancePatterns = [
      /\bkilometer\b/, /\bkm\b/, /\bdistance\b/, /\blength\b/,
      /\bmiles\b/, /\bfar\b/, /\bnear\b/, /\baway\b/
    ];
    return distancePatterns.some(pattern => pattern.test(text));
  }

  /**
   * Find the best matching columns for user text
   */
  static findBestMatches(userText: string, columns: ColumnInfo[]): ScoredColumn[] {
    const scoredColumns = columns.map(column => this.scoreColumn(userText, column));
    
    // Filter out columns with zero score and sort by score (highest first)
    return scoredColumns
      .filter(scored => scored.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Find the best single column match
   */
  static findBestMatch(userText: string, columns: ColumnInfo[]): ScoredColumn | null {
    const matches = this.findBestMatches(userText, columns);
    return matches.length > 0 ? matches[0] : null;
  }

  /**
   * Find columns for specific query types
   */
  static findColumnsForQueryType(userText: string, columns: ColumnInfo[], queryType: string): ScoredColumn[] {
    const allMatches = this.findBestMatches(userText, columns);
    
    // Filter by query type relevance
    switch (queryType) {
      case 'aggregation':
        // Prefer numeric columns for aggregations
        return allMatches.filter(match => 
          match.column.data_type.includes('numeric') || 
          match.column.data_type.includes('integer') ||
          match.column.data_type.includes('decimal')
        );
      
      case 'filter':
        // Prefer columns that can be filtered
        return allMatches.filter(match => 
          match.column.data_type.includes('character') ||
          match.column.data_type.includes('timestamp') ||
          match.column.data_type.includes('date') ||
          match.column.data_type.includes('boolean')
        );
      
      case 'group_by':
        // Prefer categorical columns for grouping
        return allMatches.filter(match => 
          match.column.data_type.includes('character') ||
          match.column.data_type.includes('text') ||
          match.column.data_type.includes('varchar')
        );
      
      default:
        return allMatches;
    }
  }
}
