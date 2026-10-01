-- ═══════════════════════════════════════════════════════════
--  셀러 모듈 접두어 변경: mb_seller* → sl_seller*  (판매자를 회원(mb) 모듈에서 독립 모듈(sl)로 분리)
--  작성일: 2026-10-02
--
--  대상 테이블 (3개)
--    mb_seller            → sl_seller
--    mb_seller_member     → sl_seller_member
--    mb_seller_warehouse  → sl_seller_warehouse
--
--  처리 내용
--    1) 테이블명 변경 (데이터 그대로 보존)
--    2) 위 3개 테이블의 PK/UNIQUE/FK/CHECK 제약명과 인덱스명 중 'mb_seller' 가 들어간 것을 'sl_seller' 로 변경
--       (어느 DDL 로 만들었든 — ec/mb_seller*.sql 방식, migration_* 방식 — 이름 패턴이 달라도 동작하도록 동적 처리)
--    3) 스키마 전체의 테이블/컬럼 COMMENT 중 'mb_seller' 문구를 'sl_seller' 로 치환
--       (예: pd_prod.seller_id 의 '판매자ID (mb_seller.seller_id)')
--
--  변경하지 않는 것
--    - 다른 테이블이 가진 FK 제약명 (fk_pd_prod_seller, fk_pm_*_seller 등 — 이름에 mb_seller 가 없음).
--      FK 가 가리키는 대상은 테이블 RENAME 으로 자동 추적된다.
--    - mb_member.md_yn, mb_member_email_verify 등 회원 소속 객체 (회원 모듈 그대로)
--
--  ⚠ 실행 순서: 이 파일을 먼저 실행한 뒤, migration_20261002_sku_warehouse.sql 을 실행한다
--               (그 파일은 sl_seller_warehouse 를 참조한다).
--  ⚠ 코드 배포: 이 마이그레이션 실행 후에는 반드시 sl_ 이름을 쓰는 새 백엔드(ecBeBo)를 배포해야 한다.
--               (구 백엔드는 mb_seller 를 찾아 오류 — 개발 DB 에서 실행하고 곧바로 배포할 것)
-- ═══════════════════════════════════════════════════════════
--  사용법 (psql/DBeaver): 아래 스크립트를 한 번에 실행 (재실행해도 안전 — 이미 변경됐으면 건너뜀)
-- ═══════════════════════════════════════════════════════════

SET search_path TO shopjoy_2604;

DO $$
DECLARE
  r      RECORD;
  v_old  TEXT;
  v_new  TEXT;
BEGIN
  -- 1) 테이블명 변경
  FOREACH v_old IN ARRAY ARRAY['mb_seller', 'mb_seller_member', 'mb_seller_warehouse'] LOOP
    v_new := replace(v_old, 'mb_seller', 'sl_seller');
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'shopjoy_2604' AND table_name = v_old) THEN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'shopjoy_2604' AND table_name = v_new) THEN
        RAISE EXCEPTION '% 와 % 가 모두 존재합니다. 수동 확인이 필요합니다.', v_old, v_new;
      END IF;
      EXECUTE format('ALTER TABLE shopjoy_2604.%I RENAME TO %I', v_old, v_new);
      RAISE NOTICE '테이블명 변경: % → %', v_old, v_new;
    END IF;
  END LOOP;

  -- 2-a) 제약명 변경 (PK/UNIQUE 는 연결된 인덱스명도 함께 바뀜)
  FOR r IN
    SELECT c.relname AS tbl, con.conname AS name
      FROM pg_constraint con
      JOIN pg_class c     ON c.oid = con.conrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'shopjoy_2604'
       AND c.relname IN ('sl_seller', 'sl_seller_member', 'sl_seller_warehouse')
       AND con.conname LIKE '%mb_seller%'
  LOOP
    EXECUTE format('ALTER TABLE shopjoy_2604.%I RENAME CONSTRAINT %I TO %I', r.tbl, r.name, replace(r.name, 'mb_seller', 'sl_seller'));
    RAISE NOTICE '제약명 변경: %.% → %', r.tbl, r.name, replace(r.name, 'mb_seller', 'sl_seller');
  END LOOP;

  -- 2-b) 인덱스명 변경 (제약과 무관한 일반/부분 유니크 인덱스 — 2-a 에서 이미 바뀐 것은 대상에서 빠짐)
  FOR r IN
    SELECT indexname AS name
      FROM pg_indexes
     WHERE schemaname = 'shopjoy_2604'
       AND tablename IN ('sl_seller', 'sl_seller_member', 'sl_seller_warehouse')
       AND indexname LIKE '%mb_seller%'
  LOOP
    EXECUTE format('ALTER INDEX shopjoy_2604.%I RENAME TO %I', r.name, replace(r.name, 'mb_seller', 'sl_seller'));
    RAISE NOTICE '인덱스명 변경: % → %', r.name, replace(r.name, 'mb_seller', 'sl_seller');
  END LOOP;

  -- 3-a) 테이블 COMMENT 안의 'mb_seller' 문구 치환
  FOR r IN
    SELECT c.relname AS tbl, d.description AS descr
      FROM pg_description d
      JOIN pg_class c     ON c.oid = d.objoid AND d.classoid = 'pg_class'::regclass
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'shopjoy_2604' AND d.objsubid = 0 AND c.relkind = 'r'
       AND d.description LIKE '%mb_seller%'
  LOOP
    EXECUTE format('COMMENT ON TABLE shopjoy_2604.%I IS %L', r.tbl, replace(r.descr, 'mb_seller', 'sl_seller'));
  END LOOP;

  -- 3-b) 컬럼 COMMENT 안의 'mb_seller' 문구 치환
  FOR r IN
    SELECT c.relname AS tbl, a.attname AS col, d.description AS descr
      FROM pg_description d
      JOIN pg_class c     ON c.oid = d.objoid AND d.classoid = 'pg_class'::regclass
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = d.objsubid
     WHERE n.nspname = 'shopjoy_2604' AND d.objsubid > 0 AND c.relkind = 'r'
       AND d.description LIKE '%mb_seller%'
  LOOP
    EXECUTE format('COMMENT ON COLUMN shopjoy_2604.%I.%I IS %L', r.tbl, r.col, replace(r.descr, 'mb_seller', 'sl_seller'));
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════
--  검증 (결과가 아래 주석과 같아야 함)
-- ═══════════════════════════════════════════════════════════
-- SELECT table_name FROM information_schema.tables WHERE table_schema='shopjoy_2604' AND table_name LIKE '%seller%' ORDER BY 1;
--   → sl_seller, sl_seller_member, sl_seller_warehouse (mb_seller* 는 없어야 함)
-- SELECT conrelid::regclass, conname FROM pg_constraint WHERE conname LIKE '%mb_seller%';          → 0건
-- SELECT indexname FROM pg_indexes WHERE schemaname='shopjoy_2604' AND indexname LIKE '%mb_seller%'; → 0건
-- SELECT count(*) FROM shopjoy_2604.sl_seller;   -- 기존 데이터 건수 그대로인지 확인
