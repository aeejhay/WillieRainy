"""
Script to create sample climatology data for testing purposes.

This creates a small NetCDF file with sample data that matches the expected
structure of the IMERG climatology data.
"""

import xarray as xr
import numpy as np
from pathlib import Path

# Create output directory
output_dir = Path("data/products")
output_dir.mkdir(parents=True, exist_ok=True)

# Define sample coordinates (small region around New York)
lat = np.linspace(40.0, 41.0, 10)  # 10 points from 40°N to 41°N
lon = np.linspace(-75.0, -74.0, 10)  # 10 points from 75°W to 74°W
dayofyear = np.arange(1, 367)  # All days of year (including leap year)

# Create sample data with realistic patterns
np.random.seed(42)  # For reproducible results

# Base probability of precipitation (higher in summer, lower in winter)
base_pop = 0.3 + 0.2 * np.sin(2 * np.pi * (dayofyear - 80) / 365)  # Peak in spring/summer

# Add some spatial variation
lat_factor = 1.0 + 0.1 * (lat - lat.mean()) / lat.std()
lon_factor = 1.0 + 0.1 * (lon - lon.mean()) / lon.std()

# Add some random noise
noise = 0.05 * np.random.randn(len(dayofyear), len(lat), len(lon))

# Create 3D arrays
pop_data = np.zeros((len(dayofyear), len(lat), len(lon)))
for i, doy in enumerate(dayofyear):
    for j, lat_val in enumerate(lat):
        for k, lon_val in enumerate(lon):
            pop_data[i, j, k] = base_pop[i] * lat_factor[j] * lon_factor[k] + noise[i, j, k]
            pop_data[i, j, k] = np.clip(pop_data[i, j, k], 0.0, 1.0)

# Confidence intervals (Wilson score interval approximation)
pop_low_data = np.clip(pop_data - 0.05, 0.0, 1.0)
pop_high_data = np.clip(pop_data + 0.05, 0.0, 1.0)

# Rainfall data (higher on rainy days in summer)
rainfall_base = 5.0 + 3.0 * np.sin(2 * np.pi * (dayofyear - 80) / 365)
mean_mm_data = rainfall_base[:, np.newaxis, np.newaxis] * pop_data
median_mm_data = 0.6 * mean_mm_data  # Median is typically lower than mean

# Sample size (number of years)
n_years_data = np.full((len(dayofyear), len(lat), len(lon)), 22)

# Create xarray Dataset
ds = xr.Dataset({
    'pop': (['dayofyear', 'lat', 'lon'], pop_data),
    'pop_low': (['dayofyear', 'lat', 'lon'], pop_low_data),
    'pop_high': (['dayofyear', 'lat', 'lon'], pop_high_data),
    'mean_mm': (['dayofyear', 'lat', 'lon'], mean_mm_data),
    'median_mm': (['dayofyear', 'lat', 'lon'], median_mm_data),
    'n_years': (['dayofyear', 'lat', 'lon'], n_years_data)
})

# Add coordinates
ds = ds.assign_coords({
    'dayofyear': dayofyear,
    'lat': lat,
    'lon': lon
})

# Add attributes
ds.attrs = {
    'title': 'Sample IMERG Final Climatology',
    'description': 'Sample climatology data for testing purposes',
    'source': 'Generated sample data',
    'period': '2001-2022',
    'rain_threshold_mm': 0.1,
    'confidence_level': 0.95,
    'smoothing_window_days': 5,
    'created': '2024-01-01T00:00:00Z'
}

ds['pop'].attrs = {'long_name': 'Probability of precipitation', 'units': '1'}
ds['pop_low'].attrs = {'long_name': 'PoP lower confidence bound', 'units': '1'}
ds['pop_high'].attrs = {'long_name': 'PoP upper confidence bound', 'units': '1'}
ds['mean_mm'].attrs = {'long_name': 'Mean rainfall on rainy days', 'units': 'mm/day'}
ds['median_mm'].attrs = {'long_name': 'Median rainfall on rainy days', 'units': 'mm/day'}
ds['n_years'].attrs = {'long_name': 'Number of years in sample', 'units': 'years'}

ds['dayofyear'].attrs = {'long_name': 'Day of year', 'units': '1'}
ds['lat'].attrs = {'long_name': 'Latitude', 'units': 'degrees_north'}
ds['lon'].attrs = {'long_name': 'Longitude', 'units': 'degrees_east'}

# Save to NetCDF
output_file = output_dir / "imerg_climo_v07.nc"
print(f"Creating sample climatology data: {output_file}")
ds.to_netcdf(output_file)

# Print summary
print("Sample climatology data created successfully!")
print(f"  Shape: {ds.sizes}")
print(f"  Latitude range: {lat.min():.2f} to {lat.max():.2f}")
print(f"  Longitude range: {lon.min():.2f} to {lon.max():.2f}")
print(f"  Day of year range: {dayofyear.min()} to {dayofyear.max()}")
print(f"  Mean PoP: {ds.pop.mean().values:.3f}")
print(f"  Max PoP: {ds.pop.max().values:.3f}")
print(f"  Mean rainfall: {ds.mean_mm.mean().values:.1f} mm/day")
