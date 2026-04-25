-- ============================================================
-- 코드 그룹
CREATE TABLE sy_code_grp (
    code_grp_id     VARCHAR(21)     NOT NULL,       -- 코드그룹ID (YYMMDDhhmmss+rand4)
    site_id         VARCHAR(21),                    -- sy_site.site_id
    code_grp        VARCHAR(50)     NOT NULL,       -- 코드그룹코드 (예: MEMBER_GRADE)
    grp_nm          VARCHAR(100)    NOT NULL,
    disp_path       VARCHAR(200),                   -- 점(.) 구분 표시경로 (예: order.payment)
    code_grp_desc   VARCHAR(300),
    use_yn          CHAR(1)         DEFAULT 'Y',
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (code_grp_id),
    UNIQUE (site_id, code_grp)
);

COMMENT ON TABLE  sy_code_grp               IS '공통코드 그룹';
COMMENT ON COLUMN sy_code_grp.code_grp_id   IS '코드그룹ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_code_grp.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_code_grp.code_grp      IS '코드그룹코드 (예: MEMBER_GRADE, UNIQUE with site_id)';
COMMENT ON COLUMN sy_code_grp.grp_nm        IS '그룹명';
COMMENT ON COLUMN sy_code_grp.disp_path     IS '점(.) 구분 표시경로 (트리 빌드용)';
COMMENT ON COLUMN sy_code_grp.code_grp_desc IS '코드그룹설명';
COMMENT ON COLUMN sy_code_grp.use_yn        IS '사용여부 Y/N';
COMMENT ON COLUMN sy_code_grp.reg_by        IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_code_grp.reg_date      IS '등록일';
COMMENT ON COLUMN sy_code_grp.upd_by        IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_code_grp.upd_date      IS '수정일';

CREATE INDEX idx_sy_code_grp_code ON sy_code_grp (code_grp);
