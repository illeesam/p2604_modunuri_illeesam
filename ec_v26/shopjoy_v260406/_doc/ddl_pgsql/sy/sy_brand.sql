-- ============================================================
-- sy_brand : 브랜드
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE sy_brand (
    brand_id        VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    brand_code      VARCHAR(50)     NOT NULL,
    brand_nm        VARCHAR(100)    NOT NULL,
    brand_en_nm     VARCHAR(100),
    disp_path       VARCHAR(200),                           -- 점(.) 구분 표시경로 (예: sports.outdoor)
    logo_url        VARCHAR(500),
    vendor_id       VARCHAR(16),
    sort_ord        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',
    remark          VARCHAR(300),
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (brand_id),
    UNIQUE (brand_code)
);

COMMENT ON TABLE  sy_brand               IS '브랜드';
COMMENT ON COLUMN sy_brand.brand_id      IS '브랜드ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_brand.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_brand.brand_code    IS '브랜드코드';
COMMENT ON COLUMN sy_brand.brand_nm      IS '브랜드명 (한글)';
COMMENT ON COLUMN sy_brand.brand_en_nm   IS '브랜드영문명';
COMMENT ON COLUMN sy_brand.disp_path     IS '점(.) 구분 표시경로 (트리 빌드용)';
COMMENT ON COLUMN sy_brand.logo_url      IS '로고URL';
COMMENT ON COLUMN sy_brand.vendor_id     IS '업체ID';
COMMENT ON COLUMN sy_brand.sort_ord      IS '정렬순서';
COMMENT ON COLUMN sy_brand.use_yn        IS '사용여부 Y/N';
COMMENT ON COLUMN sy_brand.remark        IS '비고';
COMMENT ON COLUMN sy_brand.reg_by        IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_brand.reg_date      IS '등록일';
COMMENT ON COLUMN sy_brand.upd_by        IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_brand.upd_date      IS '수정일';
