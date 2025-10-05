import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Sprout, Calendar, TrendingUp, Cloud, Droplets, Wind, X, Thermometer, Activity, Zap, AlertTriangle, BarChart3, Leaf, MoreHorizontal, Download } from "lucide-react";
import GlassSurface from "./components/GlassSurface";
import MapView from "./components/LandingPage/MapView";
import Crosshair from "./components/Crosshair";
import TiltedCard from "./components/TiltedCard";
import jsPDF from "jspdf";

const DEFAULT_PI_IP = "10.131.118.187";
const PI_IP = import.meta.env?.VITE_PI_IP ?? DEFAULT_PI_IP;
const PI_MATRIX_ENDPOINT = `http://${PI_IP}:5000/send_matrix`;

const generateBinaryMatrix = (size = 32) =>
  Array.from({ length: size }, () =>
    Array.from({ length: size }, () => Math.random() < 0.5 ? 0 : 1)
  );

const postMatrixToPi = async (matrix, endpoint = PI_MATRIX_ENDPOINT) => {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(matrix),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to send matrix: ${response.status} ${message}`);
  }

  return response;
};

const generateFakeSeries = (length = 30, base = 50, variance = 20) =>
  Array.from({ length }, (_, day) => ({
    day: day + 1,
    value: Math.max(0, Math.min(100, base + (Math.random() - 0.5) * variance)),
  }));

const drawMiniGraph = (doc, { x, y, width, height }, data, color = "#2563eb") => {
  if (!data.length) return;
  const maxValue = Math.max(...data.map((point) => point.value)) || 1;
  const minValue = Math.min(...data.map((point) => point.value));
  const graphHeight = height - 10;
  const graphWidth = width - 10;
  const originX = x + 5;
  const originY = y + height - 5;

  // Axis
  doc.setDrawColor(200);
  doc.line(originX, originY, originX + graphWidth, originY);
  doc.line(originX, originY, originX, originY - graphHeight);

  doc.setDrawColor(color);
  doc.setLineWidth(1.5);

  data.forEach((point, index) => {
    const px = originX + (graphWidth / (data.length - 1 || 1)) * index;
    const py = originY - ((point.value - minValue) / (maxValue - minValue || 1)) * graphHeight;

    if (index === 0) {
      doc.moveTo(px, py);
    } else {
      doc.lineTo(px, py);
    }
  });

  doc.stroke();
};

const buildDashboardPdf = ({
  farmName,
  cropType,
  date,
  rainChance,
  avgTemp,
  soilQuality,
  survivalRate,
}) => {
  const doc = new jsPDF({ unit: "pt" });

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Farm Insights Report", 40, 50);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 70);

  doc.setFont("Helvetica", "bold");
  doc.text("Overview", 40, 110);
  doc.setFont("Helvetica", "normal");
  const overview = [
    `Farm Name: ${farmName || "N/A"}`,
    `Crop Type: ${cropType || "N/A"}`,
    `Analysis Date: ${date || new Date().toISOString().slice(0, 10)}`,
    `Rain Probability: ${rainChance}%`,
    `Average Temperature: ${avgTemp} °C`,
    `Soil Quality Index: ${soilQuality}/100`,
    `Projected Survival Rate: ${survivalRate}%`,
  ];
  overview.forEach((line, idx) => {
    doc.text(line, 40, 140 + idx * 20);
  });

  const rainData = generateFakeSeries(30, rainChance, 40);
  const uvData = generateFakeSeries(30, 60, 35);

  const graphBox = (title, subtitle, top) => {
    doc.setDrawColor(220);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(40, top, 520, 180, 10, 10, "FD");

    doc.setTextColor(15, 23, 42);
    doc.setFont("Helvetica", "bold");
    doc.text(title, 60, top + 30);

    doc.setFont("Helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(subtitle, 60, top + 50);

    return { x: 60, y: top + 60, width: 480, height: 130 };
  };

  const rainGraphArea = graphBox(
    "Monthly Rainfall Trend",
    "Estimated daily precipitation probability",
    300
  );
  drawMiniGraph(doc, rainGraphArea, rainData, "#0ea5e9");

  const uvGraphArea = graphBox(
    "UV Exposure Trend",
    "Projected UV index for crop protection planning",
    500
  );
  drawMiniGraph(doc, uvGraphArea, uvData, "#f97316");

  doc.setFont("Helvetica", "italic");
  doc.setTextColor(100);
  doc.text(
    "Data synthesized for demonstration purposes. Customize with real telemetry when available.",
    40,
    720,
  );

  return doc;
};

const dashboardItems = [
  { id: 1, title: "Weather", icon: Cloud, content: "Detailed weather information and forecasts for your selected area.", color: "bg-gray-700", span: "col-span-1 row-span-1" },
  { id: 2, title: "Soil Health", icon: Sprout, content: "Monitor soil conditions, moisture levels, and nutrient composition.", color: "bg-gray-600", span: "col-span-1 row-span-2" },
  { id: 3, title: "Water", icon: Droplets, content: "Track irrigation schedules and water consumption patterns.", color: "bg-gray-800", span: "col-span-1 row-span-1" },
  { id: 4, title: "Market", icon: TrendingUp, content: "Real-time commodity prices and market trends for your crops.", color: "bg-slate-700", span: "col-span-2 row-span-1" },
  { id: 5, title: "Wind", icon: Wind, content: "Wind speed and direction analysis for optimal farming operations.", color: "bg-slate-600", span: "col-span-1 row-span-1" },
  { id: 6, title: "Temperature", icon: Thermometer, content: "Monitor temperature variations and heat patterns.", color: "bg-gray-700", span: "col-span-1 row-span-1" },
  { id: 7, title: "Activity", icon: Activity, content: "Track farm activities and operations in real-time.", color: "bg-slate-800", span: "col-span-2 row-span-1" },
  { id: 8, title: "Energy", icon: Zap, content: "Monitor energy consumption and solar power generation.", color: "bg-gray-600", span: "col-span-1 row-span-2" },
  { id: 9, title: "Alerts", icon: AlertTriangle, content: "Critical alerts and notifications for your farm.", color: "bg-slate-700", span: "col-span-1 row-span-1" },
  { id: 10, title: "Analytics", icon: BarChart3, content: "Detailed analytics and insights about your operations.", color: "bg-gray-800", span: "col-span-1 row-span-1" },
  { id: 11, title: "Crops", icon: Leaf, content: "Crop health monitorin g and growth tracking.", color: "bg-gray-700", span: "col-span-1 row-span-1" },
];



export default function App() {
  const mapContainerRef = useRef(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [dimensions, setDimensions] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  // Landing page form states
  const [longitude, setLongitude] = useState("");
  const [latitude, setLatitude] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [cropType, setCropType] = useState("");
  const [area, setArea] = useState("");
  const [locationMethod, setLocationMethod] = useState("coordinates"); // New state for location method
  const [placeName, setPlaceName] = useState(""); // For place name search
  
  // Dashboard search states
  const [areaInput, setAreaInput] = useState("");
  const [cropInput, setCropInput] = useState("");
  const [dashboardDate, setDashboardDate] = useState("");
  const [areaSuggestions, setAreaSuggestions] = useState([]);
  const [cropSuggestions, setCropSuggestions] = useState([]);
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);
  const [showCropSuggestions, setShowCropSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmittingMatrix, setIsSubmittingMatrix] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Fetch area suggestions from OpenStreetMap
  useEffect(() => {
    if (areaInput.length < 2) {
      setAreaSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(areaInput)}&limit=5`
        );
        const data = await response.json();
        setAreaSuggestions(data);
      } catch (error) {
        console.error("Error fetching location suggestions:", error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [areaInput]);

  // Filter crop suggestions
  useEffect(() => {
    if (cropInput.length < 1) {
      setCropSuggestions([]);
      return;
    }
    const filtered = ["Wheat", "Rice", "Corn", "Soybeans", "Cotton", "Barley", 
      "Oats", "Sorghum", "Potatoes", "Tomatoes", "Lettuce", "Carrots"]
      .filter(crop => crop.toLowerCase().includes(cropInput.toLowerCase()));
    setCropSuggestions(filtered);
  }, [cropInput]);

  const handleClick = (item, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDimensions({
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    });
    requestAnimationFrame(() => {
      setActiveItem(item);
    });
  };

  const handleDashboardSearch = () => {
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 1000);
    console.log("Searching:", { area: areaInput, crop: cropInput, date: dashboardDate });
  };

  

  const handleCloseDashboard = () => {
    setShowDashboard(false);
    setActiveItem(null);
  };const handleLandingSearch = async () => {
    if (isSubmittingMatrix) return;

    setIsSubmittingMatrix(true);
    let locationData = {};
    
    switch (locationMethod) {
      case 'coordinates':
        locationData = { longitude, latitude };
        break;
      case 'place':
        locationData = { placeName };
        break;
      case 'map':
        locationData = { longitude, latitude, selectedFromMap: true };
        break;
    }
    
    const matrix = generateBinaryMatrix();
    
    // Prepare the complete payload with farm data and matrix
    const payload = {
      matrix: matrix,
      farmData: {
        locationMethod,
        ...locationData,
        date: dateInput,
        cropType,
        farmName: area,
        timestamp: new Date().toISOString()
      }
    };
    
    console.log("Sending to Pi:", {
      endpoint: PI_MATRIX_ENDPOINT,
      farmData: payload.farmData,
      matrixSize: `${matrix.length}x${matrix[0].length}`
    });

    try {
      const response = await fetch(PI_MATRIX_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await response.text().catch(() => response.statusText);
        throw new Error(`Failed to send data: ${response.status} ${message}`);
      }

      const result = await response.json().catch(() => ({ status: "ok" }));
      console.log("Successfully sent to Pi:", result);
      
    } catch (error) {
      console.error("Failed to send data to Pi:", error);
      alert(`Error: ${error.message}\n\nPlease check if the Pi is reachable at ${PI_IP}:5000`);
    } finally {
      setIsSubmittingMatrix(false);
      setShowDashboard(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {!showDashboard ? (
        // Landing Page
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen grid grid-cols-3"
        >
            {/* Left Side - Interactive OpenStreetMap */}
            <div ref={mapContainerRef} className="col-span-2 relative">
              <MapView
                latitude={latitude}
                longitude={longitude}
                onMapClick={(lat, lng) => {
                  setLatitude(String(lat));
                  setLongitude(String(lng));
                  setLocationMethod('map');
                }}
              />
              {/* Full-page crosshair visible when hovering over the map area */}
              <Crosshair containerRef={mapContainerRef} color="#00ADB5" opacity={0.6} thickness={3} />
            </div>

            {/* Right Side - Location Selector and Form */}
            <div className="flex flex-col items-center px-6 py-8 space-y-6 max-h-screen overflow-y-auto">
              {/* Location Method Dropdown */}
              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="w-full max-w-sm"
              >
                <label className="block text-sm font-semibold text-gray-700 mb-2">Choose Location Method</label>
                <select
                  value={locationMethod}
                  onChange={(e) => setLocationMethod(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                >
                  <option value="map">Select on Map</option>
                  <option value="coordinates">Input Coordinates</option>
                  <option value="place">Input Place Name</option>
                </select>
              </motion.div>

              {/* Form */}
              <div className="w-full max-w-sm space-y-5">
                <motion.h1 
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-bold text-gray-800 mb-3 text-center"
                >
                  Welcome, Farmer! 🌾
                </motion.h1>
                <motion.p 
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-gray-600 mb-6 text-center"
                >
                  Enter your farm details to get started
                </motion.p>

                <div className="space-y-3">
                  {/* Location-specific inputs */}
                  {locationMethod === 'coordinates' && (
                    <>
                      <motion.div
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Longitude</label>
                        <input
                          type="text"
                          value={longitude}
                          onChange={(e) => setLongitude(e.target.value)}
                          onFocus={() => setLocationMethod('coordinates')}
                          placeholder="e.g., -122.4194"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                      </motion.div>

                      <motion.div
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Latitude</label>
                        <input
                          type="text"
                          value={latitude}
                          onChange={(e) => setLatitude(e.target.value)}
                          onFocus={() => setLocationMethod('coordinates')}
                          placeholder="e.g., 37.7749"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                      </motion.div>
                    </>
                  )}

                  {locationMethod === 'place' && (
                    <motion.div
                      initial={{ x: 50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Place Name</label>
                      <input
                        type="text"
                        value={placeName}
                        onChange={(e) => setPlaceName(e.target.value)}
                        placeholder="e.g., Green Valley, California"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      />
                    </motion.div>
                  )}

                  {locationMethod === 'map' && (
                    <motion.div
                      initial={{ x: 50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-3"
                    >
                      <div className="flex items-center gap-2 text-blue-700">
                        <MapPin className="w-5 h-5" />
                        <span className="font-semibold">Map Selection Mode</span>
                      </div>
                      <p className="text-blue-600 text-sm">Click on the map to select your farm location</p>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-blue-700 mb-1 uppercase tracking-wide">Latitude</label>
                          <input
                            type="text"
                            value={latitude}
                            readOnly
                            placeholder="Click the map to capture latitude"
                            className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white/80 text-blue-900 text-sm focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-blue-700 mb-1 uppercase tracking-wide">Longitude</label>
                          <input
                            type="text"
                            value={longitude}
                            readOnly
                            placeholder="Click the map to capture longitude"
                            className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white/80 text-blue-900 text-sm focus:outline-none"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Common fields */}
                  <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Farm Name</label>
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="e.g., Green Valley Farm"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={dateInput}
                      onChange={(e) => setDateInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
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
                      onChange={(e) => setCropType(e.target.value)}
                      placeholder="e.g., Wheat"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </motion.div>

                  <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    onClick={handleLandingSearch}
                    disabled={isSubmittingMatrix}
                    className={`w-full text-white font-semibold py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 ${
                      isSubmittingMatrix
                        ? "bg-blue-400 cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-600"
                    }`}
                  >
                    <Search className={`w-5 h-5 ${isSubmittingMatrix ? "animate-spin" : ""}`} />
                    {isSubmittingMatrix ? "Sending to Pi..." : "Analyze Farm"}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          // Dashboard View
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen pb-20"
          >
            {/* Top-right actions */}
            <div className="fixed top-6 right-6 z-[100] flex items-center gap-3">
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                onClick={async () => {}}
                disabled={isGeneratingPdf}
                className={`bg-indigo-500 text-white rounded-full px-4 py-2 shadow-xl hover:shadow-2xl transition-all flex items-center gap-2 text-sm font-semibold ${
                  isGeneratingPdf ? "cursor-wait bg-indigo-400" : "hover:bg-indigo-600"
                }`}
              >
                <Download className={`w-4 h-4 ${isGeneratingPdf ? "animate-bounce" : ""}`} />
                {isGeneratingPdf ? "Creating PDF" : "Export PDF"}
              </motion.button>

              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                onClick={handleCloseDashboard}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full p-3 shadow-xl hover:shadow-2xl active:scale-90 transition-all"
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>

            {/* Floating Search Bar */}
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
                            value={areaInput}
                            onChange={(e) => setAreaInput(e.target.value)}
                            onFocus={() => setShowAreaSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowAreaSuggestions(false), 200)}
                            className="bg-transparent text-gray-900 placeholder-gray-400 outline-none w-full text-sm font-medium"
                          />
                        </div>
                        {showAreaSuggestions && areaSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden z-[60]">
                            {areaSuggestions.map((suggestion, idx) => (
                              <div
                                key={idx}
                                className="px-4 py-3 hover:bg-gray-100/80 cursor-pointer text-gray-900 text-sm border-b border-gray-100/50 last:border-0"
                                onClick={() => {
                                  setAreaInput(suggestion.display_name);
                                  setShowAreaSuggestions(false);
                                }}
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
                            value={cropInput}
                            onChange={(e) => setCropInput(e.target.value)}
                            onFocus={() => setShowCropSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowCropSuggestions(false), 200)}
                            className="bg-transparent text-gray-900 placeholder-gray-400 outline-none w-full text-sm font-medium"
                          />
                        </div>
                        {showCropSuggestions && cropSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden z-[60] max-h-60 overflow-y-auto">
                            {cropSuggestions.map((crop, idx) => (
                              <div
                                key={idx}
                                className="px-4 py-3 hover:bg-gray-100/80 cursor-pointer text-gray-900 text-sm border-b border-gray-100/50 last:border-0"
                                onClick={() => {
                                  setCropInput(crop);
                                  setShowCropSuggestions(false);
                                }}
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
                          value={dashboardDate}
                          onChange={(e) => setDashboardDate(e.target.value)}
                          className="bg-transparent text-gray-900 outline-none w-full text-sm font-medium"
                        />
                      </div>
                    </div>
                  </GlassSurface>
                  
                  <button
                    onClick={handleDashboardSearch}
                    className="bg-blue-500 hover:bg-blue-600 rounded-full p-3.5 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
                  >
                    <Search className={`w-5 h-5 text-white ${isSearching ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Dashboard Grid with Tetris Animation */}
            <div className="max-w-6xl mx-auto px-4 py-8 pt-28">
              <div className="grid grid-cols-4 auto-rows-[140px] gap-3">
                {dashboardItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ y: 500, opacity: 0, scale: 0.5 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{ 
                        delay: 0.3 + (index * 0.1),
                        type: "spring",
                        stiffness: 150,
                        damping: 15
                      }}
                      className={`${item.span}`}
                    >
                      <TiltedCard
                        containerHeight="100%"
                        containerWidth="100%"
                        rotateAmplitude={12}
                        scaleOnHover={1.05}
                        showTooltip={false}
                        displayOverlayContent={true}
                        overlayContent={
                          <div className="flex items-center gap-2">
                            <Icon className="w-6 h-6 text-white" />
                            <h2 className="font-semibold text-base text-white tracking-tight">{item.title}</h2>
                          </div>
                        }
                        className={`cursor-pointer`}
                        cardClassName={`${item.color} transition-shadow duration-200 shadow-lg hover:shadow-xl`}
                        onClick={(e) => handleClick(item, e)}
                      >
                        {/* Fallback content if no image provided */}
                        <div className="absolute inset-0 p-4">
                          <p className="text-white/60 text-xs font-medium">Tap to view</p>
                        </div>
                      </TiltedCard>
                    </motion.div>
                  );
                })}
                
                {/* More Box */}
                <motion.div
                  initial={{ y: 500, opacity: 0, scale: 0.5 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ 
                    delay: 0.3 + (dashboardItems.length * 0.1),
                    type: "spring",
                    stiffness: 150,
                    damping: 15
                  }}
                  className="col-span-1 row-span-1 bg-gray-400 p-4 rounded-2xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl flex flex-col items-center justify-center"
                >
                  <MoreHorizontal className="w-7 h-7 text-white mb-1" />
                  <h2 className="font-semibold text-base text-white tracking-tight">More</h2>
                </motion.div>
              </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
              {activeItem && (
                <>
                  {/* Overlay */}
                  <motion.div
                    className="fixed inset-0 bg-black/40 z-40"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setActiveItem(null)}
                  />
                  
                  {/* Expanding card */}
                  <motion.div
                    className={`fixed z-50 ${activeItem.color} overflow-hidden shadow-2xl`}
                    style={{
                      transformOrigin: "top left"
                    }}
                    initial={{
                      left: dimensions.x,
                      top: dimensions.y,
                      width: dimensions.width,
                      height: dimensions.height,
                      borderRadius: "1rem",
                    }}
                    animate={{
                      left: window.innerWidth * 0.05,
                      top: window.innerHeight * 0.1,
                      width: window.innerWidth * 0.9,
                      height: window.innerHeight * 0.8,
                      borderRadius: "2rem",
                    }}
                    exit={{
                      left: dimensions.x,
                      top: dimensions.y,
                      width: dimensions.width,
                      height: dimensions.height,
                      borderRadius: "1rem",
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <motion.div
                      className="p-8 h-full overflow-auto relative"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <button
                        className="absolute top-5 right-5 text-white/70 hover:text-white text-2xl w-9 h-9 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 active:scale-95 transition-all"
                        onClick={() => setActiveItem(null)}
                      >
                        ✕
                      </button>
                      
                      {activeItem.icon && (
                        <div className="inline-block p-4 rounded-2xl bg-white/15 mb-5">
                          <activeItem.icon className="w-11 h-11 text-white" />
                        </div>
                      )}
                      
                      <h2 className="text-4xl font-semibold mb-5 text-white tracking-tight">{activeItem.title}</h2>
                      <p className="mb-8 text-white/80 text-base leading-relaxed">{activeItem.content}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mt-8">
                        <div className="bg-white/15 backdrop-blur-sm p-5 rounded-2xl">
                          <h3 className="text-white font-semibold mb-1.5 text-sm tracking-tight">Status</h3>
                          <p className="text-white/70 text-sm">Operational</p>
                        </div>
                        <div className="bg-white/15 backdrop-blur-sm p-5 rounded-2xl">
                          <h3 className="text-white font-semibold mb-1.5 text-sm tracking-tight">Updated</h3>
                          <p className="text-white/70 text-sm">2 min ago</p>
                        </div>
                      </div>
                      
                      <div className="mt-6 bg-white/15 backdrop-blur-sm p-5 rounded-2xl">
                        <h3 className="text-white font-semibold mb-4 text-sm tracking-tight">Activity</h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-white/90 rounded-full"></div>
                            <p className="text-white/70 text-sm">Data synced</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-white/90 rounded-full"></div>
                            <p className="text-white/70 text-sm">New insights</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-white/90 rounded-full"></div>
                            <p className="text-white/70 text-sm">Maintenance scheduled</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        )}
    </div>
  );
}