-- ============================================================
-- dp_area_panel : 디스플레이 영역-패널 매핑
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE dp_area_panel (
    area_panel_id       VARCHAR(21)     NOT NULL,
    area_id             VARCHAR(21)     NOT NULL,              -- FK: dp_area.area_id
    panel_id            VARCHAR(21)     NOT NULL,              -- FK: dp_panel.panel_id
    panel_sort_ord      INTEGER         DEFAULT 0,              -- 패널정렬순서
    visibility_targets  VARCHAR(200),                           -- 공개대상 (^CODE^CODE^ 형식)
    disp_yn             CHAR(1)         DEFAULT 'Y',            -- 전시여부 Y/N
    disp_start_date     DATE,                                   -- 전시시작일
    disp_start_time     TIME,                                   -- 전시시작시간
    disp_end_date       DATE,                                   -- 전시종료일
    disp_end_time       TIME,                                   -- 전시종료시간
    disp_env            VARCHAR(50)     DEFAULT '^PROD^',       -- 전시 환경 (^PROD^DEV^TEST^ 형식)
    use_yn              CHAR(1)         DEFAULT 'Y',            -- 사용여부 Y/N
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30),
    upd_date            TIMESTAMP,
    PRIMARY KEY (area_panel_id),
    UNIQUE (area_id, panel_id),
    FOREIGN KEY (area_id) REFERENCES dp_area(area_id),
    FOREIGN KEY (panel_id) REFERENCES dp_panel(panel_id)
);

COMMENT ON TABLE dp_area_panel IS '디스플레이 영역-패널 매핑';
COMMENT ON COLUMN dp_area_panel.area_panel_id    IS '영역패널ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN dp_area_panel.area_id          IS '영역ID (dp_area.area_id)';
COMMENT ON COLUMN dp_area_panel.panel_id           IS '패널ID (dp_panel.panel_id)';
COMMENT ON COLUMN dp_area_panel.panel_sort_ord      IS '패널정렬순서';
COMMENT ON COLUMN dp_area_panel.visibility_targets IS '공개대상 (코드: VISIBILITY_TARGET, ^CODE^CODE^ 형식)';
COMMENT ON COLUMN dp_area_panel.disp_yn            IS '전시여부 (Y/N) - 배치로 자동 관리';
COMMENT ON COLUMN dp_area_panel.disp_start_date    IS '전시시작일';
COMMENT ON COLUMN dp_area_panel.disp_start_time    IS '전시시작시간';
COMMENT ON COLUMN dp_area_panel.disp_end_date      IS '전시종료일';
COMMENT ON COLUMN dp_area_panel.disp_end_time      IS '전시종료시간';
COMMENT ON COLUMN dp_area_panel.disp_env           IS '전시 환경 (^PROD^DEV^TEST^ 형식)';
COMMENT ON COLUMN dp_area_panel.use_yn             IS '사용여부 (Y/N)';
COMMENT ON COLUMN dp_area_panel.reg_by           IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN dp_area_panel.reg_date         IS '등록일';
COMMENT ON COLUMN dp_area_panel.upd_by           IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN dp_area_panel.upd_date         IS '수정일';

CREATE INDEX idx_dp_area_panel_area ON dp_area_panel (area_id);
CREATE INDEX idx_dp_area_panel_panel ON dp_area_panel (panel_id);
CREATE INDEX idx_dp_area_panel_visibility ON dp_area_panel (visibility_targets);
CREATE INDEX idx_dp_area_panel_ord ON dp_area_panel (area_id, panel_sort_ord);
CREATE INDEX idx_dp_area_panel_disp_yn ON dp_area_panel (disp_yn);
CREATE INDEX idx_dp_area_panel_disp_date ON dp_area_panel (disp_start_date, disp_end_date);
CREATE INDEX idx_dp_area_panel_disp_env ON dp_area_panel (disp_env);
