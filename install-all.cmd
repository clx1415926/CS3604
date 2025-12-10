@echo off
setlocal

echo [Home_Page Backend] installing...
cd /d Home_Page\backend && npm install
if %errorlevel% neq 0 echo [Home_Page Backend] install failed!

echo [Login_Register Backend] installing...
cd /d ..\..\Login_Register_Page\backend && npm install
if %errorlevel% neq 0 echo [Login_Register Backend] install failed!

echo [Ticket_Selection Backend] installing...
cd /d ..\..\Ticket_Selection\backend && npm install
if %errorlevel% neq 0 echo [Ticket_Selection Backend] install failed!

echo [Ticket_Selection Frontend] installing...
cd /d ..\frontend && npm install
if %errorlevel% neq 0 echo [Ticket_Selection Frontend] install failed!

echo [Ticket_Management Backend] installing...
cd /d ..\..\Ticket_Management\backend && npm install
if %errorlevel% neq 0 echo [Ticket_Management Backend] install failed!

echo [Ticket_Management Frontend] installing...
cd /d ..\frontend && npm install
if %errorlevel% neq 0 echo [Ticket_Management Frontend] install failed!

echo [User_Center Backend] installing...
cd /d ..\..\User_Center\backend && npm install
if %errorlevel% neq 0 echo [User_Center Backend] install failed!

echo [User_Center Frontend] installing...
cd /d ..\frontend && npm install
if %errorlevel% neq 0 echo [User_Center Frontend] install failed!

echo.
echo All installations completed.
pause
endlocal
