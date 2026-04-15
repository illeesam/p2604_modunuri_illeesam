-- 상품-태그 매핑
CREATE TABLE ec_prod_tag (
    prod_tag_id     VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),
    prod_id         VARCHAR(16)     NOT NULL,               -- ec_prod.prod_id
    tag_id          VARCHAR(16)     NOT NULL,               -- ec_tag.tag_id
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (prod_tag_id),
    UNIQUE (prod_id, tag_id)
);

COMMENT ON TABLE  ec_prod_tag             IS '상품-태그 매핑';
COMMENT ON COLUMN ec_prod_tag.prod_tag_id IS '상품태그ID';
COMMENT ON COLUMN ec_prod_tag.site_id     IS '사이트ID';
COMMENT ON COLUMN ec_prod_tag.prod_id     IS '상품ID (ec_prod.prod_id)';
COMMENT ON COLUMN ec_prod_tag.tag_id      IS '태그ID (ec_tag.tag_id)';
COMMENT ON COLUMN ec_prod_tag.reg_by      IS '등록자';
COMMENT ON COLUMN ec_prod_tag.reg_date    IS '등록일';

CREATE INDEX idx_ec_prod_tag_prod ON ec_prod_tag (prod_id);
CREATE INDEX idx_ec_prod_tag_tag  ON ec_prod_tag (tag_id);
