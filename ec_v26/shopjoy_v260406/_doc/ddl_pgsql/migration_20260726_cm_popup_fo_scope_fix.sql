-- ============================================================================
-- cm_popup — FO 노출 범위 축소 (2026-07-26, 보안 정정)
--
-- 문제: sys_scope 를 처음 넣을 때 member / order / coupon 까지 '^BO^FO^' 로 열었다.
--       그런데 이 팝업 시스템에는 소유자(회원) 필터가 없고, /api/fo/** 는 SecurityConfig
--       에서 기본 permitAll 이라 FO 경로는 비로그인으로도 열린다. 결과적으로 인증 없이
--       회원 목록(이름 포함) · 주문 목록 · 쿠폰 마스터가 전부 조회됐다.
--
-- 조치: FO 는 "누구나 봐도 되는 공개 카탈로그" 만 남긴다.
--         유지 : prod, prodByCategory, category, brand, bbm
--         회수 : member, order, coupon   → '^BO^'
--       회원 본인 데이터를 고르는 화면은 소유자 필터가 있는 전용 API 를 쓴다
--       (예: FO 문의하기의 주문 선택 = foApiSvc.myOrder → OrderPickModal).
--
--       코드 레벨 2차 방어도 함께 추가했다 — CmPopupPickService.FO_ALLOWED_ENTITIES.
--       팝업관리 화면에서 실수로 ^FO^ 를 켜도 공개 카탈로그 엔티티가 아니면 서버가 거절한다.
-- ============================================================================

UPDATE shopjoy_2604.cm_popup
   SET sys_scope = '^BO^'
 WHERE popup_code IN ('member', 'order', 'coupon');
