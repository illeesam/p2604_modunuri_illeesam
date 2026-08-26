-- cm_dashboard_item 테이블 DDL
-- 대시보드 차트 패널 정의 — 3레벨 트리(chart/series/item)
--
-- 2026-08-21: 3레벨(차트/시리즈/항목) 구조로 재편 — 구 series_json/option_json 단일행 방식
--   폐기, 상하관계는 parent_dashboard_item_id 로 잇는 "행" 구조로 변경. 이 DDL 파일이 그
--   이전(구 series_json 단일 패널) 스키마로 오랫동안 방치돼 있었다 — 2026-08-26 전면 재작성.
-- 2026-08-26: item1_key/item2_key/item3_key 신설 — item_key("chart091-series01-item02")를
--   "-" 로 나눈 조각을 그대로 담는다(누적 경로 아님). 이 행 자신의 레벨에 없는 조각은 NULL.

CREATE TABLE shopjoy_2604.cm_dashboard_item (
    dashboard_item_id         VARCHAR(21)  NOT NULL CONSTRAINT cm_dashboard_item_pk_dashboard_item_id PRIMARY KEY,
    dashboard_id              VARCHAR(21)  NOT NULL,
    item_key                  VARCHAR(150) NOT NULL,
    item1_key                 VARCHAR(150),
    item2_key                 VARCHAR(150),
    item3_key                 VARCHAR(150),
    item_nm                   VARCHAR(100) NOT NULL,
    item_type_cd               VARCHAR(20)  NOT NULL,
    key_level                 INTEGER      NOT NULL,
    key_nm                    VARCHAR(50)  NOT NULL,
    parent_dashboard_item_id  VARCHAR(21),
    widget_type_cd             VARCHAR(20),
    axis_type_cd                VARCHAR(20),
    chart_type_cd               VARCHAR(30),
    lvl2_color                VARCHAR(20),
    lvl1_code_grp              VARCHAR(50),
    lvl2_code_grp              VARCHAR(50),
    data_source_cd             VARCHAR(50),
    sort_ord                  INTEGER,
    use_yn                    VARCHAR(1),
    option_json                TEXT,
    sim_json                  TEXT,
    realtime_yn                VARCHAR(1),
    realtime_json              TEXT,
    grid_col_start              INTEGER,
    grid_col_end                INTEGER,
    grid_row_start              INTEGER,
    grid_row_end                INTEGER,
    panel_width                INTEGER,
    panel_height               INTEGER,
    reg_by                    VARCHAR(30),
    reg_date                  TIMESTAMP,
    upd_by                    VARCHAR(30),
    upd_date                  TIMESTAMP,
    reg_site_id                VARCHAR(21),
    series_orient_cd           VARCHAR(10)  DEFAULT 'ROW',
    auto_collect_yn            VARCHAR(1)   DEFAULT 'N',
    editable_yn                VARCHAR(1)   DEFAULT 'Y',
    input_opts                 VARCHAR(200),
    lvl3_color                VARCHAR(20),
    lvl2_palette_cd             VARCHAR(30),
    lvl3_palette_cd             VARCHAR(30),
    widget_gen_type_cd          VARCHAR(20),
    gen_query                 TEXT,
    ref_item_key                VARCHAR(60),
    CONSTRAINT cm_dashboard_item_fk_dashboard_id FOREIGN KEY (dashboard_id) REFERENCES shopjoy_2604.cm_dashboard(dashboard_id) ON DELETE CASCADE
);

COMMENT ON TABLE  shopjoy_2604.cm_dashboard_item IS '대시보드 차트 패널 정의';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.dashboard_item_id IS '패널ID';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.dashboard_id IS '대시보드ID (cm_dashboard FK)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.item_key IS '레벨 조립코드 chart001-series01-item01. 화면·연동에서 읽기 쉬운 키, 전역 UNIQUE';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.item1_key IS '1레벨(차트) 조각 — item_key 의 1번째 "-" 구분 조각 (예: chart091)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.item2_key IS '2레벨(시리즈) 조각 — item_key 의 2번째 "-" 구분 조각 (예: series01). 차트(1레벨) 행은 NULL';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.item3_key IS '3레벨(항목) 조각 — item_key 의 3번째 "-" 구분 조각 (예: item02). 차트/시리즈(1,2레벨) 행은 NULL';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.item_nm IS '패널명 (화면 표시용)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.item_type_cd IS '레벨 (chart:차트 / series:시리즈 / item:항목)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.key_level IS '레벨 번호 1:차트 / 2:시리즈 / 3:항목 (item_type_cd 의 숫자 표현)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.key_nm IS '이 레벨의 키명 (chart038 / series01 / item01). 조립코드 item_key 의 마지막 조각';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.parent_dashboard_item_id IS '상위 정의행 (series→chart, item→series). chart 는 NULL';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.widget_type_cd IS '위젯유형 (KPI/CHART/TABLE)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.axis_type_cd IS '3레벨 축 성격 (CATEGORY:항목행 생성 / DATE:yyyymmdd 를 축으로 사용). chart 레벨만. 렌더링 힌트 — 값은 항상 3레벨에 붙는다';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.chart_type_cd IS '차트종류 (bar/line/pie/radar/heatmap/scatter). widget_type_cd=CHART 일 때만 유효';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.lvl2_color IS '2레벨(시리즈) 표시 색상 (#RRGGBB) — 막대/꺾은선 등 시리즈별 itemStyle.color';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.lvl1_code_grp IS '2레벨(시리즈) 이름 선택용 공통코드그룹 (sy_code_grp.code_grp). NULL=직접입력';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.lvl2_code_grp IS '3레벨(항목) 이름 선택용 공통코드그룹 (sy_code_grp.code_grp). NULL=직접입력';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.data_source_cd IS '실데이터 소스명 (CmDashboardDataSourceRegistry 등록명). 비우면 cm_dashboard_data 사용';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.sort_ord IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.use_yn IS '사용여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.option_json IS 'ECharts 옵션 오버라이드 JSON (xAxis/yAxis/legend 등 부분)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.sim_json IS '미리보기 시뮬레이션 값/스타일 JSON {values:[[..]],style:"css"} — 실제 집계값 아님(cm_dashboard_data 와 별개)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.realtime_yn IS '실시간 차트 여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.realtime_json IS '실시간 차트 설정 JSON {intervalMs,maxPoints,apiUrl,thresholds,brushEnabled,smoothing}';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.grid_col_start IS 'CSS Grid 열 시작 위치 (1-based, grid-column-start)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.grid_col_end IS 'CSS Grid 열 끝 위치 (grid-column-end, 미지정 시 auto)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.grid_row_start IS 'CSS Grid 행 시작 위치 (1-based, grid-row-start)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.grid_row_end IS 'CSS Grid 행 끝 위치 (grid-row-end, 미지정 시 auto)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.panel_width IS '패널 너비 (열 span 수, 기본 1)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.panel_height IS '패널 높이 (행 span 수, 기본 1)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.upd_date IS '수정일';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.reg_site_id IS '등록 사이트ID';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.series_orient_cd IS '시리즈를 데이터관리 그리드의 행(ROW,기본)에 둘지 열(COL)에 둘지. chart(1레벨)에서만 유효. ROW=시리즈가 행·항목이 열 / COL=항목이 행·시리즈가 열';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.auto_collect_yn IS '자동수집여부(Y/N, 기본 N). Y면 배치가 실 EC 테이블을 집계해 값을 채운다(SyStatsDashboardJob). chart(1레벨)에서만 의미';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.editable_yn IS '데이터관리 그리드 편집여부(Y/N, 기본 Y). 자동수집(auto_collect_yn=Y) 항목은 보통 N';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.input_opts IS '이 차트의 값을 찾는 기준 차원 키. 콤마로 나눈 조회조건 토큰 목록 — 예: site_id,yyyymm(월별) / site_id,yyyymmdd(일별) / site_id,yyyy(연도별). 날짜 토큰명 자체가 기간구분을 겸한다. 비어있으면 기본값: site_id,yyyymm. chart(1레벨)에서만 의미';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.lvl3_color IS '3레벨(항목) 표시 색상 (#RRGGBB) — 파이/도넛 등 항목별 조각 색';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.lvl2_palette_cd IS '2레벨(시리즈) 색상 팔레트 코드 (DASH_WIDGET_COLORS_01~10) — 차트(1레벨) 행에만 의미';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.lvl3_palette_cd IS '3레벨(항목) 색상 팔레트 코드 (DASH_WIDGET_COLORS_01~10) — 차트(1레벨) 행에만 의미, 파이/도넛 등에서 사용';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.widget_gen_type_cd IS '위젯생성타입 — MANUAL(화면에서 직접 정의, 기본값) | QUERY(SQL 실행 결과로 자동 생성). 차트(1레벨) 행에만 의미';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.gen_query IS 'widget_gen_type_cd=QUERY 일 때 실행할 SELECT 쿼리. 결과 컬럼은 series_cd,series_nm,item_cd,item_nm,val_num 로 약속. :siteId 플레이스홀더 지원';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.ref_item_key IS '이 위젯이 참조/파생한 원본 위젯의 item_key(예: chart036) — 목록 화면에 참조항목명으로 표시, 정보성 필드';

CREATE UNIQUE INDEX cm_dashboard_item_uk02_item_key ON shopjoy_2604.cm_dashboard_item USING btree (item_key);
CREATE INDEX cm_dashboard_item_ix02_parent_x1 ON shopjoy_2604.cm_dashboard_item USING btree (parent_dashboard_item_id);
-- dashboard_id 선두(FK, 인덱스 없던 것 발견/추가) — selectChartPage() 의 WHERE dashboard_id + ORDER BY sort_ord 와 정합
CREATE INDEX cm_dashboard_item_ix03_dash_x3 ON shopjoy_2604.cm_dashboard_item USING btree (dashboard_id, key_level, sort_ord);
CREATE INDEX cm_dashboard_item_ix10_item1_key ON shopjoy_2604.cm_dashboard_item USING btree (item1_key);
-- 2026-08-26 인덱스 재점검: data_source_cd(97.4% NULL, 조회 미사용) / item2_key(n_distinct=6, 단독 조회 없음) 제거
