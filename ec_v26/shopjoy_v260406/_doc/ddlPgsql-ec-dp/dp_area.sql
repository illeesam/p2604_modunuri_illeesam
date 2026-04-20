-- ============================================================
-- dp_area : 디스플레이 영역
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE dp_area (
    area_id         VARCHAR(21)     NOT NULL,
    ui_id           VARCHAR(21)     NOT NULL,              -- FK: dp_ui.ui_id
    site_id         VARCHAR(21),                            -- sy_site.site_id
    area_cd         VARCHAR(50)     NOT NULL,               -- 예: MAIN_TOP, MAIN_BANNER, SIDEBAR_MID
    area_nm         VARCHAR(100)    NOT NULL,
    area_type_cd    VARCHAR(30),                            -- FULL/SIDEBAR/POPUP 등
    area_desc       VARCHAR(300),
    disp_path       VARCHAR(200),                            -- 점(.) 구분 표시경로 (예: FRONT.모바일메인)
    use_yn          CHAR(1)         DEFAULT 'Y',            -- 사용여부 (Y/N)
    use_start_date  DATE,                                   -- 사용시작일
    use_end_date    DATE,                                   -- 사용종료일
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (area_id),
    UNIQUE (site_id, area_cd),
    FOREIGN KEY (ui_id) REFERENCES dp_ui(ui_id)
);

COMMENT ON TABLE dp_area IS '디스플레이 영역';
COMMENT ON COLUMN dp_area.area_id      IS '영역ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN dp_area.ui_id        IS 'UIID (dp_ui.ui_id)';
COMMENT ON COLUMN dp_area.site_id      IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN dp_area.area_cd      IS '영역코드 (예: MAIN_TOP, SIDEBAR_MID)';
COMMENT ON COLUMN dp_area.area_nm      IS '영역명';
COMMENT ON COLUMN dp_area.area_type_cd IS '영역유형 (코드: DISP_AREA_TYPE)';
COMMENT ON COLUMN dp_area.area_desc    IS '영역설명';
COMMENT ON COLUMN dp_area.disp_path    IS '점(.) 구분 표시경로';
COMMENT ON COLUMN dp_area.use_yn       IS '사용여부 (Y/N)';
COMMENT ON COLUMN dp_area.use_start_date IS '사용시작일';
COMMENT ON COLUMN dp_area.use_end_date   IS '사용종료일';
COMMENT ON COLUMN dp_area.reg_by       IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN dp_area.reg_date     IS '등록일';
COMMENT ON COLUMN dp_area.upd_by       IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN dp_area.upd_date     IS '수정일';

CREATE INDEX idx_dp_area_ui ON dp_area (ui_id);
CREATE INDEX idx_dp_area_site ON dp_area (site_id);
CREATE INDEX idx_dp_area_use ON dp_area (use_yn, use_start_date, use_end_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] dp_area.area_type_cd (영역유형) : DISP_AREA_TYPE { FULL:전체폭, SIDEBAR:사이드바, POPUP:팝업, INLINE:인라인 }
