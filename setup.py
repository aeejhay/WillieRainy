#!/usr/bin/env python3
"""
Setup script for Will It Rain? project.

This script helps set up the development environment and creates sample data.
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(command, description, cwd=None):
    """Run a command and handle errors."""
    print(f"\n🔄 {description}")
    print(f"Running: {command}")
    
    try:
        result = subprocess.run(command, shell=True, check=True, cwd=cwd, 
                              capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed")
        print(f"Error: {e.stderr}")
        return False

def main():
    print("🌧️  Will It Rain? - Project Setup")
    print("=" * 50)
    
    # Check Python version
    if sys.version_info < (3, 11):
        print("❌ Python 3.11+ is required")
        sys.exit(1)
    
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")
    
    # Setup backend
    print("\n📦 Setting up backend...")
    
    # Create virtual environment
    if not run_command("python -m venv venv", "Creating virtual environment", cwd="backend"):
        sys.exit(1)
    
    # Determine activation script based on OS
    if os.name == 'nt':  # Windows
        activate_script = "venv\\Scripts\\activate"
        pip_cmd = "venv\\Scripts\\pip"
    else:  # Unix/Linux/MacOS
        activate_script = "source venv/bin/activate"
        pip_cmd = "venv/bin/pip"
    
    # Install Python dependencies
    if not run_command(f"{pip_cmd} install -r requirements.txt", 
                      "Installing Python dependencies", cwd="backend"):
        sys.exit(1)
    
    # Create sample data
    if not run_command(f"{pip_cmd} run python jobs/create_sample_data.py", 
                      "Creating sample climatology data", cwd="backend"):
        sys.exit(1)
    
    # Setup frontend
    print("\n📦 Setting up frontend...")
    
    if not run_command("npm install", "Installing Node.js dependencies", cwd="frontend"):
        sys.exit(1)
    
    print("\n🎉 Setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. Start the backend:")
    print("   cd backend")
    if os.name == 'nt':
        print("   venv\\Scripts\\activate")
    else:
        print("   source venv/bin/activate")
    print("   uvicorn app.main:app --reload")
    print("\n2. Start the frontend (in a new terminal):")
    print("   cd frontend")
    print("   npm run dev")
    print("\n3. Open your browser to http://localhost:5173")
    print("\n4. Test the API at http://localhost:8000/docs")

if __name__ == "__main__":
    main()
