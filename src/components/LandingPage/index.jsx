import React, { useState } from 'react';
import { motion } from 'framer-motion';
import LandingForm from './LandingForm';
import MapView from './MapView';

const LandingPage = ({ formData, setFormData, onSubmit, locationType, setLocationType }) => {

  const handleMapClick = async (lat, lng) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6)
    }));
    setLocationType('coordinates');

    // Fetch location name from coordinates
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      if (data && data.display_name) {
        setFormData(prev => ({ ...prev, area: data.display_name }));
      }
    } catch (error) {
      console.error("Error fetching location name:", error);
    }
  };

  return (
    <motion.div
      key="landing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen grid grid-cols-2"
    >
      {/* Left Side - Map */}
      <div className="relative overflow-hidden">
        <MapView 
          latitude={formData.latitude}
          longitude={formData.longitude}
          onMapClick={handleMapClick}
        />
      </div>

      {/* Right Side - Form */}
      <div className="flex items-center justify-center px-12">
        <div className="w-full max-w-md">
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold text-gray-800 mb-3"
          >
            Welcome, Farmer! 🌾
          </motion.h1>
          <motion.p 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-600 mb-8"
          >
            Enter your farm details to get started
          </motion.p>

          <LandingForm 
            formData={formData}
            setFormData={setFormData}
            onSubmit={onSubmit}
            locationType={locationType}
            setLocationType={setLocationType}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default LandingPage;