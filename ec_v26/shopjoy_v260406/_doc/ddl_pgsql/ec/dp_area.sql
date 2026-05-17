-- dp_area 테이블 DDL
-- 디스플레이 영역

CREATE TABLE shopjoy_2604.dp_area (
    area_id        VARCHAR(21)  NOT NULL PRIMARY KEY,
    ui_id          VARCHAR(21)  NOT NULL,
    site_id        VARCHAR(21)  NOT NULL,
    area_cd        VARCHAR(50)  NOT NULL,
    area_nm        VARCHAR(100) NOT NULL,
    area_type_cd   VARCHAR(30) ,
    area_desc      VARCHAR(300),
    path_id        VARCHAR(21) ,
    use_yn         VARCHAR(1)   DEFAULT 'Y'::bpchar,
    use_start_date DATE        ,
    use_end_date   DATE        ,
    reg_by         VARCHAR(30) ,
    reg_date       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by         VARCHAR(30) ,
    upd_date       TIMESTAMP   ,
    CONSTRAINT dp_area_ui_id_fkey FOREIGN KEY (ui_id) REFERENCES shopjoy_2604.dp_ui (ui_id)
);

COMMENT ON TABLE  shopjoy_2604.dp_area IS '디스플레이 영역';
COMMENT ON COLUMN shopjoy_2604.dp_area.area_id IS '영역ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.dp_area.ui_id IS 'UIID (dp_ui.ui_id)';
COMMENT ON COLUMN shopjoy_2604.dp_area.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.dp_area.area_cd IS '영역코드 (예: MAIN_TOP, SIDEBAR_MID)';
COMMENT ON COLUMN shopjoy_2604.dp_area.area_nm IS '영역명';
COMMENT ON COLUMN shopjoy_2604.dp_area.area_type_cd IS '영역유형 (코드: DISP_AREA_TYPE)';
COMMENT ON COLUMN shopjoy_2604.dp_area.area_desc IS '영역설명';
COMMENT ON COLUMN shopjoy_2604.dp_area.path_id IS '점(.) 구분 표시경로';
COMMENT ON COLUMN shopjoy_2604.dp_area.use_yn IS '사용여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.dp_area.use_start_date IS '사용시작일';
COMMENT ON COLUMN shopjoy_2604.dp_area.use_end_date IS '사용종료일';
COMMENT ON COLUMN shopjoy_2604.dp_area.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.dp_area.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.dp_area.upd_by IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.dp_area.upd_date IS '수정일';

CREATE UNIQUE INDEX dp_area_site_id_area_cd_key ON shopjoy_2604.dp_area USING btree (site_id, area_cd);
CREATE INDEX idx_dp_area_site ON shopjoy_2604.dp_area USING btree (site_id);
CREATE INDEX idx_dp_area_ui ON shopjoy_2604.dp_area USING btree (ui_id);
CREATE INDEX idx_dp_area_use ON shopjoy_2604.dp_area USING btree (use_yn, use_start_date, use_end_date);
