-- cm_blog_good 테이블 DDL
-- 블로그 좋아요

CREATE TABLE shopjoy_2604.cm_blog_good (
    like_id  VARCHAR(21) NOT NULL PRIMARY KEY,
    blog_id  VARCHAR(21) NOT NULL,
    user_id  VARCHAR(21) NOT NULL,
    reg_date TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    reg_by   VARCHAR(30),
    upd_by   VARCHAR(30),
    upd_date TIMESTAMP  
);

COMMENT ON TABLE  shopjoy_2604.cm_blog_good IS '블로그 좋아요';
COMMENT ON COLUMN shopjoy_2604.cm_blog_good.like_id IS '좋아요ID';
COMMENT ON COLUMN shopjoy_2604.cm_blog_good.blog_id IS '블로그ID (cm_bltn.)';
COMMENT ON COLUMN shopjoy_2604.cm_blog_good.user_id IS '사용자ID (sy_member.user_id)';
COMMENT ON COLUMN shopjoy_2604.cm_blog_good.reg_date IS '등록일';

CREATE UNIQUE INDEX cm_bltn_good_blog_id_user_id_key ON shopjoy_2604.cm_blog_good USING btree (blog_id, user_id);
CREATE INDEX idx_cm_bltn_good_blog ON shopjoy_2604.cm_blog_good USING btree (blog_id);
CREATE INDEX idx_cm_bltn_good_user ON shopjoy_2604.cm_blog_good USING btree (user_id);
