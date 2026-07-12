-- pd_prod_opt_type 테이블 DDL
-- 상품 옵션 유형 (색상, 사이즈 등 옵션 차원 축 정의)
-- 구 테이블명: pd_prod_opt (2026-07-12 rename)

CREATE TABLE shopjoy_2604.pd_prod_opt_type (
    prod_opt_type_id   VARCHAR(21) NOT NULL PRIMARY KEY,
    site_id            VARCHAR(21) NOT NULL,
    prod_id            VARCHAR(21) NOT NULL,
    prod_opt_type_nm   VARCHAR(50) NOT NULL,
    prod_opt_type_level INTEGER    NOT NULL DEFAULT 1,
    prod_opt_input_type_cd VARCHAR(20) DEFAULT 'SELECT'::character varying,
    sort_ord      INTEGER     DEFAULT 0,
    reg_by        VARCHAR(30),
    reg_date      TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    upd_by        VARCHAR(30),
    upd_date      TIMESTAMP
);

COMMENT ON TABLE  shopjoy_2604.pd_prod_opt_type IS '상품 옵션 유형 정의 (색상, 사이즈 등 옵션 차원 축)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt_type.prod_opt_type_id IS '옵션유형ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt_type.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt_type.prod_id IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt_type.prod_opt_type_nm IS '옵션유형명 (예: 색상, 사이즈)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt_type.prod_opt_type_level IS '옵션 차원 순서 — 1=첫번째(색상), 2=두번째(사이즈)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt_type.prod_opt_input_type_cd IS '옵션입력방식 (코드: OPT_INPUT_TYPE — SELECT/SELECT_INPUT/MULTI_SELECT)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt_type.sort_ord IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt_type.reg_by IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt_type.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt_type.upd_by IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt_type.upd_date IS '수정일시';

CREATE INDEX idx_pd_prod_opt_type_prod ON shopjoy_2604.pd_prod_opt_type USING btree (prod_id);
CREATE INDEX idx_pd_prod_opt_type_site ON shopjoy_2604.pd_prod_opt_type USING btree (site_id);
