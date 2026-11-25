"""
services/email_service.py — Dịch Vụ Gửi Email Thật Qua Cổng REST API (Resend HTTPS Port 443) hoặc SMTP
Hỗ trợ Resend API (cổng 443 không bị chặn bởi Render Free) và SMTP truyền thống.
Sử dụng thư viện chuẩn urllib.request, smtplib và email.mime của Python.
Nguyen Huy Binh 25/11
"""

import json
import smtplib
import urllib.request
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Tuple
from core.config import settings


class EmailService:
    @staticmethod
    def is_configured() -> bool:
        """Kiểm tra xem hệ thống đã được cấu hình Cổng gửi Email (Resend API hoặc SMTP) hay chưa."""
        return bool(settings.RESEND_API_KEY or (settings.SMTP_USER and settings.SMTP_PASSWORD))

    @classmethod
    def _send_via_resend(cls, to_email: str, subject: str, html_content: str, text_content: str) -> Tuple[bool, str]:
        """Gửi email thật qua Resend REST API (cổng 443 HTTPS - không bao giờ bị Render chặn)."""
        try:
            url = "https://api.resend.com/emails"
            # Resend miễn phí chỉ cho phép gửi từ domain onboarding@resend.dev (trừ khi đã xác thực domain riêng).
            # Nếu người dùng vô tình đặt EMAIL_FROM là @gmail.com cá nhân, Resend sẽ trả về lỗi 403 Forbidden.
            # Do đó tự động chuẩn hóa người gửi để luôn thành công.
            sender = (settings.EMAIL_FROM or "").strip()
            if not sender or any(f in sender.lower() for f in ["@gmail.com", "@yahoo", "@hotmail", "@outlook"]):
                sender = "HYBRID.STORE Security <onboarding@resend.dev>"

            payload = {
                "from": sender,
                "to": [to_email],
                "subject": subject,
                "html": html_content,
                "text": text_content
            }
            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(url, data=data, method="POST")
            req.add_header("Authorization", f"Bearer {settings.RESEND_API_KEY}")
            req.add_header("Content-Type", "application/json")

            with urllib.request.urlopen(req, timeout=10) as resp:
                resp_json = json.loads(resp.read().decode("utf-8"))
                email_id = resp_json.get("id", "unknown")
                print(f"✅ [EmailService - Resend] Đã gửi email thành công tới {to_email} (ID: {email_id})")
                return True, f"Mã xác thực đã được gửi trực tiếp đến hộp thư {to_email} qua Resend."
        except urllib.error.HTTPError as e:
            try:
                err_body = e.read().decode("utf-8")
                err_json = json.loads(err_body)
                msg = err_json.get("message") or err_body
            except Exception:
                msg = str(e)
            print(f"❌ [EmailService - Resend HTTPError] {msg}")
            return False, f"Lỗi cổng gửi Email Resend: {msg}"
        except Exception as e:
            print(f"❌ [EmailService - Resend Error] {e}")
            return False, f"Lỗi cổng gửi Email Resend: {str(e)}"

    @classmethod
    def send_otp_email(cls, to_email: str, otp_code: str, user_name: str = "Quý khách") -> Tuple[bool, str]:
        """
        Gửi mã OTP xác minh khôi phục mật khẩu trực tiếp vào hòm thư Email thật của người dùng.
        """
        clean_email = to_email.strip().lower()
        subject = f"[HYBRID.STORE] Mã xác thực khôi phục tài khoản: {otp_code}"
        text_content = f"Kính gửi {user_name}, Mã xác thực khôi phục tài khoản HYBRID.STORE của bạn là: {otp_code}. Hiệu lực 5 phút."

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 20px; margin: 0; }}
            .container {{ max-width: 540px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }}
            .header {{ background: linear-gradient(135deg, #0284c7, #6366f1); padding: 24px; text-align: center; }}
            .header h1 {{ margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: 1px; }}
            .body {{ padding: 28px 24px; }}
            .greeting {{ font-size: 16px; font-weight: 600; color: #ffffff; margin-bottom: 12px; }}
            .text {{ font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 20px; }}
            .otp-box {{ background: #0f172a; border: 2px dashed #38bdf8; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0; }}
            .otp-code {{ font-family: monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; }}
            .alert {{ background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 12px; border-radius: 4px; font-size: 12px; color: #fca5a5; margin-top: 20px; }}
            .footer {{ background: #0f172a; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #334155; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>HYBRID.STORE SECURITY</h1>
            </div>
            <div class="body">
              <div class="greeting">Kính gửi {user_name},</div>
              <p class="text">
                Hệ thống bảo mật HYBRID.STORE vừa nhận được yêu cầu khôi phục mật khẩu cho tài khoản liên kết với địa chỉ email <strong>{clean_email}</strong>.
              </p>
              <div class="otp-box">
                <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 1px;">Mã xác minh bảo mật (OTP)</div>
                <div class="otp-code">{otp_code}</div>
              </div>
              <p class="text" style="font-size: 13px;">
                ⏱ Mã xác thực này có hiệu lực trong vòng <strong>5 phút</strong>.
              </p>
              <div class="alert">
                ⚠️ <strong>Cảnh báo an toàn:</strong> Tuyệt đối không chia sẻ mã này cho bất kỳ ai, kể cả nhân viên hỗ trợ của sàn. Nếu bạn không yêu cầu mã này, vui lòng bỏ qua thư hoặc đổi mật khẩu ngay lập tức.
              </div>
            </div>
            <div class="footer">
              © 2026 HYBRID.STORE E-Commerce Platform. Thư gửi tự động, vui lòng không phản hồi thư này.
            </div>
          </div>
        </body>
        </html>
        """

        if not cls.is_configured():
            print(f"[EmailService Warning] Chưa cấu hình RESEND_API_KEY hoặc SMTP_USER/PASSWORD trong .env. Mã OTP cho {clean_email} là {otp_code}")
            return False, "Chưa cấu hình Cổng gửi Email (RESEND_API_KEY hoặc Gmail App Password) trên máy chủ Render."

        # Ưu tiên gửi qua Resend API nếu có (cổng 443 HTTPS không bao giờ bị chặn)
        if settings.RESEND_API_KEY:
            return cls._send_via_resend(clean_email, subject, html_content, text_content)

        # Fallback gửi qua SMTP
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = settings.EMAIL_FROM or settings.SMTP_USER
            msg["To"] = clean_email

            text_part = MIMEText(text_content, "plain", "utf-8")
            html_part = MIMEText(html_content, "html", "utf-8")
            msg.attach(text_part)
            msg.attach(html_part)

            server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT, timeout=5)
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, clean_email, msg.as_string())
            server.quit()

            print(f"✅ [EmailService - SMTP] Đã gửi mã OTP thành công tới email {clean_email}")
            return True, f"Mã xác thực đã được gửi trực tiếp đến hộp thư {clean_email}."
        except Exception as e:
            print(f"❌ [EmailService Error] Không thể gửi email qua SMTP: {e}")
            return False, f"Lỗi máy chủ gửi email SMTP: {str(e)}"

    @classmethod
    def send_new_password_email(cls, to_email: str, new_password: str, user_name: str = "Quý khách") -> Tuple[bool, str]:
        """
        Gửi mật khẩu mới trực tiếp vào hộp thư Email thật của người dùng sau khi xác minh OTP thành công.
        """
        clean_email = to_email.strip().lower()
        subject = "[HYBRID.STORE] Mật khẩu mới cho tài khoản của bạn"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 20px; margin: 0; }}
            .container {{ max-width: 540px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden; }}
            .header {{ background: linear-gradient(135deg, #10b981, #0284c7); padding: 24px; text-align: center; }}
            .header h1 {{ margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; }}
            .body {{ padding: 28px 24px; }}
            .greeting {{ font-size: 16px; font-weight: 600; color: #ffffff; margin-bottom: 12px; }}
            .text {{ font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 20px; }}
            .pwd-box {{ background: #0f172a; border: 2px solid #10b981; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0; }}
            .pwd-code {{ font-family: monospace; font-size: 26px; font-weight: 800; letter-spacing: 2px; color: #34d399; }}
            .footer {{ background: #0f172a; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #334155; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>HYBRID.STORE CẤP MẬT KHẨU MỚI</h1>
            </div>
            <div class="body">
              <div class="greeting">Kính gửi {user_name},</div>
              <p class="text">
                Yêu cầu xác minh danh tính tài khoản <strong>{clean_email}</strong> đã thành công. Hệ thống đã tạo mật khẩu mới an toàn cho bạn:
              </p>
              <div class="pwd-box">
                <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px;">Mật khẩu mới của bạn</div>
                <div class="pwd-code">{new_password}</div>
              </div>
              <p class="text" style="font-size: 13px;">
                💡 <strong>Khuyến nghị:</strong> Bạn hãy sử dụng mật khẩu này để đăng nhập ngay, sau đó truy cập mục <strong>Hồ Sơ Cá Nhân</strong> để đổi lại mật khẩu cá nhân theo ý muốn.
              </p>
            </div>
            <div class="footer">
              © 2026 HYBRID.STORE E-Commerce Platform.
            </div>
          </div>
        </body>
        </html>
        """

        text_content = f"Kính gửi {user_name}, Mật khẩu mới của bạn trên HYBRID.STORE là: {new_password}. Vui lòng đăng nhập và đổi mật khẩu trong cài đặt."

        if not cls.is_configured():
            print(f"[EmailService Warning] Chưa cấu hình RESEND_API_KEY hoặc SMTP. Mật khẩu mới cho {clean_email} là {new_password}")
            return False, "Chưa cấu hình Cổng gửi Email (RESEND_API_KEY hoặc Gmail App Password) trên máy chủ."

        # Ưu tiên gửi qua Resend API nếu có
        if settings.RESEND_API_KEY:
            return cls._send_via_resend(clean_email, subject, html_content, text_content)

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = settings.EMAIL_FROM or settings.SMTP_USER
            msg["To"] = clean_email

            text_part = MIMEText(text_content, "plain", "utf-8")
            html_part = MIMEText(html_content, "html", "utf-8")
            msg.attach(text_part)
            msg.attach(html_part)

            server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT, timeout=5)
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, clean_email, msg.as_string())
            server.quit()

            print(f"✅ [EmailService - SMTP] Đã gửi mật khẩu mới thành công tới email {clean_email}")
            return True, f"Mật khẩu mới đã được gửi trực tiếp đến hộp thư {clean_email}."
        except Exception as e:
            print(f"❌ [EmailService Error] Không thể gửi mật khẩu mới qua SMTP: {e}")
            return False, f"Lỗi gửi email: {str(e)}"


email_service = EmailService()
