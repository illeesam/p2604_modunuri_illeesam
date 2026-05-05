-- mb_like 테이블 DDL
-- 좋아요 (위시리스트)

CREATE TABLE shopjoy_2604.mb_like (
    like_id        VARCHAR(21) NOT NULL PRIMARY KEY,
    site_id        VARCHAR(21),
    member_id      VARCHAR(21) NOT NULL,
    target_type_cd VARCHAR(20) NOT NULL,
    target_id      VARCHAR(21) NOT NULL,
    reg_by         VARCHAR(30),
    reg_date       TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    upd_by         VARCHAR(30),
    upd_date       TIMESTAMP  
);

COMMENT ON TABLE  shopjoy_2604.mb_like IS '좋아요 (위시리스트)';
COMMENT ON COLUMN shopjoy_2604.mb_like.like_id IS '좋아요ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.mb_like.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.mb_like.member_id IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.mb_like.target_type_cd IS '대상유형 (코드: LIKE_TARGET_TYPE — PRODUCT/BLOG/EVENT)';
COMMENT ON COLUMN shopjoy_2604.mb_like.target_id IS '대상ID';
COMMENT ON COLUMN shopjoy_2604.mb_like.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.mb_like.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.mb_like.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.mb_like.upd_date IS '수정일';

CREATE INDEX idx_mb_like_member ON shopjoy_2604.mb_like USING btree (member_id);
CREATE INDEX idx_mb_like_target ON shopjoy_2604.mb_like USING btree (target_type_cd, target_id);
CREATE UNIQUE INDEX idx_mb_like_unique ON shopjoy_2604.mb_like USING btree (member_id, target_type_cd, target_id);
