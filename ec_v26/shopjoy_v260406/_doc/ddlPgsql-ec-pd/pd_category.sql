-- ============================================================
-- ec_category : 카테고리
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE pd_category (
    category_id     VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    parent_category_id       VARCHAR(21),
    category_nm     VARCHAR(100)    NOT NULL,
    category_depth  SMALLINT        DEFAULT 1,              -- 1: 대, 2: 중, 3: 소
    sort_ord        INTEGER         DEFAULT 0,
    category_status_cd VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: USE_YN
    category_status_cd_before VARCHAR(20),                   -- 변경 전 카테고리상태
    img_url         VARCHAR(500),
    category_desc   TEXT,
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (category_id)
);

COMMENT ON TABLE pd_category IS '카테고리';
COMMENT ON COLUMN pd_category.category_id   IS '카테고리ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pd_category.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pd_category.parent_category_id     IS '상위 카테고리ID';
COMMENT ON COLUMN pd_category.category_nm   IS '카테고리명';
COMMENT ON COLUMN pd_category.category_depth IS '깊이 (1:대/2:중/3:소)';
COMMENT ON COLUMN pd_category.sort_ord      IS '정렬순서';
COMMENT ON COLUMN pd_category.category_status_cd IS '상태 (코드: USE_YN)';
COMMENT ON COLUMN pd_category.category_status_cd_before IS '변경 전 카테고리상태 (코드: USE_YN)';
COMMENT ON COLUMN pd_category.img_url       IS '이미지URL';
COMMENT ON COLUMN pd_category.category_desc IS '설명';
COMMENT ON COLUMN pd_category.reg_by        IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_category.reg_date      IS '등록일';
COMMENT ON COLUMN pd_category.upd_by        IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_category.upd_date      IS '수정일';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pd_category.category_status_cd (상태) : 사용여부 { Y:사용, N:미사용 }
