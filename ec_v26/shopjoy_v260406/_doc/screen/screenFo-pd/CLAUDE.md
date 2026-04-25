# screenFo-pd/ 사용자 페이스 화면 — 상품(PD)

## 화면 목록
- `index.html` — 상품 화면 목록 인덱스
- `fo-prod-list.html` — 상품목록 (카테고리/검색/필터/정렬)
- `fo-prod-view.html` — 상품상세 (이미지/옵션선택/리뷰/문의)
- `fo-prod-review.html` — 리뷰 작성/조회

## 관련 사용자 컴포넌트
FRONT_SITE_NO에 따라 동적 로드:
- `pages/Prod{NO}List.js` — 상품목록 (01/02/03)
- `pages/Prod{NO}View.js` — 상품상세 (01/02/03)

## 진입점
`index.html` 해시 라우팅: `#page=prodList`, `#page=prodView&pid={prodId}`

## 옵션 구조
- 1단 옵션: 단일 선택그룹 → SKU 결정
- 2단 옵션: 색상+사이즈 등 복합 선택 → SKU 결정
- SKU별 재고/가격 표시

## 관련 DDL
- `_doc/ddlPgsql-ec-pd/pd_prod.sql`, `pd_prod_opt.sql`, `pd_prod_sku.sql`
