-- =====================================================================
-- 복합 PK → 대리키(surrogate) PK + UNIQUE 전환 (2026-08-10)
--
-- 정책: 모든 테이블은 자기 테이블명 기반 단일 컬럼 {테이블명(도메인접두어 제외)}_id 를 PK 로 갖는다.
--       복합키가 필요하면 PK 가 아니라 UNIQUE 제약으로 만든다.
--       예외: 로그(*_log) · 이력(*_hist) 테이블
--
-- 대상 5건 (전수 조사 결과 복합 PK 는 이것뿐이며 모두 로그/이력이 아님)
--   pm_coupon_prod (coupon_id, prod_id)   → coupon_prod_id
--   pm_discnt_prod (discnt_id, prod_id)   → discnt_prod_id
--   pm_event_prod  (event_id, prod_id)    → event_prod_id
--   pm_save_prod   (save_id, prod_id)     → save_prod_id
--   sy_user_pref   (user_id, pref_key)    → user_pref_id
--
-- 데이터: pm_* 4개는 0행, sy_user_pref 만 6행
-- 기존 복합 PK 가 담당하던 유일성은 UNIQUE 제약이 그대로 보장한다(중복 입력 방지 유지).
-- ⚠ UPDATE 의 row_number() 는 SET 절에 직접 못 쓴다(PostgreSQL 제약) → FROM 서브쿼리로 조인
-- =====================================================================

-- ── pm_coupon_prod ───────────────────────────────────────────────────
ALTER TABLE shopjoy_2604.pm_coupon_prod ADD COLUMN IF NOT EXISTS coupon_prod_id VARCHAR(21);
UPDATE shopjoy_2604.pm_coupon_prod t SET coupon_prod_id = 'CQ' || lpad(s.rn::text, 15, '0')
  FROM (SELECT coupon_id AS k1, prod_id AS k2, row_number() OVER (ORDER BY coupon_id, prod_id) AS rn
          FROM shopjoy_2604.pm_coupon_prod) s
 WHERE t.coupon_id = s.k1 AND t.prod_id = s.k2 AND t.coupon_prod_id IS NULL;
ALTER TABLE shopjoy_2604.pm_coupon_prod ALTER COLUMN coupon_prod_id SET NOT NULL;
ALTER TABLE shopjoy_2604.pm_coupon_prod DROP CONSTRAINT pm_coupon_prod_pk_coupon_id_prod_id_x2;
ALTER TABLE shopjoy_2604.pm_coupon_prod ADD CONSTRAINT pm_coupon_prod_pk_coupon_prod_id PRIMARY KEY (coupon_prod_id);
ALTER TABLE shopjoy_2604.pm_coupon_prod ADD CONSTRAINT pm_coupon_prod_uk_coupon_id_prod_id_x2 UNIQUE (coupon_id, prod_id);
COMMENT ON COLUMN shopjoy_2604.pm_coupon_prod.coupon_prod_id IS '쿠폰상품ID (PK)';

-- ── pm_discnt_prod ───────────────────────────────────────────────────
ALTER TABLE shopjoy_2604.pm_discnt_prod ADD COLUMN IF NOT EXISTS discnt_prod_id VARCHAR(21);
UPDATE shopjoy_2604.pm_discnt_prod t SET discnt_prod_id = 'DQ' || lpad(s.rn::text, 15, '0')
  FROM (SELECT discnt_id AS k1, prod_id AS k2, row_number() OVER (ORDER BY discnt_id, prod_id) AS rn
          FROM shopjoy_2604.pm_discnt_prod) s
 WHERE t.discnt_id = s.k1 AND t.prod_id = s.k2 AND t.discnt_prod_id IS NULL;
ALTER TABLE shopjoy_2604.pm_discnt_prod ALTER COLUMN discnt_prod_id SET NOT NULL;
ALTER TABLE shopjoy_2604.pm_discnt_prod DROP CONSTRAINT pm_discnt_prod_pk_discnt_id_prod_id_x2;
ALTER TABLE shopjoy_2604.pm_discnt_prod ADD CONSTRAINT pm_discnt_prod_pk_discnt_prod_id PRIMARY KEY (discnt_prod_id);
ALTER TABLE shopjoy_2604.pm_discnt_prod ADD CONSTRAINT pm_discnt_prod_uk_discnt_id_prod_id_x2 UNIQUE (discnt_id, prod_id);
COMMENT ON COLUMN shopjoy_2604.pm_discnt_prod.discnt_prod_id IS '할인상품ID (PK)';

-- ── pm_event_prod ────────────────────────────────────────────────────
ALTER TABLE shopjoy_2604.pm_event_prod ADD COLUMN IF NOT EXISTS event_prod_id VARCHAR(21);
UPDATE shopjoy_2604.pm_event_prod t SET event_prod_id = 'EQ' || lpad(s.rn::text, 15, '0')
  FROM (SELECT event_id AS k1, prod_id AS k2, row_number() OVER (ORDER BY event_id, prod_id) AS rn
          FROM shopjoy_2604.pm_event_prod) s
 WHERE t.event_id = s.k1 AND t.prod_id = s.k2 AND t.event_prod_id IS NULL;
ALTER TABLE shopjoy_2604.pm_event_prod ALTER COLUMN event_prod_id SET NOT NULL;
ALTER TABLE shopjoy_2604.pm_event_prod DROP CONSTRAINT pm_event_prod_pk_event_id_prod_id_x2;
ALTER TABLE shopjoy_2604.pm_event_prod ADD CONSTRAINT pm_event_prod_pk_event_prod_id PRIMARY KEY (event_prod_id);
ALTER TABLE shopjoy_2604.pm_event_prod ADD CONSTRAINT pm_event_prod_uk_event_id_prod_id_x2 UNIQUE (event_id, prod_id);
COMMENT ON COLUMN shopjoy_2604.pm_event_prod.event_prod_id IS '이벤트상품ID (PK)';

-- ── pm_save_prod ─────────────────────────────────────────────────────
ALTER TABLE shopjoy_2604.pm_save_prod ADD COLUMN IF NOT EXISTS save_prod_id VARCHAR(21);
UPDATE shopjoy_2604.pm_save_prod t SET save_prod_id = 'SQ' || lpad(s.rn::text, 15, '0')
  FROM (SELECT save_id AS k1, prod_id AS k2, row_number() OVER (ORDER BY save_id, prod_id) AS rn
          FROM shopjoy_2604.pm_save_prod) s
 WHERE t.save_id = s.k1 AND t.prod_id = s.k2 AND t.save_prod_id IS NULL;
ALTER TABLE shopjoy_2604.pm_save_prod ALTER COLUMN save_prod_id SET NOT NULL;
ALTER TABLE shopjoy_2604.pm_save_prod DROP CONSTRAINT pm_save_prod_pk_save_id_prod_id_x2;
ALTER TABLE shopjoy_2604.pm_save_prod ADD CONSTRAINT pm_save_prod_pk_save_prod_id PRIMARY KEY (save_prod_id);
ALTER TABLE shopjoy_2604.pm_save_prod ADD CONSTRAINT pm_save_prod_uk_save_id_prod_id_x2 UNIQUE (save_id, prod_id);
COMMENT ON COLUMN shopjoy_2604.pm_save_prod.save_prod_id IS '적립상품ID (PK)';

-- ── sy_user_pref (6행 — 기존 데이터에 ID 부여) ────────────────────────
ALTER TABLE shopjoy_2604.sy_user_pref ADD COLUMN IF NOT EXISTS user_pref_id VARCHAR(21);
UPDATE shopjoy_2604.sy_user_pref t SET user_pref_id = 'UF' || lpad(s.rn::text, 15, '0')
  FROM (SELECT user_id AS k1, pref_key AS k2, row_number() OVER (ORDER BY user_id, pref_key) AS rn
          FROM shopjoy_2604.sy_user_pref) s
 WHERE t.user_id = s.k1 AND t.pref_key = s.k2 AND t.user_pref_id IS NULL;
ALTER TABLE shopjoy_2604.sy_user_pref ALTER COLUMN user_pref_id SET NOT NULL;
ALTER TABLE shopjoy_2604.sy_user_pref DROP CONSTRAINT sy_user_pref_pk_user_id_pref_key_x2;
ALTER TABLE shopjoy_2604.sy_user_pref ADD CONSTRAINT sy_user_pref_pk_user_pref_id PRIMARY KEY (user_pref_id);
ALTER TABLE shopjoy_2604.sy_user_pref ADD CONSTRAINT sy_user_pref_uk_user_id_pref_key_x2 UNIQUE (user_id, pref_key);
COMMENT ON COLUMN shopjoy_2604.sy_user_pref.user_pref_id IS '사용자환경설정ID (PK)';

ANALYZE;
