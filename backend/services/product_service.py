"""
services/product_service.py — Lớp Xử Lý Nghiệp Vụ & Truy Vấn CRUD Cho Product
Nguyen Tien Dat
"""

from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_

from models.catalog import Product
from schemas.product import ProductCreate, ProductUpdate


class ProductService:
    @staticmethod
    def get_by_id(db: Session, product_id: int) -> Optional[Product]:
        return db.query(Product).filter(Product.id == product_id).first()

    @staticmethod
    def get_by_slug(db: Session, slug: str) -> Optional[Product]:
        return db.query(Product).filter(Product.slug == slug).first()

    @staticmethod
    def get_products(
        db: Session,
        skip: int = 0,
        limit: int = 20,
        product_type: Optional[str] = None,
        search: Optional[str] = None
    ) -> Tuple[List[Product], int]:
        query = db.query(Product).filter(Product.is_active == True)

        if product_type:
            query = query.filter(Product.product_type == product_type)

        if search:
            kw = f"%{search}%"
            query = query.filter(or_(Product.name.ilike(kw), Product.description.ilike(kw)))

        total = query.count()
        products = query.order_by(Product.id.desc()).offset(skip).limit(limit).all()
        return products, total

    @staticmethod
    def create_product(db: Session, prod_in: ProductCreate) -> Product:
        db_prod = Product(**prod_in.model_dump())
        db.add(db_prod)
        db.commit()
        db.refresh(db_prod)
        return db_prod

    @staticmethod
    def update_product(db: Session, product_id: int, prod_in: ProductUpdate) -> Optional[Product]:
        db_prod = db.query(Product).filter(Product.id == product_id).first()
        if not db_prod:
            return None

        for key, value in prod_in.model_dump(exclude_unset=True).items():
            setattr(db_prod, key, value)

        db.commit()
        db.refresh(db_prod)
        return db_prod

    @staticmethod
    def delete_product(db: Session, product_id: int) -> bool:
        db_prod = db.query(Product).filter(Product.id == product_id).first()
        if not db_prod:
            return False

        db.delete(db_prod)
        db.commit()
        return True


product_service = ProductService()
