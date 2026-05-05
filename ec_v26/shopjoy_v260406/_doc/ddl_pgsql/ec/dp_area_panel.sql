-- dp_area_panel 테이블 DDL
-- 디스플레이 영역-패널 매핑

CREATE TABLE shopjoy_2604.dp_area_panel (
    area_panel_id      VARCHAR(21)  NOT NULL PRIMARY KEY,
    area_id            VARCHAR(21)  NOT NULL,
    panel_id           VARCHAR(21)  NOT NULL,
    panel_sort_ord     INTEGER      DEFAULT 0,
    visibility_targets VARCHAR(200),
    disp_yn            VARCHAR(1)   DEFAULT 'Y',
    disp_start_date    DATE        ,
    disp_start_time    TIME        ,
    disp_end_date      DATE        ,
    disp_end_time      TIME        ,
    disp_env           VARCHAR(50)  DEFAULT '^PROD^',
    use_yn             VARCHAR(1)   DEFAULT 'Y',
    reg_by             VARCHAR(30) ,
    reg_date           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by             VARCHAR(30) ,
    upd_date           TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.dp_area_panel IS '디스플레이 영역-패널 매핑';
COMMENT ON COLUMN shopjoy_2604.dp_area_panel.area_panel_id IS '영역패널ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.dp_area_panel.area_id IS '영역ID (dp_area.area_id)';
COMMENT ON COLUMN shopjoy_2604.dp_area_panel.panel_id IS '패널ID (dp_panel.panel_id)';
COMMENT ON COLUMN shopjoy_2604.dp_area_panel.panel_sort_ord IS '패널정렬순서';
COMMENT ON COLUMN shopjoy_2604.dp_area_panel.visibility_targets IS '공개대상 (코드: VISIBILITY_TARGET, ^CODE^CODE^ 형식)';
COMMENT ON COLUMN shopjoy_2604.dp_area_panel.disp_yn IS '전시여부 (Y/N) - 배치로 자동 관리';
COMMENT ON COLUMN shopjoy_2604.dp_area_panel.disp_start_date IS '전시시작일';
COMMENT ON COLUMN shopjoy_2604.dp_area_panel.disp_start_time IS '전시시작시간';
COMMENT ON COLUMN shopjoy_2604.dp_area_panel.disp_end_date IS '전시종료일';
COMMENT ON COLUMN shopjoy_2604.dp_area_panel.disp_end_time IS '전시종료시간';
COMMENT ON COLUMN shopjoy_2604.dp_area_panel.disp_env IS '전시 환경 (^PROD^DEV^TEST^ 형식)';
COMMENT ON COLUMN shopjoy_2604.dp_area_panel.use_yn IS '사용여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.dp_area_panel.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.dp_area_panel.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.dp_area_panel.upd_by IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.dp_area_panel.upd_date IS '수정일';

CREATE UNIQUE INDEX dp_area_panel_area_id_panel_id_key ON shopjoy_2604.dp_area_panel USING btree (area_id, panel_id);
