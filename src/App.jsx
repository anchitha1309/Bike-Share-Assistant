import React, { useState } from 'react';
import Header from './components/Header';
import SampleQuestions from './components/SampleQuestions';
import ChatInterface from './components/ChatInterface';
import ResultsPanel from './components/ResultsPanel';

const sampleQuestions = [
  "How many women rode on rainy days?",
  "What was the average ride time from Congress Avenue?",
  "Which station had the most departures in March 2024?"
];

function App() {
  const [messages, setMessages] = useState([
    { type: 'system', text: 'Welcome! I\'m your Bike Share analytics assistant. Ask me anything about bike share data using natural language.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [currentSQL, setCurrentSQL] = useState('');

  const handleQuestionClick = (question) => {
    handleSendMessage(question);
  };

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

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    const userMessage = { type: 'user', text: message };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setShowResults(false);

    try {
      const response = await fetch('/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: message }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Check if there's an error from the backend
      if (data.error) {
        const errorMessage = {
          type: 'error',
          text: data.error
        };
        setMessages(prev => [...prev, errorMessage]);
        return;
      }
      
      const formattedResult = formatResult(data.result);

      const assistantMessage = {
        type: 'assistant',
        text: `Based on your query "${message}", I found ${formattedResult} matching your criteria.`
      };
      setMessages(prev => [...prev, assistantMessage]);

      setCurrentResult(data.result);
      setCurrentSQL(data.sql);
      setShowResults(true);

    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        type: 'error',
        text: `Sorry, I encountered an error: ${error.message}. Please try again or rephrase your question.`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseResults = () => {
    setShowResults(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Section - Chat Interface on Right, Sample Questions on Left */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column - Sample Questions */}
          <div className="lg:col-span-1">
            <SampleQuestions questions={sampleQuestions} onQuestionClick={handleQuestionClick} />
          </div>
          
          {/* Right Column - Chat Interface */}
          <div className="lg:col-span-2">
            <ChatInterface messages={messages} onSendMessage={handleSendMessage} isLoading={isLoading} />
          </div>
        </div>
        
        {/* Bottom Section - Query Analysis */}
        <div className="w-full">
          {showResults && (
            <ResultsPanel sql={currentSQL} result={currentResult} isVisible={showResults} onClose={handleCloseResults} />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
