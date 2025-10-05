import { useState, useEffect, useRef, lazy, Suspense, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Sprout, Calendar, TrendingUp, Cloud, Droplets, Wind, X, Thermometer, Activity, Zap, AlertTriangle, BarChart3, Leaf, MoreHorizontal } from "lucide-react";

// Lazy load heavy components
const MapView = lazy(() => import('./components/LandingPage/MapView'));
const Aurora = lazy(() => import('./Aurora'));
const GlassSurface = lazy(() => import('./components/GlassSurface'));
const Crosshair = lazy(() => import('./components/Crosshair'));
const TiltedCard = lazy(() => import('./components/TiltedCard'));

import { reverseGeocode, fetchSoilType, fetchCropSuccess } from './utils/api';
import { useAreaSearch, useCropSuggestions, usePlaceGeocode } from './hooks/useSearchEffects';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';

export default function App() {
  const mapContainerRef = useRef(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [dimensions, setDimensions] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const revealTimeout = useRef(null);
  
  // Landing page form states
  const [longitude, setLongitude] = useState("");
  const [latitude, setLatitude] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [cropType, setCropType] = useState("");
  const [area, setArea] = useState("");
  const [locationMethod, setLocationMethod] = useState("coordinates");
  const [placeName, setPlaceName] = useState("");
  // New: geocoding states
  const [placeGeocodeLoading, setPlaceGeocodeLoading] = useState(false);
  const [placeGeocodeError, setPlaceGeocodeError] = useState("");
  const [placeMatch, setPlaceMatch] = useState("");
  
  // Dashboard search states
  const [areaInput, setAreaInput] = useState("");
  const [cropInput, setCropInput] = useState("");
  const [dashboardDate, setDashboardDate] = useState("");
  const [areaSuggestions, setAreaSuggestions] = useState([]);
  const [cropSuggestions, setCropSuggestions] = useState([]);
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);
  const [showCropSuggestions, setShowCropSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Soil type and crop success states
  const [soilTypeLoading, setSoilTypeLoading] = useState(false);
  const [soilTypeError, setSoilTypeError] = useState("");
  const [soilType, setSoilType] = useState("");
  const [cropSuccessLoading, setCropSuccessLoading] = useState(false);
  const [cropSuccessError, setCropSuccessError] = useState("");
  const [cropSuccess, setCropSuccess] = useState(null);
  // details for interactive crop success
  const [cropDetails, setCropDetails] = useState(null);
  const [cropTrend, setCropTrend] = useState([]);

  // Helper: reverse geocode to place name from map clicks
  const reverseGeocode = async (lat, lon) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      if (!res.ok) return;
      const j = await res.json();
      if (j?.display_name) setPlaceName(j.display_name);
    } catch {}
  };

  // Debounced area search with AbortController for cancellation
  useEffect(() => {
    if (areaInput.length < 2) {
      setAreaSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(areaInput)}&limit=5`,
          { signal: controller.signal }
        );
        if (response.ok) {
          const data = await response.json();
          setAreaSuggestions(data);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("Error fetching location suggestions:", error);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [areaInput]);

  // Optimized crop suggestions with useMemo would be better here, but keeping simple
  useEffect(() => {
    if (cropInput.length < 1) {
      setCropSuggestions([]);
      return;
    }
    const crops = ["Wheat", "Rice", "Corn", "Soybeans", "Cotton", "Barley", 
      "Oats", "Sorghum", "Potatoes", "Tomatoes", "Lettuce", "Carrots"];
    const filtered = crops.filter(crop => 
      crop.toLowerCase().includes(cropInput.toLowerCase())
    );
    setCropSuggestions(filtered);
  }, [cropInput]);

  // Geocode Place Name -> update lat/lon and show match under input
  useEffect(() => {
    if (locationMethod !== 'place') return;
    if (!placeName || placeName.trim().length < 3) {
      setPlaceMatch("");
      setPlaceGeocodeError("");
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setPlaceGeocodeLoading(true);
        setPlaceGeocodeError("");
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(placeName)}&limit=1`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error(`Geocode failed (${res.status})`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const first = data[0];
          setLatitude(String(first.lat));
          setLongitude(String(first.lon));
          setPlaceMatch(first.display_name || "");
        } else {
          setPlaceMatch("");
          setPlaceGeocodeError("No match found");
        }
      } catch (e) {
        if (e.name !== 'AbortError') {
          setPlaceGeocodeError(e.message || "Geocode error");
        }
      } finally {
        setPlaceGeocodeLoading(false);
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [placeName, locationMethod]);

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
  };

  const handleLandingSearch = () => {
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

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
      fetchSoilType(lat, lon);
      fetchCropSuccess(lat, lon, dateInput, cropType, area);
    } else {
      setSoilType("");
      setSoilTypeError("");
      setCropSuccess(null);
      setCropSuccessError("");
    }

    setIsRevealing(true);
    if (revealTimeout.current) clearTimeout(revealTimeout.current);
    revealTimeout.current = setTimeout(() => {
      setShowDashboard(true);
      setIsRevealing(false);
    }, 450);
  };

  const handleCloseDashboard = () => {
    setShowDashboard(false);
    setActiveItem(null);
  };

  useEffect(() => {
    return () => {
      if (revealTimeout.current) clearTimeout(revealTimeout.current);
    };
  }, []);

  const gridVariants = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.06, delayChildren: 0.18 }
    }
  };
  
  const itemVariants = {
    hidden: { y: 40, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 200, damping: 18 } }
  };

  // Optimized fetch with better error handling
  const fetchSoilType = async (lat, lon) => {
    const controller = new AbortController();
    
    try {
      setSoilTypeLoading(true);
      setSoilTypeError("");
      setSoilType("");
      
      const classifyUrl = new URL('https://rest.isric.org/soilgrids/v2.0/classification/query');
      classifyUrl.searchParams.set('lat', lat);
      classifyUrl.searchParams.set('lon', lon);
      
      let resolvedType = '';
      
      try {
        const res = await fetch(classifyUrl.toString(), { 
          headers: { 'Accept': 'application/json' },
          signal: controller.signal 
        });
        if (res.ok) {
          const j = await res.json();
          resolvedType = j?.USDA_TEXTURE_CLASS || j?.usda_texture_class || j?.texture_class || '';
        }
      } catch {}
      
      if (!resolvedType) {
        const propUrl = new URL('https://rest.isric.org/soilgrids/v2.0/properties/query');
        propUrl.searchParams.set('lat', lat);
        propUrl.searchParams.set('lon', lon);
        propUrl.searchParams.set('property', 'sand,clay');
        propUrl.searchParams.set('depth', '0-5cm');
        
        const res2 = await fetch(propUrl.toString(), { 
          headers: { 'Accept': 'application/json' },
          signal: controller.signal 
        });
        
        if (res2.ok) {
          const d = await res2.json();
          const sand = Number(d?.properties?.sand?.values?.[0]?.value ?? NaN);
          const clay = Number(d?.properties?.clay?.values?.[0]?.value ?? NaN);
          
          if (!Number.isNaN(sand) && !Number.isNaN(clay)) {
            if (clay >= 40) resolvedType = 'Clay';
            else if (clay >= 27 && sand <= 45) resolvedType = 'Clay Loam';
            else if (sand >= 70 && clay <= 15) resolvedType = 'Sandy Loam';
            else if (sand >= 85 && clay < 10) resolvedType = 'Sand';
            else if (clay <= 10 && sand <= 52) resolvedType = 'Silt Loam';
            else resolvedType = 'Loam';
          }
        }
      }
      
      if (resolvedType) {
        setSoilType(resolvedType);
      } else {
        throw new Error('No soil type available');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setSoilTypeError(err?.message || 'Failed to load soil type');
      }
    } finally {
      setSoilTypeLoading(false);
    }
    
    return () => controller.abort();
  };

  // Helper to compute detailed crop success with factors + trend
  const computeCropSuccessDetailed = (lat, lon, dateStr, crop, soil) => {
    const toMonth = (ds) => {
      if (!ds) return new Date().getUTCMonth() + 1;
      const d = new Date(ds);
      return Number.isNaN(d.getTime()) ? (new Date().getUTCMonth() + 1) : (d.getUTCMonth() + 1);
    };
    const month = toMonth(dateStr);
    const cropL = (crop || "").toLowerCase();
    const soilL = (soil || "").toLowerCase();

    // base from coordinates
    const base = 50 + 15 * Math.cos((lat * Math.PI) / 180) + 10 * Math.sin((lon * Math.PI) / 180);

    // seasonality
    let season = 0;
    if ([3,4,5].includes(month)) season += 6;
    if ([6,7,8].includes(month)) season += 2;
    if ([9,10,11].includes(month)) season += 4;
    if ([12,1,2].includes(month)) season -= 3;

    // soil vs crop tweaks
    let soilAdj = 0;
    if (soilL.includes("clay")) {
      if (cropL.includes("rice")) soilAdj += 8;
      if (cropL.includes("carrot") || cropL.includes("potato")) soilAdj -= 4;
    } else if (soilL.includes("sandy")) {
      if (cropL.includes("peanut") || cropL.includes("cotton")) soilAdj += 6;
      if (cropL.includes("rice")) soilAdj -= 6;
    } else if (soilL.includes("loam")) {
      soilAdj += 5;
    }

    // simple rainfall proxy by latitude band
    const rainProxy = Math.abs(lat) < 15 ? 4 : 0;

    let score = base + season + soilAdj + rainProxy;
    let clampAdj = 0;
    if (score > 100) { clampAdj = 100 - score; score = 100; }
    if (score < 0) { clampAdj = -score; score = 0; }

    // confidence
    let conf = 0.5;
    if (soilL) conf += 0.15;
    if (cropL) conf += 0.15;
    if (dateStr) conf += 0.1;
    if (Number.isFinite(lat) && Number.isFinite(lon)) conf += 0.1;
    conf = Math.max(0.4, Math.min(0.95, conf));

    // trend for 12 months
    const trend = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      let seas = 0;
      if ([3,4,5].includes(m)) seas += 6;
      if ([6,7,8].includes(m)) seas += 2;
      if ([9,10,11].includes(m)) seas += 4;
      if ([12,1,2].includes(m)) seas -= 3;
      let s = base + seas + soilAdj + rainProxy;
      return Math.max(0, Math.min(100, s));
    });

    return {
      score: Math.round(score),
      confidence: conf,
      factors: [
        { label: "Coords base", value: Math.round(base), sign: base >= 50 ? "+" : "±" },
        { label: "Seasonality", value: season, sign: season >= 0 ? "+" : "-" },
        { label: "Soil compatibility", value: soilAdj, sign: soilAdj >= 0 ? "+" : "-" },
        { label: "Rainfall proxy", value: rainProxy, sign: rainProxy >= 0 ? "+" : "-" },
        { label: "Clamp", value: Math.round(clampAdj), sign: clampAdj ? "±" : "" },
      ],
      month,
      trend,
    };
  };

  // Enhanced crop success: compute with details and trend
  const fetchCropSuccess = async (lat, lon, dateStr, crop, areaName) => {
    try {
      setCropSuccessLoading(true);
      setCropSuccessError("");
      setCropSuccess(null);
      setCropDetails(null);
      setCropTrend([]);

      // brief delay for UX
      await new Promise(r => setTimeout(r, 200));

      const det = computeCropSuccessDetailed(lat, lon, dateStr, crop || cropInput || cropType, soilType);
      setCropSuccess(det.score);
      setCropDetails(det);
      setCropTrend(det.trend);
    } catch (err) {
      setCropSuccessError(err?.message || 'Crop success not available');
    } finally {
      setCropSuccessLoading(false);
    }
  };

  // Recompute interactively when key inputs change while dashboard is open
  useEffect(() => {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (!showDashboard) return;
    if (Number.isNaN(lat) || Number.isNaN(lon)) return;
    fetchCropSuccess(lat, lon, dashboardDate || dateInput, cropInput || cropType, area);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDashboard, latitude, longitude, soilType, cropInput, cropType, dashboardDate, dateInput]);

  // Helper: reverse geocode to place name from map clicks
  const reverseGeocode = async (lat, lon) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      if (!res.ok) return;
      const j = await res.json();
      if (j?.display_name) setPlaceName(j.display_name);
    } catch {}
  };

  // Debounced area search with AbortController for cancellation
  useEffect(() => {
    if (areaInput.length < 2) {
      setAreaSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(areaInput)}&limit=5`,
          { signal: controller.signal }
        );
        if (response.ok) {
          const data = await response.json();
          setAreaSuggestions(data);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("Error fetching location suggestions:", error);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [areaInput]);

  // Optimized crop suggestions with useMemo would be better here, but keeping simple
  useEffect(() => {
    if (cropInput.length < 1) {
      setCropSuggestions([]);
      return;
    }
    const crops = ["Wheat", "Rice", "Corn", "Soybeans", "Cotton", "Barley", 
      "Oats", "Sorghum", "Potatoes", "Tomatoes", "Lettuce", "Carrots"];
    const filtered = crops.filter(crop => 
      crop.toLowerCase().includes(cropInput.toLowerCase())
    );
    setCropSuggestions(filtered);
  }, [cropInput]);

  // Geocode Place Name -> update lat/lon and show match under input
  useEffect(() => {
    if (locationMethod !== 'place') return;
    if (!placeName || placeName.trim().length < 3) {
      setPlaceMatch("");
      setPlaceGeocodeError("");
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setPlaceGeocodeLoading(true);
        setPlaceGeocodeError("");
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(placeName)}&limit=1`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error(`Geocode failed (${res.status})`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const first = data[0];
          setLatitude(String(first.lat));
          setLongitude(String(first.lon));
          setPlaceMatch(first.display_name || "");
        } else {
          setPlaceMatch("");
          setPlaceGeocodeError("No match found");
        }
      } catch (e) {
        if (e.name !== 'AbortError') {
          setPlaceGeocodeError(e.message || "Geocode error");
        }
      } finally {
        setPlaceGeocodeLoading(false);
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [placeName, locationMethod]);

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
  };

  const handleLandingSearch = () => {
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

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
      fetchSoilType(lat, lon);
      fetchCropSuccess(lat, lon, dateInput, cropType, area);
    } else {
      setSoilType("");
      setSoilTypeError("");
      setCropSuccess(null);
      setCropSuccessError("");
    }

    setIsRevealing(true);
    if (revealTimeout.current) clearTimeout(revealTimeout.current);
    revealTimeout.current = setTimeout(() => {
      setShowDashboard(true);
      setIsRevealing(false);
    }, 450);
  };

  const handleCloseDashboard = () => {
    setShowDashboard(false);
    setActiveItem(null);
  };

  useEffect(() => {
    return () => {
      if (revealTimeout.current) clearTimeout(revealTimeout.current);
    };
  }, []);

  const gridVariants = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.06, delayChildren: 0.18 }
    }
  };
  
  const itemVariants = {
    hidden: { y: 40, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 200, damping: 18 } }
  };

  // Optimized fetch with better error handling
  const fetchSoilType = async (lat, lon) => {
    const controller = new AbortController();
    
    try {
      setSoilTypeLoading(true);
      setSoilTypeError("");
      setSoilType("");
      
      const classifyUrl = new URL('https://rest.isric.org/soilgrids/v2.0/classification/query');
      classifyUrl.searchParams.set('lat', lat);
      classifyUrl.searchParams.set('lon', lon);
      
      let resolvedType = '';
      
      try {
        const res = await fetch(classifyUrl.toString(), { 
          headers: { 'Accept': 'application/json' },
          signal: controller.signal 
        });
        if (res.ok) {
          const j = await res.json();
          resolvedType = j?.USDA_TEXTURE_CLASS || j?.usda_texture_class || j?.texture_class || '';
        }
      } catch {}
      
      if (!resolvedType) {
        const propUrl = new URL('https://rest.isric.org/soilgrids/v2.0/properties/query');
        propUrl.searchParams.set('lat', lat);
        propUrl.searchParams.set('lon', lon);
        propUrl.searchParams.set('property', 'sand,clay');
        propUrl.searchParams.set('depth', '0-5cm');
        
        const res2 = await fetch(propUrl.toString(), { 
          headers: { 'Accept': 'application/json' },
          signal: controller.signal 
        });
        
        if (res2.ok) {
          const d = await res2.json();
          const sand = Number(d?.properties?.sand?.values?.[0]?.value ?? NaN);
          const clay = Number(d?.properties?.clay?.values?.[0]?.value ?? NaN);
          
          if (!Number.isNaN(sand) && !Number.isNaN(clay)) {
            if (clay >= 40) resolvedType = 'Clay';
            else if (clay >= 27 && sand <= 45) resolvedType = 'Clay Loam';
            else if (sand >= 70 && clay <= 15) resolvedType = 'Sandy Loam';
            else if (sand >= 85 && clay < 10) resolvedType = 'Sand';
            else if (clay <= 10 && sand <= 52) resolvedType = 'Silt Loam';
            else resolvedType = 'Loam';
          }
        }
      }
      
      if (resolvedType) {
        setSoilType(resolvedType);
      } else {
        throw new Error('No soil type available');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setSoilTypeError(err?.message || 'Failed to load soil type');
      }
    } finally {
      setSoilTypeLoading(false);
    }
    
    return () => controller.abort();
  };

  // Helper to compute detailed crop success with factors + trend
  const computeCropSuccessDetailed = (lat, lon, dateStr, crop, soil) => {
    const toMonth = (ds) => {
      if (!ds) return new Date().getUTCMonth() + 1;
      const d = new Date(ds);
      return Number.isNaN(d.getTime()) ? (new Date().getUTCMonth() + 1) : (d.getUTCMonth() + 1);
    };
    const month = toMonth(dateStr);
    const cropL = (crop || "").toLowerCase();
    const soilL = (soil || "").toLowerCase();

    // base from coordinates
    const base = 50 + 15 * Math.cos((lat * Math.PI) / 180) + 10 * Math.sin((lon * Math.PI) / 180);

    // seasonality
    let season = 0;
    if ([3,4,5].includes(month)) season += 6;
    if ([6,7,8].includes(month)) season += 2;
    if ([9,10,11].includes(month)) season += 4;
    if ([12,1,2].includes(month)) season -= 3;

    // soil vs crop tweaks
    let soilAdj = 0;
    if (soilL.includes("clay")) {
      if (cropL.includes("rice")) soilAdj += 8;
      if (cropL.includes("carrot") || cropL.includes("potato")) soilAdj -= 4;
    } else if (soilL.includes("sandy")) {
      if (cropL.includes("peanut") || cropL.includes("cotton")) soilAdj += 6;
      if (cropL.includes("rice")) soilAdj -= 6;
    } else if (soilL.includes("loam")) {
      soilAdj += 5;
    }

    // simple rainfall proxy by latitude band
    const rainProxy = Math.abs(lat) < 15 ? 4 : 0;

    let score = base + season + soilAdj + rainProxy;
    let clampAdj = 0;
    if (score > 100) { clampAdj = 100 - score; score = 100; }
    if (score < 0) { clampAdj = -score; score = 0; }

    // confidence
    let conf = 0.5;
    if (soilL) conf += 0.15;
    if (cropL) conf += 0.15;
    if (dateStr) conf += 0.1;
    if (Number.isFinite(lat) && Number.isFinite(lon)) conf += 0.1;
    conf = Math.max(0.4, Math.min(0.95, conf));

    // trend for 12 months
    const trend = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      let seas = 0;
      if ([3,4,5].includes(m)) seas += 6;
      if ([6,7,8].includes(m)) seas += 2;
      if ([9,10,11].includes(m)) seas += 4;
      if ([12,1,2].includes(m)) seas -= 3;
      let s = base + seas + soilAdj + rainProxy;
      return Math.max(0, Math.min(100, s));
    });

    return {
      score: Math.round(score),
      confidence: conf,
      factors: [
        { label: "Coords base", value: Math.round(base), sign: base >= 50 ? "+" : "±" },
        { label: "Seasonality", value: season, sign: season >= 0 ? "+" : "-" },
        { label: "Soil compatibility", value: soilAdj, sign: soilAdj >= 0 ? "+" : "-" },
        { label: "Rainfall proxy", value: rainProxy, sign: rainProxy >= 0 ? "+" : "-" },
        { label: "Clamp", value: Math.round(clampAdj), sign: clampAdj ? "±" : "" },
      ],
      month,
      trend,
    };
  };

  // Enhanced crop success: compute with details and trend
  const fetchCropSuccess = async (lat, lon, dateStr, crop, areaName) => {
    try {
      setCropSuccessLoading(true);
      setCropSuccessError("");
      setCropSuccess(null);
      setCropDetails(null);
      setCropTrend([]);

      // brief delay for UX
      await new Promise(r => setTimeout(r, 200));

      const det = computeCropSuccessDetailed(lat, lon, dateStr, crop || cropInput || cropType, soilType);
      setCropSuccess(det.score);
      setCropDetails(det);
      setCropTrend(det.trend);
    } catch (err) {
      setCropSuccessError(err?.message || 'Crop success not available');
    } finally {
      setCropSuccessLoading(false);
    }
  };

  // Recompute interactively when key inputs change while dashboard is open
  useEffect(() => {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (!showDashboard) return;
    if (Number.isNaN(lat) || Number.isNaN(lon)) return;
    fetchCropSuccess(lat, lon, dashboardDate || dateInput, cropInput || cropType, area);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDashboard, latitude, longitude, soilType, cropInput, cropType, dashboardDate, dateInput]);

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
  };

  const handleLandingSearch = () => {
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

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
      fetchSoilType(lat, lon);
      fetchCropSuccess(lat, lon, dateInput, cropType, area);
    } else {
      setSoilType("");
      setSoilTypeError("");
      setCropSuccess(null);
      setCropSuccessError("");
    }

    setIsRevealing(true);
    if (revealTimeout.current) clearTimeout(revealTimeout.current);
    revealTimeout.current = setTimeout(() => {
      setShowDashboard(true);
      setIsRevealing(false);
    }, 450);
  };

  const handleCloseDashboard = () => {
    setShowDashboard(false);
    setActiveItem(null);
  };

  useEffect(() => {
    return () => {
      if (revealTimeout.current) clearTimeout(revealTimeout.current);
    };
  }, []);

  const gridVariants = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.06, delayChildren: 0.18 }
    }
  };
  
  const itemVariants = {
    hidden: { y: 40, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 200, damping: 18 } }
  };

  // Optimized fetch with better error handling
  const fetchSoilType = async (lat, lon) => {
    const controller = new AbortController();
    
    try {
      setSoilTypeLoading(true);
      setSoilTypeError("");
      setSoilType("");
      
      const classifyUrl = new URL('https://rest.isric.org/soilgrids/v2.0/classification/query');
      classifyUrl.searchParams.set('lat', lat);
      classifyUrl.searchParams.set('lon', lon);
      
      let resolvedType = '';
      
      try {
        const res = await fetch(classifyUrl.toString(), { 
          headers: { 'Accept': 'application/json' },
          signal: controller.signal 
        });
        if (res.ok) {
          const j = await res.json();
          resolvedType = j?.USDA_TEXTURE_CLASS || j?.usda_texture_class || j?.texture_class || '';
        }
      } catch {}
      
      if (!resolvedType) {
        const propUrl = new URL('https://rest.isric.org/soilgrids/v2.0/properties/query');
        propUrl.searchParams.set('lat', lat);
        propUrl.searchParams.set('lon', lon);
        propUrl.searchParams.set('property', 'sand,clay');
        propUrl.searchParams.set('depth', '0-5cm');
        
        const res2 = await fetch(propUrl.toString(), { 
          headers: { 'Accept': 'application/json' },
          signal: controller.signal 
        });
        
        if (res2.ok) {
          const d = await res2.json();
          const sand = Number(d?.properties?.sand?.values?.[0]?.value ?? NaN);
          const clay = Number(d?.properties?.clay?.values?.[0]?.value ?? NaN);
          
          if (!Number.isNaN(sand) && !Number.isNaN(clay)) {
            if (clay >= 40) resolvedType = 'Clay';
            else if (clay >= 27 && sand <= 45) resolvedType = 'Clay Loam';
            else if (sand >= 70 && clay <= 15) resolvedType = 'Sandy Loam';
            else if (sand >= 85 && clay < 10) resolvedType = 'Sand';
            else if (clay <= 10 && sand <= 52) resolvedType = 'Silt Loam';
            else resolvedType = 'Loam';
          }
        }
      }
      
      if (resolvedType) {
        setSoilType(resolvedType);
      } else {
        throw new Error('No soil type available');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setSoilTypeError(err?.message || 'Failed to load soil type');
      }
    } finally {
      setSoilTypeLoading(false);
    }
    
    return () => controller.abort();
  };

  // Helper to compute detailed crop success with factors + trend
  const computeCropSuccessDetailed = (lat, lon, dateStr, crop, soil) => {
    const toMonth = (ds) => {
      if (!ds) return new Date().getUTCMonth() + 1;
      const d = new Date(ds);
      return Number.isNaN(d.getTime()) ? (new Date().getUTCMonth() + 1) : (d.getUTCMonth() + 1);
    };
    const month = toMonth(dateStr);
    const cropL = (crop || "").toLowerCase();
    const soilL = (soil || "").toLowerCase();

    // base from coordinates
    const base = 50 + 15 * Math.cos((lat * Math.PI) / 180) + 10 * Math.sin((lon * Math.PI) / 180);

    // seasonality
    let season = 0;
    if ([3,4,5].includes(month)) season += 6;
    if ([6,7,8].includes(month)) season += 2;
    if ([9,10,11].includes(month)) season += 4;
    if ([12,1,2].includes(month)) season -= 3;

    // soil vs crop tweaks
    let soilAdj = 0;
    if (soilL.includes("clay")) {
      if (cropL.includes("rice")) soilAdj += 8;
      if (cropL.includes("carrot") || cropL.includes("potato")) soilAdj -= 4;
    } else if (soilL.includes("sandy")) {
      if (cropL.includes("peanut") || cropL.includes("cotton")) soilAdj += 6;
      if (cropL.includes("rice")) soilAdj -= 6;
    } else if (soilL.includes("loam")) {
      soilAdj += 5;
    }

    // simple rainfall proxy by latitude band
    const rainProxy = Math.abs(lat) < 15 ? 4 : 0;

    let score = base + season + soilAdj + rainProxy;
    let clampAdj = 0;
    if (score > 100) { clampAdj = 100 - score; score = 100; }
    if (score < 0) { clampAdj = -score; score = 0; }

    // confidence
    let conf = 0.5;
    if (soilL) conf += 0.15;
    if (cropL) conf += 0.15;
    if (dateStr) conf += 0.1;
    if (Number.isFinite(lat) && Number.isFinite(lon)) conf += 0.1;
    conf = Math.max(0.4, Math.min(0.95, conf));

    // trend for 12 months
    const trend = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      let seas = 0;
      if ([3,4,5].includes(m)) seas += 6;
      if ([6,7,8].includes(m)) seas += 2;
      if ([9,10,11].includes(m)) seas += 4;
      if ([12,1,2].includes(m)) seas -= 3;
      let s = base + seas + soilAdj + rainProxy;
      return Math.max(0, Math.min(100, s));
    });

    return {
      score: Math.round(score),
      confidence: conf,
      factors: [
        { label: "Coords base", value: Math.round(base), sign: base >= 50 ? "+" : "±" },
        { label: "Seasonality", value: season, sign: season >= 0 ? "+" : "-" },
        { label: "Soil compatibility", value: soilAdj, sign: soilAdj >= 0 ? "+" : "-" },
        { label: "Rainfall proxy", value: rainProxy, sign: rainProxy >= 0 ? "+" : "-" },
        { label: "Clamp", value: Math.round(clampAdj), sign: clampAdj ? "±" : "" },
      ],
      month,
      trend,
    };
  };

  // Enhanced crop success: compute with details and trend
  const fetchCropSuccess = async (lat, lon, dateStr, crop, areaName) => {
    try {
      setCropSuccessLoading(true);
      setCropSuccessError("");
      setCropSuccess(null);
      setCropDetails(null);
      setCropTrend([]);

      // brief delay for UX
      await new Promise(r => setTimeout(r, 200));

      const det = computeCropSuccessDetailed(lat, lon, dateStr, crop || cropInput || cropType, soilType);
      setCropSuccess(det.score);
      setCropDetails(det);
      setCropTrend(det.trend);
    } catch (err) {
      setCropSuccessError(err?.message || 'Crop success not available');
    } finally {
      setCropSuccessLoading(false);
    }
  };

  // Recompute interactively when key inputs change while dashboard is open
  useEffect(() => {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (!showDashboard) return;
    if (Number.isNaN(lat) || Number.isNaN(lon)) return;
    fetchCropSuccess(lat, lon, dashboardDate || dateInput, cropInput || cropType, area);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDashboard, latitude, longitude, soilType, cropInput, cropType, dashboardDate, dateInput]);

  return (
    <div className="min-h-screen relative">
      <Suspense fallback={<div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-green-50" />}>
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <Aurora
            colorStops={["#0BFF8A", "#00D8FF", "#7B2CFF"]}
            blend={0.5}
            amplitude={1.0}
            speed={0.5}
          />
        </div>
      </Suspense>
      
      {!showDashboard ? (
        <>
          {/* Landing Page */}
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: isRevealing ? 0.5 : 1, filter: isRevealing ? 'blur(8px)' : 'blur(0px)', scale: isRevealing ? 0.98 : 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen grid grid-cols-3"
            style={{ pointerEvents: isRevealing ? 'none' : 'auto' }}
          >
            {/* Left Side - Interactive OpenStreetMap */}
            <div ref={mapContainerRef} className="col-span-2 relative">
              <Suspense fallback={<div className="w-full h-full bg-gray-100 animate-pulse" />}>
                <MapView
                  latitude={latitude}
                  longitude={longitude}
                  onMapClick={async (lat, lng) => {
                    setLatitude(String(lat));
                    setLongitude(String(lng));
                    setLocationMethod('map');
                    // New: reverse geocode into place name
                    reverseGeocode(lat, lng);
                  }}
                />
                <Crosshair containerRef={mapContainerRef} color="#00ADB5" opacity={0.6} thickness={2} />
              </Suspense>
            </div>

            {/* Right Side - Location Selector and Form */}
            <div className="flex flex-col items-center justify-center px-4 space-y-4">
              {/* Location Method Dropdown */}
              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="w-full max-w-xs"
              >
                <label className="block text-sm font-semibold text-black-700 mb-2">Choose Location Method</label>
                <select
                  value={locationMethod}
                  onChange={(e) => setLocationMethod(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-black-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white text-sm"
                >
                  <option value="map">Select on Map</option>
                  <option value="coordinates">Input Coordinates</option>
                  <option value="place">Input Place Name</option>
                </select>
              </motion.div>

              {/* Form */}
              <div className="w-full max-w-xs">
                <motion.h1 
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold text-black-800 mb-2 text-center"
                >
                  Welcome, Farmer! 🌾
                </motion.h1>
                <motion.p 
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-black-600 mb-4 text-center text-sm"
                >
                  Enter your farm details to get started
                </motion.p>

                <div className="space-y-4">
                  {/* Location-specific inputs */}
                  {locationMethod === 'coordinates' && (
                    <>
                      <motion.div
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        <label className="block text-sm font-semibold text-black-700 mb-2">Longitude</label>
                        <input
                          type="text"
                          value={longitude}
                          onChange={(e) => setLongitude(e.target.value)}
                          placeholder="e.g., -122.4194"
                          className="w-full px-3 py-2.5 rounded-lg border border-black-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                        />
                      </motion.div>

                      <motion.div
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <label className="block text-sm font-semibold text-black-700 mb-2">Latitude</label>
                        <input
                          type="text"
                          value={latitude}
                          onChange={(e) => setLatitude(e.target.value)}
                          placeholder="e.g., 37.7749"
                          className="w-full px-3 py-2.5 rounded-lg border border-black-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
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
                      <label className="block text-sm font-semibold text-black-700 mb-2">Place Name</label>
                      <input
                        type="text"
                        value={placeName}
                        onChange={(e) => setPlaceName(e.target.value)}
                        placeholder="e.g., Green Valley, California"
                        className="w-full px-3 py-2.5 rounded-lg border border-black-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                      />
                      {/* Feedback for matched place and coordinates */}
                      <div className="mt-2 text-xs">
                        {placeGeocodeLoading && <span className="text-blue-600">Locating…</span>}
                        {!placeGeocodeLoading && placeGeocodeError && <span className="text-red-600">{placeGeocodeError}</span>}
                        {!placeGeocodeLoading && !placeGeocodeError && placeMatch && (
                          <span className="text-blue-700">Matched: {placeMatch} ({latitude}, {longitude})</span>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {locationMethod === 'map' && (
                    <motion.div
                      initial={{ x: 50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="p-3 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <div className="flex items-center gap-2 text-blue-700">
                        <MapPin className="w-5 h-5" />
                        <span className="font-semibold">Map Selection Mode</span>
                      </div>
                      <p className="text-blue-600 text-sm mt-1">Click on the map to select your farm location</p>
                      {longitude && latitude && (
                        <div className="mt-2 text-sm text-blue-600">Selected: {latitude}, {longitude}</div>
                      )}
                    </motion.div>
                  )}

                  {/* Common fields */}
                  <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <label className="block text-sm font-semibold text-black-700 mb-2">Farm Name</label>
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="e.g., Green Valley Farm"
                      className="w-full px-3 py-2.5 rounded-lg border border-black-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <label className="block text-sm font-semibold text-black-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={dateInput}
                      onChange={(e) => setDateInput(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-black-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <label className="block text-sm font-semibold text-black-700 mb-2">Crop Type</label>
                    <input
                      type="text"
                      value={cropType}
                      onChange={(e) => setCropType(e.target.value)}
                      placeholder="e.g., Wheat"
                      className="w-full px-3 py-2.5 rounded-lg border border-black-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                    />
                  </motion.div>

                  <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    onClick={handleLandingSearch}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 text-sm"
                  >
                    <Search className="w-5 h-5" />
                    Analyze Farm
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
          
          {isRevealing && (
            <motion.div
              className="fixed inset-0 z-[80] backdrop-blur-lg bg-black/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm backdrop-blur-md border border-white/20">
                  Analyzing…
                </div>
              </div>
            </motion.div>
          )}
        </>
      ) : (
        // Dashboard View
        <motion.div
          key="dashboard"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 22 }}
          className="min-h-screen pb-20"
        >
          {/* Close Button */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            className="fixed top-6 right-6 z-[100]"
          >
            <Suspense fallback={null}>
              <GlassSurface
                width={52}
                height={52}
                borderRadius={26}
                opacity={0.9}
                blur={12}
                className="shadow-xl hover:shadow-2xl active:scale-95 transition-all cursor-pointer"
              >
                <button
                  onClick={handleCloseDashboard}
                  className="w-full h-full flex items-center justify-center rounded-full"
                  aria-label="Close"
                >
                  <X className="w-6 h-6 text-white/95" />
                </button>
              </GlassSurface>
            </Suspense>
          </motion.div>

          {/* Floating Search Bar */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            className="max-w-6xl mx-auto px-4 relative"
          >
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
              <div className="flex items-center gap-3">
                <Suspense fallback={<div className="flex-1 h-[52px] bg-white/20 rounded-[26px] animate-pulse" />}>
                  <GlassSurface
                    width="100%"
                    height={52}
                    borderRadius={26}
                    opacity={0.85}
                    className="flex-1 glass-surface--allow-overflow"
                  >
                    <div className="px-5 py-1.5 flex items-center gap-2 h-full">
                      {/* Area Input */}
                      <div className="relative flex-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-black-600 flex-shrink-0" />
                          <input
                            type="text"
                            placeholder="Location"
                            value={areaInput}
                            onChange={(e) => setAreaInput(e.target.value)}
                            onFocus={() => setShowAreaSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowAreaSuggestions(false), 200)}
                            className="bg-transparent text-black-900 placeholder-black-600 outline-none w-full text-sm font-medium"
                          />
                        </div>
                        {showAreaSuggestions && areaSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-black-200/50 overflow-hidden z-[70]">
                            {areaSuggestions.map((suggestion, idx) => (
                              <div
                                key={idx}
                                className="px-4 py-3 hover:bg-black-100/80 cursor-pointer text-black-900 text-sm border-b border-black-100/50 last:border-0"
                                onMouseDown={() => {
                                  // New: set coordinates and place name from suggestion
                                  setAreaInput(suggestion.display_name);
                                  setPlaceName(suggestion.display_name);
                                  setLatitude(String(suggestion.lat));
                                  setLongitude(String(suggestion.lon));
                                  setLocationMethod('place');
                                  setShowAreaSuggestions(false);
                                }}
                              >
                                {suggestion.display_name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="w-px h-6 bg-black-300/50"></div>

                      {/* Crop Input */}
                      <div className="relative flex-1">
                        <div className="flex items-center gap-2">
                          <Sprout className="w-4 h-4 text-black-600 flex-shrink-0" />
                          <input
                            type="text"
                            placeholder="Crop"
                            value={cropInput}
                            onChange={(e) => setCropInput(e.target.value)}
                            onFocus={() => setShowCropSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowCropSuggestions(false), 200)}
                            className="bg-transparent text-black-900 placeholder-black-600 outline-none w-full text-sm font-medium"
                          />
                        </div>
                        {showCropSuggestions && cropSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-black-200/50 overflow-hidden z-[70]">
                            {cropSuggestions.map((suggestion, idx) => (
                              <div
                                key={idx}
                                className="px-4 py-3 hover:bg-black-100/80 cursor-pointer text-black-900 text-sm border-b border-black-100/50 last:border-0"
                                onMouseDown={() => {
                                  setCropInput(suggestion);
                                  setShowCropSuggestions(false);
                                }}
                              >
                                {suggestion}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="w-px h-6 bg-black-300/50"></div>

                      {/* Date Input */}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-black-600 flex-shrink-0" />
                        <input
                          type="date"
                          value={dashboardDate}
                          onChange={(e) => setDashboardDate(e.target.value)}
                          className="bg-transparent text-black-900 placeholder-black-600 outline-none text-sm font-medium"
                        />
                      </div>
                    </div>
                  </GlassSurface>
                </Suspense>

                {/* Search Button */}
                <Suspense fallback={null}>
                  <GlassSurface
                    width={52}
                    height={52}
                    borderRadius={26}
                    opacity={0.85}
                    className="shadow-xl hover:shadow-2xl active:scale-95 transition-all cursor-pointer"
                  >
                    <button
                      onClick={handleDashboardSearch}
                      className="w-full h-full flex items-center justify-center rounded-full"
                      aria-label="Search"
                    >
                      {isSearching ? (
                        <div className="w-5 h-5 rounded-full border-2 border-white/80 border-t-transparent animate-spin" />
                      ) : (
                        <Search className="w-5 h-5 text-white/95" />
                      )}
                    </button>
                  </GlassSurface>
                </Suspense>
              </div>
            </div>
          </motion.div>

          {/* Dashboard Tiles Grid */}
          <div className="max-w-6xl mx-auto px-4 pt-28">
            <motion.div
              variants={gridVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[140px]"> {/* reduced row height */}
              {dashboardItems.map((item) => (
                <motion.div key={item.id} variants={itemVariants} className={item.span}>
                  <DashboardTile
                    item={item}
                    onClick={(e) => handleClick(item, e)}
                    soilTypeLoading={soilTypeLoading}
                    soilTypeError={soilTypeError}
                    soilType={soilType}
                    cropSuccessLoading={cropSuccessLoading}
                    cropSuccessError={cropSuccessError}
                    cropSuccess={cropSuccess}
                    latitude={latitude}
                    longitude={longitude}
                    cropDetails={cropDetails}
                    cropTrend={cropTrend}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Active Tile Overlay */}
          <AnimatePresence>
            {activeItem && (
              <motion.div
                className="fixed inset-0 z-[95] bg-black/50 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveItem(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className="w-full max-w-lg px-4"> {/* slightly smaller modal */}
                  <Suspense fallback={<div className="h-64 bg-white/10 rounded-3xl animate-pulse" />}>
                    <GlassSurface
                      width="100%"
                      height="auto"
                      borderRadius={20}
                      opacity={0.9}
                      blur={14}
                      className="p-5 relative"
                    >
                      <button
                        onClick={() => setActiveItem(null)}
                        className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition"
                        aria-label="Close details"
                      >
                        <X className="w-5 h-5 text-white/95" />
                      </button>

                      <div className="flex items-center gap-3 mb-4">
                        {(() => {
                          const IconC = activeItem?.icon;
                          return IconC ? <IconC className="w-6 h-6 text-white/95" /> : null;
                        })()}
                        <h3 className="text-lg font-semibold text-white/95">{activeItem.title}</h3>
                      </div>

                      {/* Details */}
                      <div className="text-white/90 text-sm space-y-3">
                        {activeItem.title === 'Soil Type' ? (
                          <>
                            {soilTypeLoading && (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                                <span>Loading soil type…</span>
                              </div>
                            )}
                            {!soilTypeLoading && soilTypeError && (
                              <p className="text-red-200">{soilTypeError}</p>
                            )}
                            {!soilTypeLoading && !soilTypeError && soilType && (
                              <div className="bg-white/10 rounded-lg p-3">
                                <div className="text-xs text-white/70">USDA Texture</div>
                                <div className="text-base font-semibold">{soilType}</div>
                              </div>
                            )}
                            {!soilTypeLoading && !soilTypeError && !soilType && (
                              <p className="text-white/70">Run Analyze to fetch soil type for the selected coordinates.</p>
                            )}
                          </>
                        ) : activeItem.title === 'Crop Success Rate' ? (
                          <>
                            {!cropSuccessLoading && !cropSuccessError && typeof cropSuccess === 'number' ? (
                              <div className="space-y-4">
                                {/* score + confidence */}
                                <div className="flex items-center gap-4">
                                  <div className="text-3xl font-semibold">{Math.round(cropSuccess)}%</div>
                                  <div className="flex-1">
                                    <div className="text-xs text-white/70">Confidence</div>
                                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                      <div
                                        className="h-2 bg-emerald-500"
                                        style={{ width: `${Math.round((cropDetails?.confidence ?? 0) * 100)}%` }}
                                      />
                                    </div>
                                    <div className="text-[11px] text-white/70 mt-1">
                                      ~{Math.round((cropDetails?.confidence ?? 0) * 100)}%
                                    </div>
                                  </div>
                                </div>

                                {/* factors */}
                                <div>
                                  <div className="text-xs font-semibold mb-2">Contributing factors</div>
                                  <div className="grid grid-cols-2 gap-2">
                                    {cropDetails?.factors?.map((f, idx) => (
                                      <div key={idx} className="bg-white/10 rounded-md px-2 py-2">
                                        <div className="text-[11px] text-white/70">{f.label}</div>
                                        <div className="text-xs font-semibold">{f.sign}{Math.round(f.value)}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* trend */}
                                {Array.isArray(cropTrend) && cropTrend.length > 0 && (
                                  <div>
                                    <div className="text-xs font-semibold mb-2">Seasonal trend</div>
                                    <svg width="100%" height="60" viewBox="0 0 260 60" preserveAspectRatio="none" className="rounded-md">
                                      {(() => {
                                        const w = 260, h = 60;
                                        const stepX = w / Math.max(1, cropTrend.length - 1);
                                        const path = cropTrend.map((v, i) => {
                                          const x = i * stepX;
                                          const y = h - (v / 100) * h;
                                          return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
                                        }).join(' ');
                                        return (
                                          <>
                                            <rect x="0" y="0" width={w} height={h} fill="rgba(255,255,255,0.06)" />
                                            <path d={path} fill="none" stroke="#60a5fa" strokeWidth="2" />
                                          </>
                                        );
                                      })()}
                                    </svg>
                                    <div className="text-[11px] text-white/60 mt-1">Jan to Dec at selected location</div>
                                  </div>
                                )}

                                {/* hint */}
                                <div className="text-[11px] text-white/60">
                                  Tip: change date, crop, or move the pin to see this update live.
                                </div>
                              </div>
                            ) : cropSuccessLoading ? (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full border-2 border-white/60 border-t