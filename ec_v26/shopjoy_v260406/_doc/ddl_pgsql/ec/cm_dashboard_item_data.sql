-- cm_dashboard_item_data 테이블 DDL
-- 대시보드 차트 패널 집계 데이터
--
-- 2026-08-21: 데이터관리(3레벨) 지원 컬럼 추가 — series_nm / site_id / period_type_cd / prod_id / vendor_id
--   1레벨 차트명   = cm_dashboard_item.item_nm  (dashboard_item_id 로 참조)
--   2레벨 시리즈명 = series_nm                   (데이터관리 그리드의 "행 제목")
--   3레벨 항목명   = col1_nm ~ col9_nm           (데이터관리 그리드의 "열 제목")
--   → (차트 × 시리즈 × 기간 × 상품 × 업체) 한 조합이 한 행. 상세 → _doc/정책서/ec/cm/ 및
--     CmDashboardDataGridService

CREATE TABLE shopjoy_2604.cm_dashboard_item_data (
    dashboard_item_data_id character varying(21)       NOT NULL,
    dashboard_item_id      character varying(21)       NOT NULL,
    ui_nm                  character varying(100)      NOT NULL,
    item_key               character varying(50)       NOT NULL,
    yyyymmdd               character varying(8)        NOT NULL,
    series_nm              character varying(100)     ,
    site_id                character varying(21)      ,
    period_type_cd         character varying(1)       ,
    prod_id                character varying(21)      ,
    vendor_id              character varying(21)      ,
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
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.yyyymmdd IS '기준일자 (D=YYYYMMDD / M=YYYYMM00)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.series_nm IS '시리즈명 (2레벨 — 그리드 행 제목). NULL=단일 시리즈';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.site_id IS '사이트ID (sy_site.site_id) — 업무 소속 사이트(필수 기준조건)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.period_type_cd IS '기간구분 D:일자(yyyymmdd=YYYYMMDD) / M:월(yyyymmdd=YYYYMM00)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.prod_id IS '상품ID (pd_prod.prod_id) — 선택 기준조건';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.vendor_id IS '판매업체ID (sy_vendor.vendor_id) — 선택 기준조건';
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

-- ⚠ 아래 UNIQUE 는 (차트,일자) 당 1행이던 시절의 키다. 데이터관리(3레벨) 도입 후에는
--   같은 (차트,일자) 에 시리즈 수만큼 행이 생기므로 더 이상 실제 키가 아니다.
--   dept_id/user_id 가 NULL 인 행들은 PostgreSQL 이 NULL 을 서로 다르게 보아 UNIQUE 에 걸리지 않아
--   현재 동작에는 지장이 없다(데이터관리 행은 dept_id/user_id 를 쓰지 않는다).
--   실제 유일성((site_id, dashboard_item_id, yyyymmdd, series_nm, prod_id, vendor_id))은
--   CmDashboardDataGridService.saveGrids 가 "시리즈로 기존 행을 찾아 갱신" 하는 방식으로 보장한다
--   — 위 컬럼 다수가 NULL 가능이라 DB UNIQUE 로는 (NULL 취급 때문에) 강제되지 않는다.
CREATE UNIQUE INDEX cm_dashboard_item_data_ix01_dashboard_item_id_yyyymmdd_x4 ON shopjoy_2604.cm_dashboard_item_data USING btree (dashboard_item_id, yyyymmdd, dept_id, user_id);
CREATE INDEX cm_dashboard_item_data_ix02_user_id ON shopjoy_2604.cm_dashboard_item_data USING btree (user_id);
CREATE INDEX cm_dashboard_item_data_ix03_yyyymmdd ON shopjoy_2604.cm_dashboard_item_data USING btree (yyyymmdd);
-- 데이터관리 조회 기준조건 (사이트+차트+기간)
CREATE INDEX cm_dashboard_item_data_ix01_site_item ON shopjoy_2604.cm_dashboard_item_data USING btree (site_id, dashboard_item_id, yyyymmdd);

