-- ============================================================
-- cm_dashboard_item — 대시보드 차트 패널 정의
-- 대시보드(ui_nm 기준) 아래 각 차트 패널 1행
-- series_json: ECharts 시리즈 설정 배열 JSON
-- ============================================================
CREATE TABLE IF NOT EXISTS shopjoy_2604.cm_dashboard_item (
    dashboard_item_id   VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21)     NOT NULL,
    ui_nm               VARCHAR(100)    NOT NULL,
    item_key            VARCHAR(50)     NOT NULL,
    item_nm             VARCHAR(100)    NOT NULL,
    chart_type          VARCHAR(30),
    sort_ord            INTEGER,
    grid_col_start      INTEGER,
    grid_col_end        INTEGER,
    grid_row_start      INTEGER,
    grid_row_end        INTEGER,
    panel_width         INTEGER         DEFAULT 1,
    panel_height        INTEGER         DEFAULT 1,
    use_yn              VARCHAR(1)         DEFAULT 'Y',
    series_json         TEXT,
    option_json         TEXT,
    realtime_yn         VARCHAR(1)         DEFAULT 'N',
    realtime_json       TEXT,
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP,
    upd_by              VARCHAR(30),
    upd_date            TIMESTAMP,
    CONSTRAINT pk_cm_dashboard_item PRIMARY KEY (dashboard_item_id)
);

COMMENT ON TABLE  shopjoy_2604.cm_dashboard_item                    IS '대시보드 차트 패널 정의';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.dashboard_item_id  IS '패널ID';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.site_id            IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.ui_nm              IS '대상화면명 (DashboardBoEc01 등)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.item_key           IS '패널 키 (COMP0101, sales, xview 등)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.item_nm            IS '패널명 (화면 표시용)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.chart_type         IS '차트 유형 (bar/line/pie/scatter/kpi/heatmap 등)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.sort_ord           IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.grid_col_start     IS 'CSS Grid 열 시작 위치 (1-based, grid-column-start)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.grid_col_end       IS 'CSS Grid 열 끝 위치 (grid-column-end, 미지정 시 auto)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.grid_row_start     IS 'CSS Grid 행 시작 위치 (1-based, grid-row-start)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.grid_row_end       IS 'CSS Grid 행 끝 위치 (grid-row-end, 미지정 시 auto)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.panel_width        IS '패널 너비 (열 span 수, 기본 1)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.panel_height       IS '패널 높이 (행 span 수, 기본 1)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.use_yn             IS '사용여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.series_json        IS '시리즈 설정 JSON 배열 [{name,color,type,...}]';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.option_json        IS 'ECharts 옵션 오버라이드 JSON (xAxis/yAxis/legend 등 부분)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.realtime_yn        IS '실시간 차트 여부 (Y: 폴링/스트리밍, N: 정적)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.realtime_json      IS '실시간 차트 설정 JSON {intervalMs,maxPoints,apiUrl,thresholds:[{value,color,label}],brushEnabled,smoothing}';

CREATE UNIQUE INDEX IF NOT EXISTS uq_cm_dashboard_item_key
    ON shopjoy_2604.cm_dashboard_item (site_id, ui_nm, item_key);
CREATE INDEX IF NOT EXISTS idx_cm_dashboard_item_ui_nm
    ON shopjoy_2604.cm_dashboard_item (ui_nm);
CREATE INDEX IF NOT EXISTS idx_cm_dashboard_item_site_id
    ON shopjoy_2604.cm_dashboard_item (site_id);
