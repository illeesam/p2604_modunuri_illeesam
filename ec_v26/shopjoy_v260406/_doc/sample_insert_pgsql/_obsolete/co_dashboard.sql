-- ============================================================
-- co_dashboard 샘플 데이터
-- 대시보드 집계 행: 각 info 코드당 대표 행 1~N개
-- dashboard_id 규칙: info코드_yyyymmdd_siteNo (조회 참조용)
-- ============================================================

-- DDL 먼저 실행 필요: _doc/ddl_pgsql/ec/co_dashboard.sql

-- ── DDL 생성 (없으면 생성) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS shopjoy_2604.co_dashboard (
    dashboard_id VARCHAR(21) NOT NULL,
    yyyymmdd     VARCHAR(8)  NOT NULL,
    site_no      VARCHAR(10) NOT NULL,
    site_nm      VARCHAR(100),
    dept_id      VARCHAR(21),
    dept_nm      VARCHAR(100),
    user_id      VARCHAR(21),
    user_nm      VARCHAR(100),
    col1_nm      VARCHAR(100), col1_num FLOAT8,
    col2_nm      VARCHAR(100), col2_num FLOAT8,
    col3_nm      VARCHAR(100), col3_num FLOAT8,
    col4_nm      VARCHAR(100), col4_num FLOAT8,
    col5_nm      VARCHAR(100), col5_num FLOAT8,
    col6_nm      VARCHAR(100), col6_num FLOAT8,
    col7_nm      VARCHAR(100), col7_num FLOAT8,
    col8_nm      VARCHAR(100), col8_num FLOAT8,
    col9_nm      VARCHAR(100), col9_num FLOAT8,
    reg_by       VARCHAR(30),
    reg_date     TIMESTAMP,
    upd_by       VARCHAR(30),
    upd_date     TIMESTAMP,
    CONSTRAINT pk_co_dashboard PRIMARY KEY (dashboard_id)
);

-- ── info0101 월별 매출현황 (14개월) ───────────────────────
INSERT INTO shopjoy_2604.co_dashboard
    (dashboard_id, yyyymmdd, site_no, site_nm,
     col1_nm, col1_num, reg_by, reg_date)
VALUES
    ('D0101_202505_01','20250501','01','ShopJoy','2025-05',118500000,  'SYSTEM',CURRENT_TIMESTAMP),
    ('D0101_202506_01','20250601','01','ShopJoy','2025-06',132000000,  'SYSTEM',CURRENT_TIMESTAMP),
    ('D0101_202507_01','20250701','01','ShopJoy','2025-07',145800000,  'SYSTEM',CURRENT_TIMESTAMP),
    ('D0101_202508_01','20250801','01','ShopJoy','2025-08',139200000,  'SYSTEM',CURRENT_TIMESTAMP),
    ('D0101_202509_01','20250901','01','ShopJoy','2025-09',128700000,  'SYSTEM',CURRENT_TIMESTAMP),
    ('D0101_202510_01','20251001','01','ShopJoy','2025-10',155300000,  'SYSTEM',CURRENT_TIMESTAMP),
    ('D0101_202511_01','20251101','01','ShopJoy','2025-11',162400000,  'SYSTEM',CURRENT_TIMESTAMP),
    ('D0101_202512_01','20251201','01','ShopJoy','2025-12',198600000,  'SYSTEM',CURRENT_TIMESTAMP),
    ('D0101_202601_01','20260101','01','ShopJoy','2026-01',143100000,  'SYSTEM',CURRENT_TIMESTAMP),
    ('D0101_202602_01','20260201','01','ShopJoy','2026-02',131900000,  'SYSTEM',CURRENT_TIMESTAMP),
    ('D0101_202603_01','20260301','01','ShopJoy','2026-03',148200000,  'SYSTEM',CURRENT_TIMESTAMP),
    ('D0101_202604_01','20260401','01','ShopJoy','2026-04',160500000,  'SYSTEM',CURRENT_TIMESTAMP),
    ('D0101_202605_01','20260501','01','ShopJoy','2026-05',174800000,  'SYSTEM',CURRENT_TIMESTAMP),
    ('D0101_202606_01','20260601','01','ShopJoy','2026-06',112972550,  'SYSTEM',CURRENT_TIMESTAMP)
ON CONFLICT (dashboard_id) DO UPDATE
    SET col1_num=EXCLUDED.col1_num, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

-- ── info0202 핵심지표 (단일행) ───────────────────────────
INSERT INTO shopjoy_2604.co_dashboard
    (dashboard_id, yyyymmdd, site_no, site_nm,
     col1_nm, col1_num, col2_nm, col2_num, col3_nm, col3_num, col4_nm, col4_num,
     reg_by, reg_date)
VALUES
    ('D0202_202606_01','20260601','01','ShopJoy',
     '전체 매출현황',1951772550,'전체 구매수량',30033,'평균 마진율',7.7,'평균 결제금액',64988,
     'SYSTEM',CURRENT_TIMESTAMP)
ON CONFLICT (dashboard_id) DO UPDATE
    SET col1_num=EXCLUDED.col1_num, col2_num=EXCLUDED.col2_num,
        col3_num=EXCLUDED.col3_num, col4_num=EXCLUDED.col4_num,
        upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

-- ── info0203 상품별 TOP 7 ────────────────────────────────
INSERT INTO shopjoy_2604.co_dashboard
    (dashboard_id, yyyymmdd, site_no, site_nm,
     col1_nm, col1_num, col2_nm, col2_num, col3_nm, col3_num, col4_nm, col4_num,
     col5_nm, col5_num, col6_nm, col6_num, col7_nm, col7_num,
     reg_by, reg_date)
VALUES
    ('D0203_202606_01','20260601','01','ShopJoy',
     '오버사이즈 코드',  1495000,
     '슬림핏 데님 진',   2995000,
     '캐시미 니트 스웨터',2450000,
     '글로벌 미디 드레스',3950000,
     '카고 와이드 팬츠',  2750000,
     '울 블렌드 콤프드',  5950000,
     '스드라이프 티서츠', 2250000,
     'SYSTEM',CURRENT_TIMESTAMP)
ON CONFLICT (dashboard_id) DO UPDATE
    SET col1_num=EXCLUDED.col1_num, col2_num=EXCLUDED.col2_num,
        col3_num=EXCLUDED.col3_num, col4_num=EXCLUDED.col4_num,
        col5_num=EXCLUDED.col5_num, col6_num=EXCLUDED.col6_num,
        col7_num=EXCLUDED.col7_num,
        upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

-- ── info0204 판매채널 비중 (도넛) ─────────────────────────
INSERT INTO shopjoy_2604.co_dashboard
    (dashboard_id, yyyymmdd, site_no, site_nm,
     col1_nm, col1_num, col2_nm, col2_num, col3_nm, col3_num,
     reg_by, reg_date)
VALUES
    ('D0204_202606_01','20260601','01','ShopJoy',
     '온라인',62,'모바일앱',28,'오프라인',10,
     'SYSTEM',CURRENT_TIMESTAMP)
ON CONFLICT (dashboard_id) DO UPDATE
    SET col1_num=EXCLUDED.col1_num, col2_num=EXCLUDED.col2_num, col3_num=EXCLUDED.col3_num,
        upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

-- ── info0301 디바이스별 비중 ─────────────────────────────
INSERT INTO shopjoy_2604.co_dashboard
    (dashboard_id, yyyymmdd, site_no, site_nm,
     col1_nm, col1_num, col2_nm, col2_num, col3_nm, col3_num,
     reg_by, reg_date)
VALUES
    ('D0301_202606_01','20260601','01','ShopJoy',
     'Mobile',58,'Desktop',32,'Tablet',10,
     'SYSTEM',CURRENT_TIMESTAMP)
ON CONFLICT (dashboard_id) DO UPDATE
    SET col1_num=EXCLUDED.col1_num, col2_num=EXCLUDED.col2_num, col3_num=EXCLUDED.col3_num,
        upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

-- ── info0302 시간대별 비중 ───────────────────────────────
INSERT INTO shopjoy_2604.co_dashboard
    (dashboard_id, yyyymmdd, site_no, site_nm,
     col1_nm, col1_num, col2_nm, col2_num, col3_nm, col3_num, col4_nm, col4_num,
     reg_by, reg_date)
VALUES
    ('D0302_202606_01','20260601','01','ShopJoy',
     '아침 (06-12)',15,'점심 (12-18)',22,'저녁 (18-24)',38,'야간 (00-06)',25,
     'SYSTEM',CURRENT_TIMESTAMP)
ON CONFLICT (dashboard_id) DO UPDATE
    SET col1_num=EXCLUDED.col1_num, col2_num=EXCLUDED.col2_num,
        col3_num=EXCLUDED.col3_num, col4_num=EXCLUDED.col4_num,
        upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

-- ── info0303 지역별 매출현황 ─────────────────────────────
INSERT INTO shopjoy_2604.co_dashboard
    (dashboard_id, yyyymmdd, site_no, site_nm,
     col1_nm, col1_num, col2_nm, col2_num, col3_nm, col3_num, col4_nm, col4_num,
     col5_nm, col5_num, col6_nm, col6_num, col7_nm, col7_num,
     reg_by, reg_date)
VALUES
    ('D0303_202606_01','20260601','01','ShopJoy',
     '서울',58000000,'경기',42000000,'부산',21000000,'인천',16000000,
     '대구',12000000,'광주',9000000,'기타',6000000,
     'SYSTEM',CURRENT_TIMESTAMP)
ON CONFLICT (dashboard_id) DO UPDATE
    SET col1_num=EXCLUDED.col1_num, col2_num=EXCLUDED.col2_num,
        col3_num=EXCLUDED.col3_num, col4_num=EXCLUDED.col4_num,
        col5_num=EXCLUDED.col5_num, col6_num=EXCLUDED.col6_num,
        col7_num=EXCLUDED.col7_num,
        upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

-- ── info0401 영업지표 비교 ───────────────────────────────
INSERT INTO shopjoy_2604.co_dashboard
    (dashboard_id, yyyymmdd, site_no, site_nm,
     col1_nm, col1_num, col2_nm, col2_num, col3_nm, col3_num, col4_nm, col4_num, col5_nm, col5_num,
     reg_by, reg_date)
VALUES
    ('D0401_202606_01','20260601','01','ShopJoy',
     '매출',78,'주문',65,'반품률',42,'신규회원',55,'재구매',70,
     'SYSTEM',CURRENT_TIMESTAMP)
ON CONFLICT (dashboard_id) DO UPDATE
    SET col1_num=EXCLUDED.col1_num, col2_num=EXCLUDED.col2_num,
        col3_num=EXCLUDED.col3_num, col4_num=EXCLUDED.col4_num,
        col5_num=EXCLUDED.col5_num,
        upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

-- ── info0403 배송조건별 매출현황 ─────────────────────────
INSERT INTO shopjoy_2604.co_dashboard
    (dashboard_id, yyyymmdd, site_no, site_nm,
     col1_nm, col1_num, col2_nm, col2_num,
     reg_by, reg_date)
VALUES
    ('D0403_202606_01','20260601','01','ShopJoy',
     '무료배송',58,'유료배송',42,
     'SYSTEM',CURRENT_TIMESTAMP)
ON CONFLICT (dashboard_id) DO UPDATE
    SET col1_num=EXCLUDED.col1_num, col2_num=EXCLUDED.col2_num,
        upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;
