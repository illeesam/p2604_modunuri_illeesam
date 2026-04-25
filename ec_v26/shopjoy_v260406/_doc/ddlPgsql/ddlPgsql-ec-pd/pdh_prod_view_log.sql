-- ============================================================
-- ec_prod_view_log : 상품/페이지 조회 로그 (추천·분석용)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- 용도: 최근 본 상품, 인기 상품 집계, 개인화 추천 기반 데이터
-- ============================================================
CREATE TABLE pdh_prod_view_log (
    log_id          VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),
    member_id       VARCHAR(21),                           -- 비회원 NULL
    session_key     VARCHAR(100),                          -- 비회원 세션키
    prod_id       VARCHAR(21)     NOT NULL,              -- PROD
    ref_id          VARCHAR(21),                           -- prod_id별 참조ID (prod_id, category_id 등)
    ref_nm          VARCHAR(200),                          -- 참조명 스냅샷 (상품명 등)
    search_kw       VARCHAR(200),                          -- prod_id=SEARCH 시 검색어
    ip              VARCHAR(50),
    device          VARCHAR(200),                          -- User-Agent
    referrer        VARCHAR(500),                          -- 유입 경로 URL
    view_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (log_id)
);

COMMENT ON TABLE pdh_prod_view_log IS '상품/페이지 조회 로그';
COMMENT ON COLUMN pdh_prod_view_log.log_id     IS '로그ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pdh_prod_view_log.site_id    IS '사이트ID';
COMMENT ON COLUMN pdh_prod_view_log.member_id  IS '회원ID (비회원 NULL)';
COMMENT ON COLUMN pdh_prod_view_log.session_key IS '비회원 세션키';
COMMENT ON COLUMN pdh_prod_view_log.prod_id  IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN pdh_prod_view_log.ref_id     IS '참조ID (prod_id 등)';
COMMENT ON COLUMN pdh_prod_view_log.ref_nm     IS '참조명 스냅샷';
COMMENT ON COLUMN pdh_prod_view_log.search_kw  IS '검색어 (SEARCH 유형)';
COMMENT ON COLUMN pdh_prod_view_log.ip         IS 'IP주소';
COMMENT ON COLUMN pdh_prod_view_log.device     IS 'User-Agent';
COMMENT ON COLUMN pdh_prod_view_log.referrer   IS '유입경로 URL';
COMMENT ON COLUMN pdh_prod_view_log.view_date  IS '조회일시';
COMMENT ON COLUMN pdh_prod_view_log.reg_by     IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pdh_prod_view_log.reg_date   IS '등록일';
COMMENT ON COLUMN pdh_prod_view_log.upd_by     IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pdh_prod_view_log.upd_date   IS '수정일';

CREATE INDEX idx_ec_pvl_member ON pdh_prod_view_log (member_id);
CREATE INDEX idx_ec_pvl_ref    ON pdh_prod_view_log (prod_id, ref_id);
CREATE INDEX idx_ec_pvl_date   ON pdh_prod_view_log (view_date);
