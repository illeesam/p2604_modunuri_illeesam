-- pd_prod_tag 테이블 DDL
-- 상품-태그 매핑

CREATE TABLE shopjoy_2604.pd_prod_tag (
    prod_tag_id VARCHAR(21) NOT NULL PRIMARY KEY,
    site_id     VARCHAR(21) NOT NULL,
    prod_id     VARCHAR(21) NOT NULL,
    tag_id      VARCHAR(21) NOT NULL,
    reg_by      VARCHAR(30),
    reg_date    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    upd_by      VARCHAR(30),
    upd_date    TIMESTAMP  
);

COMMENT ON TABLE  shopjoy_2604.pd_prod_tag IS '상품-태그 매핑';
COMMENT ON COLUMN shopjoy_2604.pd_prod_tag.prod_tag_id IS '상품태그ID';
COMMENT ON COLUMN shopjoy_2604.pd_prod_tag.site_id IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.pd_prod_tag.prod_id IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_tag.tag_id IS '태그ID (pd_tag.)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_tag.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.pd_prod_tag.reg_date IS '등록일';

CREATE INDEX idx_pd_prod_tag_prod ON shopjoy_2604.pd_prod_tag USING btree (prod_id);
CREATE INDEX idx_pd_prod_tag_site ON shopjoy_2604.pd_prod_tag USING btree (site_id);
CREATE INDEX idx_pd_prod_tag_tag ON shopjoy_2604.pd_prod_tag USING btree (tag_id);
CREATE UNIQUE INDEX pd_prod_tag_prod_id_tag_id_key ON shopjoy_2604.pd_prod_tag USING btree (prod_id, tag_id);
