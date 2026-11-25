"""
services/catalog_service.py — Nghiệp vụ Danh mục, Thương hiệu, Sản phẩm & Thư viện ảnh
Nguyen Tien Dat
"""

from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_

from models.catalog import Category, Brand, Product, ProductImage, ProductSpec
from schemas.catalog import ProductCreate, ProductUpdate


class CatalogService:
    # --- Categories ---
    @staticmethod
    def get_categories(db: Session) -> List[Category]:
        return db.query(Category).filter(Category.is_active == True).order_by(Category.display_order).all()

    @staticmethod
    def get_category_by_id_or_slug(db: Session, identifier: str) -> Optional[Category]:
        if identifier.isdigit():
            return db.query(Category).filter(Category.id == int(identifier)).first()
        return db.query(Category).filter(Category.slug == identifier).first()

    # --- Brands ---
    @staticmethod
    def get_brands(db: Session) -> List[Brand]:
        return db.query(Brand).order_by(Brand.name).all()

    # --- Products ---
    @staticmethod
    def get_products(
        db: Session,
        skip: int = 0,
        limit: int = 20,
        category_slug: Optional[str] = None,
        brand_id: Optional[int] = None,
        product_type: Optional[str] = None,
        condition_min: Optional[int] = None,
        min_price: Optional[int] = None,
        max_price: Optional[int] = None,
        is_flash_sale: Optional[bool] = None,
        search: Optional[str] = None,
        seller_id: Optional[int] = None
    ) -> Tuple[List[Product], int]:
        q = db.query(Product).filter(Product.is_active == True)

        if seller_id:
            q = q.filter(Product.seller_id == seller_id)

        if category_slug:
            cat = db.query(Category).filter(Category.slug == category_slug).first()
            if cat:
                q = q.filter(Product.category_id == cat.id)

        if brand_id:
            q = q.filter(Product.brand_id == brand_id)

        if product_type:
            q = q.filter(Product.product_type == product_type)

        if condition_min is not None:
            q = q.filter(Product.condition_pct >= condition_min)

        if min_price is not None:
            q = q.filter(Product.selling_price >= min_price)

        if max_price is not None:
            q = q.filter(Product.selling_price <= max_price)

        if is_flash_sale is not None:
            q = q.filter(Product.is_flash_sale == is_flash_sale)

        if search:
            kw = f"%{search}%"
            q = q.filter(or_(Product.name.ilike(kw), Product.short_name.ilike(kw), Product.description.ilike(kw)))

        total = q.count()
        products = q.order_by(Product.id.desc()).offset(skip).limit(limit).all()
        return products, total

    @staticmethod
    def get_product_by_id_or_slug(db: Session, identifier: str) -> Optional[Product]:
        if identifier.isdigit():
            return db.query(Product).filter(Product.id == int(identifier)).first()
        return db.query(Product).filter(or_(Product.slug == identifier, Product.sku == identifier)).first()

    @staticmethod
    def create_product(db: Session, prod_in: ProductCreate, images: List[str] = None, specs: List[Dict[str, str]] = None) -> Product:
        db_prod = Product(**prod_in.model_dump())
        db.add(db_prod)
        db.flush()

        # Thêm ảnh
        if images:
            for idx, img_url in enumerate(images):
                img = ProductImage(product_id=db_prod.id, image_url=img_url, display_order=idx, is_cover=(idx == 0))
                db.add(img)
        else:
            img = ProductImage(product_id=db_prod.id, image_url=db_prod.thumbnail_url, display_order=0, is_cover=True)
            db.add(img)

        # Thêm thông số kỹ thuật
        if specs:
            for idx, sp in enumerate(specs):
                spec = ProductSpec(
                    product_id=db_prod.id,
                    group_name=sp.get("group", "Cấu hình chung"),
                    spec_key=sp.get("key", ""),
                    spec_value=sp.get("value", ""),
                    display_order=idx
                )
                db.add(spec)

        db.commit()
        db.refresh(db_prod)
        return db_prod

    @staticmethod
    def update_product(db: Session, product_id: int, prod_in: ProductUpdate) -> Optional[Product]:
        db_prod = db.query(Product).filter(Product.id == product_id).first()
        if not db_prod:
            return None

        for k, v in prod_in.model_dump(exclude_unset=True).items():
            setattr(db_prod, k, v)

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


catalog_service = CatalogService()
product_service = catalog_service
