-- ═══════════════════════════════════════════════════════════
--  BO 모바일 앱 알림(BO 사용자 푸시) — mb_device_token 에 BO 사용자 칸(user_id) 추가
--  작성일: 2026-10-05
--
--  배경:
--   사용자 "app 에서 알림 수신되는 것도 연계되어야 해" — BO 를 Nuxt 4 로 새로 만드는 ecFeBoNuxt4 의 모바일 BO 모듈 bom1 을
--   앱(ecAppFlutter "BO 모바일" 테넌트 BO-bom1)이 웹뷰로 열고, 새 주문·클레임·문의/상담·채팅·재고 부족 알림을 BO 사용자 폰으로 보낸다.
--   ER 단순 원칙(사용자, 정책 sy.59): 새 테이블을 만들지 않는다 —
--    - BO 사용자 기기 토큰 = 기존 mb_device_token 에 user_id 칸 하나(회원 앱 기기 = member_id, BO 앱 기기 = user_id, 둘이 함께 차지 않음)
--    - BO 사용자 알림 = 기존 알림함 ap_fcm_noti 의 recv_type_cd = 'USER'(이미 있는 값), noti_type_cd = 이벤트 코드
--    - 이벤트별 수신 켜기/끄기 = 기존 사용자 개인화 설정 sy_user_pref (pref_key bopush.<이벤트> = Y/N, bopush.platform)
--
--  백엔드(ecBeBo co/bopush)는 이 칸이 없어도 기동·동작한다 — 칸이 생기기 전에는 BO 기기 등록·푸시만 꺼지고(알림함·종 아이콘은 동작),
--  5분마다 다시 확인해 이 SQL 을 실행하면 재시작 없이 켜진다. (MbDeviceToken JPA 엔티티는 바꾸지 않았다 — 회원 앱 푸시 조회가 칸 유무와 무관하게 돌도록.)
--
--  되돌리기(필요할 때만): ALTER TABLE shopjoy_2604.mb_device_token DROP CONSTRAINT IF EXISTS mb_device_token_ck_owner;
--                       ALTER TABLE shopjoy_2604.mb_device_token DROP CONSTRAINT IF EXISTS mb_device_token_fk_user_id;
--                       DROP INDEX IF EXISTS shopjoy_2604.mb_device_token_ix_user_id;
--                       ALTER TABLE shopjoy_2604.mb_device_token DROP COLUMN IF EXISTS user_id;
-- ═══════════════════════════════════════════════════════════
--  사용법: 아래 스크립트 실행 (다시 실행해도 안전)
-- ═══════════════════════════════════════════════════════════

SET search_path TO shopjoy_2604;

-- 1) mb_device_token.user_id — BO 사용자(sy_user) 기기
ALTER TABLE shopjoy_2604.mb_device_token ADD COLUMN IF NOT EXISTS user_id VARCHAR(21);
COMMENT ON COLUMN shopjoy_2604.mb_device_token.user_id IS 'BO 사용자ID (sy_user.user_id) - BO 모바일 앱 기기(회원 앱 기기면 NULL). member_id 와 함께 값이 있지 않다';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.member_id IS '회원ID (mb_member.member_id) - 회원 앱 기기(BO 모바일 앱 기기면 NULL)';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.tenant_modules IS '알림 수신 모듈 목록(콤마 구분) - 회원 앱: FO 모듈(NULL/빈값=사이트 전체) / BO 앱: 앱이 여는 BO 모듈(bom1)';
COMMENT ON TABLE  shopjoy_2604.mb_device_token IS '앱 디바이스 토큰 (회원 앱 = member_id, BO 모바일 앱 = user_id)';

CREATE INDEX IF NOT EXISTS mb_device_token_ix_user_id ON shopjoy_2604.mb_device_token (user_id) WHERE user_id IS NOT NULL;

-- 2) 관계·규칙 — 사용자 삭제 시 기기 연결만 끊기, 한 기기 = 한 주인(회원 또는 사용자)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mb_device_token_fk_user_id') THEN
    ALTER TABLE shopjoy_2604.mb_device_token
      ADD CONSTRAINT mb_device_token_fk_user_id FOREIGN KEY (user_id) REFERENCES shopjoy_2604.sy_user (user_id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mb_device_token_ck_owner') THEN
    ALTER TABLE shopjoy_2604.mb_device_token
      ADD CONSTRAINT mb_device_token_ck_owner CHECK (member_id IS NULL OR user_id IS NULL);
  END IF;
END $$;

-- 3) 알림함 — BO 사용자 알림 유형 설명(코드값은 백엔드 enum BoPushEventType, 칸 변경 없음)
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti.noti_type_cd IS '알림유형 (NOTICE 공지 / ALARM 수신알림 / SPECIAL 특이사항 / CHAT 채팅 / BO 사용자: ORDER_PAID 새 주문·CLAIM_REQ 클레임 요청·CS_CONTACT 문의·CS_QNA 상품Q&A·CHAT_REQ 상담 요청·CHAT_MSG 채팅 메시지·STOCK_LOW 재고 부족·BO_TEST 시험)';

-- 확인
SELECT column_name, data_type, character_maximum_length
  FROM information_schema.columns
 WHERE table_schema = 'shopjoy_2604' AND table_name = 'mb_device_token' AND column_name = 'user_id';
