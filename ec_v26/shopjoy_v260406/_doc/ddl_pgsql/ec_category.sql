-- ============================================================
-- ec_category : 카테고리
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE ec_category (
    category_id     VARCHAR(16)     NOT NULL,
    parent_id       VARCHAR(16),
    category_name   VARCHAR(100)    NOT NULL,
    depth           SMALLINT        DEFAULT 1,              -- 1: 대, 2: 중, 3: 소
    sort_ord        INTEGER         DEFAULT 0,
    status_cd       VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: USE_YN
    img_url         VARCHAR(500),
    description     TEXT,
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_date        TIMESTAMP,
    PRIMARY KEY (category_id)
);

COMMENT ON TABLE  ec_category               IS '카테고리';
COMMENT ON COLUMN ec_category.category_id   IS '카테고리ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN ec_category.parent_id     IS '상위 카테고리ID';
COMMENT ON COLUMN ec_category.category_name IS '카테고리명';
COMMENT ON COLUMN ec_category.depth         IS '깊이 (1:대/2:중/3:소)';
COMMENT ON COLUMN ec_category.sort_ord      IS '정렬순서';
COMMENT ON COLUMN ec_category.status_cd     IS '상태 (ACTIVE/INACTIVE)';
COMMENT ON COLUMN ec_category.img_url       IS '이미지URL';
COMMENT ON COLUMN ec_category.description   IS '설명';
COMMENT ON COLUMN ec_category.reg_date      IS '등록일';
COMMENT ON COLUMN ec_category.upd_date      IS '수정일';
