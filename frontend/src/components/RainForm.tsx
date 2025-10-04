import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { geocodingService, GeocodingResult } from '../services/geocoding';

interface RainFormProps {
  onSubmit: (lat: number, lon: number, date: string) => void;
  isLoading: boolean;
}

interface Location {
  name: string;
  lat: number;
  lon: number;
}

const RainForm: React.FC<RainFormProps> = ({ onSubmit, isLoading }) => {
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [city, setCity] = useState('');
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [locationName, setLocationName] = useState('Unknown Location');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Geolocation functionality
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser');
      return;
    }

    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        
        setLat(latitude.toString());
        setLon(longitude.toString());
        setLocationName('Your Current Location');
        setIsGeolocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to get your location. Please enter coordinates manually.');
        setIsGeolocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    
    // Basic validation
    if (isNaN(latitude) || isNaN(longitude)) {
      alert('Please enter valid latitude and longitude values or use geolocation');
      return;
    }
    
    if (latitude < -90 || latitude > 90) {
      alert('Latitude must be between -90 and 90');
      return;
    }
    
    if (longitude < -180 || longitude > 180) {
      alert('Longitude must be between -180 and 180');
      return;
    }
    
    if (!date) {
      alert('Please select a date');
      return;
    }
    
    onSubmit(latitude, longitude, date);
  };

  const handleLocationClick = (lat: number, lon: number, name: string) => {
    setLat(lat.toString());
    setLon(lon.toString());
    setLocationName(name);
  };

  // Popular locations for quick selection (still useful for common searches)
  const popularLocations = [
    { name: 'New York', lat: 40.7128, lon: -74.0060 },
    { name: 'London', lat: 51.5074, lon: -0.1278 },
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
    { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
    { name: 'Paris', lat: 48.8566, lon: 2.3522 },
    { name: 'Dubai', lat: 25.2048, lon: 55.2708 },
    { name: 'Singapore', lat: 1.3521, lon: 103.8198 },
    { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
  ];

  // Real geocoding search functionality
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

  const selectSearchResult = (location: GeocodingResult) => {
    handleLocationClick(location.lat, location.lon, location.name);
    setSearchQuery(location.name);
    setShowSearchResults(false);
    setSearchError(null);
  };

  // Debounced search to avoid too many API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length >= 2) {
        handleSearch(searchQuery);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Click outside handler to close search results
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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        🌧️ Will It Rain?
      </h2>
      
      {/* Location Display */}
      {lat && lon && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800 font-medium">
            📍 {locationName}
          </p>
          <p className="text-xs text-blue-600">
            {parseFloat(lat).toFixed(4)}, {parseFloat(lon).toFixed(4)}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Location Search */}
        <div className="relative" ref={searchRef}>
          <label htmlFor="locationSearch" className="block text-sm font-medium text-gray-700 mb-1">
            🔍 Search Location
          </label>
          <div className="relative">
            <input
              type="text"
              id="locationSearch"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              placeholder="Search any location (e.g., Paris, Mount Everest, Times Square)"
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rain-500 focus:border-transparent"
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
          
          {/* Search Error */}
          {searchError && (
            <div className="absolute z-10 w-full mt-1 bg-red-50 border border-red-200 rounded-md shadow-lg">
              <div className="px-4 py-3 text-sm text-red-600 text-center">
                ⚠️ {searchError}
              </div>
            </div>
          )}
          
          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((location, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => selectSearchResult(location)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900 text-sm">{location.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    📍 {location.lat.toFixed(6)}, {location.lon.toFixed(6)}
                  </div>
                  {location.display_name && location.display_name !== location.name && (
                    <div className="text-xs text-gray-400 mt-1 truncate">
                      {location.display_name}
                    </div>
                  )}
                </button>
              ))}
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
        <div className="text-center">
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

        {/* Manual Coordinates */}
        <div className="border-t pt-4">
          <p className="text-sm text-gray-600 mb-3 text-center">Or enter coordinates manually:</p>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="lat" className="block text-sm font-medium text-gray-700 mb-1">
                Latitude
              </label>
              <input
                type="number"
                id="lat"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="e.g., 40.7128"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rain-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label htmlFor="lon" className="block text-sm font-medium text-gray-700 mb-1">
                Longitude
              </label>
              <input
                type="number"
                id="lon"
                step="any"
                value={lon}
                onChange={(e) => setLon(e.target.value)}
                placeholder="e.g., -74.0060"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rain-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
        
        {/* Date Selection */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            📅 Select Date
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rain-500 focus:border-transparent"
            required
          />
        </div>
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || (!lat || !lon)}
          className="w-full bg-rain-600 hover:bg-rain-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center text-lg"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Checking Rain Probability...
            </>
          ) : (
            '🌧️ Check Rain Probability'
          )}
        </button>
      </form>
      
      {/* Quick Location Buttons */}
      <div className="mt-6 border-t pt-4">
        <p className="text-sm text-gray-600 mb-3 text-center">Quick locations:</p>
        <div className="grid grid-cols-2 gap-2">
          {popularLocations.map((location) => (
            <button
              key={location.name}
              type="button"
              onClick={() => handleLocationClick(location.lat, location.lon, location.name)}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors duration-200 text-center"
            >
              {location.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RainForm;
