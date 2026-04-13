@echo off
echo ============================================
echo  Healthcare AI - Local Dev Startup Script
echo ============================================
echo.

REM ── Step 1: Start infrastructure ──────────────────────────────
echo [1/3] Starting infrastructure (Postgres, MongoDB, Redis, Kafka)...
docker-compose -f docker-compose.local.yml up -d
echo Waiting 15 seconds for infrastructure to be ready...
timeout /t 15 /nobreak >nul

REM ── Step 2: Start AI service ──────────────────────────────────
echo [2/3] Starting Python AI service on port 8085...
cd ai-service
start "AI-Service" cmd /k "pip install -r requirements.txt && uvicorn main:app --host 0.0.0.0 --port 8085 --reload"
cd ..
echo Waiting 10 seconds for AI service...
timeout /t 10 /nobreak >nul

REM ── Step 3: Start Spring Boot services ───────────────────────
echo [3/3] Starting Spring Boot microservices...

cd auth-service
start "Auth-Service" cmd /k "mvn spring-boot:run"
cd ..
timeout /t 5 /nobreak >nul

cd diagnosis-service
start "Diagnosis-Service" cmd /k "mvn spring-boot:run"
cd ..
timeout /t 5 /nobreak >nul

cd patient-records-service
start "Patient-Records" cmd /k "mvn spring-boot:run"
cd ..
timeout /t 5 /nobreak >nul

cd notification-service
start "Notification-Service" cmd /k "mvn spring-boot:run"
cd ..
timeout /t 5 /nobreak >nul

cd api-gateway
start "API-Gateway" cmd /k "mvn spring-boot:run"
cd ..
timeout /t 10 /nobreak >nul

REM ── Step 4: Start React frontend ──────────────────────────────
echo Starting React frontend on port 3000...
cd frontend
start "Frontend" cmd /k "npm install && npm start"
cd ..

echo.
echo ============================================
echo  All services starting up!
echo  Frontend:  http://localhost:3000
echo  API Gateway: http://localhost:8080
echo  AI Service:  http://localhost:8085/docs
echo ============================================
