@echo off
chcp 65001 >nul
title Chia Se Website Ra Internet - Hybrid Store
cd /d "%~dp0"

echo ==============================================================
echo  🚀 CHIA SE DỰ ÁN HYBRID STORE RA TOÀN BỘ INTERNET
echo ==============================================================
echo.

:: 1. Khởi động Backend FastAPI Server
echo [*] Đang khởi động Backend FastAPI Server (Port 8000)...
start "Backend Server (Port 8000)" cmd /c "cd /d %~dp0\backend && .\venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000"

:: Đợi 3 giây cho server sẵn sàng
timeout /t 3 /nobreak >nul

:: 2. Kiểm tra hoặc tải Cloudflare Tunnel
if not exist "tools" mkdir tools
if not exist "tools\cloudflared.exe" (
    echo [*] Đang tải công cụ Cloudflare Tunnel chính thức (chỉ tải lần đầu tiên)...
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile('https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe', 'tools\cloudflared.exe')"
)

echo.
echo ==============================================================
echo  ✨ ĐANG TẠO ĐƯỜNG LINK TRUY CẬP CÔNG KHAI (INTERNET)...
echo  🌐 Link công khai sẽ hiển thị bên dưới (dạng https://*.trycloudflare.com)
echo  👉 Gửi link đó cho bất kỳ ai (điện thoại, máy tính) để truy cập web!
echo ==============================================================
echo.

if exist "tools\cloudflared.exe" (
    tools\cloudflared.exe tunnel --url http://127.0.0.1:8000
) else (
    echo [*] Đang thử kết nối qua LocalTunnel (npx)...
    npx localtunnel --port 8000
)

pause
