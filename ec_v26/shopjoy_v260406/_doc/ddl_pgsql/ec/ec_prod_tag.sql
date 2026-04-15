-- ============================================================

-- 태그 마스터
CREATE TABLE ec_tag (
    tag_id          VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),
    tag_nm          VARCHAR(50)     NOT NULL,               -- 태그명 (예: 코튼)
    tag_code        VARCHAR(50),                           -- 영문 슬러그 (예: cotton)
    use_yn          CHAR(1)         DEFAULT 'Y',
    sort_ord        INTEGER         DEFAULT 0,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (tag_id),
    UNIQUE (site_id, tag_nm)
);

COMMENT ON TABLE  ec_tag            IS '태그 마스터';
COMMENT ON COLUMN ec_tag.tag_id     IS '태그ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN ec_tag.site_id    IS '사이트ID';
COMMENT ON COLUMN ec_tag.tag_nm     IS '태그명 (예: 코튼)';
COMMENT ON COLUMN ec_tag.tag_code   IS '영문 슬러그 (예: cotton)';
COMMENT ON COLUMN ec_tag.use_yn     IS '사용여부 Y/N';
COMMENT ON COLUMN ec_tag.sort_ord   IS '정렬순서';
COMMENT ON COLUMN ec_tag.reg_by     IS '등록자';
COMMENT ON COLUMN ec_tag.reg_date   IS '등록일';
COMMENT ON COLUMN ec_tag.upd_by     IS '수정자';
COMMENT ON COLUMN ec_tag.upd_date   IS '수정일';

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
