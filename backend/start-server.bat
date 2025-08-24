@echo off
echo Starting Facebook Lite Backend Server...
echo.
echo Make sure MongoDB is running before starting the server!
echo.
echo Server will be available at: http://localhost:5000
echo API endpoints will be at: http://localhost:5000/api/v1
echo.
echo To stop the server, press Ctrl+C
echo.

cd /d "%~dp0"
npm run dev 