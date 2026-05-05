-- sy_bbm 테이블 DDL
-- 게시판 마스터

CREATE TABLE shopjoy_2604.sy_bbm (
    bbm_id          VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id         VARCHAR(21) ,
    bbm_code        VARCHAR(50)  NOT NULL,
    bbm_nm          VARCHAR(100) NOT NULL,
    path_id         VARCHAR(21) ,
    bbm_type_cd     VARCHAR(20)  DEFAULT 'NORMAL',
    allow_comment   VARCHAR(1)   DEFAULT 'N',
    allow_attach    VARCHAR(1)   DEFAULT 'N',
    allow_like      VARCHAR(1)   DEFAULT 'N',
    content_type_cd VARCHAR(20)  DEFAULT 'TEXT',
    scope_type_cd   VARCHAR(20)  DEFAULT 'ALL',
    sort_ord        INTEGER      DEFAULT 0,
    use_yn          VARCHAR(1)   DEFAULT 'Y',
    bbm_remark      VARCHAR(300),
    reg_by          VARCHAR(30) ,
    reg_date        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30) ,
    upd_date        TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.sy_bbm IS '게시판 마스터';
COMMENT ON COLUMN shopjoy_2604.sy_bbm.bbm_id IS '게시판ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.sy_bbm.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.sy_bbm.bbm_code IS '게시판코드';
COMMENT ON COLUMN shopjoy_2604.sy_bbm.bbm_nm IS '게시판명';
COMMENT ON COLUMN shopjoy_2604.sy_bbm.bbm_type_cd IS '게시판유형 (코드: BBM_TYPE — NORMAL/FAQ/REVIEW/QNA)';
COMMENT ON COLUMN shopjoy_2604.sy_bbm.allow_comment IS '댓글허용 Y/N';
COMMENT ON COLUMN shopjoy_2604.sy_bbm.allow_attach IS '첨부허용 Y/N';
COMMENT ON COLUMN shopjoy_2604.sy_bbm.allow_like IS '좋아요허용 Y/N';
COMMENT ON COLUMN shopjoy_2604.sy_bbm.content_type_cd IS '내용유형 (코드: BBM_CONTENT_TYPE — TEXT/HTML)';
COMMENT ON COLUMN shopjoy_2604.sy_bbm.scope_type_cd IS '접근범위 (코드: BBM_SCOPE_TYPE — ALL/MEMBER/ADMIN)';
COMMENT ON COLUMN shopjoy_2604.sy_bbm.sort_ord IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.sy_bbm.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.sy_bbm.bbm_remark IS '비고';
COMMENT ON COLUMN shopjoy_2604.sy_bbm.reg_by IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_bbm.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.sy_bbm.upd_by IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_bbm.upd_date IS '수정일';

CREATE UNIQUE INDEX sy_bbm_bbm_code_key ON shopjoy_2604.sy_bbm USING btree (bbm_code);
