import axios from 'axios';

export interface ClimoResponse {
  pop: number;
  pop_low: number;
  pop_high: number;
  mean_mm: number;
  median_mm: number;
  n_years: number;
  source: string;
}

export interface ApiError {
  error: string;
  detail?: string;
}

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    
    if (error.response) {
      // Server responded with error status
      const errorData: ApiError = error.response.data;
      throw new Error(errorData.detail || errorData.error || 'API request failed');
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Something else happened
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
);

/**
 * Get climatology data for a specific location and date
 */
export const getClimatologyData = async (
  lat: number,
  lon: number,
  date: string
): Promise<ClimoResponse> => {
  try {
    const response = await api.get<ClimoResponse>('/rain/climo', {
      params: {
        lat,
        lon,
        date,
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching climatology data:', error);
    throw error;
  }
};

/**
 * Health check endpoint
 */
export const healthCheck = async (): Promise<{ status: string; service?: string; error?: string }> => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

export default api;
