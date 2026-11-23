"""
schemas/escrow.py — Pydantic Schemas Cho Ví Ký Quỹ Escrow & Sổ Cái 24/7
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class EscrowTransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    wallet_id: int
    order_id: Optional[int] = None
    transaction_code: str
    transaction_type: str
    amount: int
    balance_after: int
    memo: str
    status: str
    created_at: datetime


class EscrowWalletResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    available_balance: int
    locked_balance: int
    total_withdrawn: int
    transactions: List[EscrowTransactionResponse] = Field(default_factory=list)


class WithdrawalRequest(BaseModel):
    amount: int = Field(..., gt=50000, description="Số tiền muốn rút (tối thiểu 50.000 VNĐ)")
    bank_account_id: int
    note: Optional[str] = ""
