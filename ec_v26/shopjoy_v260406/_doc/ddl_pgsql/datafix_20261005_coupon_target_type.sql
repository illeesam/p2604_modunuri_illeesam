-- ============================================================================================
-- datafix_20261005_coupon_target_type.sql  (데이터 보정 — 스키마 변경 없음)
-- 쿠폰 헤더의 적용 대상 종류(pm_coupon.target_type_cd)를 대상 행(pm_coupon_item)의 유형으로 맞춘다.
--
-- 왜 필요한가
--   2026-10-05 쿠폰 주문 연결(ecBeBo PmCouponApplyCalc, 정책서 pm.02 §11)의 대상 판정:
--     · 대상 행이 있으면 그 행만으로 판정(상품 / 카테고리 + 하위 / 브랜드 / 업체)
--     · 대상 행이 없으면 헤더 target_type_cd 가 ALL(또는 MEMBER_GRADE)일 때만 "전체 상품", 그 밖은 "적용 안 됨"
--   그런데 지금 쿠폰 192건의 헤더가 전부 ALL 또는 MEMBER_GRADE 다(대상 행이 있는 쿠폰 112건 포함 — 시드가 헤더를 ALL 로 넣었고,
--   BO 화면은 이 칸을 "발급 대상 종류" 선택기로만 썼다). 이대로 datafix_20261005_promo_disp_site.py 의 D1
--   (없는 카테고리를 가리키는 대상 행 삭제, 쿠폰 대상 171행)을 실행하면 대상이 하나도 남지 않는 쿠폰 57건이
--   헤더 ALL 때문에 "전체 상품 쿠폰"이 된다. 이 스크립트가 대상 행이 있던 쿠폰의 헤더를 그 유형(CATEGORY/PRODUCT …)으로
--   바꿔 두면, 대상이 지워진 뒤에도 "적용 안 됨"으로 남는다.
--
-- 실행 순서
--   원칙: D1 실행 **전에** 이 스크립트 → 그다음 python datafix_20261005_promo_disp_site.py run (D1 포함)
--   D1 을 이미 실행했다면: 2단계가 백업 스키마 shopjoy_2604_bak_promofix_20261005._del 의 지운 대상 행으로 같은 결과를 낸다.
--
-- 바꾸는 범위
--   헤더가 비었거나 ALL / MEMBER_GRADE 인 쿠폰 중 대상 행이 있는(또는 D1 이 지운) 쿠폰만. 헤더가 이미 PRODUCT/CATEGORY 등이면 그대로.
--   MEMBER_GRADE 쿠폰의 등급 제한은 mem_grade_cd 에 그대로 남는다(헤더 값은 상품 범위 판정에만 쓰인다).
--
-- 다시 실행해도 안전(멱등): 바꾼 쿠폰은 백업 표에 한 번만 남고, 이미 바뀐 헤더는 조건에 걸리지 않는다.
-- 되돌리기: 맨 아래 "되돌리기" 블록의 주석을 풀어 실행 (그 뒤 다시 바뀐 칸은 건드리지 않는다).
--
-- 실행: psql 또는 DBeaver 에서 shopjoy_2604 스키마 대상으로 파일 전체 실행 (트랜잭션 1개)
-- ============================================================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS shopjoy_2604_bak_cpntype_20261005;
CREATE TABLE IF NOT EXISTS shopjoy_2604_bak_cpntype_20261005.chg (
    coupon_id           varchar(21) PRIMARY KEY,
    old_target_type_cd  varchar(20),
    new_target_type_cd  varchar(20) NOT NULL,
    src                 text,            -- item = 지금 대상 행 / promofix_del = D1 이 지운 대상 행(백업)
    item_cnt            int,
    chg_at              timestamp DEFAULT now()
);

-- [점검 전] 헤더 × 대상 행 유무
SELECT c.target_type_cd AS header, (SELECT count(*) > 0 FROM shopjoy_2604.pm_coupon_item i WHERE i.coupon_id = c.coupon_id) AS has_item, count(*)
FROM shopjoy_2604.pm_coupon c GROUP BY 1, 2 ORDER BY 1, 2;

-- 1단계: 지금 대상 행이 있는 쿠폰 → 대상 행 유형(한 쿠폰 안에서 유형이 여럿이면 가장 많은 유형)
INSERT INTO shopjoy_2604_bak_cpntype_20261005.chg (coupon_id, old_target_type_cd, new_target_type_cd, src, item_cnt)
SELECT c.coupon_id, c.target_type_cd, t.typ, 'item', t.cnt
FROM shopjoy_2604.pm_coupon c
JOIN (
    SELECT coupon_id,
           (array_agg(target_type_cd ORDER BY n DESC, target_type_cd))[1] AS typ,
           sum(n)::int AS cnt
    FROM (SELECT coupon_id, target_type_cd, count(*) AS n FROM shopjoy_2604.pm_coupon_item GROUP BY 1, 2) x
    GROUP BY coupon_id
) t ON t.coupon_id = c.coupon_id
WHERE coalesce(c.target_type_cd, '') IN ('', 'ALL', 'MEMBER_GRADE')
ON CONFLICT (coupon_id) DO NOTHING;

-- 2단계: D1 을 이미 실행한 경우 — 지금은 대상 행이 없지만 D1 이 지운 대상 행이 있던 쿠폰
DO $$
BEGIN
    IF to_regclass('shopjoy_2604_bak_promofix_20261005._del') IS NOT NULL THEN
        INSERT INTO shopjoy_2604_bak_cpntype_20261005.chg (coupon_id, old_target_type_cd, new_target_type_cd, src, item_cnt)
        SELECT c.coupon_id, c.target_type_cd, min(d.row ->> 'target_type_cd'), 'promofix_del', count(*)::int
        FROM shopjoy_2604.pm_coupon c
        JOIN shopjoy_2604_bak_promofix_20261005._del d
          ON d.tbl = 'pm_coupon_item' AND d.row ->> 'coupon_id' = c.coupon_id
        WHERE coalesce(c.target_type_cd, '') IN ('', 'ALL', 'MEMBER_GRADE')
          AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.pm_coupon_item i WHERE i.coupon_id = c.coupon_id)
        GROUP BY c.coupon_id, c.target_type_cd
        ON CONFLICT (coupon_id) DO NOTHING;
    END IF;
END $$;

-- 3단계: 헤더 반영
UPDATE shopjoy_2604.pm_coupon c
   SET target_type_cd = b.new_target_type_cd,
       upd_by = 'DATAFIX_CPNTYPE',
       upd_date = now()
  FROM shopjoy_2604_bak_cpntype_20261005.chg b
 WHERE b.coupon_id = c.coupon_id
   AND coalesce(c.target_type_cd, '') IN ('', 'ALL', 'MEMBER_GRADE')
   AND c.target_type_cd IS DISTINCT FROM b.new_target_type_cd;

-- [점검 후] 바꾼 건수 (2026-10-05 D1 전 기준 기대값: 1단계 112건 = ALL→CATEGORY 48·ALL→PRODUCT 51·MEMBER_GRADE→CATEGORY 9·MEMBER_GRADE→PRODUCT 4, 2단계 0건)
SELECT src, old_target_type_cd, new_target_type_cd, count(*) FROM shopjoy_2604_bak_cpntype_20261005.chg GROUP BY 1, 2, 3 ORDER BY 1, 2, 3;
-- [점검 후] 대상 행이 있는데 헤더가 ALL/MEMBER_GRADE 로 남은 쿠폰 = 0 이어야 한다
SELECT count(*) AS remain_header_all_with_item
FROM shopjoy_2604.pm_coupon c
WHERE coalesce(c.target_type_cd, '') IN ('', 'ALL', 'MEMBER_GRADE')
  AND EXISTS (SELECT 1 FROM shopjoy_2604.pm_coupon_item i WHERE i.coupon_id = c.coupon_id);

COMMIT;

-- ============================================================================================
-- 되돌리기 (필요할 때만 주석을 풀어 실행)
-- BEGIN;
-- UPDATE shopjoy_2604.pm_coupon c SET target_type_cd = b.old_target_type_cd, upd_by = 'DATAFIX_CPNTYPE_REVERT', upd_date = now()
--   FROM shopjoy_2604_bak_cpntype_20261005.chg b
--  WHERE b.coupon_id = c.coupon_id AND c.target_type_cd = b.new_target_type_cd;
-- DROP SCHEMA shopjoy_2604_bak_cpntype_20261005 CASCADE;
-- COMMIT;
-- ============================================================================================
