@echo off
echo 🌧️ Starting Will It Rain? Backend Server
echo ========================================

REM Activate virtual environment
call venv\Scripts\activate.bat

echo ✅ Virtual environment activated
echo 🚀 Starting FastAPI server...
echo 📍 Server: http://localhost:8000
echo 📚 API docs: http://localhost:8000/docs
echo ========================================

REM Use the Python launcher (most reliable on Windows)
py -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

pause
