"""
routers/product_router.py — API Endpoints Quản Lý Sản Phẩm (Products)
Nguyen Tien Dat
"""

from typing import Optional, Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.database import get_db
from schemas.common import BaseResponse, PaginatedResponse
from schemas.product import ProductCreate, ProductUpdate, ProductResponse
from services.product_service import product_service

router = APIRouter(prefix="/products", tags=["Products (Sản phẩm)"])


@router.get("/", response_model=PaginatedResponse[ProductResponse], summary="Lấy danh sách sản phẩm")
def get_products(
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    type: Annotated[Optional[str], Query(description="mall hoặc c2c")] = None,
    search: Annotated[Optional[str], Query(description="Tìm theo tên")] = None,
    db: Session = Depends(get_db)
):
    skip = (page - 1) * limit
    products, total = product_service.get_products(db, skip=skip, limit=limit, product_type=type, search=search)
    return PaginatedResponse[ProductResponse](
        success=True,
        message="Lấy danh sách sản phẩm thành công",
        data=products,
        total=total,
        page=page,
        limit=limit
    )


@router.get("/{product_id}", response_model=BaseResponse[ProductResponse], summary="Chi tiết sản phẩm")
def get_product(product_id: int, db: Session = Depends(get_db)):
    prod = product_service.get_by_id(db, product_id)
    if not prod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy sản phẩm #{product_id}")
    return BaseResponse[ProductResponse](success=True, message="Lấy chi tiết sản phẩm thành công", data=prod)


@router.post("/", response_model=BaseResponse[ProductResponse], status_code=status.HTTP_201_CREATED, summary="Đăng bán sản phẩm")
def create_product(prod_in: ProductCreate, db: Session = Depends(get_db)):
    new_prod = product_service.create_product(db, prod_in)
    return BaseResponse[ProductResponse](success=True, message="Đăng tải sản phẩm thành công", data=new_prod)
