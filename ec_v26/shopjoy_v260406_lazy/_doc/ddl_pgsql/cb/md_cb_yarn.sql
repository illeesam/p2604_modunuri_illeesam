-- md_cb_yarn 테이블 DDL
-- 코바늘 실 마스터

CREATE TABLE shopjoy_2604.md_cb_yarn (
    yarn_id     VARCHAR(21)  NOT NULL CONSTRAINT md_cb_yarn_pk_yarn_id PRIMARY KEY,
    site_id     VARCHAR(21)  NOT NULL,
    reg_site_id VARCHAR(21)  NOT NULL,
    yarn_nm     VARCHAR(100) NOT NULL,
    color_hex   VARCHAR(7)   NOT NULL,
    weight_cd   VARCHAR(20),
    brand_nm    VARCHAR(100),
    use_yn      VARCHAR(1)   DEFAULT 'Y'::bpchar,
    reg_by      VARCHAR(30),
    reg_date    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by      VARCHAR(30),
    upd_date    TIMESTAMP
);

COMMENT ON TABLE  shopjoy_2604.md_cb_yarn IS '코바늘 실 마스터';
COMMENT ON COLUMN shopjoy_2604.md_cb_yarn.yarn_id IS '실ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.md_cb_yarn.site_id IS '사이트ID (sy_site.site_id) - 업무 소속 사이트';
COMMENT ON COLUMN shopjoy_2604.md_cb_yarn.reg_site_id IS '등록 사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.md_cb_yarn.yarn_nm IS '실 이름 (예: 코튼워시드 아이보리)';
COMMENT ON COLUMN shopjoy_2604.md_cb_yarn.color_hex IS '실 색상 (#RRGGBB)';
COMMENT ON COLUMN shopjoy_2604.md_cb_yarn.weight_cd IS '실 굵기 — CB_YARN_WEIGHT_CD {LACE, FINGERING, DK, WORSTED, BULKY}';
COMMENT ON COLUMN shopjoy_2604.md_cb_yarn.brand_nm IS '실 브랜드명';
COMMENT ON COLUMN shopjoy_2604.md_cb_yarn.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.md_cb_yarn.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.md_cb_yarn.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.md_cb_yarn.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.md_cb_yarn.upd_date IS '수정일';
