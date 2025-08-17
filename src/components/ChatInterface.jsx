import React, { useState, useRef, useEffect } from 'react';

const ChatInterface = ({ messages, onSendMessage, isLoading }) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const getMessageIcon = (type) => {
    switch (type) {
      case 'user':
        return (
          <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-all duration-300 hover:shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        );
      case 'assistant':
        return (
          <div className="w-10 h-10 bg-gray-600 text-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-all duration-300 hover:shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
        );
      case 'system':
        return (
          <div className="w-10 h-10 bg-gray-600 text-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-all duration-300 hover:shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-all duration-300 hover:shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getMessageStyle = (type) => {
    switch (type) {
      case 'user':
        return 'bg-black text-white shadow-lg hover:shadow-xl transition-all duration-300';
      case 'assistant':
        return 'bg-gray-100 text-black border border-gray-200 hover:shadow-md transition-all duration-300';
      case 'system':
        return 'bg-gray-100 text-black border border-gray-200 hover:shadow-md transition-all duration-300';
      case 'error':
        return 'bg-red-600 text-white hover:shadow-lg transition-all duration-300';
      default:
        return 'bg-gray-100 text-black border border-gray-200 hover:shadow-md transition-all duration-300';
    }
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-black shadow-2xl hover:shadow-3xl transition-all duration-500 relative overflow-hidden transform hover:scale-[1.01]">
      {/* Enhanced background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50 opacity-40"></div>
      
      {/* Chat Header - Enhanced */}
      <div className="px-8 py-6 border-b-2 border-black relative z-10 bg-gradient-to-r from-black to-gray-800 text-white">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-300 hover:shadow-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-black text-white group-hover:scale-105 transition-all duration-300">Chat Interface</h3>
            <p className="text-gray-200 text-base font-medium group-hover:text-white transition-all duration-300">Ask questions in natural language</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="h-96 overflow-y-auto px-8 py-6 space-y-5 relative z-10">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className="flex items-start space-x-4 animate-fade-in-up"
            style={{
              animationDelay: `${index * 0.1}s`,
              animationFillMode: 'both'
            }}
          >
            {getMessageIcon(message.type)}
            <div className={`px-6 py-4 rounded-2xl max-w-xs lg:max-w-md ${getMessageStyle(message.type)} transform hover:scale-105 transition-all duration-300`}>
              <p className="text-base leading-relaxed font-medium">{message.text}</p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-start space-x-4 animate-fade-in-up">
            {getMessageIcon('assistant')}
            <div className="px-6 py-4 rounded-2xl bg-gray-100 border border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-gray-600 rounded-full animate-bounce"></div>
                  <div className="w-3 h-3 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-3 h-3 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-base text-gray-700 font-medium">Analyzing your question...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form - Enhanced */}
      <div className="px-8 py-6 border-t-2 border-black relative z-10 bg-gradient-to-r from-gray-50 to-white">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <div className="flex-1 relative group">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about ride times, distances, weather patterns..."
              disabled={isLoading}
              className="w-full px-6 py-4 border-2 border-black rounded-2xl focus:ring-4 focus:ring-black focus:border-transparent transition-all duration-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-base font-medium bg-white text-black placeholder-gray-500 shadow-lg group-hover:shadow-xl group-hover:border-gray-700"
              aria-label="Ask about bike share data"
            />
            {/* Enhanced input focus effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-black to-gray-800 opacity-0 group-focus-within:opacity-10 transition-opacity duration-300 pointer-events-none"></div>
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="px-8 py-4 bg-black text-white rounded-2xl font-black hover:bg-gray-800 focus:ring-4 focus:ring-black focus:ring-offset-2 focus:ring-offset-white transition-all duration-300 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95 border-2 border-black hover:border-gray-700"
          >
            {isLoading ? (
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="text-base font-black">Processing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span className="text-base font-black">Send</span>
              </div>
            )}
          </button>
        </form>
        <div className="mt-4 text-center text-sm text-gray-600 font-medium hover:text-gray-800 transition-colors duration-300">
          💡 Try asking about ride times, distances, weather patterns, or station usage
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
