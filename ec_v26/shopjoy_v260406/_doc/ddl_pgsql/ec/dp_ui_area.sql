-- dp_ui_area 테이블 DDL
-- 디스플레이 UI-영역 매핑

CREATE TABLE shopjoy_2604.dp_ui_area (
    ui_area_id         VARCHAR(21)  NOT NULL PRIMARY KEY,
    ui_id              VARCHAR(21)  NOT NULL,
    area_id            VARCHAR(21)  NOT NULL,
    area_sort_ord      INTEGER      DEFAULT 0,
    visibility_targets VARCHAR(200),
    disp_env           VARCHAR(50)  DEFAULT '^PROD^',
    disp_yn            VARCHAR(1)   DEFAULT 'Y',
    disp_start_dt      TIMESTAMP   ,
    disp_end_dt        TIMESTAMP   ,
    use_yn             VARCHAR(1)   DEFAULT 'Y',
    reg_by             VARCHAR(30) ,
    reg_date           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by             VARCHAR(30) ,
    upd_date           TIMESTAMP   ,
    CONSTRAINT dp_ui_area_area_id_fkey FOREIGN KEY (area_id) REFERENCES shopjoy_2604.dp_area (area_id),
    CONSTRAINT dp_ui_area_ui_id_fkey FOREIGN KEY (ui_id) REFERENCES shopjoy_2604.dp_ui (ui_id)
);

COMMENT ON TABLE  shopjoy_2604.dp_ui_area IS '디스플레이 UI-영역 매핑';
COMMENT ON COLUMN shopjoy_2604.dp_ui_area.ui_area_id IS 'UI영역ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.dp_ui_area.ui_id IS 'UIID (dp_ui.ui_id)';
COMMENT ON COLUMN shopjoy_2604.dp_ui_area.area_id IS '영역ID (dp_area.area_id)';
COMMENT ON COLUMN shopjoy_2604.dp_ui_area.area_sort_ord IS '영역정렬순서';
COMMENT ON COLUMN shopjoy_2604.dp_ui_area.visibility_targets IS '공개대상 (코드: VISIBILITY_TARGET, ^CODE^CODE^ 형식)';
COMMENT ON COLUMN shopjoy_2604.dp_ui_area.disp_env IS '전시 환경 (^PROD^DEV^TEST^ 형식)';
COMMENT ON COLUMN shopjoy_2604.dp_ui_area.disp_yn IS '전시여부 (Y/N) - 배치로 자동 관리';
COMMENT ON COLUMN shopjoy_2604.dp_ui_area.disp_start_dt IS '전시시작일시';
COMMENT ON COLUMN shopjoy_2604.dp_ui_area.disp_end_dt IS '전시종료일시';
COMMENT ON COLUMN shopjoy_2604.dp_ui_area.use_yn IS '사용여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.dp_ui_area.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.dp_ui_area.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.dp_ui_area.upd_by IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.dp_ui_area.upd_date IS '수정일';

CREATE UNIQUE INDEX dp_ui_area_ui_id_area_id_key ON shopjoy_2604.dp_ui_area USING btree (ui_id, area_id);
CREATE INDEX idx_dp_ui_area_area ON shopjoy_2604.dp_ui_area USING btree (area_id);
CREATE INDEX idx_dp_ui_area_disp_date ON shopjoy_2604.dp_ui_area USING btree (disp_start_dt, disp_end_dt);
CREATE INDEX idx_dp_ui_area_disp_yn ON shopjoy_2604.dp_ui_area USING btree (disp_yn);
CREATE INDEX idx_dp_ui_area_ord ON shopjoy_2604.dp_ui_area USING btree (ui_id, area_sort_ord);
CREATE INDEX idx_dp_ui_area_ui ON shopjoy_2604.dp_ui_area USING btree (ui_id);
CREATE INDEX idx_dp_ui_area_visibility ON shopjoy_2604.dp_ui_area USING btree (visibility_targets);
