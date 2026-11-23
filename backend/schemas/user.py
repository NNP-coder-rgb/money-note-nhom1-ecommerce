"""
schemas/user.py — Pydantic Schemas Cho Người Dùng, eKYC, Sổ Địa Chỉ & Ngân Hàng
"""

from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel, Field, ConfigDict


class UserBase(BaseModel):
    email: str = Field(..., description="Email người dùng (duy nhất)")
    phone: str = Field(..., description="Số điện thoại liên hệ (duy nhất)")
    full_name: str = Field(..., min_length=2, max_length=100, description="Họ và tên người dùng")
    username: Optional[str] = Field(default=None, description="Tên đăng nhập")
    role: str = Field(default="buyer", description="Vai trò: buyer, seller, admin, inspector")
    avatar_url: Optional[str] = Field(default=None, description="Đường dẫn ảnh đại diện")
    bio: Optional[str] = Field(default=None, description="Giới thiệu bản thân")
    shop_name: Optional[str] = Field(default=None, description="Tên gian hàng (nếu là người bán)")


class UserLogin(BaseModel):
    username_or_phone: str = Field(..., description="Email, số điện thoại hoặc username")
    password: str = Field(..., description="Mật khẩu tài khoản")


class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., description="Email nhận mã xác thực đặt lại mật khẩu")


class ForgotPasswordVerify(BaseModel):
    email: str = Field(..., description="Email tài khoản")
    otp: str = Field(..., min_length=6, max_length=6, description="Mã OTP 6 chữ số")


class ForgotPasswordReset(BaseModel):
    email: str = Field(..., description="Email tài khoản")
    otp: str = Field(..., min_length=6, max_length=6, description="Mã OTP 6 chữ số")
    new_password: Optional[str] = Field(default=None, description="Mật khẩu mới (tùy chọn, nếu không nhập hệ thống sẽ tự sinh)")


class PhoneOtpRequest(BaseModel):
    phone: str = Field(..., min_length=3, max_length=120, description="Số điện thoại hoặc Email nhận mã OTP")


class PhoneOtpVerify(BaseModel):
    phone: str = Field(..., min_length=3, max_length=120, description="Số điện thoại hoặc Email nhận mã OTP")
    otp: str = Field(..., min_length=6, max_length=6, description="Mã OTP 6 chữ số")
    role: Optional[str] = Field(default="buyer", description="Vai trò đăng nhập")


class GoogleTokenVerify(BaseModel):
    access_token: Optional[str] = Field(default=None, description="OAuth 2.0 Access Token từ Google")
    id_token: Optional[str] = Field(default=None, description="Google ID Token (JWT)")
    role: Optional[str] = Field(default="buyer", description="Vai trò đăng nhập")


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=50, description="Mật khẩu khởi tạo tài khoản")


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    phone: Optional[str] = Field(default=None)
    role: Optional[str] = Field(default=None)
    avatar_url: Optional[str] = Field(default=None)
    bio: Optional[str] = Field(default=None)
    shop_name: Optional[str] = Field(default=None)
    is_active: Optional[bool] = Field(default=None)
    password: Optional[str] = Field(default=None, min_length=6, description="Mật khẩu mới nếu muốn đổi")


class KYCVerificationCreate(BaseModel):
    id_card_number: str = Field(..., min_length=9, max_length=20, description="Số CCCD gắn chip C06")
    full_name_on_card: str = Field(..., description="Họ tên in hoa trên thẻ")
    date_of_birth: Optional[date] = None
    gender: Optional[str] = "Nam"
    permanent_address: Optional[str] = None
    front_image_url: str = Field(..., description="Ảnh mặt trước CCCD")
    back_image_url: str = Field(..., description="Ảnh mặt sau CCCD")
    selfie_image_url: Optional[str] = None


class KYCVerificationResponse(KYCVerificationCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    status: str
    rejection_reason: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime


class UserAddressCreate(BaseModel):
    recipient_name: str = Field(..., min_length=2)
    phone: str = Field(..., min_length=9)
    province: str
    district: str
    ward: str
    street_address: str
    address_type: str = "home"
    is_default: bool = False


class UserAddressResponse(UserAddressCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    full_address: str
    created_at: datetime


class BankAccountCreate(BaseModel):
    bank_code: str = Field(..., description="Mã ngân hàng (VCB, TCB, MB...)")
    bank_name: str
    account_number: str
    account_holder: str
    is_default: bool = False


class BankAccountResponse(BankAccountCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="Mã ID người dùng")
    membership_title: Optional[str] = "VIP BUYER"
    shop_rating: Optional[float] = 5.0
    loyalty_points: Optional[int] = 0
    is_active: bool = Field(..., description="Trạng thái tài khoản")
    created_at: datetime = Field(..., description="Ngày tạo tài khoản")
    updated_at: datetime = Field(..., description="Ngày cập nhật mới nhất")
    kyc: Optional[KYCVerificationResponse] = None
    addresses: List[UserAddressResponse] = Field(default_factory=list)
    bank_accounts: List[BankAccountResponse] = Field(default_factory=list)
