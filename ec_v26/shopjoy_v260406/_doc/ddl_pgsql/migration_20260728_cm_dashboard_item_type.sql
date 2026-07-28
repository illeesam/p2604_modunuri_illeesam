-- ============================================================================
-- cm_dashboard_item — 항목유형(item_type_cd) 분리 (2026-07-28)
--
-- 지금까지 chart_type 하나가 두 가지 의미를 겸했다.
--   chart_type = 'kpi'  → 차트가 아니라 숫자 카드
--   chart_type = 'bar'  → 진짜 차트 종류
-- 여기에 '목록(표)' 을 더하려니 chart_type='table' 이 되는데, 목록은 차트 종류가 아니다.
-- 범주가 다른 값을 한 컬럼에 섞으면 "차트유형 선택" UI 가 목록·KPI 까지 떠안게 되고,
-- 차트 전용 속성(축·시리즈)을 언제 물어봐야 하는지 판단할 근거가 사라진다.
--
-- 그래서 두 컬럼으로 나눈다.
--   item_type_cd = KPI   숫자 카드   — chart_type 무의미
--   item_type_cd = CHART 차트        — chart_type 이 bar/line/pie/radar/heatmap/scatter
--   item_type_cd = TABLE 목록(표)    — chart_type 무의미, series_json 이 컬럼 정의
--
-- series_json 은 유형에 따라 의미가 갈린다(기존 동작 유지).
--   CHART : [{"name":"매출","color":"#6366f1","type":"bar"}]      시리즈 정의
--   TABLE : [{"name":"주문번호","key":"col1Nm","align":"left"}]   컬럼 정의
-- ============================================================================

ALTER TABLE shopjoy_2604.cm_dashboard_item
    ADD COLUMN IF NOT EXISTS item_type_cd VARCHAR(20);

-- 기존 행 이관 — kpi 는 KPI 로, 나머지는 전부 CHART
UPDATE shopjoy_2604.cm_dashboard_item
   SET item_type_cd = CASE WHEN LOWER(COALESCE(chart_type, '')) = 'kpi' THEN 'KPI' ELSE 'CHART' END
 WHERE item_type_cd IS NULL;

-- KPI 였던 행의 chart_type 은 이제 의미가 없다 (남겨두면 "kpi 차트" 라는 오해가 계속된다)
UPDATE shopjoy_2604.cm_dashboard_item
   SET chart_type = NULL
 WHERE item_type_cd = 'KPI';

ALTER TABLE shopjoy_2604.cm_dashboard_item ALTER COLUMN item_type_cd SET DEFAULT 'CHART';
ALTER TABLE shopjoy_2604.cm_dashboard_item ALTER COLUMN item_type_cd SET NOT NULL;

COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.item_type_cd IS
  '항목유형 (KPI:숫자카드 / CHART:차트 / TABLE:목록)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.chart_type IS
  '차트종류 (bar/line/pie/radar/heatmap/scatter). item_type_cd=CHART 일 때만 유효';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.series_json IS
  'CHART=시리즈 정의 [{name,color,type}] / TABLE=컬럼 정의 [{name,key,align}]';
