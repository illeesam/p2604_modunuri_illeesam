-- cm_dashboard_item_data 테이블 DDL
-- 대시보드 차트 패널 집계 데이터

CREATE TABLE shopjoy_2604.cm_dashboard_item_data (
    dashboard_item_data_id character varying(21)       NOT NULL,
    dashboard_item_id      character varying(21)       NOT NULL,
    ui_nm                  character varying(100)      NOT NULL,
    item_key               character varying(50)       NOT NULL,
    yyyymmdd               character varying(8)        NOT NULL,
    dept_id                character varying(21)      ,
    user_id                character varying(21)      ,
    data_json              text                       ,
    col1_nm                character varying(100)     ,
    col1_num               double precision           ,
    col2_nm                character varying(100)     ,
    col2_num               double precision           ,
    col3_nm                character varying(100)     ,
    col3_num               double precision           ,
    col4_nm                character varying(100)     ,
    col4_num               double precision           ,
    col5_nm                character varying(100)     ,
    col5_num               double precision           ,
    col6_nm                character varying(100)     ,
    col6_num               double precision           ,
    col7_nm                character varying(100)     ,
    col7_num               double precision           ,
    col8_nm                character varying(100)     ,
    col8_num               double precision           ,
    col9_nm                character varying(100)     ,
    col9_num               double precision           ,
    reg_by                 character varying(30)      ,
    reg_date               timestamp without time zone,
    upd_by                 character varying(30)      ,
    upd_date               timestamp without time zone,
    reg_site_id            character varying(21)      ,
    CONSTRAINT cm_dashboard_item_data_pk_dashboard_item_data_id PRIMARY KEY (dashboard_item_data_id)
);

COMMENT ON TABLE  shopjoy_2604.cm_dashboard_item_data IS '대시보드 차트 패널 집계 데이터';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.dashboard_item_data_id IS '데이터ID';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.dashboard_item_id IS '패널ID (cm_dashboard_item FK)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.ui_nm IS '대상화면명 (조회 편의용 역정규화)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.item_key IS '패널 키 (조회 편의용 역정규화)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.yyyymmdd IS '기준일자 (YYYYMMDD)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.dept_id IS '부서ID (부서별 집계 시 사용)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.user_id IS '사용자ID (개인별 집계 시 사용)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.data_json IS '유연한 집계 데이터 JSON ({labels:[...], series:[{name,data:[...]}]})';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col1_nm IS '지표1명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col1_num IS '지표1값';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col2_nm IS '지표2명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col2_num IS '지표2값';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col3_nm IS '지표3명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col3_num IS '지표3값';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col4_nm IS '지표4명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col4_num IS '지표4값';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col5_nm IS '지표5명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col5_num IS '지표5값';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col6_nm IS '지표6명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col6_num IS '지표6값';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col7_nm IS '지표7명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col7_num IS '지표7값';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col8_nm IS '지표8명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col8_num IS '지표8값';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col9_nm IS '지표9명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col9_num IS '지표9값';

CREATE UNIQUE INDEX cm_dashboard_item_data_ix01_dashboard_item_id_yyyymmdd_x4 ON shopjoy_2604.cm_dashboard_item_data USING btree (dashboard_item_id, yyyymmdd, dept_id, user_id);
CREATE INDEX cm_dashboard_item_data_ix02_user_id ON shopjoy_2604.cm_dashboard_item_data USING btree (user_id);
CREATE INDEX cm_dashboard_item_data_ix03_yyyymmdd ON shopjoy_2604.cm_dashboard_item_data USING btree (yyyymmdd);

