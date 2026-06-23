-- ============================================================
-- cm_dashboard_data — 대시보드 차트 패널 집계 데이터
-- cm_dashboard_item.dashboard_item_id FK 보유
-- data_json: 날짜별 시리즈별 수치를 유연하게 저장
-- ============================================================
CREATE TABLE IF NOT EXISTS shopjoy_2604.cm_dashboard_data (
    dashboard_data_id   VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21)     NOT NULL,
    dashboard_item_id   VARCHAR(21)     NOT NULL,
    ui_nm               VARCHAR(100)    NOT NULL,
    item_key            VARCHAR(50)     NOT NULL,
    yyyymmdd            VARCHAR(8)      NOT NULL,
    dept_id             VARCHAR(21),
    user_id             VARCHAR(21),
    data_json           TEXT,
    col1_nm             VARCHAR(100),
    col1_num            FLOAT8,
    col2_nm             VARCHAR(100),
    col2_num            FLOAT8,
    col3_nm             VARCHAR(100),
    col3_num            FLOAT8,
    col4_nm             VARCHAR(100),
    col4_num            FLOAT8,
    col5_nm             VARCHAR(100),
    col5_num            FLOAT8,
    col6_nm             VARCHAR(100),
    col6_num            FLOAT8,
    col7_nm             VARCHAR(100),
    col7_num            FLOAT8,
    col8_nm             VARCHAR(100),
    col8_num            FLOAT8,
    col9_nm             VARCHAR(100),
    col9_num            FLOAT8,
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP,
    upd_by              VARCHAR(30),
    upd_date            TIMESTAMP,
    CONSTRAINT pk_cm_dashboard_data PRIMARY KEY (dashboard_data_id),
    CONSTRAINT fk_cm_dashboard_data_item
        FOREIGN KEY (dashboard_item_id)
        REFERENCES shopjoy_2604.cm_dashboard_item (dashboard_item_id)
        ON DELETE CASCADE
);

COMMENT ON TABLE  shopjoy_2604.cm_dashboard_data                        IS '대시보드 차트 패널 집계 데이터';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.dashboard_data_id      IS '데이터ID';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.site_id                IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.dashboard_item_id      IS '패널ID (cm_dashboard_item FK)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.ui_nm                  IS '대상화면명 (조회 편의용 역정규화)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.item_key               IS '패널 키 (조회 편의용 역정규화)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.yyyymmdd               IS '기준일자 (YYYYMMDD)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.dept_id                IS '부서ID (부서별 집계 시 사용)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.user_id                IS '사용자ID (개인별 집계 시 사용)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.data_json              IS '유연한 집계 데이터 JSON ({labels:[...], series:[{name,data:[...]}]})';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.col1_nm                IS '지표1명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.col1_num               IS '지표1값';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.col2_nm                IS '지표2명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.col2_num               IS '지표2값';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.col3_nm                IS '지표3명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.col3_num               IS '지표3값';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.col4_nm                IS '지표4명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.col4_num               IS '지표4값';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.col5_nm                IS '지표5명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.col5_num               IS '지표5값';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.col6_nm                IS '지표6명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.col6_num               IS '지표6값';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.col7_nm                IS '지표7명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.col7_num               IS '지표7값';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.col8_nm                IS '지표8명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.col8_num               IS '지표8값';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.col9_nm                IS '지표9명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.col9_num               IS '지표9값';

CREATE UNIQUE INDEX IF NOT EXISTS uq_cm_dashboard_data_key
    ON shopjoy_2604.cm_dashboard_data (dashboard_item_id, yyyymmdd, dept_id, user_id);
CREATE INDEX IF NOT EXISTS idx_cm_dashboard_data_item_id
    ON shopjoy_2604.cm_dashboard_data (dashboard_item_id);
CREATE INDEX IF NOT EXISTS idx_cm_dashboard_data_yyyymmdd
    ON shopjoy_2604.cm_dashboard_data (yyyymmdd);
CREATE INDEX IF NOT EXISTS idx_cm_dashboard_data_site_id
    ON shopjoy_2604.cm_dashboard_data (site_id);
CREATE INDEX IF NOT EXISTS idx_cm_dashboard_data_user_id
    ON shopjoy_2604.cm_dashboard_data (user_id);
