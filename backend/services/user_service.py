"""
services/user_service.py — Lớp Xử Lý Nghiệp Vụ & Truy Vấn CRUD Cho User
Tách bạch hoàn toàn logic nghiệp vụ với Router:
Mọi thao tác truy vấn CSDL qua `db: Session` đều được thực thi tại đây.
Nguyễn Khả Minh Đức
"""

import hashlib
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_

from models.user import User
from schemas.user import UserCreate, UserUpdate


def hash_password(password: str) -> str:
    """Mã hóa mật khẩu bằng SHA-256 kèm salt."""
    salt = "hybrid_store_salt_2026"
    return f"sha256${hashlib.sha256((password + salt).encode('utf-8')).hexdigest()}"


class UserService:
    """Service xử lý toàn bộ logic nghiệp vụ cho đối tượng User."""

    @staticmethod
    def get_by_id(db: Session, user_id: int) -> Optional[User]:
        """Truy vấn tìm người dùng theo Khóa chính ID."""
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        """Truy vấn tìm người dùng theo Email."""
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_by_phone(db: Session, phone: str) -> Optional[User]:
        """Truy vấn tìm người dùng theo Số điện thoại."""
        return db.query(User).filter(User.phone == phone).first()

    @staticmethod
    def get_users(
        db: Session, 
        skip: int = 0, 
        limit: int = 20, 
        role: Optional[str] = None,
        search: Optional[str] = None
    ) -> Tuple[List[User], int]:
        """Lấy danh sách người dùng kèm phân trang và tìm kiếm."""
        query = db.query(User)

        if role:
            query = query.filter(User.role == role)

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    User.full_name.ilike(search_pattern),
                    User.email.ilike(search_pattern),
                    User.phone.ilike(search_pattern)
                )
            )

        total = query.count()
        users = query.order_by(User.id.desc()).offset(skip).limit(limit).all()
        return users, total

    @staticmethod
    def create_user(db: Session, user_in: UserCreate) -> User:
        """Tạo mới một người dùng trong CSDL."""
        hashed_pwd = hash_password(user_in.password)
        db_user = User(
            email=user_in.email,
            phone=user_in.phone,
            password_hash=hashed_pwd,
            full_name=user_in.full_name,
            role=user_in.role,
            avatar_url=user_in.avatar_url,
            bio=user_in.bio,
            is_active=True
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def update_user(db: Session, user_id: int, user_in: UserUpdate) -> Optional[User]:
        """Cập nhật thông tin người dùng."""
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            return None

        update_data = user_in.model_dump(exclude_unset=True)

        # Xử lý cập nhật mật khẩu nếu có
        if "password" in update_data and update_data["password"]:
            db_user.password_hash = hash_password(update_data.pop("password"))

        for key, value in update_data.items():
            setattr(db_user, key, value)

        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def delete_user(db: Session, user_id: int) -> bool:
        """Xóa người dùng khỏi hệ thống theo ID."""
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            return False

        db.delete(db_user)
        db.commit()
        return True


user_service = UserService()
