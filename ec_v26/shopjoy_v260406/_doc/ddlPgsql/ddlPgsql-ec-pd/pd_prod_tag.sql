-- 상품-태그 매핑
CREATE TABLE pd_prod_tag (
    prod_tag_id     VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),
    prod_id         VARCHAR(21)     NOT NULL,               -- pd_prod.prod_id
    tag_id          VARCHAR(21)     NOT NULL,               -- pd_tag.
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (prod_tag_id),
    UNIQUE (prod_id, tag_id)
);

COMMENT ON TABLE pd_prod_tag IS '상품-태그 매핑';
COMMENT ON COLUMN pd_prod_tag.prod_tag_id IS '상품태그ID';
COMMENT ON COLUMN pd_prod_tag.site_id     IS '사이트ID';
COMMENT ON COLUMN pd_prod_tag.prod_id     IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN pd_prod_tag.tag_id      IS '태그ID (pd_tag.)';
COMMENT ON COLUMN pd_prod_tag.reg_by      IS '등록자';
COMMENT ON COLUMN pd_prod_tag.reg_date    IS '등록일';
COMMENT ON COLUMN pd_prod_tag.upd_by   IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_prod_tag.upd_date IS '수정일';

CREATE INDEX idx_pd_prod_tag_prod ON pd_prod_tag (prod_id);
CREATE INDEX idx_pd_prod_tag_tag  ON pd_prod_tag (tag_id);
