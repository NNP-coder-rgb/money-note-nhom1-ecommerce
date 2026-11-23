"""
create_tables.py — Kịch bản khởi tạo toàn bộ 23 Bảng CSDL tự động qua Python & SQLAlchemy ORM
Cách chạy:
    cd backend
    python create_tables.py
"""

import os
import sys

# Thêm thư mục hiện tại vào sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from core.database import engine, Base, DB_PATH
import models  # Nạp toàn bộ 23 Models

def main():
    print("=" * 68)
    print("🚀 KHỞI TẠO CƠ SỞ DỮ LIỆU QUA PYTHON VÀ SQLALCHEMY ORM")
    print(f"📁 Tệp CSDL đích: {DB_PATH}")
    print("=" * 68)

    # Base.metadata.create_all tự động sinh câu lệnh CREATE TABLE cho 23 bảng
    Base.metadata.create_all(bind=engine)

    tables = sorted(list(Base.metadata.tables.keys()))
    print(f"✨ Đã cấu hình và khởi tạo thành công {len(tables)} bảng CSDL:")
    for idx, table_name in enumerate(tables, 1):
        cols_count = len(Base.metadata.tables[table_name].columns)
        print(f"   [{idx:02d}] Bảng: {table_name:<25} ({cols_count} cột thuộc tính)")

    print("=" * 68)
    print("🎉 HOÀN TẤT: Toàn bộ bảng đã sẵn sàng trong SQLite mà không cần viết SQL thủ công!")
    print("=" * 68)

if __name__ == "__main__":
    main()
