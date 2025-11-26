@echo off
setlocal

echo [Stopping] killing listeners on ports: 8080 8082 8083 3000 3001 5173 5174 5176
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports = @(8080,8082,8083,3000,3001,5173,5174,5176); foreach ($p in $ports) { Get-NetTCPConnection -State Listen -LocalPort $p -ErrorAction SilentlyContinue | Select-Object -Expand OwningProcess | Sort-Object -Unique | ForEach-Object { try { Stop-Process -Id $_ -Force } catch {} } }"

echo [Done] targeted ports released.
endlocal
