"""
services/order_service.py — Nghiệp vụ Đơn Hàng & Phân Tách Kiện Multi-Vendor
"""

import uuid
from typing import List, Optional, Tuple, Dict
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from models.order import Order, OrderParcel, OrderItem, OrderTrackingEvent
from models.catalog import Product
from models.voucher import Voucher
from schemas.order import OrderCreate, OrderUpdate


class OrderService:
    @staticmethod
    def get_by_id(db: Session, order_id: int) -> Optional[Order]:
        return db.query(Order).filter(Order.id == order_id).first()

    @staticmethod
    def get_by_code(db: Session, order_code: str) -> Optional[Order]:
        return db.query(Order).filter(Order.order_code == order_code).first()

    @staticmethod
    def get_by_id_or_code(db: Session, identifier: str) -> Optional[Order]:
        if identifier.isdigit():
            return OrderService.get_by_id(db, int(identifier))
        return OrderService.get_by_code(db, identifier)

    @staticmethod
    def get_orders(
        db: Session,
        buyer_id: Optional[int] = None,
        seller_id: Optional[int] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ) -> Tuple[List[Order], int]:
        q = db.query(Order)

        if buyer_id:
            q = q.filter(Order.buyer_id == buyer_id)

        if seller_id:
            # Lọc các đơn có kiện hàng của seller
            q = q.join(OrderParcel).filter(OrderParcel.seller_id == seller_id)

        if status:
            q = q.filter(Order.status == status)

        total = q.count()
        orders = q.order_by(Order.id.desc()).offset(skip).limit(limit).all()
        return orders, total

    @staticmethod
    def create_order(db: Session, buyer_id: int, order_in: OrderCreate) -> Order:
        order_code = f"ORD-{uuid.uuid4().hex[:8].upper()}"

        # 1. Tính tổng tiền sản phẩm
        subtotal = sum(item.unit_price * item.quantity for item in order_in.items)

        # 2. Xử lý Voucher nếu có
        discount_amount = 0
        voucher_id = None
        if order_in.voucher_code:
            v = db.query(Voucher).filter(Voucher.code == order_in.voucher_code.upper()).first()
            if v and v.is_active:
                voucher_id = v.id
                if v.voucher_type == "percent":
                    discount_amount = int(subtotal * (v.discount_value / 100))
                    if v.max_discount_amount:
                        discount_amount = min(discount_amount, v.max_discount_amount)
                else:
                    discount_amount = v.discount_value
                v.usage_count += 1

        total_amount = max(0, subtotal + order_in.shipping_fee - discount_amount)

        # 3. Tạo Đơn hàng trung tâm
        order = Order(
            order_code=order_code,
            buyer_id=buyer_id,
            subtotal=subtotal,
            shipping_fee=order_in.shipping_fee,
            discount_amount=discount_amount,
            total_amount=total_amount,
            voucher_id=voucher_id,
            payment_method=order_in.payment_method,
            payment_status="paid" if order_in.payment_method in ("VIETQR", "CARD") else "unpaid",
            shipping_method=order_in.shipping_method,
            recipient_name=order_in.recipient_name,
            recipient_phone=order_in.recipient_phone,
            shipping_address=order_in.shipping_address,
            buyer_note=order_in.buyer_note or "",
            vat_requested=order_in.vat_requested,
            vat_company_name=order_in.vat_company_name or "",
            vat_tax_code=order_in.vat_tax_code or "",
            status="pending",
            step_index=1
        )
        db.add(order)
        db.flush()

        # 4. Phân nhóm sản phẩm theo người bán (Multi-Vendor Split Parcels)
        seller_items: Dict[int, List] = {}
        for it in order_in.items:
            prod = db.query(Product).filter(Product.id == it.product_id).first()
            s_id = prod.seller_id if prod else 1
            if s_id not in seller_items:
                seller_items[s_id] = []
            seller_items[s_id].append((it, prod))

        # 5. Tạo kiện hàng (OrderParcel) & Items & Tracking Event
        now = datetime.now()
        for s_id, items_list in seller_items.items():
            parcel_code = f"PKG-{uuid.uuid4().hex[:6].upper()}"
            tracking_code = f"GHN{uuid.uuid4().hex[:9].upper()}VN"

            parcel = OrderParcel(
                order_id=order.id,
                seller_id=s_id,
                parcel_code=parcel_code,
                carrier_name="Giao Hàng Nhanh (GHN)",
                tracking_code=tracking_code,
                shipping_fee=int(order_in.shipping_fee / max(1, len(seller_items))),
                estimated_delivery=(now + timedelta(days=2)).strftime("%d/%m/%Y"),
                status="processing"
            )
            db.add(parcel)
            db.flush()

            # Tạo OrderItems
            for it, prod in items_list:
                item = OrderItem(
                    order_id=order.id,
                    parcel_id=parcel.id,
                    product_id=it.product_id,
                    product_name=it.product_name,
                    product_type=it.product_type or (prod.product_type if prod else "c2c"),
                    condition_pct=it.condition_pct or (prod.condition_pct if prod else 100),
                    unit_price=it.unit_price,
                    quantity=it.quantity,
                    total_price=it.unit_price * it.quantity,
                    thumbnail_url=it.thumbnail_url or (prod.thumbnail_url if prod else "")
                )
                db.add(item)

                # Giảm tồn kho sản phẩm
                if prod and prod.stock_quantity >= it.quantity:
                    prod.stock_quantity -= it.quantity

            # Sự kiện hành trình ban đầu
            event = OrderTrackingEvent(
                parcel_id=parcel.id,
                status_title="Đơn hàng được khởi tạo",
                status_description="Đơn hàng đã được xác nhận thành công trên sàn TMĐT Hybrid Store.",
                location="Hà Nội",
                event_time=now
            )
            db.add(event)

        db.commit()
        db.refresh(order)
        return order

    @staticmethod
    def update_order_status(db: Session, order_id: int, order_in: OrderUpdate) -> Optional[Order]:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return None

        if order_in.status:
            order.status = order_in.status
            if order_in.status == "completed":
                order.completed_at = datetime.now()
                order.step_index = 4
            elif order_in.status == "shipping":
                order.step_index = 3
            elif order_in.status == "confirmed":
                order.step_index = 2
            elif order_in.status == "cancelled":
                order.cancelled_at = datetime.now()
                order.cancel_reason = order_in.cancel_reason or "Khách hàng hủy đơn"

        if order_in.payment_status:
            order.payment_status = order_in.payment_status

        db.commit()
        db.refresh(order)
        return order


order_service = OrderService()
