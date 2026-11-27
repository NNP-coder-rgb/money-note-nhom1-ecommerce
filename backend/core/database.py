"""
core/database.py — Cấu hình Kết nối Cơ sở Dữ liệu và Dependency Session
Sử dụng SQLAlchemy ORM kết nối MySQL qua pymysql, cung cấp SessionLocal, Base và get_db().
"""

import os
import sys
from typing import Generator
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.exc import OperationalError

from core.config import settings

# Lấy URL kết nối cấu hình
db_url = settings.database_url
is_mysql = db_url.startswith("mysql")

engine = None

# 1. Khởi tạo Engine SQLAlchemy
try:
    if is_mysql:
        # Cấu hình Pool kết nối cho MySQL
        engine = create_engine(
            db_url,
            connect_args={"connect_timeout": 1},
            pool_pre_ping=True,       # Tự động ping kiểm tra kết nối còn sống trước khi query
            pool_recycle=3600,        # Tái tạo kết nối sau 1 giờ tránh MySQL timeout (8h)
            pool_size=10,             # Số lượng kết nối duy trì trong pool
            max_overflow=20,          # Số lượng kết nối tối đa khi tải cao
            echo=False
        )
        # Thử nghiệm kết nối nhanh tới MySQL
        with engine.connect() as conn:
            pass
        print(f"✅ [Database] Kết nối MySQL thành công tới: {settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}")
    else:
        engine = create_engine(db_url, connect_args={"check_same_thread": False})
except (OperationalError, Exception) as err:
    if settings.USE_SQLITE_FALLBACK:
        # Tự động chuyển hướng sang SQLite dự phòng nếu MySQL chưa bật
        fallback_url = settings.sqlite_fallback_url
        print(f"⚠️ [Database] Không thể kết nối tới MySQL ({err}).")
        print(f"🔄 [Database] Đang chuyển sang sử dụng SQLite dự phòng tại: {fallback_url}")
        
        # Đảm bảo thư mục database/ tồn tại
        db_dir = os.path.dirname(fallback_url.replace("sqlite:///", ""))
        os.makedirs(db_dir, exist_ok=True)
        
        engine = create_engine(fallback_url, connect_args={"check_same_thread": False})
        
        # Bật ràng buộc khóa ngoại cho SQLite
        @event.listens_for(engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()
    else:
        raise err

# 2. Khởi tạo Sessionmaker quản lý phiên làm việc
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3. Khai báo Declarative Base cho toàn bộ Models
Base = declarative_base()

DB_PATH = settings.sqlite_fallback_url if settings.USE_SQLITE_FALLBACK else settings.database_url


# 4. Dependency Dependency Injection cho FastAPI Endpoints
def get_db() -> Generator[Session, None, None]:
    """
    Dependency quản lý vòng đời Session cho từng Request trong FastAPI:
    Tự động mở Session khi request đến và đảm bảo đóng an toàn trong khối finally.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_all_tables():
    """Tự động tạo toàn bộ bảng cơ sở dữ liệu nếu chưa tồn tại."""
    import models  # Nạp toàn bộ models để Base.metadata nhận diện
    Base.metadata.create_all(bind=engine)
    total = len(Base.metadata.tables)
    print(f"✨ [Database] Đã đồng bộ thành công {total} bảng vào Cơ sở Dữ liệu.")
    return total
