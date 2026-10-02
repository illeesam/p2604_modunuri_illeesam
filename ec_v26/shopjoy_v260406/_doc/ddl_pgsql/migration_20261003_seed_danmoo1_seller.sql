-- ============================================================================
-- danmoo1(사이트 7) 테스트 판매자 시드 — 2026-10-03
--   dm_user1@danmoo.com(MEDM0000000001) 을 승인된 판매자(ACTIVE)로 만들고 기본 창고 1개를 둔다.
--   목적: danmoo1 "내 물건 팔기 / 판매내역 / 거래 상태 변경 / 끌어올리기" 화면을 실제로 써 볼 수 있게(E2E 포함).
--   실제 운영 흐름(FO 판매자 신청 → BO 승인)은 이메일 인증·서류 첨부가 필요해 시드 계정에는 쓰기 어려워 직접 넣는다.
--   DDL 아님(INSERT 만), 멱등(NOT EXISTS). 되돌리기: 아래 ROLLBACK 주석 참고.
-- ============================================================================
SET search_path TO shopjoy_2604;

-- 1) 판매자 (sl_seller)
INSERT INTO shopjoy_2604.sl_seller (seller_id, seller_nm, seller_type_cd, seller_status_cd, email_verified_yn, email_verified_date, reg_by, reg_date, reg_site_id, upd_by, upd_date)
SELECT 'SLDM0000000001', '여수동주민 상점', 'INDIVIDUAL', 'ACTIVE', 'Y', now(), 'SEED', now(), '2604010000000007', 'SEED', now()
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sl_seller WHERE seller_id = 'SLDM0000000001');

-- 2) 판매자 소속 회원 (sl_seller_member) — dm_user1 = OWNER
INSERT INTO shopjoy_2604.sl_seller_member (seller_member_id, seller_id, member_id, role_cd, is_main, is_default, status_cd, reg_by, reg_date, reg_site_id, upd_by, upd_date)
SELECT 'SMDM0000000001', 'SLDM0000000001', 'MEDM0000000001', 'OWNER', 'Y', 'Y', 'ACTIVE', 'SEED', now(), '2604010000000007', 'SEED', now()
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sl_seller_member WHERE seller_member_id = 'SMDM0000000001');

-- 3) 기본 창고(출고지·반품지) (sl_seller_warehouse)
INSERT INTO shopjoy_2604.sl_seller_warehouse (warehouse_id, seller_id, warehouse_nm, zip_code, addr, addr_detail, contact_nm, contact_phone, is_default, is_return_addr, use_yn, reg_by, reg_date, reg_site_id, upd_by, upd_date)
SELECT 'WHDM0000000001', 'SLDM0000000001', '여수동 집', '13107', '경기도 성남시 중원구 여수동', '101동 1001호', '여수동주민', '010-0000-0001', 'Y', 'Y', 'Y', 'SEED', now(), '2604010000000007', 'SEED', now()
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sl_seller_warehouse WHERE warehouse_id = 'WHDM0000000001');

-- 4) 회원 이메일 인증 표시(판매자 신청 게이트와 일관되게)
UPDATE shopjoy_2604.mb_member SET email_verified_yn = 'Y', email_verified_date = COALESCE(email_verified_date, now()) WHERE member_id = 'MEDM0000000001' AND COALESCE(email_verified_yn, 'N') <> 'Y';

-- ROLLBACK (필요 시 수동):
-- DELETE FROM shopjoy_2604.sl_seller_warehouse WHERE warehouse_id = 'WHDM0000000001';
-- DELETE FROM shopjoy_2604.sl_seller_member WHERE seller_member_id = 'SMDM0000000001';
-- DELETE FROM shopjoy_2604.sl_seller WHERE seller_id = 'SLDM0000000001';
