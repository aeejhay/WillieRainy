"""
Script to build seasonal tilt JSON from climatology data.

This script analyzes the climatology data to identify seasonal patterns and
creates a JSON file with seasonal adjustments for different regions.
"""

import xarray as xr
import numpy as np
import json
from pathlib import Path
import pandas as pd
import logging
from typing import Dict, List, Tuple

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
CLIMO_FILE = "data/products/imerg_climo_v07.nc"
OUTPUT_DIR = Path("data/products")
OUTPUT_FILE = "seasonal_tilt.json"


def load_climatology() -> xarray.Dataset:
    """Load the climatology NetCDF file"""
    climo_path = Path(CLIMO_FILE)
    if not climo_path.exists():
        raise FileNotFoundError(f"Climatology file not found: {climo_path}")
    
    logger.info(f"Loading climatology data from {climo_path}")
    return xr.open_dataset(climo_path)


def define_seasons() -> Dict[str, Tuple[int, int]]:
    """Define seasonal periods by day of year"""
    return {
        "winter": (335, 365),  # Dec 1 - Dec 31
        "spring": (60, 151),   # Mar 1 - May 31
        "summer": (152, 243),  # Jun 1 - Aug 31
        "fall": (244, 334)     # Sep 1 - Nov 30
    }


def compute_seasonal_statistics(ds: xarray.Dataset) -> Dict:
    """Compute seasonal statistics from climatology data"""
    logger.info("Computing seasonal statistics...")
    
    seasons = define_seasons()
    seasonal_data = {}
    
    for season_name, (start_doy, end_doy) in seasons.items():
        logger.info(f"Processing {season_name} season (days {start_doy}-{end_doy})")
        
        # Handle winter season that spans year boundary
        if start_doy > end_doy:
            # Winter spans Dec 1 to end of year, then Jan 1 to Feb 28/29
            winter_days = list(range(start_doy, 367)) + list(range(1, 60))
            season_mask = ds.dayofyear.isin(winter_days)
        else:
            season_mask = (ds.dayofyear >= start_doy) & (ds.dayofyear <= end_doy)
        
        # Extract seasonal data
        season_ds = ds.where(season_mask, drop=True)
        
        if season_ds.sizes['dayofyear'] == 0:
            logger.warning(f"No data found for {season_name} season")
            continue
        
        # Compute statistics
        seasonal_stats = {
            "name": season_name,
            "days": list(season_ds.dayofyear.values),
            "pop_mean": float(season_ds.pop.mean().values),
            "pop_std": float(season_ds.pop.std().values),
            "pop_min": float(season_ds.pop.min().values),
            "pop_max": float(season_ds.pop.max().values),
            "rainfall_mean": float(season_ds.mean_mm.mean().values),
            "rainfall_std": float(season_ds.mean_mm.std().values),
            "n_locations": int(season_ds.sizes['lat'] * season_ds.sizes['lon'])
        }
        
        seasonal_data[season_name] = seasonal_stats
    
    return seasonal_data


def identify_rainy_seasons(ds: xarray.Dataset) -> Dict:
    """Identify which seasons are typically rainy for different regions"""
    logger.info("Identifying rainy seasons by region...")
    
    seasons = define_seasons()
    regional_patterns = {}
    
    # Define major climate regions (simplified)
    regions = {
        "tropical": {"lat_range": (-30, 30)},
        "subtropical": {"lat_range": (30, 40), "lat_range_south": (-40, -30)},
        "temperate_north": {"lat_range": (40, 60)},
        "temperate_south": {"lat_range": (-60, -40)},
        "polar_north": {"lat_range": (60, 90)},
        "polar_south": {"lat_range": (-90, -60)}
    }
    
    for region_name, region_def in regions.items():
        logger.info(f"Analyzing {region_name} region")
        
        # Select region
        if "lat_range" in region_def:
            lat_min, lat_max = region_def["lat_range"]
            if lat_min < lat_max:  # Northern hemisphere
                region_ds = ds.sel(lat=slice(lat_min, lat_max))
            else:  # Southern hemisphere (lat is decreasing)
                region_ds = ds.sel(lat=slice(lat_max, lat_min))
        else:
            # Handle regions with multiple lat ranges (like subtropical)
            region_ds_list = []
            for key in region_def:
                if "lat_range" in key:
                    lat_min, lat_max = region_def[key]
                    if lat_min < lat_max:
                        region_ds_list.append(ds.sel(lat=slice(lat_min, lat_max)))
                    else:
                        region_ds_list.append(ds.sel(lat=slice(lat_max, lat_min)))
            
            if region_ds_list:
                region_ds = xr.concat(region_ds_list, dim='lat')
            else:
                continue
        
        # Compute seasonal PoP for this region
        region_seasons = {}
        for season_name, (start_doy, end_doy) in seasons.items():
            # Handle winter season that spans year boundary
            if start_doy > end_doy:
                winter_days = list(range(start_doy, 367)) + list(range(1, 60))
                season_mask = region_ds.dayofyear.isin(winter_days)
            else:
                season_mask = (region_ds.dayofyear >= start_doy) & (region_ds.dayofyear <= end_doy)
            
            season_ds = region_ds.where(season_mask, drop=True)
            if season_ds.sizes['dayofyear'] > 0:
                avg_pop = float(season_ds.pop.mean().values)
                region_seasons[season_name] = avg_pop
        
        # Find the rainiest season
        if region_seasons:
            rainiest_season = max(region_seasons, key=region_seasons.get)
            driest_season = min(region_seasons, key=region_seasons.get)
            
            regional_patterns[region_name] = {
                "rainiest_season": rainiest_season,
                "driest_season": driest_season,
                "seasonal_pops": region_seasons,
                "lat_range": region_def.get("lat_range", region_def.get("lat_range_south"))
            }
    
    return regional_patterns


def compute_climate_zones(ds: xarray.Dataset) -> Dict:
    """Compute climate zone classifications based on precipitation patterns"""
    logger.info("Computing climate zone classifications...")
    
    # Compute annual mean PoP
    annual_pop = ds.pop.mean(dim='dayofyear')
    
    # Define climate zones based on annual PoP
    zones = {
        "arid": {"pop_range": (0, 0.15), "description": "Very dry, PoP < 15%"},
        "semi_arid": {"pop_range": (0.15, 0.25), "description": "Dry, PoP 15-25%"},
        "temperate_dry": {"pop_range": (0.25, 0.35), "description": "Moderately dry, PoP 25-35%"},
        "temperate": {"pop_range": (0.35, 0.55), "description": "Moderate rainfall, PoP 35-55%"},
        "humid": {"pop_range": (0.55, 0.75), "description": "High rainfall, PoP 55-75%"},
        "very_humid": {"pop_range": (0.75, 1.0), "description": "Very high rainfall, PoP > 75%"}
    }
    
    climate_zones = {}
    
    for zone_name, zone_def in zones.items():
        pop_min, pop_max = zone_def["pop_range"]
        zone_mask = (annual_pop >= pop_min) & (annual_pop < pop_max)
        
        # Count grid points in this zone
        n_points = int(zone_mask.sum().values)
        
        if n_points > 0:
            climate_zones[zone_name] = {
                "description": zone_def["description"],
                "pop_range": zone_def["pop_range"],
                "n_grid_points": n_points,
                "percentage_of_globe": float(n_points / zone_mask.size * 100)
            }
    
    return climate_zones


def main():
    """Main function to build seasonal analysis"""
    logger.info("Starting seasonal analysis")
    
    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Load climatology data
    ds = load_climatology()
    
    # Compute seasonal statistics
    seasonal_stats = compute_seasonal_statistics(ds)
    
    # Identify rainy seasons by region
    regional_patterns = identify_rainy_seasons(ds)
    
    # Compute climate zones
    climate_zones = compute_climate_zones(ds)
    
    # Compile final output
    output_data = {
        "metadata": {
            "title": "IMERG Final Seasonal Analysis",
            "description": "Seasonal precipitation patterns from IMERG Final climatology",
            "source": "NASA GPM IMERG Final v06",
            "period": "2001-2022",
            "created": pd.Timestamp.now().isoformat(),
            "data_file": CLIMO_FILE
        },
        "seasons": seasonal_stats,
        "regional_patterns": regional_patterns,
        "climate_zones": climate_zones,
        "season_definitions": define_seasons()
    }
    
    # Save to JSON
    output_path = OUTPUT_DIR / OUTPUT_FILE
    logger.info(f"Saving seasonal analysis to {output_path}")
    
    with open(output_path, 'w') as f:
        json.dump(output_data, f, indent=2, default=str)
    
    # Print summary
    logger.info("Seasonal analysis summary:")
    for season, stats in seasonal_stats.items():
        logger.info(f"  {season}: PoP={stats['pop_mean']:.3f}, Rainfall={stats['rainfall_mean']:.1f}mm")
    
    logger.info(f"  Climate zones identified: {len(climate_zones)}")
    logger.info(f"  Regional patterns analyzed: {len(regional_patterns)}")
    
    logger.info("Seasonal analysis complete!")


if __name__ == "__main__":
    main()
