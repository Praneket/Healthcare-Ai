@echo off
echo Stopping infrastructure containers...
docker-compose -f docker-compose.local.yml down
echo.
echo All Docker containers stopped.
echo Close the individual service terminal windows manually.
