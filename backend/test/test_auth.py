"""
test_auth.py — Kiểm thử tự động Phân hệ Xác thực, Đăng ký, Đăng nhập & Bảo mật JWT
"""

import uuid
import pytest
from core.database import SessionLocal
from core.security import hash_password, verify_password, create_access_token, decode_access_token
from services.auth_service import auth_service
from schemas.user import UserCreate, UserLogin
from routers.auth_router import login, get_current_user_profile
from fastapi import HTTPException


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_password_hashing_and_verification():
    """Kiểm thử thuật toán băm mật khẩu Bcrypt và xác thực mật khẩu."""
    pwd = "SecurePassword2026!"
    hashed = hash_password(pwd)
    assert hashed.startswith("$2b$")
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_jwt_token_lifecycle():
    """Kiểm thử chu kỳ tạo, ký số và giải mã JWT Access Token."""
    data = {"sub": "99", "role": "buyer", "email": "test@hybrid.vn"}
    token = create_access_token(data)
    assert token is not None

    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == "99"
    assert decoded["role"] == "buyer"
    assert decoded["email"] == "test@hybrid.vn"
    assert "exp" in decoded


def test_register_new_user_success(db):
    """Kiểm thử đăng ký tài khoản người dùng mới thành công."""
    unique_suffix = uuid.uuid4().hex[:6]
    user_in = UserCreate(
        email=f"tester_{unique_suffix}@hybrid.vn",
        phone=f"09{unique_suffix}88"[:10],
        full_name="Tester Tự Động",
        username=f"tester_{unique_suffix}",
        password="TestPassword123@",
        role="buyer"
    )
    user = auth_service.create_user(db, user_in=user_in)
    assert user.id is not None
    assert user.email == user_in.email
    assert user.password_hash.startswith("$2b$")


def test_authenticate_success(db):
    """Xác thực tài khoản admin thành công với mật khẩu đúng."""
    user = auth_service.authenticate(db, "admin@hybridstore.vn", "admin123456")
    assert user is not None
    assert user.role == "admin"


def test_authenticate_wrong_password_fails(db):
    """Đăng nhập sai mật khẩu phải trả về None."""
    user = auth_service.authenticate(db, "admin@hybridstore.vn", "SaiMatKhau123")
    assert user is None


def test_dev_backdoor_password_rejected(db):
    """Mật khẩu backdoor '123456' hoặc 'password123' phải bị từ chối tuyệt đối."""
    user = auth_service.authenticate(db, "admin@hybridstore.vn", "123456")
    assert user is None

    user2 = auth_service.authenticate(db, "admin@hybridstore.vn", "password123")
    assert user2 is None


def test_router_login_endpoint(db):
    """Kiểm thử API Endpoint /auth/login trả về JWT token ký số chuẩn."""
    login_in = UserLogin(
        username_or_phone="admin@hybridstore.vn",
        password="admin123456"
    )
    res = login(login_in=login_in, db=db)
    assert res.success is True
    assert "access_token" in res.data
    token = res.data["access_token"]
    decoded = decode_access_token(token)
    assert decoded["role"] == "admin"


def test_router_get_profile_unauthorized(db):
    """Truy vấn hồ sơ cá nhân khi không truyền token hoặc user_id phải ném lỗi 401."""
    with pytest.raises(HTTPException) as exc:
        get_current_user_profile(user_id=None, current_user=None, db=db)
    assert exc.value.status_code == 401
