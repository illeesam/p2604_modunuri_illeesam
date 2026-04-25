-- ============================================================
-- sy_contact : 고객문의 (1:1 문의)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE sy_contact (
    contact_id      VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    member_id       VARCHAR(21),
    member_nm       VARCHAR(50),
    category_cd     VARCHAR(30),                            -- 코드: 문의유형
    contact_title   VARCHAR(200)    NOT NULL,
    contact_content TEXT            NOT NULL,
    attach_grp_id   VARCHAR(21),
    contact_status_cd VARCHAR(20)     DEFAULT 'PENDING',      -- 코드: CONTACT_STATUS
    contact_answer  TEXT,
    answer_user_id       VARCHAR(21),
    answer_date     TIMESTAMP,
    contact_date    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (contact_id)
);

COMMENT ON TABLE  sy_contact                IS '고객문의';
COMMENT ON COLUMN sy_contact.contact_id     IS '문의ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_contact.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_contact.member_id      IS '회원ID';
COMMENT ON COLUMN sy_contact.member_nm      IS '문의자명';
COMMENT ON COLUMN sy_contact.category_cd    IS '문의유형';
COMMENT ON COLUMN sy_contact.contact_title  IS '제목';
COMMENT ON COLUMN sy_contact.contact_content IS '문의내용';
COMMENT ON COLUMN sy_contact.attach_grp_id  IS '첨부파일그룹ID';
COMMENT ON COLUMN sy_contact.contact_status_cd IS '처리상태 (코드: CONTACT_STATUS)';
COMMENT ON COLUMN sy_contact.contact_answer IS '답변내용';
COMMENT ON COLUMN sy_contact.answer_user_id      IS '답변자 (sy_user.user_id)';
COMMENT ON COLUMN sy_contact.answer_date    IS '답변일시';
COMMENT ON COLUMN sy_contact.contact_date   IS '문의일시';
COMMENT ON COLUMN sy_contact.reg_by         IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_contact.reg_date       IS '등록일';
COMMENT ON COLUMN sy_contact.upd_by         IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_contact.upd_date       IS '수정일';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_contact.contact_status_cd (처리상태) : 문의상태 { RECEIVED:접수, IN_PROGRESS:처리중, DONE:완료, ON_HOLD:보류 }
