-- ============================================================
-- dp_ui_area : 디스플레이 UI-영역 매핑
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE dp_ui_area (
    ui_area_id          VARCHAR(21)     NOT NULL,
    ui_id               VARCHAR(21)     NOT NULL,              -- FK: dp_ui.ui_id
    area_id             VARCHAR(21)     NOT NULL,              -- FK: dp_area.area_id
    area_sort_ord       INTEGER         DEFAULT 0,              -- 영역정렬순서
    visibility_targets  VARCHAR(200),                           -- 공개대상 (^CODE^CODE^ 형식)
    disp_env            VARCHAR(50)     DEFAULT '^PROD^',       -- 전시 환경 (^PROD^DEV^TEST^ 형식)
    disp_yn             CHAR(1)         DEFAULT 'Y',            -- 전시여부 Y/N
    disp_start_date     DATE,                                   -- 전시시작일
    disp_start_time     TIME,                                   -- 전시시작시간
    disp_end_date       DATE,                                   -- 전시종료일
    disp_end_time       TIME,                                   -- 전시종료시간
    use_yn              CHAR(1)         DEFAULT 'Y',            -- 사용여부 Y/N
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30),
    upd_date            TIMESTAMP,
    PRIMARY KEY (ui_area_id),
    UNIQUE (ui_id, area_id),
    FOREIGN KEY (ui_id) REFERENCES dp_ui(ui_id),
    FOREIGN KEY (area_id) REFERENCES dp_area(area_id)
);

COMMENT ON TABLE dp_ui_area IS '디스플레이 UI-영역 매핑';
COMMENT ON COLUMN dp_ui_area.ui_area_id    IS 'UI영역ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN dp_ui_area.ui_id         IS 'UIID (dp_ui.ui_id)';
COMMENT ON COLUMN dp_ui_area.area_id         IS '영역ID (dp_area.area_id)';
COMMENT ON COLUMN dp_ui_area.area_sort_ord      IS '영역정렬순서';
COMMENT ON COLUMN dp_ui_area.visibility_targets IS '공개대상 (코드: VISIBILITY_TARGET, ^CODE^CODE^ 형식)';
COMMENT ON COLUMN dp_ui_area.disp_env           IS '전시 환경 (^PROD^DEV^TEST^ 형식)';
COMMENT ON COLUMN dp_ui_area.disp_yn            IS '전시여부 (Y/N) - 배치로 자동 관리';
COMMENT ON COLUMN dp_ui_area.disp_start_date    IS '전시시작일';
COMMENT ON COLUMN dp_ui_area.disp_start_time    IS '전시시작시간';
COMMENT ON COLUMN dp_ui_area.disp_end_date      IS '전시종료일';
COMMENT ON COLUMN dp_ui_area.disp_end_time      IS '전시종료시간';
COMMENT ON COLUMN dp_ui_area.use_yn             IS '사용여부 (Y/N)';
COMMENT ON COLUMN dp_ui_area.reg_by        IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN dp_ui_area.reg_date      IS '등록일';
COMMENT ON COLUMN dp_ui_area.upd_by        IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN dp_ui_area.upd_date      IS '수정일';

CREATE INDEX idx_dp_ui_area_ui ON dp_ui_area (ui_id);
CREATE INDEX idx_dp_ui_area_area ON dp_ui_area (area_id);
CREATE INDEX idx_dp_ui_area_visibility ON dp_ui_area (visibility_targets);
CREATE INDEX idx_dp_ui_area_ord ON dp_ui_area (ui_id, area_sort_ord);
CREATE INDEX idx_dp_ui_area_disp_yn ON dp_ui_area (disp_yn);
CREATE INDEX idx_dp_ui_area_disp_date ON dp_ui_area (disp_start_date, disp_end_date);
