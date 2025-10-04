export interface GeocodingResult {
  name: string;
  display_name: string;
  lat: number;
  lon: number;
  type: string;
  importance: number;
}

export interface GeocodingService {
  searchLocation(query: string): Promise<GeocodingResult[]>;
}

class NominatimGeocodingService implements GeocodingService {
  private readonly baseUrl = 'https://nominatim.openstreetmap.org/search';
  private readonly requestDelay = 1000; // 1 second delay to respect rate limits
  private lastRequestTime = 0;

  async searchLocation(query: string): Promise<GeocodingResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    // Rate limiting - respect Nominatim's 1 request per second policy
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.requestDelay) {
      await new Promise(resolve => setTimeout(resolve, this.requestDelay - timeSinceLastRequest));
    }

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        format: 'json',
        limit: '10',
        addressdetails: '1',
        extratags: '1',
        namedetails: '1',
        countrycodes: '',
        dedupe: '1'
      });

      const response = await fetch(`${this.baseUrl}?${params}`, {
        headers: {
          'User-Agent': 'WillItRain-WeatherApp/1.0 (contact@example.com)', // Required by Nominatim
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.lastRequestTime = Date.now();

      return data.map((item: any) => ({
        name: this.formatLocationName(item),
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        type: item.type || 'location',
        importance: parseFloat(item.importance) || 0
      })).sort((a: GeocodingResult, b: GeocodingResult) => b.importance - a.importance);

    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error('Failed to search location. Please try again.');
    }
  }

  private formatLocationName(item: any): string {
    const address = item.address || {};
    const name = item.name || '';
    
    // Try to create a meaningful name from the address components
    if (name && name !== address?.city && name !== address?.town && name !== address?.village) {
      return name;
    }

    const parts = [];
    if (address?.city) parts.push(address.city);
    else if (address?.town) parts.push(address.town);
    else if (address?.village) parts.push(address.village);
    
    if (address?.state) parts.push(address.state);
    if (address?.country) parts.push(address.country);

    return parts.length > 0 ? parts.join(', ') : name || 'Unknown Location';
  }
}

// Alternative: Google Geocoding Service (requires API key)
class GoogleGeocodingService implements GeocodingService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchLocation(query: string): Promise<GeocodingResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      const params = new URLSearchParams({
        address: query.trim(),
        key: this.apiKey,
        language: 'en'
      });

      const response = await fetch(`${this.baseUrl}?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Google API error: ${data.status}`);
      }

      return data.results.map((item: any) => ({
        name: item.formatted_address,
        display_name: item.formatted_address,
        lat: item.geometry.location.lat,
        lon: item.geometry.location.lng,
        type: item.types[0] || 'location',
        importance: item.types.includes('locality') ? 1 : 0.5
      }));

    } catch (error) {
      console.error('Google Geocoding error:', error);
      throw new Error('Failed to search location. Please try again.');
    }
  }
}

// Export the default service (Nominatim - free, no API key required)
export const geocodingService = new NominatimGeocodingService();

// Export for testing or if you want to use Google instead
export { NominatimGeocodingService, GoogleGeocodingService };
