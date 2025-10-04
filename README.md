# Will It Rain? 🌧️

A full-stack web application that answers: "What is the chance of rain on a given date at a given location?" using NASA's IMERG Final climatology dataset.

## Project Overview

This application provides historical rain probability data based on 22 years of NASA GPM IMERG Final satellite observations (2001-2022). Users can input any location (latitude/longitude) and date to get:

- Probability of precipitation (PoP) with 95% confidence intervals
- Mean and median rainfall on rainy days
- Sample size (number of years of data)
- Data source information

## Tech Stack

### Backend
- **Python 3.11+** with FastAPI
- **Libraries**: xarray, netCDF4, numpy, pandas, pydantic, python-dotenv, uvicorn
- **Data Processing**: Offline scripts for downloading and processing IMERG Final data

### Frontend
- **React 19** with TypeScript and Vite
- **Styling**: TailwindCSS
- **HTTP Client**: Axios
- **Date Handling**: date-fns

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm or yarn

### Option 1: Local Development

1. **Clone and setup the project:**
```bash
git clone <repository-url>
cd willierainy-niceeyes
```

2. **Backend setup:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Frontend setup:**
```bash
cd ../frontend
npm install
```

4. **Start the services:**
```bash
# Terminal 1 - Backend
cd backend
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

5. **Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Option 2: Docker Development

1. **Start all services with Docker Compose:**
```bash
docker-compose up --build
```

2. **Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

## API Usage

### Example API Call

```bash
curl "http://localhost:8000/api/rain/climo?lat=40.7128&lon=-74.0060&date=2024-07-15"
```

### Example Response

```json
{
  "pop": 45.2,
  "pop_low": 38.1,
  "pop_high": 52.3,
  "mean_mm": 8.7,
  "median_mm": 4.2,
  "n_years": 22,
  "source": "IMERG Final v07 climatology (2001-2022)"
}
```

### API Endpoints

- `GET /api/rain/climo` - Get rain probability data
  - Parameters:
    - `lat` (required): Latitude (-90 to 90)
    - `lon` (required): Longitude (-180 to 180)
    - `date` (required): Date in YYYY-MM-DD format
  - Returns: Climatology data with PoP, confidence intervals, and rainfall statistics

- `GET /health` - Health check endpoint
- `GET /` - Root endpoint with basic info

## Data Processing

The application includes offline scripts for processing NASA IMERG Final data:

### 1. Download IMERG Data
```bash
cd backend/jobs
python fetch_imerg_final.py
```

### 2. Build Climatology
```bash
python build_climo.py
```

### 3. Build Seasonal Analysis
```bash
python build_seasonal.py
```

## Project Structure

```
├─ backend/                 # FastAPI backend
│ ├─ app/
│ │ ├─ main.py             # FastAPI application
│ │ ├─ models.py           # Pydantic models
│ │ └─ services.py         # Data processing services
│ ├─ jobs/                 # Offline processing scripts
│ │ ├─ fetch_imerg_final.py
│ │ ├─ build_climo.py
│ │ └─ build_seasonal.py
│ ├─ data/                 # Data storage
│ │ └─ products/           # Processed climatology files
│ └─ requirements.txt
│
├─ frontend/               # React frontend
│ ├─ src/
│ │ ├─ components/
│ │ │ ├─ RainForm.tsx      # Input form component
│ │ │ └─ ResultCard.tsx    # Results display component
│ │ ├─ App.tsx             # Main application
│ │ └─ api.ts              # API client
│ ├─ package.json
│ └─ vite.config.js
│
├─ docker-compose.yml      # Docker development setup
└─ README.md
```

## Features

### Frontend
- Clean, responsive UI with TailwindCSS
- Input validation for coordinates and dates
- Quick location buttons for major cities
- Real-time loading states and error handling
- Detailed results display with confidence intervals

### Backend
- FastAPI with automatic API documentation
- CORS middleware for development
- Comprehensive error handling
- Type-safe Pydantic models
- Efficient xarray-based data processing

### Data Processing
- Automated IMERG Final data downloading
- Climatology computation with Wilson confidence intervals
- Seasonal analysis and climate zone classification
- Smoothing and quality control

## Development Notes

- The backend expects climatology data at `backend/data/products/imerg_climo_v07.nc`
- Frontend proxies `/api` requests to backend on port 8000
- CORS is configured for local development
- All data processing scripts include comprehensive logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is for educational and research purposes. Please respect NASA's data usage policies for IMERG Final data.

## Data Source

- **Primary Data**: NASA GPM IMERG Final v06 (2001-2022)
- **Source**: NASA Goddard Earth Sciences Data and Information Services Center (GES DISC)
- **Resolution**: 0.1° × 0.1° (approximately 11 km)
- **Temporal Coverage**: Daily precipitation estimates
- **Processing**: 22-year climatology with 95% confidence intervals