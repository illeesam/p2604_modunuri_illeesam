-- mb_member_group 테이블 DDL
-- 회원그룹

CREATE TABLE shopjoy_2604.mb_member_group (
    member_group_id VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id         VARCHAR(21)  NOT NULL,
    group_nm        VARCHAR(100) NOT NULL,
    group_memo      TEXT        ,
    use_yn          VARCHAR(1)   DEFAULT 'Y'::character varying,
    reg_by          VARCHAR(30) ,
    reg_date        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30) ,
    upd_date        TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.mb_member_group IS '회원그룹';
COMMENT ON COLUMN shopjoy_2604.mb_member_group.member_group_id IS '그룹ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.mb_member_group.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.mb_member_group.group_nm IS '그룹명';
COMMENT ON COLUMN shopjoy_2604.mb_member_group.group_memo IS '메모';
COMMENT ON COLUMN shopjoy_2604.mb_member_group.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.mb_member_group.reg_by IS '등록자ID';
COMMENT ON COLUMN shopjoy_2604.mb_member_group.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.mb_member_group.upd_by IS '수정자ID';
COMMENT ON COLUMN shopjoy_2604.mb_member_group.upd_date IS '수정일시';

CREATE INDEX idx_mb_member_group_site ON shopjoy_2604.mb_member_group USING btree (site_id);
