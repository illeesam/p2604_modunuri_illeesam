-- ═══════════════════════════════════════════════════════════
--  개인간 거래(당근형) 사이트 — 회원이 바로 물건 올리기 + 거래방법
--  작성일: 2026-10-03
--
--  배경 (사용자 요청 "danmoo1 에 회원이 로그인해서 바로 상품생성", "창고는 필수 아니어도 되 / 사람간 직거래, 문고리거래, 택배거래가 주야"):
--   ① pd_prod.trade_method_cds — 개인간 거래 상품의 거래방법(여러 개, 콤마 구분).
--        DIRECT = 직거래(만나서), DOOR = 문고리거래(문 앞에 두고 비대면), PARCEL = 택배거래
--        쇼핑몰 상품은 NULL(배송은 기존 배송템플릿·dliv_method_cd 를 쓴다).
--   ② sy_site.config_json 의 "c2c": true — 이 사이트는 개인간 거래 사이트다.
--        ecBeBo 가 읽어(SiteRegistry.isC2c) FO 상품등록에서 판매자 승인 없이 회원 이름으로 개인 판매자를 바로 만들고,
--        출고 창고를 선택으로, 나눔(0원)을 허용하고, 거래방법을 1개 이상 받는다. 쇼핑몰 사이트(ec1 등)는 그대로.
--   danmoo1(당근 스타일) = 사이트 SI260003.
-- ═══════════════════════════════════════════════════════════
--  사용법 (psql/DBeaver): 아래 스크립트 실행 (재실행해도 안전 — 컬럼은 IF NOT EXISTS, 설정은 기존 JSON 에 c2c 만 더함)
-- ═══════════════════════════════════════════════════════════

SET search_path TO shopjoy_2604;

ALTER TABLE shopjoy_2604.pd_prod ADD COLUMN IF NOT EXISTS trade_method_cds VARCHAR(50);
COMMENT ON COLUMN shopjoy_2604.pd_prod.trade_method_cds IS '거래방법(개인간 거래) — 콤마 구분 {DIRECT:직거래, DOOR:문고리거래, PARCEL:택배거래}. NULL=쇼핑몰 상품(배송템플릿 사용)';

-- danmoo1 사이트를 개인간 거래 사이트로 (config_json 이 비었으면 새로, 있으면 c2c 키만 더한다)
UPDATE shopjoy_2604.sy_site
   SET config_json = (COALESCE(NULLIF(trim(config_json), ''), '{}')::jsonb || '{"c2c": true}'::jsonb)::text,
       upd_date    = now()
 WHERE site_id = 'SI260003';

-- ═══════════════════════════════════════════════════════════
--  검증
-- ═══════════════════════════════════════════════════════════
-- SELECT column_name, data_type, character_maximum_length FROM information_schema.columns
--  WHERE table_schema = 'shopjoy_2604' AND table_name = 'pd_prod' AND column_name = 'trade_method_cds';   → varchar 50
-- SELECT site_id, tenant_module, config_json FROM shopjoy_2604.sy_site WHERE site_id = 'SI260003';         → {"c2c": true}
--
--  되돌리기(필요할 때만): UPDATE shopjoy_2604.sy_site SET config_json = (config_json::jsonb - 'c2c')::text WHERE site_id = 'SI260003';
--                         ALTER TABLE shopjoy_2604.pd_prod DROP COLUMN IF EXISTS trade_method_cds;
