-- cm_dashboard_data 테이블 DDL
-- 대시보드 3레벨 항목 실데이터 — 값은 항상 3레벨(cm_dashboard_item.key_level=3) 정의행에만 붙는다
--
-- 2026-08-21: 3레벨(차트/시리즈/항목) 구조로 재편 — 구 cm_dashboard_item_data(col1~9 반복 컬럼,
--   data_json) 폐기, data_opts(차원 정규화 키) + data_val(값 하나) 로 단순화. 구 DDL 은
--   _doc/ddl_pgsql/_obsolete/cm_dashboard_item_data.sql 로 이동.
-- 2026-08-26: period_type_cd(D/M/Y 약어) → date_type_cd(y/m/d) 로 컬럼명·값 표기 변경 —
--   "조회기간" 이 아니라 "이 날짜 값의 형식/자리수" 를 나타내므로 더 정확한 이름. 동시에
--   yyyymmdd 컬럼의 0-패딩 관례도 폐지 — date_type_cd 에 맞는 실제 자리수만 담는다
--   (y=4자리 YYYY / m=6자리 YYYYMM / d=8자리 YYYYMMDD). 여러 형식이 섞인 날짜범위(BETWEEN)
--   비교가 필요한 곳(예: CmDashboardDataGridService.queryWidgetRows)은 비교 시점에
--   RPAD(yyyymmdd,8,'0') 로 맞춰서 비교해야 한다(길이가 다르면 사전식 비교가 깨짐).
-- 2026-08-26(2차): data_opts 를 site_id,yyyymmdd 두 개(핵심 좌표)로만 좁히고, 나머지
--   선택 차원(dept_id/prod_id/user_id/vendor_id)은 새 컬럼 data_opt2s 로 분리 — "필수 조건
--   vs 부가 조건"이 컬럼만 봐도 구분되게. date_type_cd 는 data_opt2s 에도 넣지 않는다 —
--   yyyymmdd 값의 자리수(y=4/m=6/d=8)가 이미 그 값을 구분해주므로 중복이다. UNIQUE 도
--   (item_key, data_opts, data_opt2s) 세 컬럼 조합으로 확장.
-- 2026-08-26(3차): item1_key/item2_key/item3_key 신설 — item_key("chart091-series01-item02")를
--   "-" 로 나눈 조각을 그대로 담는다(누적 경로 아님) — item1_key="chart091" / item2_key=
--   "series01" / item3_key="item02". cm_dashboard_item 의 같은 이름 컬럼과 값 규칙이 동일하다.
-- 2026-08-26(4차): 인덱스 재점검(pg_stats.n_distinct 실측) — site_id 는 현재 전체 행이 값 1개뿐
--   (n_distinct=1)이라 선두 컬럼으로는 무의미하고, queryWidgetRows 처럼 site_id 가 NULL 로
--   넘어오는 호출에는 아예 안 먹었다 — dashboard_item_id(고카디널리티, FK) 선두로 재구성.
--   yyyymmdd 단독/user_id/dashboard_id+yyyymmdd 조합/item2_key 단독 인덱스는 이를 단독으로
--   쓰는 쿼리가 없어(user_id 는 100% NULL, item2_key 는 n_distinct=4) 제거.

CREATE TABLE shopjoy_2604.cm_dashboard_data (
    dashboard_data_id  VARCHAR(21)  NOT NULL CONSTRAINT cm_dashboard_data_pk_dashboard_data_id PRIMARY KEY,
    dashboard_id       VARCHAR(21)  NOT NULL,
    dashboard_item_id  VARCHAR(21)  NOT NULL,
    item_key           VARCHAR(150) NOT NULL,
    item1_key          VARCHAR(150),
    item2_key          VARCHAR(150),
    item3_key          VARCHAR(150),
    data_opts          VARCHAR(500),
    data_opt2s         VARCHAR(500),
    data_val           DOUBLE PRECISION,
    yyyymmdd           VARCHAR(8)   NOT NULL,
    date_type_cd       VARCHAR(1),
    site_id            VARCHAR(21),
    prod_id            VARCHAR(21),
    vendor_id          VARCHAR(21),
    dept_id            VARCHAR(21),
    user_id            VARCHAR(21),
    reg_by             VARCHAR(30),
    reg_date           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by             VARCHAR(30),
    upd_date           TIMESTAMP,
    reg_site_id        VARCHAR(21)
);

COMMENT ON TABLE  shopjoy_2604.cm_dashboard_data IS '대시보드 3레벨 항목 실데이터';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.dashboard_data_id IS '데이터ID';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.dashboard_id IS '대시보드ID (필수). dashboard_item_id 로 유도 가능하나 조회·필터용 반정규화';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.dashboard_item_id IS '값이 붙은 3레벨(항목) 정의행 FK (항상 key_level=3)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.item_key IS '값이 붙은 3레벨 정의행의 조립코드 (cm_dashboard_item.item_key). 조인 없이 위치를 읽기 위한 반정규화';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.item1_key IS '1레벨(차트) 조각 - item_key 의 1번째 "-" 구분 조각 (예: chart091)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.item2_key IS '2레벨(시리즈) 조각 - item_key 의 2번째 "-" 구분 조각 (예: series01)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.item3_key IS '3레벨(항목) 조각 - item_key 의 3번째 "-" 구분 조각 (예: item02)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.data_opts IS '차원 정규화 키(핵심) - site_id,yyyymmdd 두 개만. item_key+data_opt2s 와 함께 UNIQUE';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.data_opt2s IS '차원 정규화 키(부가) - data_opts 를 뺀 나머지 선택 차원(dept_id/prod_id/user_id/vendor_id, date_type_cd 는 제외). item_key+data_opts 와 함께 UNIQUE';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.data_val IS '값(숫자)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.yyyymmdd IS '집계일자 — date_type_cd 에 맞는 실제 자리수만 채운다(y=4자리/m=6자리/d=8자리, 0-패딩 없음). 여러 형식이 섞인 날짜범위 비교가 필요하면 RPAD(yyyymmdd,8,''0'') 로 맞춰서 비교할 것';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.date_type_cd IS '날짜 값 형식 y:연도(yyyymmdd=4자리 YYYY) / m:년월(yyyymmdd=6자리 YYYYMM) / d:년월일(yyyymmdd=8자리 YYYYMMDD). 값 자체는 형식 코드일 뿐, yyyymmdd 컬럼이 실제 자리수를 그대로 담는다(2026-08-26 개편, 0-패딩 폐지)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.site_id IS '사이트ID (sy_site.site_id) — 업무 소속 사이트(필수 기준조건)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.prod_id IS '상품ID (pd_prod.prod_id) — 선택 기준조건';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.vendor_id IS '판매업체ID (sy_vendor.vendor_id) — 선택 기준조건';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.dept_id IS '부서ID (부서별 집계 시 사용)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.user_id IS '사용자ID (개인별 집계 시 사용)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.upd_date IS '수정일';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_data.reg_site_id IS '등록 사이트ID (sy_site.site_id)';

CREATE UNIQUE INDEX cm_dashboard_data_uk01_item_key_opts ON shopjoy_2604.cm_dashboard_data USING btree (item_key, data_opts, data_opt2s);
-- dashboard_item_id 선두(고카디널리티 FK, queryWidgetRows/selectBySiteYmdChartIds 공용 + cm_dashboard_item ON DELETE CASCADE 지원)
CREATE INDEX cm_dashboard_data_ix01_item_x3 ON shopjoy_2604.cm_dashboard_data USING btree (dashboard_item_id, site_id, yyyymmdd);
CREATE INDEX cm_dashboard_data_ix04_item1_key ON shopjoy_2604.cm_dashboard_data USING btree (item1_key);
