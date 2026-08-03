@echo off
echo ========================================
echo StreamCredit - Complete Setup Script
echo ========================================
echo.
echo This script will:
echo 1. Install all dependencies
echo 2. Compile smart contracts
echo 3. Deploy to Hardhat local network
echo 4. Update frontend configuration
echo 5. Start all services
echo.
pause

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found!
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo ========================================
echo Step 1: Installing Dependencies
echo ========================================

echo [1/3] Installing contracts dependencies...
cd contracts
if not exist node_modules (
    call npm install
) else (
    echo Skipping - already installed
)

echo.
echo [2/3] Installing mock-api dependencies...
cd ..\mock-api
if not exist node_modules (
    call npm install
) else (
    echo Skipping - already installed
)

echo.
echo [3/3] Installing frontend dependencies...
cd ..\frontend
if not exist node_modules (
    call npm install
) else (
    echo Skipping - already installed
)

cd ..

echo.
echo ========================================
echo Step 2: Compiling Smart Contracts
echo ========================================
cd contracts
call npx hardhat compile
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Compilation failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Step 3: Starting Hardhat Network
echo ========================================
echo Starting Hardhat node in background...
start "Hardhat Network" cmd /k "cd contracts && npx hardhat node"
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo Step 4: Deploying Contracts
echo ========================================
call npx hardhat run scripts/deploy.js --network localhost
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Deployment failed!
    echo Make sure Hardhat node is running
    pause
    exit /b 1
)

cd ..

echo.
echo ========================================
echo Step 5: Starting Services
echo ========================================

echo Starting Mock API...
start "Mock API Server" cmd /k "cd mock-api && npm start"
timeout /t 3 /nobreak >nul

echo Starting Frontend...
start "Frontend Dev Server" cmd /k "cd frontend && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo ✅ SETUP COMPLETE!
echo ========================================
echo.
echo 🌐 Services Running:
echo    - Hardhat Network:  http://localhost:8545
echo    - Mock API:         http://localhost:3001
echo    - Frontend:         http://localhost:3000
echo.
echo 📝 Next Steps:
echo 1. Configure MetaMask to connect to localhost:8545
echo 2. Import test account (private key from Hardhat node terminal)
echo 3. Open http://localhost:3000 in your browser
echo 4. Click "Connect Wallet" and select MetaMask
echo.
echo ⚠️  Keep all terminal windows open!
echo.
pause

echo Opening browser...
timeout /t 2 /nobreak >nul
start http://localhost:3000

echo.
echo Press any key to view MetaMask setup instructions...
pause >nul

echo.
echo ========================================
echo 🦊 MetaMask Setup Instructions
echo ========================================
echo.
echo 1. Open MetaMask extension
echo 2. Click network dropdown (top)
echo 3. Click "Add Network" -^> "Add network manually"
echo 4. Enter these details:
echo    Network Name: Hardhat Local
echo    RPC URL: http://localhost:8545
echo    Chain ID: 31337
echo    Currency Symbol: ETH
echo 5. Click "Save"
echo.
echo 6. Import Test Account:
echo    - Copy private key from Hardhat terminal
echo    - MetaMask -^> Account icon -^> Import Account
echo    - Paste private key
echo.
echo ========================================
echo.
pause
