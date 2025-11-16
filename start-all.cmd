@echo off
setlocal

start "Home_Page" cmd /k "cd /d Home_Page\backend && node src\server.js"
start "Login_Register" cmd /k "cd /d Login_Register_Page\backend && npm i && set PORT=8082 && npm start"
start "Ticket_Backend" cmd /k "cd /d Ticket_Selection\backend && npm i && set PORT=3000 && npm start"
start "Ticket_Frontend" cmd /k "cd /d Ticket_Selection\frontend && npm i && npm run dev"
start "Ticket_Management_Backend" cmd /k "cd /d Ticket_Management\backend && npm i && set PORT=3001 && npm start"
start "Ticket_Management_Frontend" cmd /k "cd /d Ticket_Management\frontend && npm i && npm run dev"

endlocal