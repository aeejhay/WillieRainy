import asyncio
from typing import Optional
from datetime import datetime
import logging

from .models import ClimoResponse
from .nasa_service import nasa_gpm_service

logger = logging.getLogger(__name__)


class ClimatologyService:
    """Service for accessing IMERG climatology data from NASA GPM"""
    
    def __init__(self):
        self.nasa_service = nasa_gpm_service
        
    def get_day_of_year(self, date: str) -> int:
        """Convert date string to day of year"""
        try:
            parsed_date = datetime.strptime(date, "%Y-%m-%d")
            return parsed_date.timetuple().tm_yday
        except ValueError as e:
            raise ValueError(f"Invalid date format. Use YYYY-MM-DD: {e}")
    
    async def get_climatology_data(self, lat: float, lon: float, date: str) -> ClimoResponse:
        """
        Get climatology data for a specific location and date from NASA GPM
        
        Args:
            lat: Latitude (-90 to 90)
            lon: Longitude (-180 to 180)
            date: Date in YYYY-MM-DD format
            
        Returns:
            ClimoResponse with probability of precipitation and statistics
        """
        # Validate inputs
        if not (-90 <= lat <= 90):
            raise ValueError("Latitude must be between -90 and 90")
        if not (-180 <= lon <= 180):
            raise ValueError("Longitude must be between -180 and 180")
        
        try:
            # Parse the date
            parsed_date = datetime.strptime(date, "%Y-%m-%d")
            
            # Use async context manager for NASA service
            async with self.nasa_service as service:
                # Try to get real precipitation data first
                precipitation_data = await service.fetch_precipitation_data(lat, lon, parsed_date)
                
                if precipitation_data and 'pop' in precipitation_data:
                    # We got real data from NASA
                    logger.info(f"Retrieved NASA data for lat={lat}, lon={lon}, date={date}")
                    return ClimoResponse(
                        pop=precipitation_data['pop'],
                        pop_low=precipitation_data['pop_low'],
                        pop_high=precipitation_data['pop_high'],
                        mean_mm=precipitation_data['mean_mm'],
                        median_mm=precipitation_data['median_mm'],
                        n_years=precipitation_data['n_years'],
                        source=precipitation_data['source']
                    )
                else:
                    # Fallback to climatology
                    climatology_data = await service.fetch_climatology_data(lat, lon, parsed_date)
                    logger.info(f"Using climatology data for lat={lat}, lon={lon}, date={date}")
                    return ClimoResponse(
                        pop=climatology_data['pop'],
                        pop_low=climatology_data['pop_low'],
                        pop_high=climatology_data['pop_high'],
                        mean_mm=climatology_data['mean_mm'],
                        median_mm=climatology_data['median_mm'],
                        n_years=climatology_data['n_years'],
                        source=climatology_data['source']
                    )
                    
        except Exception as e:
            logger.error(f"Error fetching NASA data: {e}")
            # Return a fallback response with error indication
            return ClimoResponse(
                pop=45.0,  # Default value
                pop_low=35.0,
                pop_high=55.0,
                mean_mm=8.5,
                median_mm=4.2,
                n_years=22,
                source=f"IMERG Final v07 climatology (2001-2022) - Service temporarily unavailable: {str(e)}"
            )


# Global service instance
climatology_service = ClimatologyService()