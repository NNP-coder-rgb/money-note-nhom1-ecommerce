@echo off
chcp 65001 >nul
title Backend FastAPI - Swagger UI Server
cd /d "%~dp0"

echo ==============================================================
echo  🚀 ĐANG KHỞI ĐỘNG MÁY CHỦ FASTAPI (UVICORN)...
echo  📖 Đường dẫn Swagger UI: http://127.0.0.1:8000/docs
echo ==============================================================
echo.

:: Tự động mở trình duyệt đến trang Swagger UI
start "" http://127.0.0.1:8000/docs

:: Chạy máy chủ Uvicorn với chế độ tự động reload khi sửa code
.\venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ⚠️ Có lỗi khi chạy máy chủ. Vui lòng kiểm tra lại môi trường Python.
    pause
)
