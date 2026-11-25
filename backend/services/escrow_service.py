"""
services/escrow_service.py — Nghiệp vụ Ví Ký Quỹ Escrow & Sổ Cái 24/7
Task T41: Ký quỹ escrow & Trọng tài tranh chấp (Chu Đình Minh)
"""

import uuid
from typing import List, Optional, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from models.escrow import EscrowWallet, EscrowTransaction
from models.order import Order


class EscrowService:
    @staticmethod
    def get_or_create_wallet(db: Session, user_id: int) -> EscrowWallet:
        wallet = db.query(EscrowWallet).filter(EscrowWallet.user_id == user_id).first()
        if not wallet:
            wallet = EscrowWallet(
                user_id=user_id,
                available_balance=0,
                locked_balance=0,
                total_withdrawn=0
            )
            db.add(wallet)
            db.commit()
            db.refresh(wallet)
        return wallet

    @staticmethod
    def get_wallet(db: Session, user_id: int) -> EscrowWallet:
        return EscrowService.get_or_create_wallet(db, user_id)

    @staticmethod
    def hold_order_funds(db: Session, seller_id: int, order_id: int, amount: int) -> EscrowTransaction:
        wallet = EscrowService.get_or_create_wallet(db, seller_id)
        wallet.locked_balance += amount

        tx_code = f"TX-HOLD-{uuid.uuid4().hex[:8].upper()}"
        tx = EscrowTransaction(
            wallet_id=wallet.id,
            order_id=order_id,
            transaction_code=tx_code,
            transaction_type="hold_order",
            amount=amount,
            balance_after=wallet.available_balance + wallet.locked_balance,
            memo=f"Tạm giữ tiền thanh toán đơn hàng #{order_id} trong Escrow",
            status="completed"
        )
        db.add(tx)
        db.commit()
        db.refresh(tx)
        return tx

    @staticmethod
    def release_payout(db: Session, seller_id: int, order_id: int, amount: int) -> EscrowTransaction:
        wallet = EscrowService.get_or_create_wallet(db, seller_id)
        if wallet.locked_balance >= amount:
            wallet.locked_balance -= amount
        wallet.available_balance += amount

        tx_code = f"TX-PAY-{uuid.uuid4().hex[:8].upper()}"
        tx = EscrowTransaction(
            wallet_id=wallet.id,
            order_id=order_id,
            transaction_code=tx_code,
            transaction_type="release_payout",
            amount=amount,
            balance_after=wallet.available_balance,
            memo=f"Giải ngân doanh thu hoàn tất đơn hàng #{order_id} vào số dư khả dụng",
            status="completed"
        )
        db.add(tx)
        db.commit()
        db.refresh(tx)
        return tx

    @staticmethod
    def request_withdrawal(db: Session, user_id: int, amount: int, bank_account_id: int, note: str = "") -> EscrowTransaction:
        wallet = EscrowService.get_or_create_wallet(db, user_id)
        if wallet.available_balance < amount:
            raise ValueError("Số dư khả dụng không đủ để thực hiện rút tiền")

        wallet.available_balance -= amount
        wallet.total_withdrawn += amount

        tx_code = f"TX-WDR-{uuid.uuid4().hex[:8].upper()}"
        tx = EscrowTransaction(
            wallet_id=wallet.id,
            transaction_code=tx_code,
            transaction_type="withdrawal",
            amount=-amount,
            balance_after=wallet.available_balance,
            memo=f"Rút tiền về tài khoản ngân hàng liên kết #{bank_account_id}. {note}",
            status="completed"
        )
        db.add(tx)
        db.commit()
        db.refresh(tx)
        return tx


escrow_service = EscrowService()
