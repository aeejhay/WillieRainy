# 🌧️👁️ Team Setup Guide - Willie Rainy Nice Eyes

## 🎯 For New Team Members

Welcome to the Willie Rainy Nice Eyes project! This guide will get you up and running in under 5 minutes.

## 📋 Prerequisites Checklist

Before you start, make sure you have:
- [ ] **Python 3.11+** installed ([Download here](https://www.python.org/downloads/))
- [ ] **Node.js 18+** installed ([Download here](https://nodejs.org/))
- [ ] **Git** installed ([Download here](https://git-scm.com/downloads))

## 🚀 One-Command Setup

```bash
git clone https://github.com/aeejhay/WillieRainy.git
cd WillieRainy
python setup.py
```

**That's it!** The setup script handles everything automatically.

## 🎮 Running the Application

After setup, you have several options:

### Option 1: Start Everything (Recommended)
```bash
# Double-click this file or run:
start_app.bat
```
This opens two windows - one for backend, one for frontend!

### Option 2: Start Separately
```bash
# Backend only
start_backend.bat

# Frontend only (in another terminal)
start_frontend.bat
```

### Option 3: Manual Commands
```bash
# Terminal 1 - Backend
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 🌐 Access Your Application

Once running, visit:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🛠️ Development Workflow

### Making Changes
1. Make your changes to the code
2. The servers will auto-reload (hot reload enabled)
3. Test your changes in the browser

### Backend Development
- Main API code: `backend/app/main.py`
- Data models: `backend/app/models.py`
- Services: `backend/app/services.py`
- NASA integration: `backend/app/nasa_service.py`

### Frontend Development
- Main app: `frontend/src/App.tsx`
- Components: `frontend/src/components/`
- API client: `frontend/src/api.ts`
- Styling: TailwindCSS classes

## 🐛 Troubleshooting

### Common Issues

**"Python not found"**
- Make sure Python 3.11+ is installed and added to PATH
- Try `python --version` in command prompt

**"Node not found"**
- Make sure Node.js 18+ is installed
- Try `node --version` in command prompt

**"Port already in use"**
- Close other applications using ports 8000 or 5173
- Or change ports in the startup scripts

**"Dependencies failed to install"**
- Check your internet connection
- Try running `pip install --upgrade pip` first
- For Node.js issues, try `npm cache clean --force`

### Getting Help

1. Check the main README.md for detailed documentation
2. Look at the API docs at http://localhost:8000/docs
3. Ask team members in your communication channel
4. Check GitHub issues for known problems

## 📁 Project Structure

```
WillieRainy/
├── backend/                 # FastAPI backend
│   ├── app/                # Main application code
│   ├── data/               # Data files
│   ├── models/             # ML models
│   ├── venv/               # Python virtual environment
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/                # Source code
│   ├── node_modules/       # Node.js dependencies
│   └── package.json        # Node.js dependencies
├── setup.py                # Automated setup script
├── start_app.bat           # Start both servers
├── start_backend.bat       # Start backend only
├── start_frontend.bat      # Start frontend only
└── README.md               # Detailed documentation
```

## 🎉 You're Ready!

Once you see both servers running and can access the frontend at http://localhost:5173, you're all set to start developing!

Happy coding! 🌧️👁️
