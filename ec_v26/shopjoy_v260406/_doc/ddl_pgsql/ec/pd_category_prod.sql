-- pd_category_prod 테이블 DDL
-- 상품-카테고리 연결 (N:N, 복수 카테고리·타입 등록)

CREATE TABLE shopjoy_2604.pd_category_prod (
    category_prod_id      VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id               VARCHAR(21)  NOT NULL,
    category_id           VARCHAR(21)  NOT NULL,
    prod_id               VARCHAR(21)  NOT NULL,
    category_prod_type_cd VARCHAR(20)  NOT NULL DEFAULT 'NORMAL'::character varying,
    sort_ord              INTEGER      DEFAULT 0,
    emphasis_cd           VARCHAR(200),
    disp_yn               VARCHAR(1)   NOT NULL DEFAULT 'Y'::bpchar,
    disp_start_date       DATE         DEFAULT CURRENT_DATE,
    disp_end_date         DATE         DEFAULT ((((CURRENT_DATE + '3 years'::interval) - ((EXTRACT(doy FROM CURRENT_DATE))::double precision * '1 day'::interval)) + '1 year'::interval) - '1 day'::interval),
    reg_by                VARCHAR(30) ,
    reg_date              TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by                VARCHAR(30) ,
    upd_date              TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.pd_category_prod IS '상품-카테고리 연결 (N:N, 복수 카테고리·타입 등록)';
COMMENT ON COLUMN shopjoy_2604.pd_category_prod.category_prod_id IS '상품카테고리연결ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.pd_category_prod.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.pd_category_prod.category_id IS '카테고리ID (pd_category.category_id)';
COMMENT ON COLUMN shopjoy_2604.pd_category_prod.prod_id IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN shopjoy_2604.pd_category_prod.category_prod_type_cd IS '진열유형 (NORMAL/HIGHLIGHT/RECOMMEND/MAIN/BANNER/HOT_DEAL)';
COMMENT ON COLUMN shopjoy_2604.pd_category_prod.sort_ord IS '표시 순서 (동일 타입 내, 낮을수록 우선 노출)';
COMMENT ON COLUMN shopjoy_2604.pd_category_prod.disp_yn IS '전시여부 (Y=전시, N=비전시)';
COMMENT ON COLUMN shopjoy_2604.pd_category_prod.disp_start_date IS '전시시작일 (NULL=즉시)';
COMMENT ON COLUMN shopjoy_2604.pd_category_prod.disp_end_date IS '전시종료일 (NULL=무기한, 기본 3년 후 12월31일)';
COMMENT ON COLUMN shopjoy_2604.pd_category_prod.reg_by IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.pd_category_prod.reg_date IS '등록일';

CREATE INDEX idx_pd_category_prod_cat ON shopjoy_2604.pd_category_prod USING btree (category_id, category_prod_type_cd, sort_ord);
CREATE INDEX idx_pd_category_prod_prod ON shopjoy_2604.pd_category_prod USING btree (prod_id, category_prod_type_cd, sort_ord);
CREATE INDEX idx_pd_category_prod_site ON shopjoy_2604.pd_category_prod USING btree (site_id);
CREATE UNIQUE INDEX pd_category_prod_category_id_prod_id_category_prod_type_cd_key ON shopjoy_2604.pd_category_prod USING btree (category_id, prod_id, category_prod_type_cd);
