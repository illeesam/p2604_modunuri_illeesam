-- ============================================================
-- sy_role : 역할 (권한그룹) / sy_role_menu : 역할-메뉴 매핑
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE sy_role (
    role_id         VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    role_code       VARCHAR(50)     NOT NULL,
    role_nm         VARCHAR(100)    NOT NULL,
    parent_role_id       VARCHAR(21),
    role_type_cd    VARCHAR(20),                            -- 코드: ROLE_TYPE (SYSTEM/CUSTOM)
    sort_ord        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',
    restrict_perm   CHAR(1)         DEFAULT 'N',            -- 제한권한여부
    role_remark     VARCHAR(300),
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    disp_path       VARCHAR(200),                           -- 점(.) 구분 표시경로
    PRIMARY KEY (role_id),
    UNIQUE (role_code)
);

COMMENT ON TABLE  sy_role                  IS '역할 (권한그룹)';
COMMENT ON COLUMN sy_role.role_id          IS '역할ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_role.site_id          IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_role.role_code        IS '역할코드';
COMMENT ON COLUMN sy_role.role_nm          IS '역할명';
COMMENT ON COLUMN sy_role.parent_role_id        IS '상위역할ID';
COMMENT ON COLUMN sy_role.role_type_cd     IS '역할유형 (코드: ROLE_TYPE — SYSTEM/CUSTOM)';
COMMENT ON COLUMN sy_role.sort_ord         IS '정렬순서';
COMMENT ON COLUMN sy_role.use_yn           IS '사용여부 Y/N';
COMMENT ON COLUMN sy_role.restrict_perm    IS '제한권한여부 Y/N';
COMMENT ON COLUMN sy_role.role_remark      IS '비고';
COMMENT ON COLUMN sy_role.reg_by           IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_role.reg_date         IS '등록일';
COMMENT ON COLUMN sy_role.upd_by           IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_role.upd_date         IS '수정일';
COMMENT ON COLUMN sy_role.disp_path IS '점(.) 구분 표시경로 (트리 빌드용)';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_role.role_type_cd (역할유형) : ROLE_TYPE { SUPER:최고관리자, ADMIN:관리자, VENDOR:업체, CS:고객서비스, VIEWER:조회자 }
