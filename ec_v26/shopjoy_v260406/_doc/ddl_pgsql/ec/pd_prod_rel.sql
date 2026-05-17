-- pd_prod_rel 테이블 DDL
-- 상품 연관 관계 (연관상품/코디상품)

CREATE TABLE shopjoy_2604.pd_prod_rel (
    prod_rel_id      VARCHAR(21) NOT NULL PRIMARY KEY,
    prod_id          VARCHAR(21) NOT NULL,
    rel_prod_id      VARCHAR(21) NOT NULL,
    prod_rel_type_cd VARCHAR(20) NOT NULL,
    sort_ord         INTEGER     DEFAULT 0,
    use_yn           VARCHAR(1)  DEFAULT 'Y'::bpchar,
    reg_by           VARCHAR(30),
    reg_date         TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    upd_by           VARCHAR(30),
    upd_date         TIMESTAMP  ,
    site_id          VARCHAR(21) NOT NULL
);

COMMENT ON TABLE  shopjoy_2604.pd_prod_rel IS '상품 연관 관계 (연관상품/코디상품)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_rel.prod_rel_id IS '연관관계ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_rel.prod_id IS '기준 상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_rel.rel_prod_id IS '연관 대상 상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_rel.prod_rel_type_cd IS '관계유형 코드 (PROD_REL_TYPE: REL_PROD/CODY_PROD)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_rel.sort_ord IS '정렬순서 (낮을수록 우선 노출)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_rel.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.pd_prod_rel.reg_by IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_rel.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.pd_prod_rel.upd_by IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_rel.upd_date IS '수정일';

CREATE INDEX idx_pd_prod_rel_prod_id ON shopjoy_2604.pd_prod_rel USING btree (prod_id, prod_rel_type_cd, sort_ord);
CREATE INDEX idx_pd_prod_rel_rel_prod_id ON shopjoy_2604.pd_prod_rel USING btree (rel_prod_id);
CREATE INDEX idx_pd_prod_rel_site ON shopjoy_2604.pd_prod_rel USING btree (site_id);
CREATE UNIQUE INDEX pd_prod_rel_prod_id_rel_prod_id_prod_rel_type_cd_key ON shopjoy_2604.pd_prod_rel USING btree (prod_id, rel_prod_id, prod_rel_type_cd);
