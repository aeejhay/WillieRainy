import React, { useState, useEffect, useRef } from 'react';
import WillieMascot from './WillieMascot';
import { geocodingService, GeocodingResult } from '../services/geocoding';

interface RainfallData {
  date: string;
  probability: number;
  mean_mm: number;
  cumulative_mm: number;
}

interface CropInfo {
  name: string;
  waterNeeds: number; // liters per day
  plantingDays: number;
  idealRainfall: number; // mm per week
  icon: string;
  description: string;
}

const CROP_TYPES: CropInfo[] = [
  {
    name: 'Rice',
    waterNeeds: 25,
    plantingDays: 120,
    idealRainfall: 50,
    icon: '🌾',
    description: 'Needs consistent water, especially during flowering stage'
  },
  {
    name: 'Corn',
    waterNeeds: 15,
    plantingDays: 90,
    idealRainfall: 35,
    icon: '🌽',
    description: 'Moderate water needs, sensitive to drought during pollination'
  },
  {
    name: 'Wheat',
    waterNeeds: 12,
    plantingDays: 150,
    idealRainfall: 25,
    icon: '🌾',
    description: 'Low water requirements, good for dry climates'
  },
  {
    name: 'Tomatoes',
    waterNeeds: 20,
    plantingDays: 75,
    idealRainfall: 40,
    icon: '🍅',
    description: 'Needs consistent moisture, avoid overwatering'
  }
];

const CropPlanning: React.FC = () => {
  const [selectedCrop, setSelectedCrop] = useState<CropInfo>(CROP_TYPES[0]);
  const [plantingDate, setPlantingDate] = useState('');
  const [location, setLocation] = useState({ lat: '', lon: '', name: '' });
  const [rainfallData, setRainfallData] = useState<RainfallData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [willieMessage, setWillieMessage] = useState('');
  const [willieMood, setWillieMood] = useState<'happy' | 'thinking' | 'concerned' | 'excited'>('happy');
  
  // Location search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Location search functionality
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setSearchError(null);
    
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    
    try {
      const results = await geocodingService.searchLocation(query);
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Search failed');
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result: GeocodingResult) => {
    setLocation({
      lat: result.lat.toString(),
      lon: result.lon.toString(),
      name: result.name
    });
    setSearchQuery(result.name);
    setShowSearchResults(false);
    setSearchError(null);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setWillieMood('concerned');
      setWillieMessage('Geolocation is not supported by this browser');
      return;
    }

    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setLocation({
          lat: latitude.toString(),
          lon: longitude.toString(),
          name: 'Your Current Location'
        });
        setSearchQuery('Your Current Location');
        setIsGeolocating(false);
        setWillieMood('happy');
        setWillieMessage('Great! I found your location. Now let\'s plan your crops!');
      },
      (error) => {
        console.error('Geolocation error:', error);
        setWillieMood('concerned');
        setWillieMessage('Unable to get your location. Please search for your farm location manually.');
        setIsGeolocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length >= 2) {
        handleSearch(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Generate sample rainfall data for 100 days
  const generateRainfallData = (startDate: string, crop: CropInfo) => {
    const data: RainfallData[] = [];
    const start = new Date(startDate);
    let cumulative = 0;

    for (let i = 0; i < 100; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      
      // Generate realistic rainfall data
      const baseProb = 30 + Math.sin(i * 0.1) * 20 + Math.random() * 10;
      const probability = Math.max(5, Math.min(95, baseProb));
      const mean_mm = probability > 20 ? Math.random() * 15 + 2 : 0;
      
      cumulative += mean_mm;
      
      data.push({
        date: currentDate.toISOString().split('T')[0],
        probability: Math.round(probability * 10) / 10,
        mean_mm: Math.round(mean_mm * 10) / 10,
        cumulative_mm: Math.round(cumulative * 10) / 10
      });
    }

    return data;
  };

  const analyzePlantingConditions = (data: RainfallData[], crop: CropInfo) => {
    const first30Days = data.slice(0, 30);
    const avgRainfall = first30Days.reduce((sum, day) => sum + day.mean_mm, 0) / 30;
    const rainDays = first30Days.filter(day => day.probability > 30).length;
    const totalWater = data.slice(0, crop.plantingDays).reduce((sum, day) => sum + day.mean_mm, 0);
    
    return {
      avgRainfall,
      rainDays,
      totalWater,
      suitability: avgRainfall >= crop.idealRainfall / 7 ? 'excellent' : 
                   avgRainfall >= crop.idealRainfall / 10 ? 'good' : 'poor'
    };
  };

  const getWillieAdvice = (analysis: any, crop: CropInfo) => {
    if (analysis.suitability === 'excellent') {
      setWillieMood('excited');
      return `Perfect timing, ${crop.name} will love these conditions! The rainfall pattern looks ideal for planting.`;
    } else if (analysis.suitability === 'good') {
      setWillieMood('happy');
      return `Good conditions for ${crop.name}! You might need some irrigation, but it should grow well.`;
    } else {
      setWillieMood('concerned');
      return `Hmm, conditions are challenging for ${crop.name}. Consider waiting or preparing irrigation systems.`;
    }
  };

  const handleAnalyze = async () => {
    if (!plantingDate || !location.lat || !location.lon) {
      setWillieMood('thinking');
      setWillieMessage("Please select a location and planting date first!");
      return;
    }

    setIsLoading(true);
    setWillieMood('thinking');
    setWillieMessage("Analyzing rainfall patterns...");

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate rainfall data
    const data = generateRainfallData(plantingDate, selectedCrop);
    setRainfallData(data);

    // Analyze conditions
    const analysis = analyzePlantingConditions(data, selectedCrop);
    const advice = getWillieAdvice(analysis, selectedCrop);
    setWillieMessage(advice);

    setIsLoading(false);
  };

  const calculateWaterNeeds = (crop: CropInfo, days: number) => {
    return crop.waterNeeds * days; // liters
  };

  const getRainfallChartData = () => {
    return rainfallData.map((day, index) => ({
      day: index + 1,
      probability: day.probability,
      rainfall: day.mean_mm,
      cumulative: day.cumulative_mm
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-green-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Willie */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-green-800 mb-2">
                🌾 Willie's Crop Planning Assistant
              </h1>
              <p className="text-lg text-green-600">
                Plan your planting with confidence using rainfall predictions
              </p>
            </div>
            <WillieMascot mood={willieMood} message={willieMessage} size="large" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Planning Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Location Selection */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-green-800 mb-4 flex items-center">
                📍 Farm Location
              </h2>
              
              {/* Location Search */}
              <div className="relative mb-4" ref={searchRef}>
                <label htmlFor="farmLocationSearch" className="block text-sm font-medium text-gray-700 mb-2">
                  🔍 Search Your Farm Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="farmLocationSearch"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for your farm location (e.g., Manila, Cebu, Davao)"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-2.5">
                      <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Search Results Dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => selectSearchResult(result)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900 text-sm">{result.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          📍 {result.lat.toFixed(6)}, {result.lon.toFixed(6)}
                        </div>
                        {result.display_name && result.display_name !== result.name && (
                          <div className="text-xs text-gray-400 mt-1 truncate">
                            {result.display_name}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Search Error */}
                {searchError && (
                  <div className="absolute z-10 w-full mt-1 bg-red-50 border border-red-200 rounded-md shadow-lg">
                    <div className="px-4 py-3 text-sm text-red-600 text-center">
                      ⚠️ {searchError}
                    </div>
                  </div>
                )}
                
                {/* No Results */}
                {showSearchResults && searchResults.length === 0 && searchQuery.length >= 2 && !isSearching && !searchError && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      🔍 No locations found for "{searchQuery}"
                      <div className="text-xs mt-1">Try a different search term</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Geolocation Button */}
              <div className="text-center mb-4">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={isGeolocating}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
                >
                  {isGeolocating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Getting Location...
                    </>
                  ) : (
                    <>
                      📍 Use My Current Location
                    </>
                  )}
                </button>
              </div>

              {/* Selected Location Display */}
              {location.lat && location.lon && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800 font-medium">
                    📍 {location.name}
                  </p>
                  <p className="text-xs text-green-600">
                    {parseFloat(location.lat).toFixed(4)}, {parseFloat(location.lon).toFixed(4)}
                  </p>
                </div>
              )}

              {/* Manual Entry Option */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <details className="group">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 flex items-center">
                    <span className="mr-2">⚙️</span>
                    Manual coordinates entry
                    <span className="ml-auto group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={location.lat}
                        onChange={(e) => setLocation({...location, lat: e.target.value})}
                        placeholder="e.g., 14.5995"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={location.lon}
                        onChange={(e) => setLocation({...location, lon: e.target.value})}
                        placeholder="e.g., 120.9842"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      />
                    </div>
                  </div>
                </details>
              </div>
            </div>

            {/* Crop Selection */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-green-800 mb-4 flex items-center">
                🌱 Choose Your Crop
              </h2>
              <div className="space-y-3">
                {CROP_TYPES.map((crop) => (
                  <button
                    key={crop.name}
                    onClick={() => setSelectedCrop(crop)}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      selectedCrop.name === crop.name
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{crop.icon}</span>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-800">{crop.name}</h3>
                        <p className="text-sm text-gray-600">{crop.description}</p>
                        <div className="flex space-x-4 mt-1 text-xs text-gray-500">
                          <span>💧 {crop.waterNeeds}L/day</span>
                          <span>📅 {crop.plantingDays} days</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Planting Date */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-green-800 mb-4 flex items-center">
                📅 Planting Date
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  When do you want to plant?
                </label>
                <input
                  type="date"
                  value={plantingDate}
                  onChange={(e) => setPlantingDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  🔍 Analyze Planting Conditions
                </>
              )}
            </button>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-6">
            {rainfallData.length > 0 && (
              <>
                {/* Analysis Summary */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-bold text-green-800 mb-4">
                    📊 Planting Analysis for {selectedCrop.name}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-blue-800">Total Water Available</h3>
                      <p className="text-2xl font-bold text-blue-600">
                        {rainfallData.slice(0, selectedCrop.plantingDays).reduce((sum, day) => sum + day.mean_mm, 0).toFixed(1)} mm
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-green-800">Water Needed</h3>
                      <p className="text-2xl font-bold text-green-600">
                        {calculateWaterNeeds(selectedCrop, selectedCrop.plantingDays).toFixed(0)} L
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-yellow-800">Rain Days (First 30)</h3>
                      <p className="text-2xl font-bold text-yellow-600">
                        {rainfallData.slice(0, 30).filter(day => day.probability > 30).length} days
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rainfall Chart */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-bold text-green-800 mb-4">
                    📈 100-Day Rainfall Forecast
                  </h2>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Chart visualization would go here</p>
                    {/* In a real implementation, you'd use Chart.js or similar */}
                  </div>
                </div>

                {/* Detailed Timeline */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-bold text-green-800 mb-4">
                    📅 Daily Rainfall Timeline
                  </h2>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="space-y-2">
                      {rainfallData.slice(0, 30).map((day, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium">Day {index + 1}</span>
                            <span className="text-xs text-gray-500">{day.date}</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className={`text-sm px-2 py-1 rounded ${
                              day.probability > 60 ? 'bg-red-100 text-red-800' :
                              day.probability > 30 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {day.probability}% chance
                            </span>
                            <span className="text-sm text-blue-600">
                              {day.mean_mm}mm
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {rainfallData.length === 0 && (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">🌾</div>
                <h2 className="text-2xl font-bold text-gray-700 mb-2">
                  Ready to Plan Your Planting?
                </h2>
                <p className="text-gray-500 mb-6">
                  Select your location, crop, and planting date to get Willie's expert advice!
                </p>
                <WillieMascot mood="happy" message="Let's grow something amazing together!" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropPlanning;
