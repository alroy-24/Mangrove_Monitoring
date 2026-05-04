@echo off
echo ============================================
echo   Mangrove Monitor — Vasai-Konkan Coast
echo ============================================

echo.
echo [1/2] Starting FastAPI backend on port 8000...
cd /d "%~dp0backend"
start "MangroveBackend" cmd /k "pip install -r requirements.txt -q && uvicorn api:app --reload --port 8000"

echo.
echo [2/2] Starting Next.js frontend on port 3000...
cd /d "%~dp0frontend"
start "MangroveFrontend" cmd /k "npm install --legacy-peer-deps && npm run dev"

echo.
echo ============================================
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:3000
echo  API docs: http://localhost:8000/docs
echo ============================================
timeout /t 3
start http://localhost:3000
