-- ============================================================================
-- cm_popup — 사용 시스템(BO/FO) 범위 컬럼 추가 (2026-07-26)
--
-- 배경: 공통 선택 팝업을 사용자 화면(FO)에서도 쓰게 되면서, 어떤 팝업을 어느
--       시스템에 노출할지 정해야 한다. 회원·주문처럼 FO 에서도 고르는 것이 있고
--       사용자·권한·메뉴처럼 BO 전용이어야 하는 것이 있다.
--
-- 저장형식: ^ 로 감싼 멀티값 (프로젝트 관례. 예: ^BO^ / ^BO^FO^)
--           BO 엔드포인트는 ^BO^ 포함 팝업만, FO 는 ^FO^ 포함 팝업만 허용한다.
-- ============================================================================

ALTER TABLE shopjoy_2604.cm_popup ADD COLUMN IF NOT EXISTS sys_scope VARCHAR(20) DEFAULT '^BO^';

UPDATE shopjoy_2604.cm_popup SET sys_scope = '^BO^' WHERE sys_scope IS NULL OR sys_scope = '';

COMMENT ON COLUMN shopjoy_2604.cm_popup.sys_scope IS '사용 시스템 범위 ^BO^ / ^FO^ 멀티값. BO·FO 엔드포인트가 각각 이 값으로 접근을 제한';

-- FO 에서도 고를 수 있는 것 — 회원 본인이 다루는 대상
UPDATE shopjoy_2604.cm_popup SET sys_scope = '^BO^FO^'
 WHERE popup_code IN ('member', 'order', 'prod', 'category', 'brand', 'coupon', 'bbm', 'prodByCategory');
