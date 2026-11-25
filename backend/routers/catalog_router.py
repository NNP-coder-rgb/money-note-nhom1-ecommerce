"""
routers/catalog_router.py — API Endpoints Danh Mục, Thương Hiệu & Sản Phẩm (Mall & C2C)
Nguyen Tien Dat
"""

from typing import Optional, List, Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.database import get_db
from schemas.common import BaseResponse, PaginatedResponse
from schemas.catalog import (
    CategoryResponse, BrandResponse,
    ProductCreate, ProductUpdate, ProductResponse, ProductDetailResponse
)
from services.catalog_service import catalog_service

router = APIRouter(tags=["Catalog & Products (Danh mục, Thương hiệu & Sản phẩm)"])


# ==============================================================
# DANH MỤC SẢN PHẨM (CATEGORIES)
# ==============================================================
@router.get(
    "/categories",
    response_model=BaseResponse[List[CategoryResponse]],
    summary="Lấy danh mục sản phẩm đang kích hoạt"
)
def get_categories(db: Session = Depends(get_db)):
    categories = catalog_service.get_categories(db)
    return BaseResponse[List[CategoryResponse]](
        success=True,
        message="Lấy danh sách danh mục thành công",
        data=categories
    )


@router.get(
    "/categories/{id_or_slug}",
    response_model=BaseResponse[CategoryResponse],
    summary="Lấy chi tiết danh mục theo ID hoặc slug"
)
def get_category(id_or_slug: str, db: Session = Depends(get_db)):
    cat = catalog_service.get_category_by_id_or_slug(db, id_or_slug)
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy danh mục '{id_or_slug}'")
    return BaseResponse[CategoryResponse](
        success=True,
        message="Lấy thông tin danh mục thành công",
        data=cat
    )


# ==============================================================
# THƯƠNG HIỆU CHÍNH HÃNG (BRANDS)
# ==============================================================
@router.get(
    "/brands",
    response_model=BaseResponse[List[BrandResponse]],
    summary="Lấy danh sách thương hiệu chính hãng (Brand Mall)"
)
def get_brands(db: Session = Depends(get_db)):
    brands = catalog_service.get_brands(db)
    return BaseResponse[List[BrandResponse]](
        success=True,
        message="Lấy danh sách thương hiệu thành công",
        data=brands
    )


# ==============================================================
# SẢN PHẨM (PRODUCTS: MALL & C2C)
# ==============================================================
@router.get(
    "/products",
    response_model=PaginatedResponse[ProductResponse],
    summary="Lấy danh sách sản phẩm (Hỗ trợ đa bộ lọc & phân trang)"
)
def get_products(
    page: Annotated[int, Query(ge=1, description="Số thứ tự trang")] = 1,
    limit: Annotated[int, Query(ge=1, le=100, description="Số lượng sản phẩm mỗi trang")] = 20,
    category: Annotated[Optional[str], Query(description="Slug danh mục sản phẩm")] = None,
    brand_id: Annotated[Optional[int], Query(description="ID thương hiệu")] = None,
    product_type: Annotated[Optional[str], Query(alias="type", description="Phân loại: mall hoặc c2c")] = None,
    condition_min: Annotated[Optional[int], Query(description="Tình trạng tối thiểu: ví dụ 95, 99, 100")] = None,
    min_price: Annotated[Optional[int], Query(description="Giá bán từ (VNĐ)")] = None,
    max_price: Annotated[Optional[int], Query(description="Giá bán đến (VNĐ)")] = None,
    is_flash_sale: Annotated[Optional[bool], Query(description="Lọc sản phẩm Flash Sale chớp nhoáng")] = None,
    search: Annotated[Optional[str], Query(description="Từ khóa tìm kiếm theo tên, mô tả")] = None,
    seller_id: Annotated[Optional[int], Query(description="Lọc sản phẩm theo người bán")] = None,
    db: Session = Depends(get_db)
):
    skip = (page - 1) * limit
    products, total = catalog_service.get_products(
        db,
        skip=skip,
        limit=limit,
        category_slug=category,
        brand_id=brand_id,
        product_type=product_type,
        condition_min=condition_min,
        min_price=min_price,
        max_price=max_price,
        is_flash_sale=is_flash_sale,
        search=search,
        seller_id=seller_id
    )
    return PaginatedResponse[ProductResponse](
        success=True,
        message="Lấy danh sách sản phẩm thành công",
        data=products,
        total=total,
        page=page,
        limit=limit
    )


@router.get(
    "/products/flash-sale",
    response_model=BaseResponse[List[ProductResponse]],
    summary="Lấy danh sách sản phẩm Flash Sale chớp nhoáng"
)
def get_flash_sale_products(db: Session = Depends(get_db)):
    products, _ = catalog_service.get_products(db, skip=0, limit=20, is_flash_sale=True)
    return BaseResponse[List[ProductResponse]](
        success=True,
        message="Lấy danh sách Flash Sale thành công",
        data=products
    )


@router.get(
    "/products/{identifier}",
    response_model=BaseResponse[ProductDetailResponse],
    summary="Chi tiết sản phẩm (kèm ảnh, thông số kỹ thuật specs và thương hiệu)"
)
def get_product_detail(identifier: str, db: Session = Depends(get_db)):
    product = catalog_service.get_product_by_id_or_slug(db, identifier)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy sản phẩm '{identifier}'"
        )
    return BaseResponse[ProductDetailResponse](
        success=True,
        message="Lấy chi tiết sản phẩm thành công",
        data=product
    )


@router.post(
    "/products",
    response_model=BaseResponse[ProductResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Đăng bán sản phẩm mới (Hỗ trợ người bán C2C và Mall)"
)
def create_product(
    prod_in: ProductCreate,
    images: Optional[List[str]] = None,
    db: Session = Depends(get_db)
):
    product = catalog_service.create_product(db, prod_in=prod_in, images=images)
    return BaseResponse[ProductResponse](
        success=True,
        message="Đăng bán sản phẩm thành công",
        data=product
    )


@router.put(
    "/products/{product_id}",
    response_model=BaseResponse[ProductResponse],
    summary="Cập nhật thông tin sản phẩm"
)
def update_product(
    product_id: int,
    prod_in: ProductUpdate,
    db: Session = Depends(get_db)
):
    product = catalog_service.update_product(db, product_id, prod_in)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy sản phẩm cần cập nhật")
    return BaseResponse[ProductResponse](
        success=True,
        message="Cập nhật thông tin sản phẩm thành công",
        data=product
    )


@router.delete(
    "/products/{product_id}",
    response_model=BaseResponse[dict],
    summary="Xóa sản phẩm"
)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    success = catalog_service.delete_product(db, product_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy sản phẩm cần xóa")
    return BaseResponse[dict](
        success=True,
        message="Xóa sản phẩm thành công",
        data={"deleted_product_id": product_id}
    )
