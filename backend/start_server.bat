@echo off
echo 🌧️ Starting Will It Rain? Backend Server
echo ========================================

REM Activate virtual environment
call venv\Scripts\activate

REM Check if virtual environment is activated
if not defined VIRTUAL_ENV (
    echo ❌ Virtual environment not activated
    pause
    exit /b 1
)

echo ✅ Virtual environment activated
echo 🚀 Starting FastAPI server...
echo 📍 Server will be available at: http://localhost:8000
echo 📚 API docs available at: http://localhost:8000/docs
echo 🔍 Health check at: http://localhost:8000/health
echo ========================================

REM Start the server
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

pause
