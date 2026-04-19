# erd/ ERD 다이어그램

## 목적
전자상거래 시스템 전체 도메인의 ERD(Entity-Relationship Diagram) 산출물 보관.

## 도메인 구분
- **ec/** — 전자상거래 도메인 (회원/상품/주문/클레임/배송/전시/프로모션/정산)
- **sy/** — 시스템 도메인 (사이트/코드/브랜드/업체/사용자/부서/권한/메뉴/첨부)

## DDL 기준
- `_doc/ddlPgsql-ec-*/` — EC 도메인 DDL
- `_doc/ddlPgsql-sy/` — SY 도메인 DDL
- 기본 스키마: `shopjoy_2604` (PostgreSQL)
