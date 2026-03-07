@echo off
cd /d f:\SMART-POLYPHARMACY-VITAMIN-RECOMMENDATION-SYSTEM-FOR-GERIATRIC-PATIENTS\server

REM Activate virtual environment
call emotion_env\Scripts\activate.bat

REM Set Google API Key
set GOOGLE_API_KEY=AIzaSyB3qf8LRtmRk_4WAxBUuIsYiGaN1Yi68mI

REM Verify the key is set
echo.
echo ✅ Google API Key configured
echo 🚀 Starting Flask Server...
echo.

REM Start Flask
python app.py
pause
