-- ============================================================
-- cm_dashboard — EC 종합 대시보드 집계 테이블
-- yyyymmdd + site_no + dept_id + user_id 조합으로 집계 1행
-- col1~col9: 지표명(Nm) + 수치(Num) 쌍 × 9개
-- ============================================================
CREATE TABLE IF NOT EXISTS shopjoy_2604.cm_dashboard (
    dashboard_id    VARCHAR(21)     NOT NULL,
    comp_id         VARCHAR(20),
    sort_ord        INTEGER,
    yyyymmdd        VARCHAR(8)      NOT NULL,
    site_no         VARCHAR(10)     NOT NULL,
    site_nm         VARCHAR(100),
    ui_nm           VARCHAR(100),
    dept_id         VARCHAR(21),
    dept_nm         VARCHAR(100),
    user_id         VARCHAR(21),
    user_nm         VARCHAR(100),
    col1_nm         VARCHAR(100),
    col1_num        FLOAT8,
    col2_nm         VARCHAR(100),
    col2_num        FLOAT8,
    col3_nm         VARCHAR(100),
    col3_num        FLOAT8,
    col4_nm         VARCHAR(100),
    col4_num        FLOAT8,
    col5_nm         VARCHAR(100),
    col5_num        FLOAT8,
    col6_nm         VARCHAR(100),
    col6_num        FLOAT8,
    col7_nm         VARCHAR(100),
    col7_num        FLOAT8,
    col8_nm         VARCHAR(100),
    col8_num        FLOAT8,
    col9_nm         VARCHAR(100),
    col9_num        FLOAT8,
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    CONSTRAINT pk_cm_dashboard PRIMARY KEY (dashboard_id)
);

COMMENT ON TABLE  shopjoy_2604.cm_dashboard              IS 'EC 종합 대시보드 집계';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.dashboard_id IS '대시보드ID';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.comp_id      IS '컴포넌트ID (차트 분류 키: COMP0101~COMP0403)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.sort_ord     IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.yyyymmdd     IS '기준일자 (YYYYMMDD)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.site_no      IS '사이트번호';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.site_nm      IS '사이트명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.ui_nm        IS '대상화면명 (DashboardBoEc01 등)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.dept_id      IS '부서ID';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.dept_nm      IS '부서명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.user_id      IS '사용자ID';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.user_nm      IS '사용자명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.col1_nm      IS '지표1명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.col1_num     IS '지표1값';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.col2_nm      IS '지표2명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.col2_num     IS '지표2값';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.col3_nm      IS '지표3명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.col3_num     IS '지표3값';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.col4_nm      IS '지표4명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.col4_num     IS '지표4값';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.col5_nm      IS '지표5명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.col5_num     IS '지표5값';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.col6_nm      IS '지표6명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.col6_num     IS '지표6값';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.col7_nm      IS '지표7명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.col7_num     IS '지표7값';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.col8_nm      IS '지표8명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.col8_num     IS '지표8값';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.col9_nm      IS '지표9명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.col9_num     IS '지표9값';

CREATE INDEX IF NOT EXISTS idx_cm_dashboard_yyyymmdd ON shopjoy_2604.cm_dashboard (yyyymmdd);
CREATE INDEX IF NOT EXISTS idx_cm_dashboard_site_no  ON shopjoy_2604.cm_dashboard (site_no);
CREATE INDEX IF NOT EXISTS idx_cm_dashboard_dept_id  ON shopjoy_2604.cm_dashboard (dept_id);
CREATE INDEX IF NOT EXISTS idx_cm_dashboard_user_id  ON shopjoy_2604.cm_dashboard (user_id);
CREATE INDEX IF NOT EXISTS idx_cm_dashboard_comp_id  ON shopjoy_2604.cm_dashboard (comp_id);
CREATE INDEX IF NOT EXISTS idx_cm_dashboard_ui_nm    ON shopjoy_2604.cm_dashboard (ui_nm);
