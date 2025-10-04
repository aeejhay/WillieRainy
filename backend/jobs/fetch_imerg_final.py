"""
Script to download IMERG Final precipitation data from NASA GES DISC.

This script downloads daily IMERG Final precipitation data for building climatology.
The data is stored in NetCDF format and covers the period 2001-2022.
"""

import os
import requests
from pathlib import Path
from datetime import datetime, timedelta
import logging
from typing import List
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# NASA GES DISC IMERG Final data URL pattern
BASE_URL = "https://gpm1.gesdisc.eosdis.nasa.gov/data/GPM_L3/GPM_3IMERGDF.06"
DATA_DIR = Path("data/raw/imerg_final")


def create_data_directory():
    """Create the data directory if it doesn't exist"""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    logger.info(f"Created data directory: {DATA_DIR}")


def get_date_range(start_year: int = 2001, end_year: int = 2022) -> List[datetime]:
    """Generate list of dates for the specified year range"""
    dates = []
    current_date = datetime(start_year, 1, 1)
    end_date = datetime(end_year, 12, 31)
    
    while current_date <= end_date:
        dates.append(current_date)
        current_date += timedelta(days=1)
    
    logger.info(f"Generated {len(dates)} dates from {start_year} to {end_year}")
    return dates


def build_url(date: datetime) -> str:
    """Build the URL for a specific date's IMERG Final data"""
    year = date.year
    month = f"{date.month:02d}"
    day = f"{date.day:02d}"
    
    # IMERG Final files are organized by year/month
    url = f"{BASE_URL}/{year}/{month:02d}/3B-DAY.MS.MRG.3IMERG.{year}{month}{day}-S000000-E235959.V06B.HDF5"
    return url


def download_file(url: str, output_path: Path, max_retries: int = 3) -> bool:
    """Download a file from URL with retry logic"""
    for attempt in range(max_retries):
        try:
            logger.info(f"Downloading {url} (attempt {attempt + 1})")
            
            # Create session for better connection handling
            session = requests.Session()
            session.headers.update({
                'User-Agent': 'WillItRain-Climatology/1.0'
            })
            
            response = session.get(url, stream=True, timeout=30)
            response.raise_for_status()
            
            # Write file in chunks
            with open(output_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            
            logger.info(f"Successfully downloaded {output_path}")
            return True
            
        except requests.exceptions.RequestException as e:
            logger.warning(f"Download failed (attempt {attempt + 1}): {e}")
            if attempt < max_retries - 1:
                time.sleep(5)  # Wait before retry
            else:
                logger.error(f"Failed to download {url} after {max_retries} attempts")
                return False
    
    return False


def check_existing_files() -> set:
    """Check which files already exist to avoid re-downloading"""
    existing_files = set()
    if DATA_DIR.exists():
        for file_path in DATA_DIR.glob("**/*.HDF5"):
            existing_files.add(file_path.name)
    return existing_files


def main():
    """Main function to download IMERG Final data"""
    logger.info("Starting IMERG Final data download")
    
    # Create data directory
    create_data_directory()
    
    # Get list of dates to download
    dates = get_date_range(2001, 2022)
    
    # Check existing files
    existing_files = check_existing_files()
    logger.info(f"Found {len(existing_files)} existing files")
    
    # Download files
    downloaded = 0
    skipped = 0
    failed = 0
    
    for date in dates:
        filename = f"3B-DAY.MS.MRG.3IMERG.{date.strftime('%Y%m%d')}-S000000-E235959.V06B.HDF5"
        output_path = DATA_DIR / filename
        
        # Skip if file already exists
        if filename in existing_files:
            skipped += 1
            continue
        
        # Build URL and download
        url = build_url(date)
        if download_file(url, output_path):
            downloaded += 1
        else:
            failed += 1
        
        # Add small delay to be respectful to the server
        time.sleep(0.5)
        
        # Progress update every 100 files
        if (downloaded + skipped + failed) % 100 == 0:
            logger.info(f"Progress: {downloaded} downloaded, {skipped} skipped, {failed} failed")
    
    logger.info(f"Download complete: {downloaded} downloaded, {skipped} skipped, {failed} failed")


if __name__ == "__main__":
    main()
