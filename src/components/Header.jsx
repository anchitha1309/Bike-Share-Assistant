import React from "react";

const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #000 2px, transparent 2px)`,
          backgroundSize: '20px 20px'
        }}></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 py-4 relative z-10">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shadow-md animate-float hover:animate-bounce transition-all duration-300 hover:scale-110 hover:shadow-xl group">
              {/* 3D Bike Icon */}
              <svg className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                {/* Main bike frame */}
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" opacity="0.1"/>
                {/* Bike wheels */}
                <circle cx="7" cy="17" r="2.5" fill="currentColor" opacity="0.8"/>
                <circle cx="17" cy="17" r="2.5" fill="currentColor" opacity="0.8"/>
                {/* Bike frame lines */}
                <path d="M7 17h10" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6"/>
                <path d="M12 7v10" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6"/>
                {/* Handlebar */}
                <path d="M12 7c-1.5 0-2.5-1-2.5-2.5S10.5 2 12 2s2.5 1 2.5 2.5S13.5 7 12 7z" fill="currentColor" opacity="0.7"/>
                {/* Seat */}
                <path d="M12 17c-1.5 0-2.5 1-2.5 2.5S10.5 22 12 22s2.5-1 2.5-2.5S13.5 17 12 17z" fill="currentColor" opacity="0.7"/>
              </svg>
            </div>
            <div className="group">
              <h1 className="text-2xl font-bold text-black transition-all duration-300 group-hover:scale-105 group-hover:text-gray-800">
                Bike Share Analytics
              </h1>
              <p className="text-sm text-gray-600 font-medium transition-all duration-300 group-hover:text-gray-800">
                Data Insights for Bike Share
              </p>
            </div>
          </div>

          {/* Floating particles effect */}
          <div className="hidden lg:block">
            <div className="flex space-x-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-black rounded-full opacity-20 animate-pulse"
                  style={{
                    animationDelay: `${i * 0.5}s`,
                    animationDuration: '2s'
                  }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
