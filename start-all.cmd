@echo off
setlocal

echo [Home_Page] starting...
start /b cmd /c "cd /d Home_Page\backend && node src\server.js"

echo [Login_Register] starting...
start /b cmd /c "cd /d Login_Register_Page\backend && npm i && set PORT=8082 && npm start"

echo [Ticket_Backend] starting...
start /b cmd /c "cd /d Ticket_Selection\backend && npm i && set PORT=3000 && npm start"

echo [Ticket_Frontend] starting...
start /b cmd /c "cd /d Ticket_Selection\frontend && npm i && npm run dev"

echo [Ticket_Management_Backend] starting...
start /b cmd /c "cd /d Ticket_Management\backend && npm i && set PORT=3001 && npm start"

echo [Ticket_Management_Frontend] starting...
start /b cmd /c "cd /d Ticket_Management\frontend && npm i && npm run dev"

echo [User_Center_Backend] starting...
start /b cmd /c "cd /d User_Center\backend && set PORT=8083 && node src\server.js"

echo [User_Center_Frontend] starting...
start /b cmd /c "cd /d User_Center\frontend && npm i && npm run dev"

echo [User_Center] Personal Center API available at http://localhost:8083/api/v1

echo All services launched in this window. Press Ctrl+C to stop or run stop-all.cmd.
pause >nul

endlocal
