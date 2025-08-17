import React from 'react';

const ResultsPanel = ({ sql, result, isVisible, onClose }) => {
  if (!isVisible) return null;

  const formatResult = (result) => {
    if (!result) return 'No results';
    
    // Handle different result types
    if (result.average_minutes !== undefined) {
      return `${result.average_minutes} minutes`;
    }
    if (result.station_name !== undefined) {
      return result.station_name;
    }
    if (result.total_kilometers !== undefined) {
      return `${result.total_kilometers} km`;
    }
    if (result.total_count !== undefined) {
      return result.total_count;
    }
    
    // Fallback to formatted result if available
    if (result.formatted_result) {
      return result.formatted_result;
    }
    
    return JSON.stringify(result, null, 2);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sql || '');
    } catch (e) {
      // ignore
    }
  };

  // Check if we have actual results to show
  const hasResults = result && Object.keys(result).length > 0;
  const hasSQL = sql && sql.trim().length > 0;

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-500 relative overflow-hidden animate-fade-in-up">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50 opacity-30"></div>
      
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-black text-white rounded-2xl flex items-center justify-center shadow-md hover:scale-110 transition-all duration-300 hover:shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2zm0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-black text-black hover:scale-105 transition-all duration-300">Query Results</h3>
            <p className="text-sm text-gray-600 font-medium hover:text-gray-800 transition-all duration-300">Generated SQL and data insights</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-xl transition-all duration-300 border border-gray-300 hover:border-gray-400 hover:scale-110 hover:shadow-md"
            aria-label="Copy SQL"
            title="Copy SQL"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-xl transition-all duration-300 border border-gray-300 hover:border-gray-400 hover:scale-110 hover:shadow-md"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Results Content */}
      <div className="p-4 space-y-4 relative z-10">
        {/* Total Results Display - Only show when there are results */}
        {hasResults && (
          <div className="bg-gradient-to-br from-black via-gray-900 to-black text-white rounded-2xl p-6 border border-gray-300 hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] relative overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 50% 50%, #fff 1px, transparent 1px)`,
                backgroundSize: '20px 20px',
                animation: 'float 6s ease-in-out infinite'
              }}></div>
            </div>
            
            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-sm text-gray-300 font-medium hover:text-white transition-colors duration-300">Total Results</span>
              <svg className="w-6 h-6 text-gray-400 hover:text-white transition-colors duration-300 hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2zm0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="text-4xl font-black text-center hover:scale-105 transition-all duration-500">
              {formatResult(result)}
            </div>
          </div>
        )}

        {/* Generated SQL - Only show when there's SQL */}
        {hasSQL && (
          <div className="group">
            <div className="flex items-center space-x-3 mb-2">
              <svg className="w-5 h-5 text-gray-600 group-hover:text-black transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7c0-2.21-3.582-4-8-4s-8 1.79-8 4z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" />
              </svg>
              <h4 className="text-base font-black text-black group-hover:scale-105 transition-all duration-300">Generated SQL</h4>
            </div>
            <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-3 overflow-x-auto border border-gray-300 hover:shadow-xl transition-all duration-500 group-hover:border-gray-400">
              <pre className="text-xs text-green-400 font-mono leading-relaxed">
                <code>{sql}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Query Analysis - Only show when there's SQL */}
        {hasSQL && (
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-3 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center space-x-3 mb-2">
              <svg className="w-4 h-4 text-gray-600 group-hover:text-black transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              <h4 className="text-base font-black text-black group-hover:scale-105 transition-all duration-300">Query Analysis</h4>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="bg-white rounded-lg p-1.5 border border-gray-200 text-center shadow-sm min-h-[35px] flex flex-col justify-center hover:shadow-md hover:scale-105 transition-all duration-300">
                <div className="text-xs font-black text-black mb-0.5 break-words leading-tight">
                  {sql.includes('AVG') ? 'Avg' : 
                   sql.includes('COUNT') ? 'Count' : 
                   sql.includes('SUM') ? 'Sum' : 
                   sql.includes('MAX') ? 'Max' : 'Other'}
                </div>
                <div className="text-xs text-gray-600 font-medium leading-tight">Query Type</div>
              </div>
              <div className="bg-white rounded-lg p-1.5 border border-gray-200 text-center shadow-sm min-h-[35px] flex flex-col justify-center hover:shadow-md hover:scale-105 transition-all duration-300">
                <div className="text-xs font-black text-black mb-0.5 break-words leading-tight">
                  {sql.includes('JOIN') ? 'Multi' : 'Single'}
                </div>
                <div className="text-xs text-gray-600 font-medium leading-tight">Tables Used</div>
              </div>
              <div className="bg-white rounded-lg p-1.5 border border-gray-200 text-center shadow-sm min-h-[35px] flex flex-col justify-center hover:shadow-md hover:scale-105 transition-all duration-300">
                <div className="text-xs font-black text-black mb-0.5 leading-tight">
                  {(sql.match(/\$/g) || []).length}
                </div>
                <div className="text-xs text-gray-600 font-medium leading-tight">Parameters</div>
              </div>
            </div>
          </div>
        )}

        {/* Pro Tips - Always show but with reduced spacing when no results */}
        <div className={`bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-3 hover:shadow-lg transition-all duration-300 group ${!hasResults ? 'mt-0' : ''}`}>
          <div className="flex items-center space-x-3 mb-2">
            <svg className="w-4 h-4 text-gray-600 group-hover:text-black transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h4 className="text-base font-black text-black group-hover:scale-105 transition-all duration-300">Pro Tips</h4>
          </div>
          <ul className="text-gray-700 text-sm space-y-1 font-medium">
            <li className="flex items-start space-x-3 hover:text-gray-800 transition-colors duration-300">
              <span className="text-black font-black mt-1 hover:scale-125 transition-transform duration-300">•</span>
              <span>All queries are parameterized for security</span>
            </li>
            <li className="flex items-start space-x-3 hover:text-gray-800 transition-colors duration-300">
              <span className="text-black font-black mt-1 hover:scale-125 transition-transform duration-300">•</span>
              <span>Results are generated in real-time</span>
            </li>
            <li className="flex items-start space-x-3 hover:text-gray-800 transition-colors duration-300">
              <span className="text-black font-black mt-1 hover:scale-125 transition-transform duration-300">•</span>
              <span>Try asking follow-up questions</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ResultsPanel;
