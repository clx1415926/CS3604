@echo off
setlocal

call :install_if_present "Home_Page\backend" "Home_Page Backend"
call :ensure_runtime "Home_Page\backend" "express"

call :install_if_present "Login_Register_Page\backend" "Login_Register Backend"
call :ensure_runtime "Login_Register_Page\backend" "express cors nedb-promises"

call :install_if_present "Ticket_Selection\backend" "Ticket_Selection Backend"
call :ensure_runtime "Ticket_Selection\backend" "express cors"

call :install_if_present "Ticket_Selection\frontend" "Ticket_Selection Frontend"
call :ensure_frontend_dev "Ticket_Selection\frontend" "vite @vitejs/plugin-react"

call :install_if_present "Ticket_Management\backend" "Ticket_Management Backend"
call :ensure_runtime "Ticket_Management\backend" "express cors"

call :install_if_present "Ticket_Management\frontend" "Ticket_Management Frontend"
call :ensure_frontend_dev "Ticket_Management\frontend" "vite @vitejs/plugin-react"

call :install_if_present "User_Center\backend" "User_Center Backend"
call :install_if_present "User_Center\frontend" "User_Center Frontend"
call :ensure_frontend_dev "User_Center\frontend" "vite @vitejs/plugin-react"

echo.
echo All installations completed.
pause
endlocal
goto :eof

:install_if_present
set "DIR=%~1"
set "NAME=%~2"
if not exist "%DIR%" (
  echo [%NAME%] directory missing, skipping.
  goto :eof
)
if not exist "%DIR%\package.json" (
  echo [%NAME%] package.json missing, skipping npm install.
  goto :eof
)
pushd "%DIR%"
if exist package-lock.json (
  call npm ci
) else (
  call npm install
)
if %errorlevel% neq 0 echo [%NAME%] install failed!
popd
goto :eof

:ensure_runtime
set "DIR=%~1"
set "PKGS=%~2"
if not exist "%DIR%" goto :eof
pushd "%DIR%"
for %%M in (%PKGS%) do (
  if not exist "node_modules\%%M" (
    call npm install %%M
  )
)
popd
goto :eof

:ensure_frontend_dev
set "DIR=%~1"
set "PKGS=%~2"
if not exist "%DIR%" goto :eof
pushd "%DIR%"
for %%M in (%PKGS%) do (
  if not exist "node_modules\%%M" (
    call npm install -D %%M
  )
)
popd
goto :eof
