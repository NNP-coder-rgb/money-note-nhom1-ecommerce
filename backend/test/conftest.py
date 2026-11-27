"""
conftest.py — Cấu hình môi trường kiểm thử Pytest cho FastAPI Backend
Tạo TestClient và Fixtures nạp dữ liệu mẫu cho các ca kiểm thử tự động.
"""

import os
import sys
import pytest
from fastapi.testclient import TestClient

# Đưa thư mục backend vào sys.path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from main import app
from core.database import SessionLocal, get_db
from core.security import create_access_token
from models.user import User


@pytest.fixture(scope="session")
def client():
    """Khởi tạo TestClient của FastAPI."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="session")
def db_session():
    """Cung cấp session kết nối CSDL phục vụ kiểm thử."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session")
def admin_token(db_session):
    """Fixture tạo JWT Bearer Token cho Quản Trị Viên (Admin)."""
    admin = db_session.query(User).filter(User.role == "admin").first()
    if not admin:
        return ""
    return create_access_token(data={"sub": str(admin.id), "role": admin.role, "email": admin.email})


@pytest.fixture(scope="session")
def buyer_token(db_session):
    """Fixture tạo JWT Bearer Token cho Người Mua (Buyer)."""
    buyer = db_session.query(User).filter(User.role == "buyer").first()
    if not buyer:
        return ""
    return create_access_token(data={"sub": str(buyer.id), "role": buyer.role, "email": buyer.email})


@pytest.fixture(scope="session")
def seller_token(db_session):
    """Fixture tạo JWT Bearer Token cho Người Bán (Seller)."""
    seller = db_session.query(User).filter(User.role == "seller").first()
    if not seller:
        return ""
    return create_access_token(data={"sub": str(seller.id), "role": seller.role, "email": seller.email})
