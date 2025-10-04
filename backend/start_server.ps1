# Will It Rain? Backend Server Startup Script
Write-Host "🌧️ Starting Will It Rain? Backend Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Activate virtual environment
Write-Host "🔧 Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

# Check if virtual environment is activated
if (-not $env:VIRTUAL_ENV) {
    Write-Host "❌ Virtual environment not activated" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Virtual environment activated" -ForegroundColor Green
Write-Host "🚀 Starting FastAPI server..." -ForegroundColor Yellow
Write-Host "📍 Server will be available at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "📚 API docs available at: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "🔍 Health check at: http://localhost:8000/health" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Start the server
try {
    py -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
} catch {
    Write-Host "❌ Error starting server: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
}
