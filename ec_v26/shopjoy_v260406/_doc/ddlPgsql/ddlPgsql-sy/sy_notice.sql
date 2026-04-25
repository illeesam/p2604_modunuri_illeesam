-- ============================================================
-- sy_notice : 공지사항
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE sy_notice (
    notice_id       VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    notice_title    VARCHAR(200)    NOT NULL,
    notice_type_cd  VARCHAR(30),                            -- 코드: NOTICE_TYPE
    is_fixed        CHAR(1)         DEFAULT 'N',            -- 상단고정 Y/N
    content_html    TEXT,
    attach_grp_id   VARCHAR(21),
    start_date      TIMESTAMP,
    end_date        TIMESTAMP,
    notice_status_cd VARCHAR(20)     DEFAULT 'ACTIVE',       -- ACTIVE/INACTIVE
    view_count      INTEGER         DEFAULT 0,
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (notice_id)
);

COMMENT ON TABLE  sy_notice               IS '공지사항';
COMMENT ON COLUMN sy_notice.notice_id     IS '공지ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_notice.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_notice.notice_title  IS '제목';
COMMENT ON COLUMN sy_notice.notice_type_cd IS '공지유형 (코드: NOTICE_TYPE)';
COMMENT ON COLUMN sy_notice.is_fixed      IS '상단고정 Y/N';
COMMENT ON COLUMN sy_notice.content_html  IS '내용 (HTML)';
COMMENT ON COLUMN sy_notice.attach_grp_id IS '첨부파일그룹ID';
COMMENT ON COLUMN sy_notice.start_date    IS '노출시작일';
COMMENT ON COLUMN sy_notice.end_date      IS '노출종료일';
COMMENT ON COLUMN sy_notice.notice_status_cd IS '상태 (ACTIVE/INACTIVE)';
COMMENT ON COLUMN sy_notice.view_count    IS '조회수';
COMMENT ON COLUMN sy_notice.reg_by        IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_notice.reg_date      IS '등록일';
COMMENT ON COLUMN sy_notice.upd_by        IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_notice.upd_date      IS '수정일';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_notice.notice_type_cd (공지유형) : 공지유형 { NORMAL:일반, URGENT:긴급 }
