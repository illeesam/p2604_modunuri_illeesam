-- dp_ui 테이블 DDL
-- 디스플레이 UI (최상위 화면 정의)

CREATE TABLE shopjoy_2604.dp_ui (
    ui_id          VARCHAR(21)  NOT NULL CONSTRAINT dp_ui_pk_ui_id PRIMARY KEY,
    reg_site_id        VARCHAR(21)  NOT NULL,
    ui_cd          VARCHAR(50)  NOT NULL,
    ui_nm          VARCHAR(100) NOT NULL,
    ui_desc        VARCHAR(300),
    device_type_cd VARCHAR(30) ,
    path_id        VARCHAR(21) ,
    sort_ord       INTEGER      DEFAULT 0,
    use_yn         VARCHAR(1)   DEFAULT 'Y'::bpchar,
    use_start_date DATE        ,
    use_end_date   DATE        ,
    reg_by         VARCHAR(30) ,
    reg_date       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by         VARCHAR(30) ,
    upd_date       TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.dp_ui IS '디스플레이 UI (최상위 화면 정의)';
COMMENT ON COLUMN shopjoy_2604.dp_ui.ui_id IS 'UIID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.dp_ui.reg_site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.dp_ui.ui_cd IS 'UI코드 (예: MOBILE_MAIN, PC_MAIN)';
COMMENT ON COLUMN shopjoy_2604.dp_ui.ui_nm IS 'UI명';
COMMENT ON COLUMN shopjoy_2604.dp_ui.ui_desc IS 'UI설명';
COMMENT ON COLUMN shopjoy_2604.dp_ui.device_type_cd IS '디바이스유형 (코드: DEVICE_TYPE)';
COMMENT ON COLUMN shopjoy_2604.dp_ui.path_id IS '페이지경로';
COMMENT ON COLUMN shopjoy_2604.dp_ui.sort_ord IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.dp_ui.use_yn IS '사용여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.dp_ui.use_start_date IS '사용시작일';
COMMENT ON COLUMN shopjoy_2604.dp_ui.use_end_date IS '사용종료일';
COMMENT ON COLUMN shopjoy_2604.dp_ui.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.dp_ui.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.dp_ui.upd_by IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.dp_ui.upd_date IS '수정일';

CREATE UNIQUE INDEX dp_ui_uk_site ON shopjoy_2604.dp_ui USING btree (site_id, ui_cd);
CREATE INDEX dp_ui_ix01_device_type_cd ON shopjoy_2604.dp_ui USING btree (device_type_cd);
CREATE INDEX dp_ui_ix02_use_yn_use_start_date_x3 ON shopjoy_2604.dp_ui USING btree (use_yn, use_start_date, use_end_date);
