"""
main.py — Điểm Khởi Chạy Ứng Dụng FastAPI Backend
Cấu hình CORS Middleware, Tự động khởi tạo bảng CSDL (create_all),
Đăng ký các API Routers với tiền tố /api/v1, Swagger UI /docs và phục vụ Giao diện Frontend.
"""

import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import uvicorn

# Thêm thư mục backend vào sys.path để import chuẩn theo kiến trúc phân tầng
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from core.config import settings
from core.database import engine, Base, create_all_tables, get_db, Session
from routers import api_router


# ==============================================================
# LIFESPAN: QUẢN LÝ VÒNG ĐỜI ỨNG DỤNG (STARTUP & SHUTDOWN)
# ==============================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Quản lý sự kiện khởi động và tắt ứng dụng:
    Tự động gọi Base.metadata.create_all(bind=engine) để sinh bảng trong Database.
    """
    print("=" * 68)
    print(f"🚀 KHỞI ĐỘNG ỨNG DỤNG: {settings.PROJECT_NAME} (v{settings.VERSION})")
    print(f"📁 CSDL Kết nối: {settings.database_url}")
    print("=" * 68)

    # 1. Tự động đồng bộ các bảng trong CSDL thông qua SQLAlchemy ORM
    try:
        create_all_tables()
        print("✅ [SQLAlchemy] Toàn bộ bảng cơ sở dữ liệu đã sẵn sàng.")

        # 2. Tự động nạp dữ liệu mẫu ban đầu nếu CSDL mới tinh
        try:
            from seed_data import auto_seed_if_empty
            auto_seed_if_empty()
        except Exception as seed_err:
            print(f"ℹ️ [AutoSeed] Bỏ qua auto-seed: {seed_err}")
    except Exception as e:
        print(f"⚠️ [SQLAlchemy] Lỗi khi tạo bảng CSDL: {e}")

    yield

    print("🛑 [FastAPI] Ứng dụng đang dừng hoạt động...")


# ==============================================================
# KHỞI TẠO ỨNG DỤNG FASTAPI
# ==============================================================
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Hệ thống Backend RESTful API Sàn TMĐT Hybrid Store xây dựng theo kiến trúc phân tầng (FastAPI + SQLAlchemy + MySQL)",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)


# ==============================================================
# CẤU HÌNH CORS MIDDLEWARE (CHO PHÉP FRONTEND KẾT NỐI AN TOÀN)
# ==============================================================
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Middleware chống cache trình duyệt cho file HTML, JS, CSS
@app.middleware("http")
async def add_cache_control_header(request: Request, call_next):
    response = await call_next(request)
    path = request.url.path
    if path.endswith((".html", ".js", ".css")) or path in ["/", "/index.html"]:
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response



# ==============================================================
# ĐĂNG KÝ CÁC ROUTERS VỚI TIỀN TỐ /api/v1
# ==============================================================
app.include_router(api_router, prefix=settings.API_V1_STR)


# ==============================================================
# ENDPOINTS HỆ THỐNG & HEALTH CHECK
# ==============================================================
@app.get(
    "/api/v1/health",
    tags=["System"],
    summary="Kiểm tra trạng thái máy chủ (Health Check)"
)
def health_check():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "connected"
    }


@app.get(
    "/api/v1/system/db-info",
    tags=["System"],
    summary="Kiểm tra nguồn cơ sở dữ liệu thực tế và thống kê bản ghi"
)
def get_db_info(db: Session = Depends(get_db)):
    is_mysql_active = engine is not None and str(engine.url).startswith("mysql")
    raw_url = str(engine.url) if engine else "unknown"
    masked_url = raw_url
    if "@" in raw_url and ":" in raw_url:
        try:
            prefix, rest = raw_url.split("://", 1)
            user_part, host_part = rest.split("@", 1)
            user = user_part.split(":", 1)[0]
            masked_url = f"{prefix}://{user}:***@{host_part}"
        except Exception:
            pass

    counts = {}
    try:
        from models import User, Product, Order, Category, Dispute, EscrowWallet
        counts["users (người dùng)"] = db.query(User).count()
        counts["products (sản phẩm)"] = db.query(Product).count()
        counts["orders (đơn hàng)"] = db.query(Order).count()
        counts["categories (danh mục)"] = db.query(Category).count()
        counts["disputes (tranh chấp)"] = db.query(Dispute).count()
        counts["escrow_wallets (ví ký quỹ)"] = db.query(EscrowWallet).count()
    except Exception as e:
        counts["error"] = str(e)

    return {
        "status": "connected",
        "database_engine": "MySQL (Chạy trên máy tính cá nhân qua cổng 3306)" if is_mysql_active else "SQLite (Cơ sở dữ liệu nhúng sẵn trên Cloud Render)",
        "connection_url": masked_url,
        "is_mysql": is_mysql_active,
        "is_sqlite": not is_mysql_active,
        "tables_summary": counts
    }


# ==============================================================
# TÍCH HỢP & PHỤC VỤ GIAO DIỆN FRONTEND TĨNH & FILE TẢI LÊN
# ==============================================================
ROOT_DIR = os.path.dirname(CURRENT_DIR)
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")
UPLOADS_DIR = os.path.join(CURRENT_DIR, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

if os.path.isdir(FRONTEND_DIR):
    for sub in ["assets", "css", "js", "pages", "components"]:
        sub_path = os.path.join(FRONTEND_DIR, sub)
        if os.path.isdir(sub_path):
            app.mount(f"/{sub}", StaticFiles(directory=sub_path), name=sub)

    @app.get("/", include_in_schema=False)
    @app.get("/index.html", include_in_schema=False)
    def serve_frontend_root():
        index_file = os.path.join(FRONTEND_DIR, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        return {
            "message": f"Chào mừng đến với {settings.PROJECT_NAME}",
            "docs": "/docs",
            "redoc": "/redoc",
            "api_v1": settings.API_V1_STR
        }

    @app.get("/manifest.json", include_in_schema=False)
    def serve_manifest():
        manifest_file = os.path.join(FRONTEND_DIR, "manifest.json")
        if os.path.isfile(manifest_file):
            return FileResponse(manifest_file, media_type="application/json")
        return JSONResponse(status_code=404, content={"detail": "Not Found"})

    @app.get("/sw.js", include_in_schema=False)
    def serve_sw():
        sw_file = os.path.join(FRONTEND_DIR, "sw.js")
        if os.path.isfile(sw_file):
            return FileResponse(sw_file, media_type="application/javascript")
        return JSONResponse(status_code=404, content={"detail": "Not Found"})

    @app.get("/{filename:path}", include_in_schema=False)
    def serve_frontend_fallback(filename: str):
        # 1. Tránh ghi đè các endpoint API hoặc tài liệu Swagger
        if filename.startswith(("api/", "docs", "redoc", "openapi.json")):
            return JSONResponse(status_code=404, content={"detail": "Not Found"})

        # 2. Kiểm tra nếu file tồn tại trực tiếp trong thư mục frontend
        file_path = os.path.join(FRONTEND_DIR, filename)
        if os.path.isfile(file_path):
            return FileResponse(file_path)

        # 3. Thử tìm file .html tương ứng
        html_file = os.path.join(FRONTEND_DIR, f"{filename}.html")
        if os.path.isfile(html_file):
            return FileResponse(html_file)

        # 4. Fallback về index.html cho SPA hoặc liên kết gốc
        index_file = os.path.join(FRONTEND_DIR, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)

        return JSONResponse(status_code=404, content={"detail": "Not Found"})
else:
    @app.get("/", include_in_schema=False)
    def root():
        return {
            "message": f"Chào mừng đến với {settings.PROJECT_NAME}",
            "docs": "/docs",
            "redoc": "/redoc",
            "api_v1": settings.API_V1_STR
        }


# ==============================================================
# KHỞI CHẠY BẰNG UVICORN SERVER
# ==============================================================
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
