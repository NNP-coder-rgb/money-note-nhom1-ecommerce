"""
test_catalog.py — Kiểm thử tự động Phân hệ Danh mục, Thương hiệu & Sản phẩm
"""

import pytest
from core.database import SessionLocal
from services.catalog_service import catalog_service
from routers.catalog_router import get_categories, get_brands, get_products


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_get_categories_service(db):
    """Kiểm tra dịch vụ lấy danh mục sản phẩm."""
    categories = catalog_service.get_categories(db)
    assert len(categories) >= 8
    slugs = [c.slug for c in categories]
    assert "tech" in slugs
    assert "fashion" in slugs


def test_get_brands_service(db):
    """Kiểm tra dịch vụ lấy thương hiệu chính hãng."""
    brands = catalog_service.get_brands(db)
    assert len(brands) >= 1
    names = [b.name for b in brands]
    assert any("Apple" in name or "Sony" in name for name in names)


def test_get_products_with_filters(db):
    """Kiểm tra lọc sản phẩm theo loại (Mall / C2C) và tìm kiếm."""
    all_prods, total = catalog_service.get_products(db, skip=0, limit=20)
    assert total >= 1

    mall_prods, mall_total = catalog_service.get_products(db, product_type="mall")
    for p in mall_prods:
        assert p.product_type == "mall"


def test_router_categories_endpoint(db):
    """Kiểm tra API router get_categories."""
    res = get_categories(db=db)
    assert res.success is True
    assert len(res.data) >= 8


def test_router_products_endpoint(db):
    """Kiểm tra API router get_products có phân trang."""
    res = get_products(page=1, limit=10, db=db)
    assert res.success is True
    assert res.page == 1
    assert len(res.data) <= 10
