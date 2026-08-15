-- =============================================================================
-- 상품옵션 값ID 컬럼명 표준화 (2026-08-16)
--
--   prod_opt_id_1      → prod_opt1_id
--   prod_opt_id_2      → prod_opt2_id
--   new_prod_opt_id_1  → new_prod_opt1_id
--   new_prod_opt_id_2  → new_prod_opt2_id
--
-- 대상: 7개 테이블 16개 컬럼 + 인덱스 1개. 뷰/제약 참조 없음(확인 완료).
-- 데이터 이동 없음 — RENAME COLUMN 이므로 값/타입/인덱스 내용은 그대로 유지된다.
--
-- 주의: 이 스키마 변경은 Entity @Column(name=...) 및 QueryDSL Q클래스와 1:1 대응이므로
--       애플리케이션 재배포(clean build)와 함께 적용해야 한다.
-- =============================================================================

ALTER TABLE shopjoy_2604.od_cart       RENAME COLUMN prod_opt_id_1     TO prod_opt1_id;
ALTER TABLE shopjoy_2604.od_cart       RENAME COLUMN prod_opt_id_2     TO prod_opt2_id;

ALTER TABLE shopjoy_2604.od_claim_item RENAME COLUMN prod_opt_id_1     TO prod_opt1_id;
ALTER TABLE shopjoy_2604.od_claim_item RENAME COLUMN prod_opt_id_2     TO prod_opt2_id;
ALTER TABLE shopjoy_2604.od_claim_item RENAME COLUMN new_prod_opt_id_1 TO new_prod_opt1_id;
ALTER TABLE shopjoy_2604.od_claim_item RENAME COLUMN new_prod_opt_id_2 TO new_prod_opt2_id;

ALTER TABLE shopjoy_2604.od_dliv_item  RENAME COLUMN prod_opt_id_1     TO prod_opt1_id;
ALTER TABLE shopjoy_2604.od_dliv_item  RENAME COLUMN prod_opt_id_2     TO prod_opt2_id;

ALTER TABLE shopjoy_2604.od_order_item RENAME COLUMN prod_opt_id_1     TO prod_opt1_id;
ALTER TABLE shopjoy_2604.od_order_item RENAME COLUMN prod_opt_id_2     TO prod_opt2_id;

ALTER TABLE shopjoy_2604.pd_prod_img   RENAME COLUMN prod_opt_id_1     TO prod_opt1_id;
ALTER TABLE shopjoy_2604.pd_prod_img   RENAME COLUMN prod_opt_id_2     TO prod_opt2_id;

ALTER TABLE shopjoy_2604.pd_prod_sku   RENAME COLUMN prod_opt_id_1     TO prod_opt1_id;
ALTER TABLE shopjoy_2604.pd_prod_sku   RENAME COLUMN prod_opt_id_2     TO prod_opt2_id;

ALTER TABLE shopjoy_2604.st_settle_raw RENAME COLUMN prod_opt_id_1     TO prod_opt1_id;
ALTER TABLE shopjoy_2604.st_settle_raw RENAME COLUMN prod_opt_id_2     TO prod_opt2_id;

-- 인덱스명도 컬럼명 규칙에 맞춰 정합
ALTER INDEX shopjoy_2604.pd_prod_img_ix01_prod_id_prod_opt_id_1_x3
      RENAME TO pd_prod_img_ix01_prod_id_prod_opt1_id_x3;
