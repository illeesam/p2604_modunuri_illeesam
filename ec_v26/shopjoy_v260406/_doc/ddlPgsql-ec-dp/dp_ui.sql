-- ============================================================
-- dp_ui : 디스플레이 UI
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE dp_ui (
    ui_id           VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    ui_cd           VARCHAR(50)     NOT NULL,               -- 예: MOBILE_MAIN, PC_MAIN, EVENT_PAGE
    ui_nm           VARCHAR(100)    NOT NULL,
    ui_desc         VARCHAR(300),
    device_type_cd  VARCHAR(30),                            -- MOBILE/PC/TABLET 등
    ui_path         VARCHAR(200),                           -- 경로 (예: /index, /event/2026-spring)
    sort_ord        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',            -- 사용여부 (Y/N)
    use_start_date  DATE,                                   -- 사용시작일
    use_end_date    DATE,                                   -- 사용종료일
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (ui_id),
    UNIQUE (site_id, ui_cd)
);

COMMENT ON TABLE dp_ui IS '디스플레이 UI (최상위 화면 정의)';
COMMENT ON COLUMN dp_ui.ui_id          IS 'UIID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN dp_ui.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN dp_ui.ui_cd          IS 'UI코드 (예: MOBILE_MAIN, PC_MAIN)';
COMMENT ON COLUMN dp_ui.ui_nm          IS 'UI명';
COMMENT ON COLUMN dp_ui.ui_desc        IS 'UI설명';
COMMENT ON COLUMN dp_ui.device_type_cd IS '디바이스유형 (코드: DEVICE_TYPE)';
COMMENT ON COLUMN dp_ui.ui_path        IS '페이지경로';
COMMENT ON COLUMN dp_ui.sort_ord       IS '정렬순서';
COMMENT ON COLUMN dp_ui.use_yn         IS '사용여부 (Y/N)';
COMMENT ON COLUMN dp_ui.use_start_date IS '사용시작일';
COMMENT ON COLUMN dp_ui.use_end_date   IS '사용종료일';
COMMENT ON COLUMN dp_ui.reg_by         IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN dp_ui.reg_date       IS '등록일';
COMMENT ON COLUMN dp_ui.upd_by         IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN dp_ui.upd_date       IS '수정일';

CREATE INDEX idx_dp_ui_site ON dp_ui (site_id);
CREATE INDEX idx_dp_ui_device ON dp_ui (device_type_cd);
CREATE INDEX idx_dp_ui_use ON dp_ui (use_yn, use_start_date, use_end_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] dp_ui.device_type_cd (디바이스유형) : DEVICE_TYPE { PC:PC, MOBILE:모바일, APP:앱, ALL:전체 }
