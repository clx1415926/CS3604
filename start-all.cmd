@echo off
setlocal

echo Please ensure you have run install-all.cmd first to install dependencies.
echo.

call :start_service "Home_Page" "Home_Page\backend" "npm start"
call :start_service "Login_Register" "Login_Register_Page\backend" "set PORT=8082 && npm start"
call :start_service "Ticket_Backend" "Ticket_Selection\backend" "set PORT=3000 && npm start"
call :start_service "Ticket_Frontend" "Ticket_Selection\frontend" "npm run dev"
call :start_service "Ticket_Management_Backend" "Ticket_Management\backend" "set PORT=3001 && npm start"
call :start_service "Ticket_Management_Frontend" "Ticket_Management\frontend" "npm run dev"
call :start_service "User_Center_Backend" "User_Center\backend" "set PORT=8083 && node src\server.js"
call :start_service "User_Center_Frontend" "User_Center\frontend" "npm run dev"

echo [User_Center] Personal Center API available at http://localhost:8083/api/v1

echo All services launched in this window. Press Ctrl+C to stop or run stop-all.cmd.
pause >nul

endlocal
goto :eof

:start_service
set "NAME=%~1"
set "DIR=%~2"
set "CMD=%~3"

if not exist "%DIR%" (
    echo [%NAME%] Error: Directory %DIR% not found.
    goto :eof
)

rem Only enforce node_modules if package.json exists (some services are pure Node without deps)
if exist "%DIR%\package.json" (
    if not exist "%DIR%\node_modules" (
        echo [%NAME%] Error: node_modules not found in %DIR%. Please run install-all.cmd.
        goto :eof
    )
)

echo [%NAME%] starting...
start /b cmd /c "cd /d %DIR% && %CMD%"
goto :eof
