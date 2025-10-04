import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Search } from 'lucide-react';

const LocationSelector = ({ selectedMethod, onMethodChange }) => {
  const methods = [
    {
      id: 'map',
      label: 'Select on Map',
      icon: MapPin,
      description: 'Click on the map to select location'
    },
    {
      id: 'coordinates',
      label: 'Input Coordinates',
      icon: Navigation,
      description: 'Enter longitude and latitude'
    },
    {
      id: 'place',
      label: 'Place Name',
      icon: Search,
      description: 'Search by location name'
    }
  ];

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
        Choose Location Method
      </h3>
      
      <div className="space-y-3">
        {methods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;
          
          return (
            <motion.button
              key={method.id}
              onClick={() => onMethodChange(method.id)}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/80 shadow-lg'
                  : 'border-gray-200 bg-white/50 hover:border-blue-300 hover:bg-blue-50/40'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  isSelected ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className={`font-semibold ${
                    isSelected ? 'text-blue-700' : 'text-gray-700'
                  }`}>
                    {method.label}
                  </div>
                  <div className={`text-sm ${
                    isSelected ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {method.description}
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-500' 
                    : 'border-gray-300'
                }`}>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 bg-white rounded-full"
                    />
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
      
      {/* Visual indicator */}
      <motion.div
        className="mt-4 p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="text-sm text-gray-600 text-center">
          {selectedMethod === 'map' && '🗺️ Interactive map selection'}
          {selectedMethod === 'coordinates' && '📍 Precise coordinate input'}
          {selectedMethod === 'place' && '🔍 Location name search'}
        </div>
      </motion.div>
    </div>
  );
};

export default LocationSelector;