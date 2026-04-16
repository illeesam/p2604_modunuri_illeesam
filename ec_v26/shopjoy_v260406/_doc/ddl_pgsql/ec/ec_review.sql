-- ============================================================
-- ec_review : 상품 리뷰
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE ec_review (
    review_id       VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    prod_id         VARCHAR(16)     NOT NULL,              -- ec_prod.prod_id
    member_id       VARCHAR(16)     NOT NULL,              -- ec_member.member_id
    review_title    VARCHAR(200)    NOT NULL,
    review_content  TEXT            NOT NULL,
    rating          NUMERIC(3,1)    NOT NULL,              -- 1.0 ~ 5.0
    helpful_cnt     INTEGER         DEFAULT 0,              -- 도움이 돼요 수
    unhelpful_cnt   INTEGER         DEFAULT 0,              -- 도움이 안 돼요 수
    review_status_cd VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: REVIEW_STATUS (ACTIVE/HIDDEN/DELETED)
    review_date     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (review_id)
);

COMMENT ON TABLE  ec_review                 IS '상품 리뷰';
COMMENT ON COLUMN ec_review.review_id       IS '리뷰ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN ec_review.site_id         IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN ec_review.prod_id         IS '상품ID (ec_prod.prod_id)';
COMMENT ON COLUMN ec_review.member_id       IS '회원ID (ec_member.member_id)';
COMMENT ON COLUMN ec_review.review_title    IS '리뷰 제목';
COMMENT ON COLUMN ec_review.review_content  IS '리뷰 내용';
COMMENT ON COLUMN ec_review.rating          IS '평점 (1.0~5.0)';
COMMENT ON COLUMN ec_review.helpful_cnt     IS '도움이 돼요 수';
COMMENT ON COLUMN ec_review.unhelpful_cnt   IS '도움이 안 돼요 수';
COMMENT ON COLUMN ec_review.review_status_cd IS '상태 (코드: REVIEW_STATUS)';
COMMENT ON COLUMN ec_review.review_date     IS '리뷰작성일';
COMMENT ON COLUMN ec_review.reg_by          IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN ec_review.reg_date        IS '등록일';
COMMENT ON COLUMN ec_review.upd_by          IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN ec_review.upd_date        IS '수정일';

CREATE INDEX idx_ec_review_prod ON ec_review (prod_id);
CREATE INDEX idx_ec_review_member ON ec_review (member_id);
CREATE INDEX idx_ec_review_status ON ec_review (review_status_cd);
CREATE INDEX idx_ec_review_date ON ec_review (review_date);
