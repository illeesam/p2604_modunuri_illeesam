-- ═══════════════════════════════════════════════════════════════════════════
--  migration_20261005_feat5_money.sql — 기존 테이블 컬럼 3개 (2026-10-05, 새 테이블 없음)
-- ═══════════════════════════════════════════════════════════════════════════
--  ① pd_dliv_tmplt.jeju_extra_cost   제주 추가배송비 (도서산간은 기존 island_extra_cost)       — 정책서 od.02 §2-4
--  ② od_order.remote_shipping_fee     주문에 붙은 제주·도서산간 추가배송비(outbound_shipping_fee 에 포함된 금액, 표시용)
--  ③ od_claim.gift_deduct_amt         사은품 미반송으로 환불에서 뺀 금액                           — 정책서 pm.06 §7-2, od.16 §3
--
--  백엔드(ecBeBo)는 이 컬럼들을 엔티티에 매핑하지 않고 SchemaColumns 로 "있는지" 확인한 뒤 네이티브 SQL 로만 읽고 쓴다.
--  → 이 파일 전에 배포돼도 기동·동작한다(없으면 그 기능만 꺼짐: 제주는 기본 3,000원, 기록·표시만 빠짐). 실행 후 최대 1분 안에 켜진다(재기동 불필요).
--
--  실행: psql/DBeaver, 스키마 소유자 postgres. 한 트랜잭션. 다시 실행해도 안전(ADD COLUMN IF NOT EXISTS, COMMENT 덮어씀).
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE shopjoy_2604.pd_dliv_tmplt ADD COLUMN IF NOT EXISTS jeju_extra_cost bigint;
COMMENT ON COLUMN shopjoy_2604.pd_dliv_tmplt.jeju_extra_cost   IS '제주 추가배송비 (배송지 우편번호가 공통코드 OD_REMOTE_ZIP_CD 의 JEJU 구간일 때 묶음마다, 무료배송이어도 부과. NULL=sy_prop app.dliv.jeju-extra-cost 기본 3,000)';
COMMENT ON COLUMN shopjoy_2604.pd_dliv_tmplt.island_extra_cost IS '도서산간 추가배송비 (배송지 우편번호가 공통코드 OD_REMOTE_ZIP_CD 의 ISLAND 구간일 때 묶음마다, 무료배송이어도 부과. NULL=sy_prop app.dliv.island-extra-cost 기본 5,000)';

ALTER TABLE shopjoy_2604.od_order ADD COLUMN IF NOT EXISTS remote_shipping_fee bigint;
COMMENT ON COLUMN shopjoy_2604.od_order.remote_shipping_fee IS '제주·도서산간 추가배송비 — outbound_shipping_fee 에 포함된 금액(배송비 쿠폰으로 할인되지 않음). 지역은 recv_zip 으로 판정(공통코드 OD_REMOTE_ZIP_CD). 2026-10-05 이후 주문부터';

ALTER TABLE shopjoy_2604.od_claim ADD COLUMN IF NOT EXISTS gift_deduct_amt bigint;
COMMENT ON COLUMN shopjoy_2604.od_claim.gift_deduct_amt IS '사은품 미반송 차감액 — 부분 반품으로 사은품 조건을 못 채우게 됐는데 사은품을 돌려보내지 않아 환불(현금 먼저, 모자라면 적립금·캐시 몫)에서 뺀 시가 합';

COMMIT;

-- 검증
-- SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'shopjoy_2604'
--    AND (table_name, column_name) IN (('pd_dliv_tmplt','jeju_extra_cost'), ('od_order','remote_shipping_fee'), ('od_claim','gift_deduct_amt'));   → 3행
--
-- 롤백(주석 해제) — 기록한 추가배송비·차감액 값이 사라진다(주문 금액 자체는 outbound_shipping_fee·환불 행에 남는다)
-- ALTER TABLE shopjoy_2604.pd_dliv_tmplt DROP COLUMN IF EXISTS jeju_extra_cost;
-- ALTER TABLE shopjoy_2604.od_order      DROP COLUMN IF EXISTS remote_shipping_fee;
-- ALTER TABLE shopjoy_2604.od_claim      DROP COLUMN IF EXISTS gift_deduct_amt;
