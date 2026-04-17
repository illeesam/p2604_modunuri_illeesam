# ec-pd/ 상품 도메인 DDL

## 테이블 목록
- `pd_category` — 카테고리 (3단계 계층: depth 1/2/3, parent_cate_id 자기참조)
- `pd_tag` — 태그 마스터
- `pd_prod` — 상품 마스터 (PK: prod_id)
- `pd_prod_content` — 상품 상세 HTML/에디터 내용
- `pd_prod_img` — 상품 이미지 (sort_no 순서)
- `pd_prod_tag` — 상품-태그 연결
- `pd_prod_opt_grp` — 옵션그룹 (opt_grp_level: 1단/2단)
- `pd_prod_opt` — 옵션값 (FK: prod_id + opt_grp_id)
- `pd_prod_opt_sku` — SKU (옵션 조합, 재고/가격 단위)
- `pd_review` — 구매 리뷰 (FK: order_item_id, 1건당 1리뷰)
- `pd_review_attach` — 리뷰 첨부파일
- `pd_review_comment` — 리뷰 댓글
- `pd_prod_status_hist` — 상품 상태 이력
- `pd_prod_chg_hist` — 상품 변경 이력
- `pd_prod_content_chg_hist` — 상품 내용 변경 이력
- `pd_prod_opt_sku_chg_hist` — SKU 변경 이력
- `pd_prod_view_log` — 상품 조회 로그 *(log 예외)*

## 상태 코드
- `prod_status_cd`: DRAFT / ACTIVE / INACTIVE / DELETED

## 옵션 구조
- 1단 옵션: opt_grp 1개 → opt 여러 개 → sku 1:1
- 2단 옵션: opt_grp 2개 → 조합으로 sku 생성

## 관련 정책서
- `_doc/정책서ec/pd.01.카테고리.md`
- `_doc/정책서ec/pd.02.상품.md`
