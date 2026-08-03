@echo off
echo ========================================
echo Deploy StreamCredit Contracts
echo ========================================
echo.

cd contracts

echo Compiling contracts...
call npx hardhat compile

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Compilation failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Choose deployment option:
echo ========================================
echo 1. Deploy to Hardhat Local (for testing)
echo 2. Deploy to Sepolia Testnet (requires .env setup)
echo 3. Cancel
echo.
set /p choice="Enter choice (1-3): "

if "%choice%"=="1" goto :local
if "%choice%"=="2" goto :sepolia
if "%choice%"=="3" goto :end
echo Invalid choice!
pause
exit /b 1

:local
echo.
echo Deploying to Hardhat Local Network...
echo Make sure Hardhat node is running: npx hardhat node
pause
call npx hardhat run scripts/deploy.js --network localhost
goto :success

:sepolia
echo.
echo Deploying to Sepolia Testnet...
echo Make sure .env file is configured with:
echo - SEPOLIA_RPC_URL
echo - PRIVATE_KEY
echo - ETHERSCAN_API_KEY
pause
call npx hardhat run scripts/deploy.js --network sepolia
goto :success

:success
echo.
echo ========================================
echo ✅ Deployment Complete!
echo ========================================
echo.
echo Contract addresses have been saved to:
if "%choice%"=="1" (
    echo - deployed-addresses-local.json
    echo - frontend/config/constants.js
) else (
    echo - deployed-addresses-mock.json
)
echo.
echo Next step: Update frontend config if needed
echo.
goto :end

:end
cd ..
pause
