@echo off
title Sistema Web de Estacionamiento de Vehiculos
echo =======================================================
echo    AUTOPARK PRO - SISTEMA DE CONTROL DE ESTACIONAMIENTO
echo =======================================================
echo.
echo 1. Iniciando Servidor Backend (Node.js + Express en puerto 4000)...
start "Backend API AutoPark" cmd /k "cd /d %~dp0backend && npm start"

echo.
echo 2. Iniciando Servidor Frontend (React + Vite en puerto 3000)...
start "Frontend UI AutoPark" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo =======================================================
echo  El sistema se esta iniciando en tu navegador:
echo  URL: http://localhost:3000
echo =======================================================
timeout /t 5 >nul
start http://localhost:3000
