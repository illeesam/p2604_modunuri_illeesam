-- ============================================================
-- Dashboard 구조 재편 마이그레이션
-- 실행 대상: shopjoy_2604 schema
-- 작성일: 2026-06-27
-- ============================================================

-- ============================================================
-- STEP 1. cm_dashboard 헤더 테이블 신규 생성
-- ============================================================
CREATE TABLE IF NOT EXISTS shopjoy_2604.cm_dashboard (
    dashboard_id    VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21)     NOT NULL,
    dashboard_nm    VARCHAR(200)    NOT NULL,
    ui_comp_nm      VARCHAR(100)    NOT NULL,
    layout_cols     INTEGER         DEFAULT 4,
    sort_ord        INTEGER         DEFAULT 1,
    use_yn          VARCHAR(1)      DEFAULT 'Y',
    remark          VARCHAR(500),
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    CONSTRAINT pk_cm_dashboard PRIMARY KEY (dashboard_id)
);

COMMENT ON TABLE  shopjoy_2604.cm_dashboard                IS '대시보드 정의 헤더';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.dashboard_id   IS '대시보드ID';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.site_id        IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.dashboard_nm   IS '대시보드명 (화면 표시용)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.ui_comp_nm     IS '프론트 컴포넌트명 (DashboardBoEc01 등)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.layout_cols    IS '그리드 열 수 (기본 4)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.sort_ord       IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.use_yn         IS '사용여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.remark         IS '비고';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.reg_by         IS '등록자';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.reg_date       IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.upd_by         IS '수정자';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.upd_date       IS '수정일시';

CREATE INDEX IF NOT EXISTS idx_cm_dashboard_site_id
    ON shopjoy_2604.cm_dashboard (site_id);
CREATE INDEX IF NOT EXISTS idx_cm_dashboard_ui_comp_nm
    ON shopjoy_2604.cm_dashboard (ui_comp_nm);

-- ============================================================
-- STEP 2. cm_dashboard 기초 데이터 INSERT (3개 대시보드)
-- ============================================================
INSERT INTO shopjoy_2604.cm_dashboard
    (dashboard_id, site_id, dashboard_nm, ui_comp_nm, layout_cols, sort_ord, use_yn, reg_by, reg_date)
VALUES
    ('DASH000000000001', '2604010000000001', '온라인 쇼핑몰 매출 및 판매현황', 'DashboardBoEc01', 4, 1, 'Y', 'SYSTEM', NOW()),
    ('DASH000000000002', '2604010000000001', '일별 운영 현황',                 'DashboardBoEc02', 4, 2, 'Y', 'SYSTEM', NOW()),
    ('DASH000000000003', '2604010000000001', '실시간 모니터링',                 'DashboardBoEc03', 4, 3, 'Y', 'SYSTEM', NOW())
ON CONFLICT (dashboard_id) DO NOTHING;

-- ============================================================
-- STEP 3. cm_dashboard_item: dashboard_id 컬럼 추가 및 데이터 채우기
-- ============================================================

-- 3-1. dashboard_id 컬럼 추가 (NOT NULL 전에 nullable로)
ALTER TABLE shopjoy_2604.cm_dashboard_item
    ADD COLUMN IF NOT EXISTS dashboard_id VARCHAR(21);

-- 3-2. ui_nm 값 기준으로 dashboard_id 매핑 업데이트
UPDATE shopjoy_2604.cm_dashboard_item i
SET    dashboard_id = d.dashboard_id
FROM   shopjoy_2604.cm_dashboard d
WHERE  d.ui_comp_nm = i.ui_nm;

-- 3-3. 매핑되지 않은 행(ui_nm 불일치)은 DashboardBoEc01 기본값으로 처리
UPDATE shopjoy_2604.cm_dashboard_item
SET    dashboard_id = 'DASH000000000001'
WHERE  dashboard_id IS NULL;

-- 3-4. NOT NULL 제약 설정
ALTER TABLE shopjoy_2604.cm_dashboard_item
    ALTER COLUMN dashboard_id SET NOT NULL;

-- 3-5. FK 제약 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = 'shopjoy_2604'
          AND table_name = 'cm_dashboard_item'
          AND constraint_name = 'fk_cm_dashboard_item_dashboard'
    ) THEN
        ALTER TABLE shopjoy_2604.cm_dashboard_item
            ADD CONSTRAINT fk_cm_dashboard_item_dashboard
                FOREIGN KEY (dashboard_id)
                REFERENCES shopjoy_2604.cm_dashboard (dashboard_id)
                ON DELETE CASCADE;
    END IF;
END;
$$;

-- 3-6. ui_nm 컬럼 삭제 전 기존 인덱스/유니크 제약 제거
DROP INDEX IF EXISTS shopjoy_2604.uq_cm_dashboard_item_key;
DROP INDEX IF EXISTS shopjoy_2604.idx_cm_dashboard_item_ui_nm;

-- 3-7. ui_nm 컬럼 삭제
ALTER TABLE shopjoy_2604.cm_dashboard_item
    DROP COLUMN IF EXISTS ui_nm;

-- 3-8. 새 유니크 인덱스 (ui_nm 제거, dashboard_id 기준)
CREATE UNIQUE INDEX IF NOT EXISTS uq_cm_dashboard_item_key
    ON shopjoy_2604.cm_dashboard_item (dashboard_id, item_key);

CREATE INDEX IF NOT EXISTS idx_cm_dashboard_item_dashboard_id
    ON shopjoy_2604.cm_dashboard_item (dashboard_id);

-- COMMENT: dashboard_id 컬럼 코멘트
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.dashboard_id IS '대시보드ID (cm_dashboard FK)';

-- ============================================================
-- STEP 4. cm_dashboard_data 백업 (원본 보존)
-- ============================================================

-- 4-1. 백업 테이블 생성 (원본 구조 그대로 복사)
CREATE TABLE IF NOT EXISTS shopjoy_2604.cm_dashboard_data_bak_20260627
    AS TABLE shopjoy_2604.cm_dashboard_data;

-- 4-2. 백업 테이블 주석
COMMENT ON TABLE shopjoy_2604.cm_dashboard_data_bak_20260627
    IS '2026-06-27 구조 재편 전 cm_dashboard_data 백업';

-- ============================================================
-- STEP 5. cm_dashboard_data → cm_dashboard_item_data 테이블명 변경
-- ============================================================

-- 5-1. FK 제약 임시 삭제 (rename 전)
ALTER TABLE shopjoy_2604.cm_dashboard_data
    DROP CONSTRAINT IF EXISTS fk_cm_dashboard_data_item;

-- 5-2. 테이블명 변경
ALTER TABLE IF EXISTS shopjoy_2604.cm_dashboard_data
    RENAME TO cm_dashboard_item_data;

-- 5-3. PK 제약명 변경
ALTER TABLE shopjoy_2604.cm_dashboard_item_data
    RENAME CONSTRAINT pk_cm_dashboard_data TO pk_cm_dashboard_item_data;

-- 5-4. dashboard_data_id 컬럼명 → item_data_id 변경
ALTER TABLE shopjoy_2604.cm_dashboard_item_data
    RENAME COLUMN dashboard_data_id TO item_data_id;

-- 5-5. FK 재설정
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = 'shopjoy_2604'
          AND table_name = 'cm_dashboard_item_data'
          AND constraint_name = 'fk_cm_dashboard_item_data_item'
    ) THEN
        ALTER TABLE shopjoy_2604.cm_dashboard_item_data
            ADD CONSTRAINT fk_cm_dashboard_item_data_item
                FOREIGN KEY (dashboard_item_id)
                REFERENCES shopjoy_2604.cm_dashboard_item (dashboard_item_id)
                ON DELETE CASCADE;
    END IF;
END;
$$;

-- 5-6. 기존 인덱스 재명명 (PostgreSQL은 인덱스를 schema 레벨에서 관리)
ALTER INDEX IF EXISTS shopjoy_2604.uq_cm_dashboard_data_key
    RENAME TO uq_cm_dashboard_item_data_key;
ALTER INDEX IF EXISTS shopjoy_2604.idx_cm_dashboard_data_item_id
    RENAME TO idx_cm_dashboard_item_data_item_id;
ALTER INDEX IF EXISTS shopjoy_2604.idx_cm_dashboard_data_yyyymmdd
    RENAME TO idx_cm_dashboard_item_data_yyyymmdd;
ALTER INDEX IF EXISTS shopjoy_2604.idx_cm_dashboard_data_site_id
    RENAME TO idx_cm_dashboard_item_data_site_id;
ALTER INDEX IF EXISTS shopjoy_2604.idx_cm_dashboard_data_user_id
    RENAME TO idx_cm_dashboard_item_data_user_id;

-- 5-7. 테이블·컬럼 코멘트 갱신
COMMENT ON TABLE  shopjoy_2604.cm_dashboard_item_data                         IS '대시보드 차트 패널 집계 데이터';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.item_data_id             IS '데이터ID';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.site_id                  IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.dashboard_item_id        IS '패널ID (cm_dashboard_item FK)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.ui_nm                    IS '대상화면명 (조회 편의용 역정규화)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.item_key                 IS '패널 키 (조회 편의용 역정규화)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.yyyymmdd                 IS '기준일자 (YYYYMMDD)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.dept_id                  IS '부서ID (부서별 집계 시 사용)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.user_id                  IS '사용자ID (개인별 집계 시 사용)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.data_json                IS '유연한 집계 데이터 JSON ({labels:[...], series:[{name,data:[...]}]})';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col1_nm                  IS '지표1명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col1_num                 IS '지표1값';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col2_nm                  IS '지표2명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col2_num                 IS '지표2값';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col3_nm                  IS '지표3명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col3_num                 IS '지표3값';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col4_nm                  IS '지표4명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col4_num                 IS '지표4값';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col5_nm                  IS '지표5명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col5_num                 IS '지표5값';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col6_nm                  IS '지표6명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col6_num                 IS '지표6값';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col7_nm                  IS '지표7명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col7_num                 IS '지표7값';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col8_nm                  IS '지표8명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col8_num                 IS '지표8값';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col9_nm                  IS '지표9명';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item_data.col9_num                 IS '지표9값';

-- ============================================================
-- STEP 6. site_id 일괄 업데이트: 'SITE000000000001' → '2604010000000001'
-- ============================================================

UPDATE shopjoy_2604.cm_dashboard
SET    site_id = '2604010000000001'
WHERE  site_id = 'SITE000000000001';

UPDATE shopjoy_2604.cm_dashboard_item
SET    site_id = '2604010000000001'
WHERE  site_id = 'SITE000000000001';

UPDATE shopjoy_2604.cm_dashboard_item_data
SET    site_id = '2604010000000001'
WHERE  site_id = 'SITE000000000001';

-- 백업 테이블도 동기화 (참고용)
UPDATE shopjoy_2604.cm_dashboard_data_bak_20260627
SET    site_id = '2604010000000001'
WHERE  site_id = 'SITE000000000001';

-- ============================================================
-- STEP 7. 추가 인덱스 (cm_dashboard_item_data)
-- ============================================================

-- uq_cm_dashboard_item_data_key 는 STEP 5에서 rename 완료
-- 혹시 rename 미적용 환경 대비 누락 시 생성
CREATE UNIQUE INDEX IF NOT EXISTS uq_cm_dashboard_item_data_key
    ON shopjoy_2604.cm_dashboard_item_data (dashboard_item_id, yyyymmdd, dept_id, user_id);

CREATE INDEX IF NOT EXISTS idx_cm_dashboard_item_data_item_id
    ON shopjoy_2604.cm_dashboard_item_data (dashboard_item_id);

CREATE INDEX IF NOT EXISTS idx_cm_dashboard_item_data_yyyymmdd
    ON shopjoy_2604.cm_dashboard_item_data (yyyymmdd);

CREATE INDEX IF NOT EXISTS idx_cm_dashboard_item_data_site_id
    ON shopjoy_2604.cm_dashboard_item_data (site_id);

CREATE INDEX IF NOT EXISTS idx_cm_dashboard_item_data_user_id
    ON shopjoy_2604.cm_dashboard_item_data (user_id);

-- ============================================================
-- 완료 확인용 검증 쿼리 (주석 처리, 필요 시 주석 해제)
-- ============================================================
-- SELECT COUNT(*) FROM shopjoy_2604.cm_dashboard;               -- 3
-- SELECT COUNT(*) FROM shopjoy_2604.cm_dashboard_item;          -- 16
-- SELECT COUNT(*) FROM shopjoy_2604.cm_dashboard_item_data;     -- 1438
-- SELECT DISTINCT site_id FROM shopjoy_2604.cm_dashboard;
-- SELECT DISTINCT site_id FROM shopjoy_2604.cm_dashboard_item;
-- SELECT DISTINCT site_id FROM shopjoy_2604.cm_dashboard_item_data;
-- SELECT dashboard_id, ui_comp_nm, dashboard_nm FROM shopjoy_2604.cm_dashboard ORDER BY sort_ord;
-- SELECT dashboard_item_id, dashboard_id, item_key, item_nm FROM shopjoy_2604.cm_dashboard_item ORDER BY sort_ord;
