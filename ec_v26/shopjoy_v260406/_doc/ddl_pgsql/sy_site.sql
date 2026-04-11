-- ============================================================
-- sy_site : 사이트
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE sy_site (
    site_id         VARCHAR(16)     NOT NULL,
    site_code       VARCHAR(50)     NOT NULL,
    site_type       VARCHAR(20),                            -- EC/ADMIN/API
    site_nm         VARCHAR(100)    NOT NULL,
    domain          VARCHAR(200),
    logo_url        VARCHAR(500),
    favicon_url     VARCHAR(500),
    description     TEXT,
    email           VARCHAR(100),
    phone           VARCHAR(20),
    zip_code        VARCHAR(10),
    address         VARCHAR(300),
    business_no     VARCHAR(20),
    ceo             VARCHAR(50),
    status_cd       VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: SITE_STATUS
    config_json     TEXT,                                   -- 사이트별 확장 설정 (JSON)
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (site_id),
    UNIQUE (site_code)
);

COMMENT ON TABLE  sy_site                IS '사이트';
COMMENT ON COLUMN sy_site.site_id        IS '사이트ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_site.site_code      IS '사이트코드';
COMMENT ON COLUMN sy_site.site_type      IS '사이트유형 (EC/ADMIN/API)';
COMMENT ON COLUMN sy_site.site_nm        IS '사이트명';
COMMENT ON COLUMN sy_site.domain         IS '도메인';
COMMENT ON COLUMN sy_site.logo_url       IS '로고URL';
COMMENT ON COLUMN sy_site.favicon_url    IS '파비콘URL';
COMMENT ON COLUMN sy_site.description    IS '설명';
COMMENT ON COLUMN sy_site.email          IS '대표이메일';
COMMENT ON COLUMN sy_site.phone          IS '대표전화';
COMMENT ON COLUMN sy_site.zip_code       IS '우편번호';
COMMENT ON COLUMN sy_site.address        IS '주소';
COMMENT ON COLUMN sy_site.business_no    IS '사업자번호';
COMMENT ON COLUMN sy_site.ceo            IS '대표자명';
COMMENT ON COLUMN sy_site.status_cd      IS '상태 (코드: SITE_STATUS)';
COMMENT ON COLUMN sy_site.config_json    IS '확장설정 (JSON)';
COMMENT ON COLUMN sy_site.reg_by         IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN sy_site.reg_date       IS '등록일';
COMMENT ON COLUMN sy_site.upd_by         IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN sy_site.upd_date       IS '수정일';
