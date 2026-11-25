"""
routers/auth_router.py — API Endpoints Xác Thực, Đăng Ký, Đăng Nhập & eKYC CCCD
Nguyễn Khả Minh Đức
"""

from typing import Optional, Dict, Any
import time
import secrets
import string
import json
import urllib.request
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.config import settings
from core.database import get_db
from schemas.common import BaseResponse
from schemas.user import (
    UserCreate, UserUpdate, UserResponse, UserLogin,
    KYCVerificationCreate, KYCVerificationResponse,
    ForgotPasswordRequest, ForgotPasswordVerify, ForgotPasswordReset,
    PhoneOtpRequest, PhoneOtpVerify, GoogleTokenVerify
)
from services.auth_service import auth_service
from services.email_service import email_service
from services.sms_service import sms_service
from models.user import KYCVerification, User

router = APIRouter(prefix="/auth", tags=["Auth & Identity (Xác thực & Danh tính)"])

# Bộ nhớ tạm lưu mã OTP khôi phục mật khẩu (Email -> {otp, expires_at, attempts, verified, requested_at, user_id})
_EMAIL_RESET_STORE: Dict[str, Dict[str, Any]] = {}

# Bộ nhớ tạm lưu mã OTP đăng nhập số điện thoại (Phone -> {otp, expires_at, attempts, requested_at})
_PHONE_OTP_STORE: Dict[str, Dict[str, Any]] = {}


@router.post(
    "/register",
    response_model=BaseResponse[UserResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Đăng ký tài khoản mới"
)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    if auth_service.get_by_email(db, user_in.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email '{user_in.email}' đã được đăng ký"
        )
    if auth_service.get_by_phone(db, user_in.phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Số điện thoại '{user_in.phone}' đã được đăng ký"
        )
    new_user = auth_service.create_user(db, user_in=user_in)
    return BaseResponse[UserResponse](
        success=True,
        message="Đăng ký tài khoản thành công",
        data=new_user
    )


@router.post(
    "/login",
    response_model=BaseResponse[dict],
    summary="Đăng nhập hệ thống"
)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = auth_service.authenticate(db, login_in.username_or_phone, login_in.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tài khoản hoặc mật khẩu không chính xác"
        )
    # Trả về thông tin người dùng kèm token phiên làm việc
    user_data = UserResponse.model_validate(user).model_dump()
    return BaseResponse[dict](
        success=True,
        message="Đăng nhập thành công",
        data={
            "user": user_data,
            "access_token": f"bearer_{user.id}_token_session_2026",
            "token_type": "bearer"
        }
    )


@router.get(
    "/me",
    response_model=BaseResponse[UserResponse],
    summary="Lấy thông tin tài khoản hiện tại"
)
def get_current_user_profile(user_id: int = Query(..., description="ID tài khoản đăng nhập"), db: Session = Depends(get_db)):
    user = auth_service.get_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy thông tin tài khoản")
    return BaseResponse[UserResponse](
        success=True,
        message="Lấy hồ sơ cá nhân thành công",
        data=user
    )


@router.put(
    "/me",
    response_model=BaseResponse[UserResponse],
    summary="Cập nhật hồ sơ tài khoản hiện tại"
)
def update_current_user_profile(
    user_in: UserUpdate,
    user_id: int = Query(..., description="ID tài khoản đăng nhập"),
    db: Session = Depends(get_db)
):
    user = auth_service.update_user(db, user_id=user_id, user_in=user_in)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tài khoản cần cập nhật")
    return BaseResponse[UserResponse](
        success=True,
        message="Cập nhật hồ sơ cá nhân thành công",
        data=user
    )


@router.post(
    "/ekyc",
    response_model=BaseResponse[KYCVerificationResponse],
    summary="Gửi hồ sơ định danh C06 eKYC (CCCD gắn chip)"
)
def submit_ekyc(
    kyc_in: KYCVerificationCreate,
    user_id: int = Query(..., description="ID tài khoản gửi hồ sơ eKYC"),
    db: Session = Depends(get_db)
):
    user = auth_service.get_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng")

    kyc = auth_service.submit_ekyc(db, user_id=user_id, kyc_in=kyc_in)
    return BaseResponse[KYCVerificationResponse](
        success=True,
        message="Đã gửi hồ sơ xác thực CCCD gắn chip thành công. Vui lòng chờ phê duyệt.",
        data=kyc
    )


@router.get(
    "/ekyc",
    response_model=BaseResponse[Optional[KYCVerificationResponse]],
    summary="Kiểm tra trạng thái định danh eKYC"
)
def get_ekyc_status(
    user_id: int = Query(..., description="ID tài khoản kiểm tra"),
    db: Session = Depends(get_db)
):
    kyc = db.query(KYCVerification).filter(KYCVerification.user_id == user_id).first()
    return BaseResponse[Optional[KYCVerificationResponse]](
        success=True,
        message="Lấy trạng thái định danh thành công" if kyc else "Người dùng chưa gửi hồ sơ eKYC",
        data=kyc
    )


# ==============================================================
# KHÔI PHỤC MẬT KHẨU QUA EMAIL BẢO MẬT & CẤP MẬT KHẨU MỚI (SMTP THẬT)
# ==============================================================
def mask_email(email: str) -> str:
    parts = email.split("@")
    if len(parts) != 2:
        return email
    name, domain = parts[0], parts[1]
    if len(name) <= 2:
        masked_name = name[0] + "*"
    else:
        masked_name = name[0] + "***" + name[-1]
    return f"{masked_name}@{domain}"


def mask_phone(phone: str) -> str:
    clean = "".join([c for c in phone if c.isdigit()])
    if len(clean) >= 10:
        return clean[:3] + "****" + clean[-3:]
    return clean


@router.post(
    "/forgot-password/request",
    response_model=BaseResponse[dict],
    summary="Yêu cầu khôi phục mật khẩu và gửi mã OTP trực tiếp qua Email thật"
)
def request_forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    user = auth_service.get_by_email(db, email=email)
    if not user:
        user_in = UserCreate(
            email=email,
            phone="09" + f"{secrets.randbelow(90000000) + 10000000:08d}",
            full_name=email.split("@")[0],
            username=email.split("@")[0],
            role="buyer",
            password="temporary_otp_auth_pwd"
        )
        user = auth_service.create_user(db, user_in=user_in)

    # Kiểm tra giới hạn thời gian gửi (cooldown 60s)
    now = time.time()
    existing = _EMAIL_RESET_STORE.get(email)
    if existing and now - existing.get("requested_at", 0) < 60:
        remain = int(60 - (now - existing["requested_at"]))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Vui lòng đợi {remain} giây trước khi yêu cầu gửi lại mã."
        )

    # Sinh mã OTP 6 chữ số an toàn
    otp = f"{secrets.randbelow(900000) + 100000:06d}"
    _EMAIL_RESET_STORE[email] = {
        "otp": otp,
        "requested_at": now,
        "expires_at": now + 300,  # 5 phút
        "attempts": 0,
        "verified": False,
        "user_id": user.id
    }

    # Gửi email thật qua Resend API (HTTPS port 443) hoặc SMTP
    email_ok, email_msg = email_service.send_otp_email(email, otp, user.full_name)

    masked = mask_email(email)
    if not email_ok:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=email_msg or "Chưa thể gửi email xác thực: Render Free chặn cổng SMTP 587. Vui lòng cấu hình biến RESEND_API_KEY trên Render Dashboard để gửi email thật qua cổng HTTPS 443."
        )

    return BaseResponse[dict](
        success=True,
        message=f"Mã xác thực OTP bảo mật đã được gửi trực tiếp tới hòm thư {masked}. Vui lòng mở email để lấy mã.",
        data={
            "email": email,
            "masked_email": masked,
            "expires_in_seconds": 300,
            "email_dispatched": True
        }
    )

"Nguyen Huy Binh"
@router.post(
    "/forgot-password/verify",
    response_model=BaseResponse[dict],
    summary="Xác minh mã OTP gửi về Email"
)
def verify_forgot_password_otp(body: ForgotPasswordVerify):
    email = body.email.strip().lower()
    clean_otp = body.otp.strip()

    record = _EMAIL_RESET_STORE.get(email)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không có yêu cầu khôi phục mật khẩu đang hoạt động cho email này."
        )

    now = time.time()
    if now > record["expires_at"]:
        _EMAIL_RESET_STORE.pop(email, None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã xác thực OTP đã hết hạn (chỉ có hiệu lực trong 5 phút). Vui lòng yêu cầu mã mới."
        )

    if record["attempts"] >= 3:
        _EMAIL_RESET_STORE.pop(email, None)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Mã OTP đã bị hủy do nhập sai quá 3 lần. Vui lòng gửi lại yêu cầu mới."
        )

    if clean_otp != record["otp"]:
        record["attempts"] += 1
        remains = 3 - record["attempts"]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Mã OTP không chính xác. Bạn còn {remains} lần thử."
        )

    # Đánh dấu đã xác thực thành công
    record["verified"] = True
    return BaseResponse[dict](
        success=True,
        message="Xác thực email chính chủ thành công. Mật khẩu mới sẽ được gửi về email của bạn.",
        data={"email": email, "verified": True}
    )


@router.post(
    "/forgot-password/reset",
    response_model=BaseResponse[dict],
    summary="Cấp và gửi mật khẩu mới trực tiếp về Email thật sau khi đã xác thực"
)
def reset_and_issue_new_password(body: ForgotPasswordReset, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    clean_otp = body.otp.strip()

    record = _EMAIL_RESET_STORE.get(email)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không tìm thấy phiên xác thực hợp lệ. Vui lòng bắt đầu lại từ bước 1."
        )

    now = time.time()
    if now > record["expires_at"]:
        _EMAIL_RESET_STORE.pop(email, None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phiên xác thực đã hết hạn. Vui lòng thực hiện lại."
        )

    if clean_otp != record["otp"] and not record.get("verified"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã xác minh không hợp lệ hoặc chưa được duyệt."
        )

    # Sinh mật khẩu mới ngẫu nhiên an toàn nếu người dùng không tự nhập
    if body.new_password and len(body.new_password) >= 6:
        new_pwd = body.new_password
    else:
        rand_num = f"{secrets.randbelow(9000) + 1000}"
        new_pwd = f"Hyb#{rand_num}@2026"

    user = auth_service.reset_password_by_email(db, email=email, new_password=new_pwd)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy tài khoản để cập nhật mật khẩu."
        )

    # Gửi mật khẩu mới thật trực tiếp vào Email qua SMTP
    email_ok, email_msg = email_service.send_new_password_email(email, new_pwd, user.full_name)

    # Xóa token sau khi đã reset thành công
    _EMAIL_RESET_STORE.pop(email, None)

    masked = mask_email(email)
    if not email_ok:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=email_msg or "Không thể gửi email chứa mật khẩu mới. Vui lòng cấu hình tài khoản gửi Email trên Render Dashboard."
        )

    return BaseResponse[dict](
        success=True,
        message=f"Mật khẩu mới đã được khởi tạo và gửi trực tiếp an toàn tới hòm thư {masked}. Vui lòng mở email để lấy mật khẩu đăng nhập.",
        data={
            "email": email,
            "masked_email": masked,
            "email_dispatched": True,
            "login_ready": True
        }
    )


# ==============================================================
# GỬI MÃ OTP TRỰC TIẾP VÀO SỐ ĐIỆN THOẠI (SMS) HOẶC EMAIL THẬT
# ==============================================================
@router.post(
    "/otp/send-phone",
    response_model=BaseResponse[dict],
    summary="Gửi mã OTP trực tiếp vào số điện thoại thật hoặc Email thật"
)
def send_phone_otp_sms(body: PhoneOtpRequest):
    raw_input = body.phone.strip()
    is_email = "@" in raw_input and "." in raw_input

    if is_email:
        clean_target = raw_input.lower()
        key = clean_target
    else:
        clean_target = "".join([c for c in raw_input if c.isdigit()])
        if len(clean_target) != 10 or not clean_target.startswith("0"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vui lòng nhập số điện thoại hợp lệ (10 số) hoặc địa chỉ Email chính xác."
            )
        key = clean_target

    now = time.time()
    existing = _PHONE_OTP_STORE.get(key)
    if existing and now - existing.get("requested_at", 0) < 60:
        remain = int(60 - (now - existing["requested_at"]))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Vui lòng đợi {remain} giây trước khi yêu cầu gửi lại mã."
        )

    # Sinh mã OTP 6 chữ số an toàn
    otp = f"{secrets.randbelow(900000) + 100000:06d}"
    _PHONE_OTP_STORE[key] = {
        "otp": otp,
        "requested_at": now,
        "expires_at": now + 180,  # 3 phút
        "attempts": 0,
        "is_email": is_email
    }

    if is_email:
        email_ok, email_msg = email_service.send_otp_email(clean_target, otp, "Quý khách")
        masked = mask_email(clean_target)
        if not email_ok:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=email_msg or "Chưa thể gửi email. Vui lòng cấu hình RESEND_API_KEY trên Render Dashboard."
            )
        msg = f"Mã OTP bảo mật 6 chữ số đã được gửi trực tiếp đến hộp thư {masked}. Vui lòng mở email để lấy mã."
    else:
        sms_ok, sms_msg = sms_service.send_otp_sms(clean_target, otp)
        masked = mask_phone(clean_target)
        if not sms_ok:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=sms_msg or "Hệ thống chưa kết nối Cổng SMS viễn thông (eSMS hoặc Twilio). Vui lòng cấu hình tài khoản gửi SMS trong Environment trên Render Dashboard."
            )
        msg = f"Mã OTP bảo mật 6 chữ số đã được gửi trực tiếp đến SIM điện thoại {masked}. Vui lòng mở tin nhắn SMS trên điện thoại của bạn."

    return BaseResponse[dict](
        success=True,
        message=msg,
        data={
            "phone": clean_target,
            "target": clean_target,
            "masked_phone": masked,
            "is_email": is_email,
            "expires_in_seconds": 180,
            "sms_dispatched": True
        }
    )


@router.post(
    "/otp/login-phone",
    response_model=BaseResponse[dict],
    summary="Đăng nhập bằng số điện thoại hoặc Email và mã OTP bảo mật"
)
def login_phone_otp(body: PhoneOtpVerify, db: Session = Depends(get_db)):
    raw_input = body.phone.strip()
    is_email = "@" in raw_input and "." in raw_input
    key = raw_input.lower() if is_email else "".join([c for c in raw_input if c.isdigit()])
    clean_otp = body.otp.strip()

    record = _PHONE_OTP_STORE.get(key)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không tìm thấy yêu cầu gửi OTP. Vui lòng bấm 'Nhận Mã OTP' trước."
        )

    now = time.time()
    if now > record["expires_at"]:
        _PHONE_OTP_STORE.pop(key, None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã OTP đã hết hạn (chỉ có hiệu lực trong 3 phút). Vui lòng yêu cầu mã mới."
        )

    if record["attempts"] >= 3:
        _PHONE_OTP_STORE.pop(key, None)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Mã OTP đã bị khóa do nhập sai quá 3 lần. Vui lòng bấm 'Nhận Mã OTP' để nhận mã mới."
        )

    if clean_otp != record["otp"]:
        record["attempts"] += 1
        remains = 3 - record["attempts"]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Mã OTP không chính xác. Bạn còn {remains} lần thử."
        )

    # Đăng nhập thành công -> Xóa mã OTP đã dùng
    _PHONE_OTP_STORE.pop(key, None)

    # Tìm hoặc tạo tài khoản người dùng theo Email hoặc Số điện thoại
    if is_email:
        user = auth_service.get_by_email(db, email=key)
        if not user:
            user_in = UserCreate(
                email=key,
                phone="09" + f"{secrets.randbelow(90000000) + 10000000:08d}",
                full_name=key.split("@")[0],
                username=key.split("@")[0],
                role=body.role or "buyer",
                password="email_otp_auth_session"
            )
            user = auth_service.create_user(db, user_in=user_in)
    else:
        user = auth_service.get_by_phone(db, phone=key)
        if not user:
            user_in = UserCreate(
                email=f"{key}@hybrid.vn",
                phone=key,
                full_name=f"Khách Hàng {key[-4:]}",
                username=f"user_{key[-4:]}",
                role=body.role or "buyer",
                password="phone_otp_auth_session"
            )
            user = auth_service.create_user(db, user_in=user_in)

    user_data = UserResponse.model_validate(user).model_dump()
    return BaseResponse[dict](
        success=True,
        message="Xác thực OTP thành công! Đang chuyển hướng...",
        data={
            "user": user_data,
            "access_token": f"bearer_{'email' if is_email else 'phone'}_{user.id}_session_2026",
            "token_type": "bearer"
        }
    )


# ==============================================================
# XÁC THỰC GOOGLE OAUTH 2.0 THẬT (GOOGLE IDENTITY SERVICES)
# ==============================================================
@router.get(
    "/oauth/google/config",
    response_model=BaseResponse[dict],
    summary="Lấy cấu hình Client ID cho Google OAuth 2.0"
)
def get_google_oauth_config():
    return BaseResponse[dict](
        success=True,
        message="Lấy cấu hình Google OAuth thành công",
        data={
            "client_id": settings.GOOGLE_CLIENT_ID or "481928491823-hybridstore.apps.googleusercontent.com",
            "is_configured": bool(settings.GOOGLE_CLIENT_ID)
        }
    )


@router.post(
    "/oauth/google/verify-token",
    response_model=BaseResponse[dict],
    summary="Xác minh Token từ Google Identity Services và Đăng nhập"
)
def verify_google_oauth_token(body: GoogleTokenVerify, db: Session = Depends(get_db)):
    access_token = body.access_token

    google_user_info = None
    if access_token:
        try:
            req = urllib.request.Request("https://www.googleapis.com/oauth2/v3/userinfo")
            req.add_header("Authorization", f"Bearer {access_token}")
            with urllib.request.urlopen(req, timeout=10) as resp:
                google_user_info = json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            print(f"[Google OAuth] Không thể xác thực token với Google API: {e}")

    if not google_user_info or "email" not in google_user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token xác thực Google không hợp lệ hoặc đã hết hạn."
        )

    email = google_user_info["email"].strip().lower()
    full_name = google_user_info.get("name") or email.split("@")[0]
    avatar_url = google_user_info.get("picture")

    user = auth_service.get_by_email(db, email=email)
    if not user:
        user_in = UserCreate(
            email=email,
            phone="09" + f"{secrets.randbelow(90000000) + 10000000:08d}",
            full_name=full_name,
            username=email.split("@")[0],
            role=body.role or "buyer",
            avatar_url=avatar_url,
            password="google_oauth_verified_auth"
        )
        user = auth_service.create_user(db, user_in=user_in)

    user_data = UserResponse.model_validate(user).model_dump()
    return BaseResponse[dict](
        success=True,
        message=f"Đăng nhập tài khoản Google {email} thành công!",
        data={
            "user": user_data,
            "access_token": f"bearer_google_{user.id}_session_2026",
            "token_type": "bearer"
        }
    )


