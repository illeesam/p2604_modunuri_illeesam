-- ============================================================
-- sy_template : 발송 템플릿 (이메일/SMS/PUSH/카카오)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE sy_template (
    template_id     VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    template_type_cd VARCHAR(20)    NOT NULL,               -- 코드: TEMPLATE_TYPE (EMAIL/SMS/PUSH/KAKAO)
    template_code   VARCHAR(50)     NOT NULL,
    template_nm     VARCHAR(100)    NOT NULL,
    template_subject VARCHAR(200),                           -- 이메일 제목
    template_content TEXT            NOT NULL,
    sample_params   TEXT,                                   -- 치환변수 예시 (JSON)
    use_yn          CHAR(1)         DEFAULT 'Y',
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    disp_path       VARCHAR(200),                           -- 점(.) 구분 표시경로
    PRIMARY KEY (template_id),
    UNIQUE (template_type_cd, template_code)
);

COMMENT ON TABLE  sy_template                IS '발송 템플릿';
COMMENT ON COLUMN sy_template.template_id    IS '템플릿ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_template.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_template.template_type_cd IS '템플릿유형 (코드: TEMPLATE_TYPE)';
COMMENT ON COLUMN sy_template.template_code  IS '템플릿코드';
COMMENT ON COLUMN sy_template.template_nm    IS '템플릿명';
COMMENT ON COLUMN sy_template.template_subject IS '제목 (이메일용)';
COMMENT ON COLUMN sy_template.template_content IS '내용 (치환변수 포함)';
COMMENT ON COLUMN sy_template.sample_params  IS '치환변수 예시 (JSON)';
COMMENT ON COLUMN sy_template.use_yn         IS '사용여부 Y/N';
COMMENT ON COLUMN sy_template.reg_by         IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_template.reg_date       IS '등록일';
COMMENT ON COLUMN sy_template.upd_by         IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_template.upd_date       IS '수정일';
COMMENT ON COLUMN sy_template.disp_path IS '점(.) 구분 표시경로 (트리 빌드용)';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_template.template_type_cd (템플릿유형) : 템플릿유형 { EMAIL:이메일, SMS:SMS, KAKAO:알림톡, PUSH:푸시 }
