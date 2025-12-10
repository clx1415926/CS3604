@echo off
setlocal

echo Please ensure you have run install-all.cmd first to install dependencies.
echo.

echo [Home_Page] starting...
start /b cmd /c "cd /d Home_Page\backend && node src\server.js"

echo [Login_Register] starting...
start /b cmd /c "cd /d Login_Register_Page\backend && set PORT=8082 && npm start"

echo [Ticket_Backend] starting...
start /b cmd /c "cd /d Ticket_Selection\backend && set PORT=3000 && npm start"

echo [Ticket_Frontend] starting...
start /b cmd /c "cd /d Ticket_Selection\frontend && npm run dev"

echo [Ticket_Management_Backend] starting...
start /b cmd /c "cd /d Ticket_Management\backend && set PORT=3001 && npm start"

echo [Ticket_Management_Frontend] starting...
start /b cmd /c "cd /d Ticket_Management\frontend && npm run dev"

echo [User_Center_Backend] starting...
start /b cmd /c "cd /d User_Center\backend && set PORT=8083 && node src\server.js"

echo [User_Center_Frontend] starting...
start /b cmd /c "cd /d User_Center\frontend && npm run dev"

echo [User_Center] Personal Center API available at http://localhost:8083/api/v1

echo All services launched in this window. Press Ctrl+C to stop or run stop-all.cmd.
pause >nul

endlocal
