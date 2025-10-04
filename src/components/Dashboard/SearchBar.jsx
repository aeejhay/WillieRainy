import React from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Sprout, Calendar } from 'lucide-react';
import GlassSurface from '../GlassSurface';

const SearchBar = ({ searchData, onSearchChange, onSearch, showSuggestions, suggestions, onSuggestionClick, isSearching }) => {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
      className="max-w-6xl mx-auto px-4 relative"
    >
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
        <div className="flex items-center gap-3">
          <GlassSurface
            width="100%"
            height={52}
            borderRadius={26}
            opacity={0.85}
            className="flex-1"
          >
            <div className="px-5 py-1.5 flex items-center gap-2 h-full">
              {/* Area Input */}
              <div className="relative flex-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Location"
                    value={searchData.areaInput}
                    onChange={(e) => onSearchChange('areaInput', e.target.value)}
                    onFocus={() => onSearchChange('showAreaSuggestions', true)}
                    onBlur={() => setTimeout(() => onSearchChange('showAreaSuggestions', false), 200)}
                    className="bg-transparent text-gray-900 placeholder-gray-400 outline-none w-full text-sm font-medium"
                  />
                </div>
                {showSuggestions.area && suggestions.area.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden z-[60]">
                    {suggestions.area.map((suggestion, idx) => (
                      <div
                        key={idx}
                        className="px-4 py-3 hover:bg-gray-100/80 cursor-pointer text-gray-900 text-sm border-b border-gray-100/50 last:border-0"
                        onClick={() => onSuggestionClick('area', suggestion.display_name)}
                      >
                        {suggestion.display_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-px h-6 bg-gray-300/50"></div>

              {/* Crop Input */}
              <div className="relative flex-1">
                <div className="flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Crop"
                    value={searchData.cropInput}
                    onChange={(e) => onSearchChange('cropInput', e.target.value)}
                    onFocus={() => onSearchChange('showCropSuggestions', true)}
                    onBlur={() => setTimeout(() => onSearchChange('showCropSuggestions', false), 200)}
                    className="bg-transparent text-gray-900 placeholder-gray-400 outline-none w-full text-sm font-medium"
                  />
                </div>
                {showSuggestions.crop && suggestions.crop.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden z-[60]">
                    {suggestions.crop.map((crop, idx) => (
                      <div
                        key={idx}
                        className="px-4 py-3 hover:bg-gray-100/80 cursor-pointer text-gray-900 text-sm border-b border-gray-100/50 last:border-0"
                        onClick={() => onSuggestionClick('crop', crop)}
                      >
                        {crop}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-px h-6 bg-gray-300/50"></div>

              {/* Date Input */}
              <div className="flex items-center gap-2 flex-1">
                <Calendar className="w-4 h-4 text-gray-600 flex-shrink-0" />
                <input
                  type="date"
                  value={searchData.dashboardDate}
                  onChange={(e) => onSearchChange('dashboardDate', e.target.value)}
                  className="bg-transparent text-gray-900 outline-none w-full text-sm font-medium"
                />
              </div>
            </div>
          </GlassSurface>
          <button
            onClick={onSearch}
            className="bg-blue-500 hover:bg-blue-600 rounded-full p-3.5 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
          >
            <Search className={`w-5 h-5 text-white ${isSearching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SearchBar;