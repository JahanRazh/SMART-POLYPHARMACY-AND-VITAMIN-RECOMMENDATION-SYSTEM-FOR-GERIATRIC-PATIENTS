#!/usr/bin/env python
"""
Flask server startup with proper environment variable configuration
"""
import os
import subprocess
import sys

# Set Google API Key
os.environ["GOOGLE_API_KEY"] = "AIzaSyB3qf8LRtmRk_4WAxBUuIsYiGaN1Yi68mI"

print("\n" + "="*60)
print("🚀 Smart Polycare Flask Server Startup")
print("="*60)
print(f"✅ GOOGLE_API_KEY configured")
print(f"   Key: {os.environ['GOOGLE_API_KEY'][:10]}...")
print("="*60 + "\n")

# Now run Flask
if __name__ == "__main__":
    import app
    app.app.run(host="127.0.0.1", port=5000, debug=False, use_reloader=False)
