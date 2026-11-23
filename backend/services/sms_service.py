"""
services/sms_service.py — Cổng Gửi Tin Nhắn SMS Thật Trực Tiếp Đến Thuê Bao Di Động
Hỗ trợ tích hợp cổng viễn thông Quốc tế (Twilio) và cổng viễn thông Việt Nam (eSMS.vn / SpeedSMS).
Sử dụng thư viện chuẩn urllib.request (zero dependency).
"""

import base64
import json
import urllib.request
import urllib.parse
from typing import Tuple
from core.config import settings


class SmsService:
    @staticmethod
    def format_e164_vietnam(phone: str) -> str:
        """Chuyển đổi số điện thoại Việt Nam sang định dạng E.164 (+84...)."""
        clean = "".join([c for c in phone if c.isdigit()])
        if clean.startswith("0") and len(clean) == 10:
            return "+84" + clean[1:]
        if clean.startswith("84") and len(clean) == 11:
            return "+" + clean
        if clean.startswith("+84"):
            return clean
        return "+84" + clean

    @classmethod
    def is_configured(cls) -> bool:
        """Kiểm tra xem hệ thống đã được cấu hình Cổng SMS (Twilio hoặc eSMS) hay chưa."""
        if settings.SMS_PROVIDER.lower() == "twilio":
            return bool(settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.TWILIO_FROM_NUMBER)
        if settings.SMS_PROVIDER.lower() == "esms":
            return bool(settings.ESMS_API_KEY and settings.ESMS_SECRET_KEY)
        return False

    @classmethod
    def send_otp_sms(cls, phone: str, otp_code: str) -> Tuple[bool, str]:
        """
        Gửi mã OTP trực tiếp vào sim điện thoại thật của người dùng qua Gateway viễn thông.
        """
        clean_phone = "".join([c for c in phone if c.isdigit()])
        message_body = f"[HYBRID.STORE] Ma xac thuc OTP cua ban la: {otp_code}. Hieu luc 3 phut. Khong chia se ma nay cho bat ky ai de bao ve tai khoan."

        if not cls.is_configured():
            print(f"[SmsService Warning] Chưa cấu hình cổng SMS (Twilio/eSMS) trong .env. Mã OTP cho {clean_phone} là {otp_code}")
            return False, "Hệ thống chưa kết nối tài khoản Cổng SMS (Twilio / eSMS). Vui lòng cấu hình TWILIO_ACCOUNT_SID hoặc ESMS_API_KEY trong .env để chuyển tiếp tin nhắn SMS đến thuê bao di động."

        provider = settings.SMS_PROVIDER.lower()
        if provider == "twilio":
            return cls._send_via_twilio(clean_phone, message_body)
        elif provider == "esms":
            return cls._send_via_esms(clean_phone, message_body)
        else:
            return False, f"Nhà cung cấp SMS '{settings.SMS_PROVIDER}' chưa được hỗ trợ."

    @classmethod
    def _send_via_twilio(cls, phone: str, body: str) -> Tuple[bool, str]:
        """Gửi SMS qua API của Twilio."""
        try:
            to_e164 = cls.format_e164_vietnam(phone)
            url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
            data = urllib.parse.urlencode({
                "To": to_e164,
                "From": settings.TWILIO_FROM_NUMBER,
                "Body": body
            }).encode("utf-8")

            req = urllib.request.Request(url, data=data, method="POST")
            auth_str = f"{settings.TWILIO_ACCOUNT_SID}:{settings.TWILIO_AUTH_TOKEN}"
            auth_b64 = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")
            req.add_header("Authorization", f"Basic {auth_b64}")

            with urllib.request.urlopen(req, timeout=12) as response:
                resp_json = json.loads(response.read().decode("utf-8"))
                sid = resp_json.get("sid", "unknown")
                print(f"✅ [SmsService - Twilio] Đã gửi SMS thành công tới {to_e164} (SID: {sid})")
                return True, f"Tin nhắn SMS bảo mật đã được gửi trực tiếp đến số thuê bao {phone}."
        except Exception as e:
            print(f"❌ [SmsService - Twilio Error] {e}")
            return False, f"Lỗi cổng SMS Twilio: {str(e)}"

    @classmethod
    def _send_via_esms(cls, phone: str, body: str) -> Tuple[bool, str]:
        """Gửi SMS qua API của eSMS.vn."""
        try:
            clean = "".join([c for c in phone if c.isdigit()])
            url = f"http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_get?Phone={clean}&Content={urllib.parse.quote(body)}&ApiKey={settings.ESMS_API_KEY}&SecretKey={settings.ESMS_SECRET_KEY}&SmsType=2"
            req = urllib.request.Request(url, method="GET")
            with urllib.request.urlopen(req, timeout=12) as response:
                resp_json = json.loads(response.read().decode("utf-8"))
                code = resp_json.get("CodeResult", "100")
                if code == "100":
                    print(f"✅ [SmsService - eSMS] Đã gửi SMS thành công tới {clean}")
                    return True, f"Tin nhắn SMS bảo mật đã được gửi trực tiếp đến số thuê bao {phone}."
                else:
                    return False, f"Cổng eSMS thông báo mã lỗi: {code}"
        except Exception as e:
            print(f"❌ [SmsService - eSMS Error] {e}")
            return False, f"Lỗi cổng eSMS: {str(e)}"


sms_service = SmsService()
