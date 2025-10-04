import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Globe2 } from 'lucide-react';

const LandingForm = ({ formData, setFormData, onSubmit, locationType, setLocationType }) => {
  const { area, longitude, latitude, dateInput, cropType } = formData;
  
  return (
    <div className="space-y-4">
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <label className="block text-sm font-semibold text-gray-700 mb-4">Choose Location Method</label>
        <div className="flex justify-between items-center bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setLocationType('coordinates')}
            className={`flex-1 px-2 py-2 rounded-lg text-sm font-medium transition-all ${
              locationType === 'coordinates' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Globe2 className="w-4 h-4 mb-1 mx-auto" />
            Coordinates
          </button>
          <div className="text-gray-400 font-medium">OR</div>
          <button
            onClick={() => setLocationType('text')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              locationType === 'text' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Search className="w-4 h-4 mb-1 mx-auto" />
            Search Location
          </button>
          <div className="text-gray-400 font-medium">OR</div>
          <button
            onClick={() => setLocationType('map')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              locationType === 'map' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <MapPin className="w-4 h-4 mb-1 mx-auto" />
            Select on Map
          </button>
        </div>
      </motion.div>

      {locationType === 'text' && (
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <label className="block text-sm font-semibold text-gray-700 mb-2">Location Name</label>
          <input
            type="text"
            value={area}
            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
            placeholder="e.g., Green Valley Farm, Delhi"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </motion.div>
      )}

      {locationType === 'coordinates' && (
        <>
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2">Longitude</label>
            <input
              type="text"
              value={longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              placeholder="e.g., -122.4194"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </motion.div>

          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2">Latitude</label>
            <input
              type="text"
              value={latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              placeholder="e.g., 37.7749"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </motion.div>
        </>
      )}

      {locationType === 'map' && (
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="text-sm text-gray-600 bg-blue-50 p-4 rounded-xl"
        >
          Click on the map to select your location
        </motion.div>
      )}

      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
        <input
          type="date"
          value={dateInput}
          onChange={(e) => setFormData({ ...formData, dateInput: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        />
      </motion.div>

      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <label className="block text-sm font-semibold text-gray-700 mb-2">Crop Type</label>
        <input
          type="text"
          value={cropType}
          onChange={(e) => setFormData({ ...formData, cropType: e.target.value })}
          placeholder="e.g., Wheat"
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        />
      </motion.div>

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9 }}
        onClick={onSubmit}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
      >
        <Search className="w-5 h-5" />
        Analyze Farm
      </motion.button>
    </div>
  );
};

export default LandingForm;