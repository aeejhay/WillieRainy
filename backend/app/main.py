from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import logging
from typing import Optional

from .models import ClimoResponse, ErrorResponse
from .services import climatology_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Will It Rain? API",
    description="API for getting climatology-based rain probability data",
    version="1.0.0"
)

# Add CORS middleware for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Will It Rain? API is running"}


@app.get("/api/rain/climo", response_model=ClimoResponse)
async def get_climatology_data(
    lat: float = Query(..., description="Latitude (-90 to 90)", ge=-90, le=90),
    lon: float = Query(..., description="Longitude (-180 to 180)", ge=-180, le=180),
    date: str = Query(..., description="Date in YYYY-MM-DD format", regex=r"^\d{4}-\d{2}-\d{2}$")
) -> ClimoResponse:
    """
    Get climatology-based rain probability for a specific location and date.
    
    Returns probability of precipitation (PoP), confidence intervals,
    mean/median rainfall on rainy days, and sample size from NASA GPM data.
    """
    try:
        logger.info(f"Request for lat={lat}, lon={lon}, date={date}")
        result = await climatology_service.get_climatology_data(lat, lon, date)
        logger.info(f"Successfully retrieved data: PoP={result.pop}%")
        return result
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    try:
        # Test NASA service connectivity
        async with climatology_service.nasa_service as service:
            available_dates = await service.get_available_dates()
        return {"status": "healthy", "service": "nasa_gpm", "available_dates": len(available_dates)}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {"status": "unhealthy", "error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
