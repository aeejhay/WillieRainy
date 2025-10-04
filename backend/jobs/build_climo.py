"""
Script to build climatology NetCDF from IMERG Final daily data.

This script processes daily IMERG Final precipitation data to create a climatology
that includes probability of precipitation (PoP), confidence intervals, mean/median
rainfall, and sample size for each day of year and location.
"""

import xarray as xr
import numpy as np
import pandas as pd
from pathlib import Path
from scipy import stats
import logging
from typing import Tuple, Optional
import warnings

warnings.filterwarnings('ignore')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
RAW_DATA_DIR = Path("data/raw/imerg_final")
OUTPUT_DIR = Path("data/products")
OUTPUT_FILE = "imerg_climo_v07.nc"
RAIN_THRESHOLD = 0.1  # mm/day
SMOOTH_WINDOW = 5  # days
CONFIDENCE_LEVEL = 0.95


def wilson_confidence_interval(successes: int, trials: int, confidence: float = 0.95) -> Tuple[float, float]:
    """
    Calculate Wilson confidence interval for binomial proportion.
    
    Args:
        successes: Number of successful trials (rainy days)
        trials: Total number of trials (total days)
        confidence: Confidence level (default 0.95)
    
    Returns:
        Tuple of (lower_bound, upper_bound)
    """
    if trials == 0:
        return 0.0, 0.0
    
    z = stats.norm.ppf((1 + confidence) / 2)
    p = successes / trials
    
    # Wilson score interval
    denominator = 1 + (z**2 / trials)
    center = (p + (z**2 / (2 * trials))) / denominator
    margin = (z * np.sqrt(p * (1 - p) / trials + (z**2 / (4 * trials**2)))) / denominator
    
    lower = max(0, center - margin)
    upper = min(1, center + margin)
    
    return lower, upper


def load_imerg_file(file_path: Path) -> Optional[xarray.Dataset]:
    """Load a single IMERG HDF5 file and return as xarray Dataset"""
    try:
        # IMERG HDF5 files have specific structure
        # The precipitation data is typically in a group called 'Grid' or similar
        ds = xr.open_dataset(file_path, group='Grid')
        
        # Extract precipitation variable (usually called 'precipitationCal' or 'precipitation')
        precip_vars = [var for var in ds.data_vars if 'precip' in var.lower()]
        if not precip_vars:
            logger.warning(f"No precipitation variable found in {file_path}")
            return None
        
        precip_var = precip_vars[0]  # Use first precipitation variable found
        
        # Rename coordinates to standard names
        if 'lat' not in ds.coords:
            # Try common IMERG coordinate names
            for lat_name in ['Latitude', 'lat', 'latitude']:
                if lat_name in ds.coords:
                    ds = ds.rename({lat_name: 'lat'})
                    break
        
        if 'lon' not in ds.coords:
            for lon_name in ['Longitude', 'lon', 'longitude']:
                if lon_name in ds.coords:
                    ds = ds.rename({lon_name: 'lon'})
                    break
        
        # Rename precipitation variable to standard name
        ds = ds.rename({precip_var: 'precipitation'})
        
        # Ensure coordinates are properly oriented
        if ds.lat[0] > ds.lat[-1]:  # If lat is decreasing, flip it
            ds = ds.reindex(lat=ds.lat[::-1])
        
        return ds
        
    except Exception as e:
        logger.warning(f"Failed to load {file_path}: {e}")
        return None


def process_daily_data(data_dir: Path) -> xarray.Dataset:
    """Process all daily IMERG files and create climatology"""
    logger.info(f"Processing IMERG data from {data_dir}")
    
    # Get all HDF5 files
    hdf_files = list(data_dir.glob("**/*.HDF5"))
    logger.info(f"Found {len(hdf_files)} HDF5 files")
    
    if not hdf_files:
        raise FileNotFoundError(f"No HDF5 files found in {data_dir}")
    
    # Initialize storage for all daily data
    daily_data = []
    processed_files = 0
    
    for file_path in sorted(hdf_files):
        logger.info(f"Processing {file_path.name}")
        
        ds = load_imerg_file(file_path)
        if ds is None:
            continue
        
        # Extract date from filename
        date_str = file_path.stem.split('.')[2][:8]  # Extract YYYYMMDD
        try:
            date = pd.to_datetime(date_str)
        except:
            logger.warning(f"Could not parse date from {file_path.name}")
            continue
        
        # Add time coordinate
        ds = ds.expand_dims('time')
        ds = ds.assign_coords(time=[date])
        
        # Convert precipitation to mm/day (IMERG is typically in mm/h, daily files are 24h)
        if 'precipitation' in ds.data_vars:
            ds['precipitation'] = ds['precipitation'] * 24  # Convert mm/h to mm/day
        else:
            logger.warning(f"No precipitation data in {file_path.name}")
            continue
        
        daily_data.append(ds)
        processed_files += 1
        
        if processed_files % 100 == 0:
            logger.info(f"Processed {processed_files} files")
    
    logger.info(f"Successfully processed {processed_files} files")
    
    if not daily_data:
        raise ValueError("No valid data files were processed")
    
    # Concatenate all daily data
    logger.info("Concatenating daily data...")
    full_dataset = xr.concat(daily_data, dim='time')
    
    return full_dataset


def compute_climatology(ds: xarray.Dataset) -> xarray.Dataset:
    """Compute climatology statistics from daily precipitation data"""
    logger.info("Computing climatology statistics...")
    
    # Add day of year coordinate
    ds = ds.assign_coords(dayofyear=ds.time.dt.dayofyear)
    
    # Create rain mask (precipitation >= threshold)
    rain_mask = ds['precipitation'] >= RAIN_THRESHOLD
    
    # Compute probability of precipitation (PoP) by day of year
    pop_by_doy = rain_mask.groupby('dayofyear').mean('time')
    
    # Compute mean and median rainfall on rainy days
    rainy_precip = ds['precipitation'].where(rain_mask)
    mean_rainy = rainy_precip.groupby('dayofyear').mean('time')
    median_rainy = rainy_precip.groupby('dayofyear').median('time')
    
    # Compute sample size (number of years) for each day of year
    n_years = ds.groupby('dayofyear').count('time')['precipitation']
    
    # Compute confidence intervals for PoP
    rain_counts = rain_mask.groupby('dayofyear').sum('time')
    
    # Apply Wilson confidence interval
    pop_low = xr.zeros_like(pop_by_doy)
    pop_high = xr.zeros_like(pop_by_doy)
    
    logger.info("Computing confidence intervals...")
    for doy in pop_by_doy.dayofyear.values:
        for lat_idx in range(pop_by_doy.sizes['lat']):
            for lon_idx in range(pop_by_doy.sizes['lon']):
                successes = int(rain_counts.isel(dayofyear=doy, lat=lat_idx, lon=lon_idx).values)
                trials = int(n_years.isel(dayofyear=doy, lat=lat_idx, lon=lon_idx).values)
                
                if trials > 0:
                    lower, upper = wilson_confidence_interval(successes, trials, CONFIDENCE_LEVEL)
                    pop_low[dict(dayofyear=doy, lat=lat_idx, lon=lon_idx)] = lower
                    pop_high[dict(dayofyear=doy, lat=lat_idx, lon=lon_idx)] = upper
    
    # Smooth the PoP data with a rolling window
    logger.info("Smoothing PoP data...")
    pop_smoothed = pop_by_doy.rolling(dayofyear=SMOOTH_WINDOW, center=True).mean()
    
    # Handle edge effects by padding
    pop_smoothed = pop_smoothed.fillna(pop_by_doy)
    
    # Create output dataset
    climo_ds = xr.Dataset({
        'pop': pop_smoothed,
        'pop_low': pop_low,
        'pop_high': pop_high,
        'mean_mm': mean_rainy.fillna(0),
        'median_mm': median_rainy.fillna(0),
        'n_years': n_years
    })
    
    # Add attributes
    climo_ds.attrs = {
        'title': 'IMERG Final Climatology',
        'description': 'Probability of precipitation climatology from IMERG Final data',
        'source': 'NASA GPM IMERG Final v06',
        'period': '2001-2022',
        'rain_threshold_mm': RAIN_THRESHOLD,
        'confidence_level': CONFIDENCE_LEVEL,
        'smoothing_window_days': SMOOTH_WINDOW,
        'created': pd.Timestamp.now().isoformat()
    }
    
    climo_ds['pop'].attrs = {'long_name': 'Probability of precipitation', 'units': '1'}
    climo_ds['pop_low'].attrs = {'long_name': 'PoP lower confidence bound', 'units': '1'}
    climo_ds['pop_high'].attrs = {'long_name': 'PoP upper confidence bound', 'units': '1'}
    climo_ds['mean_mm'].attrs = {'long_name': 'Mean rainfall on rainy days', 'units': 'mm/day'}
    climo_ds['median_mm'].attrs = {'long_name': 'Median rainfall on rainy days', 'units': 'mm/day'}
    climo_ds['n_years'].attrs = {'long_name': 'Number of years in sample', 'units': 'years'}
    
    return climo_ds


def main():
    """Main function to build climatology"""
    logger.info("Starting climatology computation")
    
    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Check if raw data exists
    if not RAW_DATA_DIR.exists():
        logger.error(f"Raw data directory not found: {RAW_DATA_DIR}")
        logger.error("Please run fetch_imerg_final.py first to download the data")
        return
    
    # Process daily data
    daily_ds = process_daily_data(RAW_DATA_DIR)
    
    # Compute climatology
    climo_ds = compute_climatology(daily_ds)
    
    # Save to NetCDF
    output_path = OUTPUT_DIR / OUTPUT_FILE
    logger.info(f"Saving climatology to {output_path}")
    climo_ds.to_netcdf(output_path)
    
    # Print summary statistics
    logger.info("Climatology summary:")
    logger.info(f"  Shape: {climo_ds.sizes}")
    logger.info(f"  Latitude range: {climo_ds.lat.min().values:.2f} to {climo_ds.lat.max().values:.2f}")
    logger.info(f"  Longitude range: {climo_ds.lon.min().values:.2f} to {climo_ds.lon.max().values:.2f}")
    logger.info(f"  Day of year range: {climo_ds.dayofyear.min().values} to {climo_ds.dayofyear.max().values}")
    logger.info(f"  Mean PoP: {climo_ds.pop.mean().values:.3f}")
    logger.info(f"  Max PoP: {climo_ds.pop.max().values:.3f}")
    
    logger.info("Climatology computation complete!")


if __name__ == "__main__":
    main()
