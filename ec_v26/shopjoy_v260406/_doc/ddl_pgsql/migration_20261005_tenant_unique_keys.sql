-- ============================================================================================================
-- migration_20261005_tenant_unique_keys.sql — 사이트별로 유일해야 할 업무 키 정비 (2026-10-05 멀티테넌트 점검, 정책 sy.57 §4.2)
--
-- 같은 내용을 datafix_20261005_tenant_audit.py 의 U1~U6 단계가 점검(사이트 안 중복 확인)·백업·되돌리기와 함께 실행한다.
-- 둘 중 하나만 실행한다(둘 다 이름으로 적용 여부를 판단하므로 순서가 바뀌어도 안전).
--
-- 판단 기준
--   · 사이트 안에서만 쓰는 업무 코드 → (site_id, 코드) 유일 — 다른 사이트가 같은 코드를 쓸 수 있어야 한다
--       pd_prod.prod_code       : ec2 상품을 ec1 에서 복사할 때 전역 유일 때문에 "-E2" 를 붙여야 했다
--       pd_prod_sku.sku_code    : 판매자가 직접 정하는 SKU 코드(BO 옵션 저장)
--       pm_coupon.coupon_cd     : 회원이 입력하는 쿠폰 코드 — FO 등록은 이미 "이 사이트 쿠폰" 에서만 찾는다(FoPmCouponOfflineService)
--       dp_widget_lib.widget_code : 사이트별 위젯 라이브러리
--       dp_ui.ui_cd · dp_area.area_cd : FO 가 영역코드로 "이 사이트" 영역을 찾는다(FoDpAreaService) — 사이트 안 중복이면 아무거나 골라졌다(지금은 유일 없음)
--   · 전역으로 유일해야 하는 키는 그대로 둔다 — 코드만으로(로그인·사이트 없이) 찾는 비밀 번호 성격
--       pm_voucher_issue.voucher_code(상품권 번호) · pm_prod_coupon.coupon_code(선물 코드) · mb_device_token.device_token · sy_site.site_code · sy_user.login_id(BO 는 사이트 공통)
--   · 이미 사이트별: mb_member(site_id, login_id) · cm_bbm(site_id, bbm_code) · sy_brand(site_id, brand_code) · pd_category(site_id, category_cd) · st_dliv_fee_policy(site_id, dliv_method_cd)
--   · reg_site_id(감사 필드)를 쓰는 유일 인덱스 삭제 — sy_exceldown_uk01_running (같은 일을 site_id 기준 uk02_running 이 한다, 정책 §12)
--
-- 실행 전 확인(사이트 안 중복 0 이어야 한다 — 2026-10-05 dry: 모두 0)
--   SELECT site_id, prod_code, count(*) FROM shopjoy_2604.pd_prod WHERE prod_code IS NOT NULL GROUP BY 1,2 HAVING count(*) > 1;
--   SELECT site_id, sku_code,  count(*) FROM shopjoy_2604.pd_prod_sku WHERE sku_code IS NOT NULL GROUP BY 1,2 HAVING count(*) > 1;
--   SELECT site_id, coupon_cd, count(*) FROM shopjoy_2604.pm_coupon WHERE coupon_cd IS NOT NULL GROUP BY 1,2 HAVING count(*) > 1;
--   SELECT site_id, widget_code, count(*) FROM shopjoy_2604.dp_widget_lib GROUP BY 1,2 HAVING count(*) > 1;
--   SELECT site_id, ui_cd, count(*) FROM shopjoy_2604.dp_ui GROUP BY 1,2 HAVING count(*) > 1;
--   SELECT site_id, area_cd, count(*) FROM shopjoy_2604.dp_area GROUP BY 1,2 HAVING count(*) > 1;
--
-- 백엔드 영향: 코드로 상품·SKU·위젯을 찾는 곳은 없다(조회는 ID). 쿠폰 코드 조회는 이미 사이트 조건을 건다. 배포 순서와 무관.
-- ============================================================================================================
BEGIN;
SET LOCAL lock_timeout = '10s';

-- U1 상품코드
CREATE UNIQUE INDEX IF NOT EXISTS pd_prod_uk_site_id_prod_code_x2 ON shopjoy_2604.pd_prod (site_id, prod_code);
ALTER TABLE shopjoy_2604.pd_prod DROP CONSTRAINT IF EXISTS pd_prod_uk_prod_code;   -- 옛 전역 유일은 제약조건(UNIQUE)이라 DROP INDEX 만으로는 실패한다(2026-10-05)
DROP INDEX IF EXISTS shopjoy_2604.pd_prod_uk_prod_code;

-- U2 SKU 코드
CREATE UNIQUE INDEX IF NOT EXISTS pd_prod_sku_uk_site_id_sku_code_x2 ON shopjoy_2604.pd_prod_sku (site_id, sku_code);
ALTER TABLE shopjoy_2604.pd_prod_sku DROP CONSTRAINT IF EXISTS pd_prod_sku_uk_sku_code;   -- 옛 전역 유일은 제약조건(UNIQUE)이라 DROP INDEX 만으로는 실패한다(2026-10-05)
DROP INDEX IF EXISTS shopjoy_2604.pd_prod_sku_uk_sku_code;

-- U3 쿠폰코드
CREATE UNIQUE INDEX IF NOT EXISTS pm_coupon_uk_site_id_coupon_cd_x2 ON shopjoy_2604.pm_coupon (site_id, coupon_cd);
ALTER TABLE shopjoy_2604.pm_coupon DROP CONSTRAINT IF EXISTS pm_coupon_uk_coupon_cd;   -- 옛 전역 유일은 제약조건(UNIQUE)이라 DROP INDEX 만으로는 실패한다(2026-10-05)
DROP INDEX IF EXISTS shopjoy_2604.pm_coupon_uk_coupon_cd;

-- U4 위젯코드
CREATE UNIQUE INDEX IF NOT EXISTS dp_widget_lib_uk_site_id_widget_code_x2 ON shopjoy_2604.dp_widget_lib (site_id, widget_code);
ALTER TABLE shopjoy_2604.dp_widget_lib DROP CONSTRAINT IF EXISTS dp_widget_lib_uk_widget_code;   -- 옛 전역 유일은 제약조건(UNIQUE)이라 DROP INDEX 만으로는 실패한다(2026-10-05)
DROP INDEX IF EXISTS shopjoy_2604.dp_widget_lib_uk_widget_code;

-- U5 전시 UI·영역 코드
CREATE UNIQUE INDEX IF NOT EXISTS dp_ui_uk_site_id_ui_cd_x2 ON shopjoy_2604.dp_ui (site_id, ui_cd);
CREATE UNIQUE INDEX IF NOT EXISTS dp_area_uk_site_id_area_cd_x2 ON shopjoy_2604.dp_area (site_id, area_cd);

-- U6 reg_site_id 기준 동시 1건 게이트 삭제 (site_id 기준 sy_exceldown_uk02_running 은 유지)
DROP INDEX IF EXISTS shopjoy_2604.sy_exceldown_uk01_running;

COMMIT;

-- ── 되돌리기 ──────────────────────────────────────────────────────────────────
-- BEGIN;
-- ALTER TABLE shopjoy_2604.pd_prod ADD CONSTRAINT pd_prod_uk_prod_code UNIQUE (prod_code);              -- 사이트 간 같은 코드가 생겼으면 실패
-- DROP INDEX IF EXISTS shopjoy_2604.pd_prod_uk_site_id_prod_code_x2;
-- ALTER TABLE shopjoy_2604.pd_prod_sku ADD CONSTRAINT pd_prod_sku_uk_sku_code UNIQUE (sku_code);
-- DROP INDEX IF EXISTS shopjoy_2604.pd_prod_sku_uk_site_id_sku_code_x2;
-- ALTER TABLE shopjoy_2604.pm_coupon ADD CONSTRAINT pm_coupon_uk_coupon_cd UNIQUE (coupon_cd);
-- DROP INDEX IF EXISTS shopjoy_2604.pm_coupon_uk_site_id_coupon_cd_x2;
-- ALTER TABLE shopjoy_2604.dp_widget_lib ADD CONSTRAINT dp_widget_lib_uk_widget_code UNIQUE (widget_code);
-- DROP INDEX IF EXISTS shopjoy_2604.dp_widget_lib_uk_site_id_widget_code_x2;
-- DROP INDEX IF EXISTS shopjoy_2604.dp_ui_uk_site_id_ui_cd_x2;
-- DROP INDEX IF EXISTS shopjoy_2604.dp_area_uk_site_id_area_cd_x2;
-- CREATE UNIQUE INDEX IF NOT EXISTS sy_exceldown_uk01_running ON shopjoy_2604.sy_exceldown (reg_site_id) WHERE ((exceldown_status_cd)::text = 'RUNNING'::text);
-- COMMIT;
