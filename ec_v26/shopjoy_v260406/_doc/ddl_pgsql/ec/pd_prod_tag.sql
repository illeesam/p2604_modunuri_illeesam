-- pd_prod_tag 테이블 DDL
-- 상품-태그 매핑

CREATE TABLE shopjoy_2604.pd_prod_tag (
    prod_tag_id VARCHAR(21) NOT NULL CONSTRAINT pd_prod_tag_pk_prod_tag_id PRIMARY KEY,
    reg_site_id     VARCHAR(21) NOT NULL,
    prod_id     VARCHAR(21) NOT NULL,
    tag_id      VARCHAR(21) NOT NULL,
    reg_by      VARCHAR(30),
    reg_date    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    upd_by      VARCHAR(30),
    upd_date    TIMESTAMP  ,
    CONSTRAINT pd_prod_tag_uk_prod_id_tag_id_x2 UNIQUE (prod_id, tag_id)
);

COMMENT ON TABLE  shopjoy_2604.pd_prod_tag IS '상품-태그 매핑';
COMMENT ON COLUMN shopjoy_2604.pd_prod_tag.prod_tag_id IS '상품태그ID';
COMMENT ON COLUMN shopjoy_2604.pd_prod_tag.reg_site_id IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.pd_prod_tag.prod_id IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_tag.tag_id IS '태그ID (pd_tag.)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_tag.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.pd_prod_tag.reg_date IS '등록일';

CREATE INDEX pd_prod_tag_ix01_tag_id ON shopjoy_2604.pd_prod_tag USING btree (tag_id);
