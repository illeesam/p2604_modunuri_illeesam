-- ============================================================
-- ec_page_view_log : 상품/페이지 조회 로그 (추천·분석용)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- 용도: 최근 본 상품, 인기 상품 집계, 개인화 추천 기반 데이터
-- ============================================================
CREATE TABLE ec_page_view_log (
    log_id          VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),
    member_id       VARCHAR(16),                           -- 비회원 NULL
    session_key     VARCHAR(100),                          -- 비회원 세션키
    page_type       VARCHAR(30)     NOT NULL,              -- PROD / CATEGORY / SEARCH / DISP
    ref_id          VARCHAR(16),                           -- page_type별 참조ID (prod_id, category_id 등)
    ref_nm          VARCHAR(200),                          -- 참조명 스냅샷 (상품명 등)
    search_kw       VARCHAR(200),                          -- page_type=SEARCH 시 검색어
    ip              VARCHAR(50),
    device          VARCHAR(200),                          -- User-Agent
    referrer        VARCHAR(500),                          -- 유입 경로 URL
    view_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (log_id)
);

COMMENT ON TABLE  ec_page_view_log            IS '상품/페이지 조회 로그';
COMMENT ON COLUMN ec_page_view_log.log_id     IS '로그ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN ec_page_view_log.site_id    IS '사이트ID';
COMMENT ON COLUMN ec_page_view_log.member_id  IS '회원ID (비회원 NULL)';
COMMENT ON COLUMN ec_page_view_log.session_key IS '비회원 세션키';
COMMENT ON COLUMN ec_page_view_log.page_type  IS '페이지유형 (PROD/CATEGORY/SEARCH/DISP)';
COMMENT ON COLUMN ec_page_view_log.ref_id     IS '참조ID (prod_id 등)';
COMMENT ON COLUMN ec_page_view_log.ref_nm     IS '참조명 스냅샷';
COMMENT ON COLUMN ec_page_view_log.search_kw  IS '검색어 (SEARCH 유형)';
COMMENT ON COLUMN ec_page_view_log.ip         IS 'IP주소';
COMMENT ON COLUMN ec_page_view_log.device     IS 'User-Agent';
COMMENT ON COLUMN ec_page_view_log.referrer   IS '유입경로 URL';
COMMENT ON COLUMN ec_page_view_log.view_date  IS '조회일시';
COMMENT ON COLUMN ec_page_view_log.reg_by     IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN ec_page_view_log.reg_date   IS '등록일';
COMMENT ON COLUMN ec_page_view_log.upd_by     IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN ec_page_view_log.upd_date   IS '수정일';

CREATE INDEX idx_ec_pvl_member ON ec_page_view_log (member_id);
CREATE INDEX idx_ec_pvl_ref    ON ec_page_view_log (page_type, ref_id);
CREATE INDEX idx_ec_pvl_date   ON ec_page_view_log (view_date);
