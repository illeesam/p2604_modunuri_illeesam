-- ============================================================
-- sy_site : 사이트
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE sy_site (
    site_id         VARCHAR(21)     NOT NULL,
    site_code       VARCHAR(50)     NOT NULL,
    site_type_cd    VARCHAR(20),                            -- 코드: SITE_TYPE (EC/ADMIN/API)
    site_nm         VARCHAR(100)    NOT NULL,
    site_domain     VARCHAR(200),
    logo_url        VARCHAR(500),
    favicon_url     VARCHAR(500),
    site_desc       TEXT,
    site_email      VARCHAR(100),
    site_phone      VARCHAR(20),
    site_zip_code   VARCHAR(10),
    site_address    VARCHAR(300),
    site_business_no VARCHAR(20),
    site_ceo        VARCHAR(50),
    site_status_cd  VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: SITE_STATUS
    config_json     TEXT,                                   -- 사이트별 확장 설정 (JSON)
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    disp_path       VARCHAR(200),                           -- 점(.) 구분 표시경로
    PRIMARY KEY (site_id),
    UNIQUE (site_code)
);

COMMENT ON TABLE  sy_site                IS '사이트';
COMMENT ON COLUMN sy_site.site_id        IS '사이트ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_site.site_code      IS '사이트코드';
COMMENT ON COLUMN sy_site.site_type_cd    IS '사이트유형 (코드: SITE_TYPE — EC/ADMIN/API)';
COMMENT ON COLUMN sy_site.site_nm        IS '사이트명';
COMMENT ON COLUMN sy_site.site_domain    IS '도메인';
COMMENT ON COLUMN sy_site.logo_url       IS '로고URL';
COMMENT ON COLUMN sy_site.favicon_url    IS '파비콘URL';
COMMENT ON COLUMN sy_site.site_desc      IS '사이트설명';
COMMENT ON COLUMN sy_site.site_email     IS '대표이메일';
COMMENT ON COLUMN sy_site.site_phone     IS '대표전화';
COMMENT ON COLUMN sy_site.site_zip_code  IS '우편번호';
COMMENT ON COLUMN sy_site.site_address   IS '주소';
COMMENT ON COLUMN sy_site.site_business_no IS '사업자번호';
COMMENT ON COLUMN sy_site.site_ceo       IS '대표자명';
COMMENT ON COLUMN sy_site.site_status_cd IS '상태 (코드: SITE_STATUS)';
COMMENT ON COLUMN sy_site.config_json    IS '확장설정 (JSON)';
COMMENT ON COLUMN sy_site.reg_by         IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_site.reg_date       IS '등록일';
COMMENT ON COLUMN sy_site.upd_by         IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_site.upd_date       IS '수정일';
COMMENT ON COLUMN sy_site.disp_path IS '점(.) 구분 표시경로 (트리 빌드용)';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_site.site_type_cd (사이트유형) : SITE_TYPE { EC:쇼핑몰, ADMIN:관리자, API:API }
-- [CODES] sy_site.site_status_cd (상태) : 사이트상태 { ACTIVE:활성, MAINTENANCE:점검중, INACTIVE:비활성 }
