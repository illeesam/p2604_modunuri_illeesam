-- ============================================================
-- pd_prod_rel : 상품 연관 관계
-- REL_PROD  : 연관상품  (같이 보면 좋을 상품, 비슷한 상품)
-- CODY_PROD : 코디상품  (함께 코디하면 좋을 상품, 크로스셀링)
-- ID 규칙   : YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE pd_prod_rel (
    prod_rel_id      VARCHAR(21)     NOT NULL,
    prod_id          VARCHAR(21)     NOT NULL,                  -- 기준 상품 (pd_prod.prod_id)
    rel_prod_id      VARCHAR(21)     NOT NULL,                  -- 연관 대상 상품 (pd_prod.prod_id)
    prod_rel_type_cd VARCHAR(20)     NOT NULL,                  -- 관계 유형 코드: PROD_REL_TYPE (REL_PROD / CODY_PROD)
    sort_ord         INTEGER         DEFAULT 0,                 -- 노출 정렬 순서 (낮을수록 우선)
    use_yn           CHAR(1)         DEFAULT 'Y',               -- 사용여부 Y/N
    reg_by           VARCHAR(30),
    reg_date         TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by           VARCHAR(30),
    upd_date         TIMESTAMP,
    PRIMARY KEY (prod_rel_id),
    UNIQUE (prod_id, rel_prod_id, prod_rel_type_cd)             -- 동일 타입 중복 연결 방지
);

COMMENT ON TABLE  pd_prod_rel                  IS '상품 연관 관계 (연관상품/코디상품)';
COMMENT ON COLUMN pd_prod_rel.prod_rel_id      IS '연관관계ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pd_prod_rel.prod_id          IS '기준 상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN pd_prod_rel.rel_prod_id      IS '연관 대상 상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN pd_prod_rel.prod_rel_type_cd IS '관계유형 코드 (PROD_REL_TYPE: REL_PROD/CODY_PROD)';
COMMENT ON COLUMN pd_prod_rel.sort_ord         IS '정렬순서 (낮을수록 우선 노출)';
COMMENT ON COLUMN pd_prod_rel.use_yn           IS '사용여부 Y/N';
COMMENT ON COLUMN pd_prod_rel.reg_by           IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN pd_prod_rel.reg_date         IS '등록일';
COMMENT ON COLUMN pd_prod_rel.upd_by           IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN pd_prod_rel.upd_date         IS '수정일';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pd_prod_rel.prod_rel_type_cd (관계유형) : PROD_REL_TYPE
--   REL_PROD  : 연관상품 — 비슷하거나 대체 가능한 상품 (PDP 하단 "관련 상품" 노출)
--   CODY_PROD : 코디상품 — 함께 코디·조합하면 좋은 상품 (PDP 하단 "코디 추천" 노출)

-- ============================================================
-- 인덱스
-- ============================================================
CREATE INDEX idx_pd_prod_rel_prod_id      ON pd_prod_rel (prod_id, prod_rel_type_cd, sort_ord);
CREATE INDEX idx_pd_prod_rel_rel_prod_id  ON pd_prod_rel (rel_prod_id);
