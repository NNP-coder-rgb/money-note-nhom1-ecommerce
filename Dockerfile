# ==============================================================
# DOCKERFILE — HYBRID.STORE MULTI-TIER E-COMMERCE PLATFORM
# ==============================================================
FROM python:3.11-slim

# Thiết lập biến môi trường tối ưu cho Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

# Cài đặt các gói hệ thống cần thiết
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    libmariadb-dev \
    && rm -rf /var/lib/apt/lists/*

# Cài đặt Python dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r ./backend/requirements.txt

# Sao chép toàn bộ mã nguồn dự án
COPY . .

# Đảm bảo thư mục lưu trữ database và uploads tồn tại
RUN mkdir -p backend/database backend/uploads

# Khởi tạo CSDL mẫu ban đầu
RUN python backend/seed_data.py

EXPOSE 8000

# Khởi chạy máy chủ FastAPI qua Uvicorn
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
