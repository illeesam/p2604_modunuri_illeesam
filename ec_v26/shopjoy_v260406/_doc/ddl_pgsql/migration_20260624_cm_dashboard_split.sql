-- ============================================================
-- migration_20260624_cm_dashboard_split.sql
-- cm_dashboard → cm_dashboard_item + cm_dashboard_data 분리
-- 기존 cm_dashboard 테이블은 유지 (레거시 보존)
-- ============================================================

-- ① cm_dashboard_item 신규 생성
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


-- ② cm_dashboard_data 신규 생성
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


-- ③ DashboardBoEc01 패널 시드 데이터 (item_key = comp_id 기준)
-- series_json: [{name,color,type}] 배열로 ECharts series 색상/명칭 정의
-- panel_width/height: 대시보드 그리드 기준 (전체 12열 기준 가정)
-- grid_col_start/end: 명시 시 CSS grid-column 직접 지정
INSERT INTO shopjoy_2604.cm_dashboard_item
  (dashboard_item_id, site_id, ui_nm, item_key, item_nm, chart_type,
   sort_ord, panel_width, panel_height, use_yn,
   series_json, reg_by, reg_date, realtime_yn, realtime_json)
VALUES
  -- KPI 행 (각 1열)
  ('ITEM000000000001', 'SITE000000000001', 'DashboardBoEc01', 'COMP0101', '오늘 매출', 'kpi',
   1, 1, 1, 'Y',
   '[{"name":"매출","color":"#3b82f6"}]', 'SYSTEM', NOW(), 'N', NULL),
  ('ITEM000000000002', 'SITE000000000001', 'DashboardBoEc01', 'COMP0102', '신규 주문', 'kpi',
   2, 1, 1, 'Y',
   '[{"name":"주문","color":"#8b5cf6"}]', 'SYSTEM', NOW(), 'N', NULL),
  ('ITEM000000000003', 'SITE000000000001', 'DashboardBoEc01', 'COMP0103', '신규 회원', 'kpi',
   3, 1, 1, 'Y',
   '[{"name":"회원","color":"#10b981"}]', 'SYSTEM', NOW(), 'N', NULL),
  ('ITEM000000000004', 'SITE000000000001', 'DashboardBoEc01', 'COMP0104', '방문자', 'kpi',
   4, 1, 1, 'Y',
   '[{"name":"방문","color":"#f59e0b"}]', 'SYSTEM', NOW(), 'N', NULL),

  -- 차트 패널
  ('ITEM000000000005', 'SITE000000000001', 'DashboardBoEc01', 'COMP0201', '일별 매출 추이', 'line',
   5, 3, 2, 'Y',
   '[{"name":"매출액","color":"#3b82f6","type":"bar"},{"name":"주문수","color":"#8b5cf6","type":"line","yAxisIndex":1}]',
   'SYSTEM', NOW(), 'N', NULL),
  ('ITEM000000000006', 'SITE000000000001', 'DashboardBoEc01', 'COMP0202', '카테고리별 매출', 'bar',
   6, 3, 2, 'Y',
   '[{"name":"매출액","color":"#10b981"}]', 'SYSTEM', NOW(), 'N', NULL),
  ('ITEM000000000007', 'SITE000000000001', 'DashboardBoEc01', 'COMP0203', '상품별 판매 순위', 'bar',
   7, 3, 2, 'Y',
   '[{"name":"판매수","color":"#f59e0b"},{"name":"매출","color":"#ef4444","type":"line","yAxisIndex":1}]',
   'SYSTEM', NOW(), 'N', NULL),

  ('ITEM000000000008', 'SITE000000000001', 'DashboardBoEc01', 'COMP0301', '결제수단별 비중', 'pie',
   8, 2, 2, 'Y',
   '[{"name":"카드","color":"#3b82f6"},{"name":"무통장","color":"#8b5cf6"},{"name":"토스","color":"#10b981"},{"name":"기타","color":"#f59e0b"}]',
   'SYSTEM', NOW(), 'N', NULL),
  ('ITEM000000000009', 'SITE000000000001', 'DashboardBoEc01', 'COMP0302', '주문 상태 현황', 'pie',
   9, 2, 2, 'Y',
   '[{"name":"결제완료","color":"#3b82f6"},{"name":"준비중","color":"#f59e0b"},{"name":"배송중","color":"#10b981"},{"name":"완료","color":"#6b7280"}]',
   'SYSTEM', NOW(), 'N', NULL),
  ('ITEM000000000010', 'SITE000000000001', 'DashboardBoEc01', 'COMP0303', '회원 등급 분포', 'pie',
   10, 2, 2, 'Y',
   '[{"name":"일반","color":"#6b7280"},{"name":"실버","color":"#9ca3af"},{"name":"골드","color":"#f59e0b"},{"name":"VIP","color":"#8b5cf6"}]',
   'SYSTEM', NOW(), 'N', NULL),
  ('ITEM000000000011', 'SITE000000000001', 'DashboardBoEc01', 'COMP0304', '클레임 유형 비중', 'pie',
   11, 2, 2, 'Y',
   '[{"name":"취소","color":"#ef4444"},{"name":"반품","color":"#f59e0b"},{"name":"교환","color":"#3b82f6"},{"name":"AS","color":"#10b981"}]',
   'SYSTEM', NOW(), 'N', NULL),

  ('ITEM000000000012', 'SITE000000000001', 'DashboardBoEc01', 'COMP0401', '시간대별 주문 히트맵', 'heatmap',
   12, 3, 2, 'Y',
   '[{"name":"주문수"}]', 'SYSTEM', NOW(), 'N', NULL),
  ('ITEM000000000013', 'SITE000000000001', 'DashboardBoEc01', 'COMP0402', '배송 지역 분포', 'bar',
   13, 3, 2, 'Y',
   '[{"name":"건수","color":"#3b82f6"}]', 'SYSTEM', NOW(), 'N', NULL),
  ('ITEM000000000014', 'SITE000000000001', 'DashboardBoEc01', 'COMP0403', '재고 소진율', 'bar',
   14, 3, 2, 'Y',
   '[{"name":"소진율(%)","color":"#ef4444"},{"name":"재고수","color":"#6b7280","type":"line","yAxisIndex":1}]',
   'SYSTEM', NOW(), 'N', NULL),

  -- X-View 실시간 scatter (전체 폭, realtime_yn='Y')
  ('ITEM000000000015', 'SITE000000000001', 'DashboardBoEc01', 'xview', 'X-View 실시간 API 응답 산포', 'scatter',
   15, 4, 2, 'Y',
   '[{"name":"정상(<500ms)","color":"#3b82f6"},{"name":"느림(<3000ms)","color":"#f59e0b"},{"name":"오류/매우느림","color":"#ef4444"}]',
   'SYSTEM', NOW(), 'Y',
   '{"intervalMs":2000,"maxPoints":500,"apiUrl":"/bo/cm/dashboard/xview/stream","thresholds":[{"value":500,"color":"#f59e0b","label":"느림 경계"},{"value":3000,"color":"#ef4444","label":"오류 경계"}],"brushEnabled":true,"smoothing":false}')
ON CONFLICT DO NOTHING;
