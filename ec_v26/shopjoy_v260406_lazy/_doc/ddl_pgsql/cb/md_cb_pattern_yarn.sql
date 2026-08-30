-- md_cb_pattern_yarn 테이블 DDL
-- 도안-실 매핑 (도안별 사용 실 목록)

CREATE TABLE shopjoy_2604.md_cb_pattern_yarn (
    pattern_yarn_id VARCHAR(21)  NOT NULL CONSTRAINT md_cb_pattern_yarn_pk_pattern_yarn_id PRIMARY KEY,
    site_id         VARCHAR(21)  NOT NULL,
    reg_site_id     VARCHAR(21)  NOT NULL,
    pattern_id      VARCHAR(21)  NOT NULL,
    yarn_id         VARCHAR(21)  NOT NULL,
    usage_desc      VARCHAR(200),
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP
);

COMMENT ON TABLE  shopjoy_2604.md_cb_pattern_yarn IS '도안-실 매핑 (도안별 사용 실 목록)';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern_yarn.pattern_yarn_id IS '도안실매핑ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern_yarn.site_id IS '사이트ID (sy_site.site_id) - 업무 소속 사이트';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern_yarn.reg_site_id IS '등록 사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern_yarn.pattern_id IS '도안ID (md_cb_pattern.pattern_id)';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern_yarn.yarn_id IS '실ID (md_cb_yarn.yarn_id)';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern_yarn.usage_desc IS '사용 설명 (예: 메인 색상, 포인트 색상)';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern_yarn.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern_yarn.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern_yarn.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern_yarn.upd_date IS '수정일';

CREATE UNIQUE INDEX md_cb_pattern_yarn_uk_pattern_yarn ON shopjoy_2604.md_cb_pattern_yarn USING btree (pattern_id, yarn_id);
