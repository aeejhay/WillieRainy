#!/usr/bin/env python3
"""
Dependency installation script for Will It Rain? Backend
"""

import subprocess
import sys
import os

def install_requirements():
    """Install requirements from requirements-nasa.txt"""
    requirements_file = os.path.join(os.path.dirname(__file__), "requirements-nasa.txt")
    
    if not os.path.exists(requirements_file):
        print("❌ requirements-nasa.txt not found")
        return False
    
    print("📦 Installing dependencies from requirements-nasa.txt...")
    
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", requirements_file
        ])
        print("✅ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def main():
    """Main installation function"""
    print("🌧️  Will It Rain? Backend - Dependency Installer")
    print("=" * 50)
    
    if install_requirements():
        print("\n🎉 Installation complete!")
        print("You can now run the server with:")
        print("python run_server.py")
    else:
        print("\n❌ Installation failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
