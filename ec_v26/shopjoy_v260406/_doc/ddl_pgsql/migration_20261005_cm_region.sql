-- ═══════════════════════════════════════════════════════════════════════════
--  migration_20261005_cm_region.sql — 지역(동네) 테이블 cm_region 신설 + 당무마켓1(SI260003) 초기 동네 (2026-10-05)
-- ═══════════════════════════════════════════════════════════════════════════
--  설계: 정책서 sy.57.사이트테넌시정책.데이터정비-2026-10-04.md §6-2 (사용자 "지금 만들라" — 이번 작업에서 새 테이블은 이것 하나)
--  쓰는 곳:
--    ecBeBo   base/ec/cm(CmRegion·CmRegionService) · FO GET /api/fo/ec/cm/region?level=3 (X-Site-Id 사이트별)
--             · BO /api/bo/ec/cm/region (CRUD·save-list, 사이트 멀티 선택)
--    ecFeBo   pages/bo/ec/cm/CmRegionMng.js (지역(동네) 관리)
--    FO       danmoo1 useDmTown — 동네 선택·동네지도·글쓰기 거래 장소. 이 테이블이 없거나 비면 FO 예비 상수(conts/tenant/danmoo1.ts)로 동작
--  초기 데이터: FO 상수 DM_NEIGHBORHOODS·DM_TOWN_COORDS 의 10개 동 + 상위 시군구 4개(2단계).
--
--  실행: psql/DBeaver, 스키마 소유자 postgres. 한 트랜잭션(중간 실패 시 전체 롤백). 다시 실행해도 안전
--        (CREATE … IF NOT EXISTS, COMMENT 는 덮어씀, 초기 행은 같은 사이트·상위·이름이 있으면 건너뜀).
--  순서: 이 파일 → migration_20261005_feat5_data.sql(BO 메뉴 등). 백엔드는 이 파일 전에 배포돼도 기동·동작한다(테이블 없으면 FO 빈 목록).
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS shopjoy_2604.cm_region (
    region_id         varchar(21)   NOT NULL,
    site_id           varchar(21)   NOT NULL,
    parent_region_id  varchar(21),
    region_nm         varchar(100)  NOT NULL,
    region_level      integer       NOT NULL DEFAULT 3,
    lat               numeric(10,7),
    lng               numeric(10,7),
    radius_m          integer,
    sort_ord          integer,
    use_yn            varchar(1)    DEFAULT 'Y',
    default_yn        varchar(1)    DEFAULT 'N',
    reg_by            varchar(30),
    reg_date          timestamp     DEFAULT CURRENT_TIMESTAMP,
    upd_by            varchar(30),
    upd_date          timestamp,
    reg_site_id       varchar(21),
    CONSTRAINT cm_region_pkey PRIMARY KEY (region_id),
    CONSTRAINT cm_region_ck_level CHECK (region_level BETWEEN 1 AND 3),
    CONSTRAINT cm_region_ck_use_yn CHECK (use_yn IN ('Y', 'N')),
    CONSTRAINT cm_region_ck_default_yn CHECK (default_yn IN ('Y', 'N')),
    CONSTRAINT cm_region_ck_lat CHECK (lat IS NULL OR lat BETWEEN -90 AND 90),
    CONSTRAINT cm_region_ck_lng CHECK (lng IS NULL OR lng BETWEEN -180 AND 180)
);

-- 같은 사이트·같은 상위 아래 이름은 하나(상위 없음 = '' 로 본다)
CREATE UNIQUE INDEX IF NOT EXISTS cm_region_uk_site_parent_nm ON shopjoy_2604.cm_region (site_id, (coalesce(parent_region_id, '')), region_nm);
CREATE INDEX IF NOT EXISTS cm_region_ix_site_use ON shopjoy_2604.cm_region (site_id, use_yn);
CREATE INDEX IF NOT EXISTS cm_region_ix_parent ON shopjoy_2604.cm_region (parent_region_id);

COMMENT ON TABLE  shopjoy_2604.cm_region                  IS '지역(동네) — 사이트별 동네 목록·좌표 (당근형 사이트의 동네 선택·지도·거래 장소, 2026-10-05)';
COMMENT ON COLUMN shopjoy_2604.cm_region.region_id        IS '지역ID (CMR+YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.cm_region.site_id          IS '사이트ID (sy_site.site_id) - 이 동네 목록을 쓰는 사이트';
COMMENT ON COLUMN shopjoy_2604.cm_region.parent_region_id IS '상위 지역ID (cm_region.region_id) - 동 → 시군구, 최상위 NULL';
COMMENT ON COLUMN shopjoy_2604.cm_region.region_nm        IS '지역명 (예: 여수동, 성남시 중원구)';
COMMENT ON COLUMN shopjoy_2604.cm_region.region_level     IS '지역 단계 (1 시도 / 2 시군구 / 3 읍면동)';
COMMENT ON COLUMN shopjoy_2604.cm_region.lat              IS '위도 (WGS84)';
COMMENT ON COLUMN shopjoy_2604.cm_region.lng              IS '경도 (WGS84)';
COMMENT ON COLUMN shopjoy_2604.cm_region.radius_m         IS '근처 판정 반경(미터)';
COMMENT ON COLUMN shopjoy_2604.cm_region.sort_ord         IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.cm_region.use_yn           IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.cm_region.default_yn       IS '기본 동네 여부 Y/N (사이트당 1개 — 처음 들어온 사용자의 동네)';
COMMENT ON COLUMN shopjoy_2604.cm_region.reg_by           IS '등록자';
COMMENT ON COLUMN shopjoy_2604.cm_region.reg_date         IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.cm_region.upd_by           IS '수정자';
COMMENT ON COLUMN shopjoy_2604.cm_region.upd_date         IS '수정일시';
COMMENT ON COLUMN shopjoy_2604.cm_region.reg_site_id      IS '등록 사이트ID (감사 필드 — 사이트 조건은 site_id)';

-- ── 초기 데이터: 당무마켓1(SI260003) — 상위 시군구(2단계) 4개 ─────────────────────────
INSERT INTO shopjoy_2604.cm_region (region_id, site_id, parent_region_id, region_nm, region_level, lat, lng, radius_m, sort_ord, use_yn, default_yn, reg_by, reg_date, reg_site_id)
SELECT v.region_id, 'SI260003', NULL, v.region_nm, 2, v.lat, v.lng, NULL, v.sort_ord, 'Y', 'N', 'MIGRATION_20261005', CURRENT_TIMESTAMP, 'SI260003'
  FROM (VALUES
         ('CMR2610051900000001', '성남시 중원구', 37.4306000, 127.1376000, 1),
         ('CMR2610051900000002', '성남시 수정구', 37.4500000, 127.1460000, 2),
         ('CMR2610051900000003', '성남시 분당구', 37.3826000, 127.1189000, 3),
         ('CMR2610051900000004', '서울 서초구',   37.4837000, 127.0324000, 4)
       ) AS v(region_id, region_nm, lat, lng, sort_ord)
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.cm_region r
                    WHERE r.region_id = v.region_id
                       OR (r.site_id = 'SI260003' AND r.parent_region_id IS NULL AND r.region_nm = v.region_nm));

-- ── 초기 데이터: 동네(3단계) 10개 — FO 상수 DM_NEIGHBORHOODS·DM_TOWN_COORDS 그대로(성남 일대 대략 좌표), 기본 동네 여수동 ──
INSERT INTO shopjoy_2604.cm_region (region_id, site_id, parent_region_id, region_nm, region_level, lat, lng, radius_m, sort_ord, use_yn, default_yn, reg_by, reg_date, reg_site_id)
SELECT v.region_id, 'SI260003', p.region_id, v.region_nm, 3, v.lat, v.lng, 1500, v.sort_ord, 'Y', v.default_yn, 'MIGRATION_20261005', CURRENT_TIMESTAMP, 'SI260003'
  FROM (VALUES
         ('CMR2610051900000011', '여수동',  '성남시 중원구', 37.4449000, 127.1388000,  1, 'Y'),
         ('CMR2610051900000012', '금토동',  '성남시 수정구', 37.4047000, 127.0968000,  2, 'N'),
         ('CMR2610051900000013', '창곡동',  '성남시 수정구', 37.4692000, 127.1446000,  3, 'N'),
         ('CMR2610051900000014', '신흥1동', '성남시 수정구', 37.4426000, 127.1495000,  4, 'N'),
         ('CMR2610051900000015', '백현동',  '성남시 분당구', 37.3888000, 127.1123000,  5, 'N'),
         ('CMR2610051900000016', '야탑동',  '성남시 분당구', 37.4113000, 127.1289000,  6, 'N'),
         ('CMR2610051900000017', '이매1동', '성남시 분당구', 37.3977000, 127.1288000,  7, 'N'),
         ('CMR2610051900000018', '수내3동', '성남시 분당구', 37.3786000, 127.1162000,  8, 'N'),
         ('CMR2610051900000019', '삼평동',  '성남시 분당구', 37.4015000, 127.1067000,  9, 'N'),
         ('CMR2610051900000020', '양재동',  '서울 서초구',   37.4701000, 127.0383000, 10, 'N')
       ) AS v(region_id, region_nm, parent_nm, lat, lng, sort_ord, default_yn)
  JOIN shopjoy_2604.cm_region p ON p.site_id = 'SI260003' AND p.parent_region_id IS NULL AND p.region_nm = v.parent_nm
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.cm_region r
                    WHERE r.region_id = v.region_id
                       OR (r.site_id = 'SI260003' AND r.parent_region_id = p.region_id AND r.region_nm = v.region_nm));

COMMIT;

-- ═══════════════════════════════════════════════════════════
--  검증
-- ═══════════════════════════════════════════════════════════
-- SELECT region_level, count(*) FROM shopjoy_2604.cm_region WHERE site_id = 'SI260003' GROUP BY 1 ORDER BY 1;   → 2단계 4, 3단계 10
-- SELECT region_nm, default_yn FROM shopjoy_2604.cm_region WHERE site_id = 'SI260003' AND default_yn = 'Y';      → 여수동 1행
-- curl -H 'X-Site-Id: SI260003' https://22300.illeesam.synology.me/api/fo/ec/cm/region?level=3                  → 10건
--
-- ═══════════════════════════════════════════════════════════
--  롤백 (주석 해제 후 실행) — BO 에서 추가한 동네도 함께 지워진다
-- ═══════════════════════════════════════════════════════════
-- DROP TABLE IF EXISTS shopjoy_2604.cm_region;
