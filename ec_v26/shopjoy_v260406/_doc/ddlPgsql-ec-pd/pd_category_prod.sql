-- ============================================================
-- pd_category_prod : 상품-카테고리 연결 (N:N)
-- 상품 1개에 카테고리 N개 등록 가능 (복수 카테고리)
-- - sort_ord: 카테고리 내 동일 타입 표시 순서
-- - category_prod_type_cd: 카테고리 내 상품 진열 유형
--   (NORMAL=일반상품, HIGHLIGHT=하이라이트상품, RECOMMEND=추천상품,
--    MAIN=대표상품, BANNER=배너상품, HOT_DEAL=핫딜상품)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE pd_category_prod (
    category_prod_id        VARCHAR(21)     NOT NULL,
    site_id                 VARCHAR(21),                                        -- sy_site.site_id
    category_id             VARCHAR(21)     NOT NULL,                           -- pd_category.category_id
    prod_id                 VARCHAR(21)     NOT NULL,                           -- pd_prod.prod_id
    category_prod_type_cd   VARCHAR(20)     NOT NULL DEFAULT 'NORMAL',          -- 진열 유형
    sort_ord                INTEGER         DEFAULT 0,                          -- 동일 타입 내 표시 순서
    emphasis_cd             VARCHAR(200),                                       -- 강조옵션 (^BOLD^TEXT_COLOR^EMOTICON^MARQUEE^)
    disp_yn                 CHAR(1)         NOT NULL DEFAULT 'Y',               -- 전시여부 (Y/N)
    disp_start_date         DATE            DEFAULT CURRENT_DATE,               -- 전시시작일
    disp_end_date           DATE            DEFAULT (CURRENT_DATE + INTERVAL '3 years' - EXTRACT(DOY FROM CURRENT_DATE) * INTERVAL '1 day' + INTERVAL '1 year' - INTERVAL '1 day'), -- 전시종료일 (기본: 3년 후 12월31일)
    reg_by                  VARCHAR(30),
    reg_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (category_prod_id),
    UNIQUE (category_id, prod_id, category_prod_type_cd)                       -- 동일 카테고리+상품+타입 중복 방지
);

COMMENT ON TABLE  pd_category_prod                              IS '상품-카테고리 연결 (N:N, 복수 카테고리·타입 등록)';
COMMENT ON COLUMN pd_category_prod.category_prod_id            IS '상품카테고리연결ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pd_category_prod.site_id                     IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pd_category_prod.category_id                 IS '카테고리ID (pd_category.category_id)';
COMMENT ON COLUMN pd_category_prod.prod_id                     IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN pd_category_prod.category_prod_type_cd       IS '진열유형 (NORMAL/HIGHLIGHT/RECOMMEND/MAIN/BANNER/HOT_DEAL)';
COMMENT ON COLUMN pd_category_prod.sort_ord                    IS '표시 순서 (동일 타입 내, 낮을수록 우선 노출)';
COMMENT ON COLUMN pd_category_prod.disp_yn                     IS '전시여부 (Y=전시, N=비전시)';
COMMENT ON COLUMN pd_category_prod.disp_start_date             IS '전시시작일 (NULL=즉시)';
COMMENT ON COLUMN pd_category_prod.disp_end_date               IS '전시종료일 (NULL=무기한, 기본 3년 후 12월31일)';
COMMENT ON COLUMN pd_category_prod.reg_by                      IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN pd_category_prod.reg_date                    IS '등록일';
COMMENT ON COLUMN pd_category_prod.upd_by   IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_category_prod.upd_date IS '수정일';

-- ============================================================
-- 인덱스
-- ============================================================
CREATE INDEX idx_pd_category_prod_prod ON pd_category_prod (prod_id, category_prod_type_cd, sort_ord);
CREATE INDEX idx_pd_category_prod_cat  ON pd_category_prod (category_id, category_prod_type_cd, sort_ord);
