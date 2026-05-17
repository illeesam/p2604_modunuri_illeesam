-- dp_panel 테이블 DDL
-- 디스플레이 패널

CREATE TABLE shopjoy_2604.dp_panel (
    panel_id                    VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id                     VARCHAR(21)  NOT NULL,
    panel_nm                    VARCHAR(100) NOT NULL,
    panel_type_cd               VARCHAR(30) ,
    path_id                     VARCHAR(21) ,
    visibility_targets          VARCHAR(200),
    use_yn                      VARCHAR(1)   DEFAULT 'Y'::bpchar,
    use_start_date              DATE        ,
    use_end_date                DATE        ,
    disp_panel_status_cd        VARCHAR(20)  DEFAULT 'ACTIVE'::character varying,
    disp_panel_status_cd_before VARCHAR(20) ,
    content_json                TEXT        ,
    reg_by                      VARCHAR(30) ,
    reg_date                    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by                      VARCHAR(30) ,
    upd_date                    TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.dp_panel IS '디스플레이 패널';
COMMENT ON COLUMN shopjoy_2604.dp_panel.panel_id IS '패널ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.dp_panel.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.dp_panel.panel_nm IS '패널명';
COMMENT ON COLUMN shopjoy_2604.dp_panel.panel_type_cd IS '표시유형 (코드: DISP_TYPE)';
COMMENT ON COLUMN shopjoy_2604.dp_panel.path_id IS '점(.) 구분 표시경로';
COMMENT ON COLUMN shopjoy_2604.dp_panel.visibility_targets IS '공개대상 (코드: VISIBILITY_TARGET, ^CODE^CODE^ 형식)';
COMMENT ON COLUMN shopjoy_2604.dp_panel.use_yn IS '사용여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.dp_panel.use_start_date IS '사용시작일';
COMMENT ON COLUMN shopjoy_2604.dp_panel.use_end_date IS '사용종료일';
COMMENT ON COLUMN shopjoy_2604.dp_panel.disp_panel_status_cd IS '상태 (코드: DISP_STATUS)';
COMMENT ON COLUMN shopjoy_2604.dp_panel.disp_panel_status_cd_before IS '변경 전 패널상태 (코드: DISP_STATUS)';
COMMENT ON COLUMN shopjoy_2604.dp_panel.content_json IS '패널콘텐츠 (JSON - 위젯 목록 및 설정)';
COMMENT ON COLUMN shopjoy_2604.dp_panel.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.dp_panel.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.dp_panel.upd_by IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.dp_panel.upd_date IS '수정일';

CREATE INDEX idx_dp_panel_site ON shopjoy_2604.dp_panel USING btree (site_id);
