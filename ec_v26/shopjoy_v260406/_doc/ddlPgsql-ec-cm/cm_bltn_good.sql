-- ============================================================
-- ec_blog_like : 블로그 좋아요
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================

CREATE TABLE cm_bltn_good (
    like_id         VARCHAR(21)     NOT NULL,
    blog_id         VARCHAR(21)     NOT NULL,              -- FK: cm_bltn.blog_id
    user_id         VARCHAR(21)     NOT NULL,              -- FK: sy_member.user_id (회원만 가능)
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (like_id),
    UNIQUE (blog_id, user_id)                              -- 중복 방지
);

COMMENT ON TABLE cm_bltn_good IS '블로그 좋아요';
COMMENT ON COLUMN cm_bltn_good.like_id IS '좋아요ID';
COMMENT ON COLUMN cm_bltn_good.blog_id IS '블로그ID (cm_bltn.)';
COMMENT ON COLUMN cm_bltn_good.user_id IS '사용자ID (sy_member.user_id)';
COMMENT ON COLUMN cm_bltn_good.reg_date IS '등록일';
COMMENT ON COLUMN cm_bltn_good.reg_by   IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN cm_bltn_good.upd_by   IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN cm_bltn_good.upd_date IS '수정일';

CREATE INDEX idx_cm_bltn_good_blog ON cm_bltn_good (blog_id);
CREATE INDEX idx_cm_bltn_good_user ON cm_bltn_good (user_id);
