-- ============================================================
-- ec_like : 좋아요 (위시리스트)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE mb_like (
    like_id         VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    member_id       VARCHAR(16)     NOT NULL,               -- mb_mem.member_id
    target_type_cd  VARCHAR(20)     NOT NULL,               -- 코드: LIKE_TARGET_TYPE (PRODUCT/BLOG/EVENT)
    target_id       VARCHAR(16)     NOT NULL,               -- 대상ID (pd_prod.prod_id 등)
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (like_id)
);

COMMENT ON TABLE mb_like IS '좋아요 (위시리스트)';
COMMENT ON COLUMN mb_like.like_id      IS '좋아요ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN mb_like.site_id      IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN mb_like.member_id    IS '회원ID (mb_mem.member_id)';
COMMENT ON COLUMN mb_like.target_type_cd IS '대상유형 (코드: LIKE_TARGET_TYPE — PRODUCT/BLOG/EVENT)';
COMMENT ON COLUMN mb_like.target_id    IS '대상ID';
COMMENT ON COLUMN mb_like.reg_by       IS '등록자';
COMMENT ON COLUMN mb_like.reg_date     IS '등록일';
COMMENT ON COLUMN mb_like.upd_by       IS '수정자';
COMMENT ON COLUMN mb_like.upd_date     IS '수정일';

CREATE UNIQUE INDEX idx_mb_like_unique ON mb_like (member_id, target_type_cd, target_id);
CREATE INDEX idx_mb_like_member        ON mb_like (member_id);
CREATE INDEX idx_mb_like_target        ON mb_like (target_type_cd, target_id);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- mb_like.target_type_cd (대상유형) : LIKE_TARGET_TYPE(LIKE_TARGET_TYPE) { 코드값 미정의 }
