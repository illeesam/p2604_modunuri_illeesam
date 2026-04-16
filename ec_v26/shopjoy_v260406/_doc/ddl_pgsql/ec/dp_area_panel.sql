-- ============================================================
-- dp_area_panel : 디스플레이 영역-패널 매핑
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE dp_area_panel (
    area_panel_id       VARCHAR(16)     NOT NULL,
    area_id             VARCHAR(16)     NOT NULL,              -- FK: dp_area.area_id
    panel_id            VARCHAR(16)     NOT NULL,              -- FK: dp_panel.panel_id
    panel_sort_ord      INTEGER         DEFAULT 0,              -- 패널정렬순서
    visibility_targets  VARCHAR(200),                           -- 공개대상 (^CODE^CODE^ 형식)
    use_yn              CHAR(1)         DEFAULT 'Y',            -- 사용여부 Y/N
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(16),
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
COMMENT ON COLUMN dp_area_panel.use_yn             IS '사용여부 (Y/N)';
COMMENT ON COLUMN dp_area_panel.reg_by           IS '등록자 (sy_user.user_id, mb_mem.member_id)';
COMMENT ON COLUMN dp_area_panel.reg_date         IS '등록일';
COMMENT ON COLUMN dp_area_panel.upd_by           IS '수정자 (sy_user.user_id, mb_mem.member_id)';
COMMENT ON COLUMN dp_area_panel.upd_date         IS '수정일';

CREATE INDEX idx_dp_area_panel_area ON dp_area_panel (area_id);
CREATE INDEX idx_dp_area_panel_panel ON dp_area_panel (panel_id);
CREATE INDEX idx_dp_area_panel_visibility ON dp_area_panel (visibility_targets);
CREATE INDEX idx_dp_area_panel_ord ON dp_area_panel (area_id, panel_sort_ord);
