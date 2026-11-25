"""
routers/user_router.py — API Endpoints Quản Lý Người Dùng, Sổ Địa Chỉ & Tài Khoản Ngân Hàng
Nguyễn Khả Minh Đức
"""

from typing import Optional, List, Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.database import get_db
from schemas.common import BaseResponse, PaginatedResponse
from schemas.user import (
    UserCreate, UserUpdate, UserResponse,
    UserAddressCreate, UserAddressResponse,
    BankAccountCreate, BankAccountResponse
)
from services.user_service import user_service
from models.user import UserAddress, BankAccount

router = APIRouter(prefix="/users", tags=["Users (Quản lý người dùng)"])


@router.get(
    "/",
    response_model=PaginatedResponse[UserResponse],
    summary="Lấy danh sách người dùng có phân trang"
)
def get_users(
    page: Annotated[int, Query(ge=1, description="Số thứ tự trang")] = 1,
    limit: Annotated[int, Query(ge=1, le=100, description="Số bản ghi trên mỗi trang")] = 20,
    role: Annotated[Optional[str], Query(description="Lọc theo vai trò: buyer, seller, admin")] = None,
    search: Annotated[Optional[str], Query(description="Tìm kiếm theo tên, email, sđt")] = None,
    db: Session = Depends(get_db)
):
    skip = (page - 1) * limit
    users, total = user_service.get_users(db, skip=skip, limit=limit, role=role, search=search)
    return PaginatedResponse[UserResponse](
        success=True,
        message="Lấy danh sách người dùng thành công",
        data=users,
        total=total,
        page=page,
        limit=limit
    )


@router.get(
    "/{user_id}",
    response_model=BaseResponse[UserResponse],
    summary="Lấy thông tin chi tiết một người dùng"
)
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    user = user_service.get_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy người dùng có mã ID: {user_id}"
        )
    return BaseResponse[UserResponse](
        success=True,
        message="Lấy thông tin người dùng thành công",
        data=user
    )


@router.post(
    "/",
    response_model=BaseResponse[UserResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Tạo mới một người dùng"
)
def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    if user_service.get_by_email(db, email=user_in.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Địa chỉ email '{user_in.email}' đã được đăng ký"
        )
    if user_service.get_by_phone(db, phone=user_in.phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Số điện thoại '{user_in.phone}' đã được đăng ký"
        )
    new_user = user_service.create_user(db, user_in=user_in)
    return BaseResponse[UserResponse](
        success=True,
        message="Tạo mới tài khoản người dùng thành công",
        data=new_user
    )


@router.put(
    "/{user_id}",
    response_model=BaseResponse[UserResponse],
    summary="Cập nhật thông tin người dùng"
)
def update_user(user_id: int, user_in: UserUpdate, db: Session = Depends(get_db)):
    updated_user = user_service.update_user(db, user_id=user_id, user_in=user_in)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy người dùng có mã ID: {user_id} để cập nhật"
        )
    return BaseResponse[UserResponse](
        success=True,
        message="Cập nhật thông tin người dùng thành công",
        data=updated_user
    )


@router.delete(
    "/{user_id}",
    response_model=BaseResponse[dict],
    summary="Xóa người dùng khỏi hệ thống"
)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    success = user_service.delete_user(db, user_id=user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy người dùng có mã ID: {user_id} để xóa"
        )
    return BaseResponse[dict](
        success=True,
        message=f"Đã xóa thành công người dùng có mã ID: {user_id}",
        data={"deleted_user_id": user_id}
    )


# --- SỔ ĐỊA CHỈ GIAO HÀNG (ADDRESS BOOK) ---
@router.get(
    "/{user_id}/addresses",
    response_model=BaseResponse[List[UserAddressResponse]],
    summary="Lấy danh sách địa chỉ giao hàng của người dùng"
)
def get_user_addresses(user_id: int, db: Session = Depends(get_db)):
    addresses = db.query(UserAddress).filter(UserAddress.user_id == user_id).order_by(UserAddress.is_default.desc()).all()
    return BaseResponse[List[UserAddressResponse]](
        success=True,
        message="Lấy danh sách địa chỉ giao hàng thành công",
        data=addresses
    )


@router.post(
    "/{user_id}/addresses",
    response_model=BaseResponse[UserAddressResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Thêm địa chỉ giao hàng mới"
)
def add_user_address(user_id: int, addr_in: UserAddressCreate, db: Session = Depends(get_db)):
    user = user_service.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng")
    addr = user_service.add_address(db, user_id, addr_in)
    return BaseResponse[UserAddressResponse](
        success=True,
        message="Thêm địa chỉ giao hàng thành công",
        data=addr
    )


@router.delete(
    "/addresses/{address_id}",
    response_model=BaseResponse[dict],
    summary="Xóa địa chỉ giao hàng"
)
def delete_user_address(address_id: int, db: Session = Depends(get_db)):
    addr = db.query(UserAddress).filter(UserAddress.id == address_id).first()
    if not addr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy địa chỉ")
    db.delete(addr)
    db.commit()
    return BaseResponse[dict](success=True, message="Xóa địa chỉ thành công", data={"deleted_address_id": address_id})


# --- TÀI KHOẢN NGÂN HÀNG LIÊN KẾT (BANK ACCOUNTS) ---
@router.get(
    "/{user_id}/bank-accounts",
    response_model=BaseResponse[List[BankAccountResponse]],
    summary="Lấy danh sách tài khoản ngân hàng liên kết"
)
def get_user_bank_accounts(user_id: int, db: Session = Depends(get_db)):
    accounts = db.query(BankAccount).filter(BankAccount.user_id == user_id).order_by(BankAccount.is_default.desc()).all()
    return BaseResponse[List[BankAccountResponse]](
        success=True,
        message="Lấy danh sách tài khoản ngân hàng thành công",
        data=accounts
    )


@router.post(
    "/{user_id}/bank-accounts",
    response_model=BaseResponse[BankAccountResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Liên kết tài khoản ngân hàng mới"
)
def add_user_bank_account(user_id: int, bank_in: BankAccountCreate, db: Session = Depends(get_db)):
    user = user_service.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng")
    bank = user_service.add_bank_account(db, user_id, bank_in)
    return BaseResponse[BankAccountResponse](
        success=True,
        message="Liên kết tài khoản ngân hàng thành công",
        data=bank
    )


@router.delete(
    "/bank-accounts/{account_id}",
    response_model=BaseResponse[dict],
    summary="Hủy liên kết tài khoản ngân hàng"
)
def delete_user_bank_account(account_id: int, db: Session = Depends(get_db)):
    bank = db.query(BankAccount).filter(BankAccount.id == account_id).first()
    if not bank:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tài khoản ngân hàng")
    db.delete(bank)
    db.commit()
    return BaseResponse[dict](success=True, message="Đã hủy liên kết tài khoản ngân hàng", data={"deleted_account_id": account_id})
