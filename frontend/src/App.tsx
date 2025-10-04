import React, { useState } from 'react';
import RainForm from './components/RainForm';
import ResultCard from './components/ResultCard';
import CropPlanning from './components/CropPlanning';
import { getClimatologyData, ClimoResponse } from './api';

function App() {
  const [activeTab, setActiveTab] = useState<'weather' | 'farming'>('weather');
  const [result, setResult] = useState<ClimoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryParams, setQueryParams] = useState<{ lat: number; lon: number; date: string } | null>(null);

  const handleSubmit = async (lat: number, lon: number, date: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setQueryParams({ lat, lon, date });

    try {
      const data = await getClimatologyData(lat, lon, date);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setQueryParams(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-rain-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              🌧️ Will It Rain? 🌾
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Check rainfall probability & plan your crops with Willie's help
            </p>
            
            {/* Navigation Tabs */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setActiveTab('weather')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'weather'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🌧️ Weather Check
              </button>
              <button
                onClick={() => setActiveTab('farming')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'farming'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🌾 Crop Planning
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === 'weather' ? (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
            {/* Form */}
            <div className="flex-shrink-0">
              <RainForm onSubmit={handleSubmit} isLoading={isLoading} />
            </div>

            {/* Results */}
            <div className="flex-shrink-0">
              {isLoading && (
                <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rain-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Fetching rain data...</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                  <div className="text-center">
                    <div className="text-red-500 text-4xl mb-4">⚠️</div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Error
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">{error}</p>
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors duration-200"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}

              {result && queryParams && (
                <ResultCard
                  data={result}
                  lat={queryParams.lat}
                  lon={queryParams.lon}
                  date={queryParams.date}
                />
              )}

              {!isLoading && !error && !result && (
                <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                  <div className="text-center text-gray-500">
                    <div className="text-6xl mb-4">🌤️</div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Ready to Check!</h3>
                    <p className="text-sm">Select a location and date to see the rain probability</p>
                    <div className="mt-4 text-xs text-gray-400">
                      <p>💡 Tip: Use "Use My Current Location" for instant results!</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <CropPlanning />
      )}

      {/* Footer */}
      <div className="bg-gray-50 border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-sm text-gray-500">
            <p className="mb-2">
              <strong>Powered by NASA GPM IMERG Final climatology data (2001-2022)</strong>
            </p>
            <p>
              Data represents historical probability based on 22 years of satellite observations
            </p>
            <div className="mt-4 flex justify-center space-x-6 text-xs">
              <span>🌍 Global Coverage</span>
              <span>📊 22 Years of Data</span>
              <span>🛰️ Satellite-Based</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
