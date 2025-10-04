#!/usr/bin/env python3
"""
Willie Rainy Nice Eyes - Complete Setup Script
This script automates the entire setup process for new team members.
"""

import subprocess
import sys
import os
import platform
from pathlib import Path

def run_command(command, description, cwd=None):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, cwd=cwd, 
                              capture_output=True, text=True)
        print(f"✅ {description} completed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        if e.stdout:
            print(f"Output: {e.stdout}")
        if e.stderr:
            print(f"Error: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is 3.11+"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 11):
        print(f"❌ Python 3.11+ required, found {version.major}.{version.minor}")
        return False
    print(f"✅ Python {version.major}.{version.minor}.{version.micro} detected")
    return True

def check_node_version():
    """Check if Node.js is installed"""
    try:
        result = subprocess.run(["node", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            version = result.stdout.strip()
            print(f"✅ Node.js {version} detected")
            return True
    except FileNotFoundError:
        pass
    
    print("❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org/")
    return False

def setup_backend():
    """Setup backend environment and dependencies"""
    print("\n🐍 Setting up Backend...")
    
    backend_dir = Path("backend")
    if not backend_dir.exists():
        print("❌ Backend directory not found")
        return False
    
    # Create virtual environment
    venv_path = backend_dir / "venv"
    if not venv_path.exists():
        if not run_command("python -m venv venv", "Creating virtual environment", cwd=backend_dir):
            return False
    
    # Determine activation script based on OS
    if platform.system() == "Windows":
        activate_script = venv_path / "Scripts" / "activate.bat"
        pip_command = str(venv_path / "Scripts" / "pip.exe")
    else:
        activate_script = venv_path / "bin" / "activate"
        pip_command = str(venv_path / "bin" / "pip")
    
    # Install dependencies
    requirements_file = backend_dir / "requirements.txt"
    if requirements_file.exists():
        if not run_command(f'"{pip_command}" install -r requirements.txt', 
                          "Installing Python dependencies", cwd=backend_dir):
            return False
    
    # Copy environment file
    env_example = backend_dir / "env.example"
    env_file = backend_dir / ".env"
    if env_example.exists() and not env_file.exists():
        if run_command(f'copy "{env_example}" "{env_file}"' if platform.system() == "Windows" 
                      else f'cp "{env_example}" "{env_file}"', 
                      "Creating .env file", cwd=backend_dir):
            print("📝 Please edit backend/.env file with your configuration")
    
    return True

def setup_frontend():
    """Setup frontend dependencies"""
    print("\n⚛️  Setting up Frontend...")
    
    frontend_dir = Path("frontend")
    if not frontend_dir.exists():
        print("❌ Frontend directory not found")
        return False
    
    # Install npm dependencies
    if not run_command("npm install", "Installing Node.js dependencies", cwd=frontend_dir):
        return False
    
    return True

def create_startup_scripts():
    """Create convenient startup scripts"""
    print("\n📝 Creating startup scripts...")
    
    # Backend startup script
    backend_script = """@echo off
echo 🌧️  Starting Willie Rainy Backend...
cd /d "%~dp0"
call venv\\Scripts\\activate.bat
echo Starting FastAPI server on http://localhost:8000
echo API docs available at http://localhost:8000/docs
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pause
"""
    
    with open("start_backend.bat", "w") as f:
        f.write(backend_script)
    
    # Frontend startup script
    frontend_script = """@echo off
echo ⚛️  Starting Willie Rainy Frontend...
cd /d "%~dp0\\frontend"
echo Starting React development server on http://localhost:5173
npm run dev
pause
"""
    
    with open("start_frontend.bat", "w") as f:
        f.write(frontend_script)
    
    # Combined startup script
    combined_script = """@echo off
echo 🌧️👁️  Starting Willie Rainy Nice Eyes Application...
echo.
echo This will start both backend and frontend servers.
echo Backend will be available at: http://localhost:8000
echo Frontend will be available at: http://localhost:5173
echo.
echo Press any key to continue...
pause >nul

start "Backend Server" cmd /k "cd /d "%~dp0" && call start_backend.bat"
timeout /t 3 /nobreak >nul
start "Frontend Server" cmd /k "cd /d "%~dp0" && call start_frontend.bat"

echo.
echo ✅ Both servers are starting up!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
echo.
echo Press any key to exit this window...
pause >nul
"""
    
    with open("start_app.bat", "w") as f:
        f.write(combined_script)
    
    print("✅ Created startup scripts:")
    print("  - start_backend.bat (backend only)")
    print("  - start_frontend.bat (frontend only)")
    print("  - start_app.bat (both servers)")

def main():
    """Main setup function"""
    print("🌧️👁️  Willie Rainy Nice Eyes - Team Setup")
    print("=" * 50)
    print("This script will set up the complete development environment")
    print("for new team members to get started quickly.\n")
    
    # Check prerequisites
    if not check_python_version():
        return False
    
    if not check_node_version():
        return False
    
    # Setup backend
    if not setup_backend():
        print("\n❌ Backend setup failed!")
        return False
    
    # Setup frontend
    if not setup_frontend():
        print("\n❌ Frontend setup failed!")
        return False
    
    # Create startup scripts
    create_startup_scripts()
    
    # Success message
    print("\n🎉 Setup Complete!")
    print("=" * 50)
    print("Your Willie Rainy Nice Eyes application is ready!")
    print("\n📋 Quick Start Guide:")
    print("1. Double-click 'start_app.bat' to run both servers")
    print("2. Or run individually:")
    print("   - Backend: double-click 'start_backend.bat'")
    print("   - Frontend: double-click 'start_frontend.bat'")
    print("\n🌐 Access Points:")
    print("- Frontend: http://localhost:5173")
    print("- Backend API: http://localhost:8000")
    print("- API Documentation: http://localhost:8000/docs")
    print("\n📝 Next Steps:")
    print("- Edit backend/.env file if needed")
    print("- Check README.md for detailed documentation")
    print("- Happy coding! 🌧️👁️")
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        if not success:
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n❌ Setup cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)