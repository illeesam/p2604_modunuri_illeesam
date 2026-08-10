-- =====================================================================
-- pd_prod.prod_type_cd 실제 구조에 맞게 정정 (2026-08-10)
--
-- 증상: 옵션상품등록 / 묶음상품등록 / 세트상품등록 메뉴가 0건.
--
-- 원인: 필터(프론트→API→백엔드 QdslUtil.strEq)는 정상 동작한다.
--       데이터가 문제였다 — 샘플 생성 시 prod_type_cd 를 전부 SINGLE 로 넣어서
--       실제로는 옵션을 6~10개씩 가진 상품 594건이 SINGLE 로 등록돼 있었다.
--
--       변경 전 분포: SINGLE 624 / NULL 7 / SET 1  (OPTION·GROUP·GIFT = 0)
--       SINGLE 624건의 실제 옵션 보유수: 0개=30건, 6~10개=593건, 160개=1건
--
-- ⚠ 단순 조회 문제가 아니다 — PdProdDtl.js 는 prod_type_cd 로 탭 노출을 제어한다.
--     OPTION → 옵션/SKU 탭,  GROUP → 묶음구성 탭,  SET → 세트구성 탭
--   따라서 SINGLE 로 잘못 등록된 594건은 **가지고 있는 옵션 데이터를 화면에서 볼 수도 고칠 수도 없는**
--   상태였다. 유형 정정으로 옵션 탭이 살아난다.
--
-- 판단 기준: 선언된 유형이 아니라 실제 하위 구조로 분류한다.
--   - pd_prod_opt 에 옵션이 1건이라도 있으면 → OPTION
--   - 옵션이 하나도 없으면                    → SINGLE
--   - 이미 SET 으로 명시된 1건은 의도로 보고 건드리지 않는다
-- =====================================================================

-- [1] 옵션을 실제로 보유한 상품 → OPTION
UPDATE shopjoy_2604.pd_prod p
   SET prod_type_cd = 'OPTION',
       upd_by   = 'SYSTEM',
       upd_date = now()
 WHERE coalesce(p.prod_type_cd, 'SINGLE') = 'SINGLE'
   AND EXISTS (SELECT 1 FROM shopjoy_2604.pd_prod_opt o WHERE o.prod_id = p.prod_id);

-- [2] 유형 미지정(NULL) 이면서 옵션도 없는 상품 → SINGLE
--     (simul 접두어의 시뮬레이션 생성 상품 7건. 옵션 0 / SKU 0 이라 단품이 맞다)
UPDATE shopjoy_2604.pd_prod p
   SET prod_type_cd = 'SINGLE',
       upd_by   = 'SYSTEM',
       upd_date = now()
 WHERE p.prod_type_cd IS NULL;

-- 확인
SELECT coalesce(prod_type_cd,'(NULL)') AS prod_type_cd, count(*)::text AS cnt
FROM shopjoy_2604.pd_prod GROUP BY prod_type_cd ORDER BY count(*) DESC;

-- =====================================================================
-- ⚠ 남은 문제 — 이 마이그레이션으로 해결되지 않음 (별도 판단 필요)
--
-- 1) 묶음(GROUP) / 사은품(GIFT) 상품이 0건이다.
--    pd_prod_bundle_item(2행) / pd_prod_set_item(2행) 이 있긴 하지만
--    bundle_prod_id / set_prod_id 가 가리키는 상품이 pd_prod 에 **존재하지 않는다**(고아 레코드).
--    → 묶음/세트 상품 샘플을 새로 만들거나 고아 행을 정리해야 한다.
--
-- 2) pm_gift.prod_id 가 상품 21건을 참조하고 있으나 그 상품들의 유형은 GIFT 가 아니다.
--    "일반 상품을 사은품으로 지급" 하는 구조인지, "사은품 전용 상품" 을 따로 두는 구조인지에 따라
--    GIFT 로 바꿀지가 갈린다. 업무 정의 확인 후 결정할 것.
--
-- 3) 정책서와 실제 코드가 불일치한다 (문서 정정 필요)
--    - _doc/정책서/ec/pd/pd.01.상품상태표.md §1-D : GENERAL/DIGITAL/MADE/FOOD  ← 실제와 완전히 다름
--    - _doc/정책서/ec/pd/pd.05.묶음상품.md          : prod_type_cd='BUNDLE'    ← 실제 코드는 'GROUP'
--    - 실제 sy_code PROD_TYPE                      : SINGLE/OPTION/GROUP/SET/GIFT
-- =====================================================================
