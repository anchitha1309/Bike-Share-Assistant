import React from 'react';

const SampleQuestions = ({ questions, onQuestionClick }) => {
  return (
    <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all duration-500 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 75% 25%, #000 1px, transparent 1px)`,
          backgroundSize: '30px 30px'
        }}></div>
      </div>
      
      <div className="text-center mb-6 relative z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-black text-white rounded-2xl mb-4 shadow-lg hover:scale-110 transition-all duration-300 hover:shadow-xl">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h2 className="text-xl font-black text-black mb-3 hover:scale-105 transition-all duration-300">Try These Sample Questions</h2>
        <p className="text-sm text-gray-600 font-medium hover:text-gray-800 transition-all duration-300">Click any question to get started instantly</p>
      </div>

      <div className="grid gap-4 relative z-10">
        {questions.map((question, index) => (
          <button
            key={index}
            onClick={() => onQuestionClick(question)}
            className="group w-full text-left p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 text-black hover:from-gray-100 hover:to-gray-200 transition-all duration-500 border border-gray-200 hover:border-gray-300 hover:shadow-lg transform hover:scale-[1.01] hover:-translate-y-0.5 relative overflow-hidden"
            aria-label={`Analyze sample question ${index + 1}`}
            style={{
              animationDelay: `${index * 0.1}s`,
              animationFillMode: 'both'
            }}
          >
            {/* Hover background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-black to-gray-800 opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-xl"></div>
            
            <div className="flex items-center space-x-3 relative z-10">
              <div className="w-6 h-6 bg-black text-white rounded-lg flex items-center justify-center text-xs font-black shadow-md group-hover:scale-110 group-hover:shadow-lg transition-all duration-300 flex-shrink-0">
                {index + 1}
              </div>
              <p className="text-sm leading-tight font-medium group-hover:text-gray-800 transition-colors duration-300 flex-1">
                {question}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 relative z-10">
        <div className="flex items-center justify-center space-x-3 text-gray-600 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-3 hover:from-gray-100 hover:to-gray-200 transition-all duration-300 border border-gray-200 hover:border-gray-300 hover:shadow-md">
          <div className="w-6 h-6 bg-black text-white rounded-lg flex items-center justify-center hover:scale-110 transition-all duration-300">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-sm font-semibold hover:text-gray-800 transition-colors duration-300">Or type your own question</span>
        </div>
      </div>
    </div>
  );
};

export default SampleQuestions;
