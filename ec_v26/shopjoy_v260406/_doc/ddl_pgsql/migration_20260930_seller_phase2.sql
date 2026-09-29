-- ═══════════════════════════════════════════════════════════
--  셀러(seller_id) 컨셉 Phase 2 — 선행 DDL (4개 컬럼)
--  작성일: 2026-09-30
--  전제  : migration_20260929_seller_phase1.sql, migration_20260930_seller_phase3_and_seed.sql,
--          migration_20260930_seller_promotion.sql 적용 완료
--
--  대상:
--   1) pm_voucher.seller_id      — 상품권도 셀러 프로모션 3종(할인/상품권/적립금)에 포함하기로
--                                   했는데 이전 프로모션 일괄작업(6개 테이블) 때 빠졌던 걸 보강.
--                                   상품권은 특정 상품에 매이지 않는 금액권 성격이라 *_prod 매핑
--                                   테이블은 만들지 않고 seller_id 단위(그 셀러 상품 전체)로만 스코프.
--   2) mb_member.email_verified_yn/date — PASS(실명/생년월일/휴대폰 검증)를 이메일 링크 인증으로
--                                   전환하며 신규 추가. 기존 pass_verified_* 필드는 의미가 달라
--                                   재활용하지 않고 그대로 남겨둠(당분간 PortOne 연동 코드 병행).
--   3) mb_seller.email_verified_yn/date — 판매자 신청 시 이메일 인증 여부 게이트용.
--   4) pd_prod.warehouse_id      — 판매자가 등록한 단품이 어느 창고(mb_seller_warehouse)에서
--                                   출고되는지 가리키는 단순 참조 FK. 재고 수량은 여전히
--                                   pd_prod_sku.stock_qty 하나로 통합 관리(2026-09-14 결정 유지),
--                                   창고별 재고 분산 원장이 아님.
-- ═══════════════════════════════════════════════════════════
--  사용법 (psql/DBeaver):
--    SET search_path TO shopjoy_2604;
--    아래 스크립트 실행
-- ═══════════════════════════════════════════════════════════

SET search_path TO shopjoy_2604;

-- 1) pm_voucher.seller_id
ALTER TABLE shopjoy_2604.pm_voucher ADD COLUMN IF NOT EXISTS seller_id VARCHAR(21);
COMMENT ON COLUMN shopjoy_2604.pm_voucher.seller_id IS '판매자ID (mb_seller.seller_id) — NULL=플랫폼 상품권, 값 있음=그 셀러 상품 전체 대상 상품권(상품별 매핑 없음)';
CREATE INDEX IF NOT EXISTS idx_pm_voucher_seller ON shopjoy_2604.pm_voucher (seller_id);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                 WHERE table_schema='shopjoy_2604' AND table_name='pm_voucher' AND constraint_name='fk_pm_voucher_seller')
  THEN
    ALTER TABLE shopjoy_2604.pm_voucher ADD CONSTRAINT fk_pm_voucher_seller FOREIGN KEY (seller_id) REFERENCES shopjoy_2604.mb_seller (seller_id);
  END IF;
END $$;

-- 2) mb_member — 이메일 인증(가입/마이페이지 등 PASS 대체)
ALTER TABLE shopjoy_2604.mb_member ADD COLUMN IF NOT EXISTS email_verified_yn VARCHAR(1);
ALTER TABLE shopjoy_2604.mb_member ADD COLUMN IF NOT EXISTS email_verified_date TIMESTAMP;
COMMENT ON COLUMN shopjoy_2604.mb_member.email_verified_yn IS '이메일 링크 인증 완료 여부 Y/N (PASS 대체, pass_verified_yn과 별개 — 의미가 다름: 이메일 소유만 증명)';
COMMENT ON COLUMN shopjoy_2604.mb_member.email_verified_date IS '이메일 링크 인증 완료 일시';

-- 3) mb_seller — 판매자 신청 시 이메일 인증 게이트
ALTER TABLE shopjoy_2604.mb_seller ADD COLUMN IF NOT EXISTS email_verified_yn VARCHAR(1);
ALTER TABLE shopjoy_2604.mb_seller ADD COLUMN IF NOT EXISTS email_verified_date TIMESTAMP;
COMMENT ON COLUMN shopjoy_2604.mb_seller.email_verified_yn IS '판매자 신청 이메일 링크 인증 완료 여부 Y/N — BO 승인 시 첨부서류와 함께 관리자가 확인(자동 게이트 아님)';
COMMENT ON COLUMN shopjoy_2604.mb_seller.email_verified_date IS '판매자 신청 이메일 링크 인증 완료 일시';

-- 4) pd_prod — 출고 창고 참조
ALTER TABLE shopjoy_2604.pd_prod ADD COLUMN IF NOT EXISTS warehouse_id VARCHAR(21);
COMMENT ON COLUMN shopjoy_2604.pd_prod.warehouse_id IS '출고 창고 (mb_seller_warehouse.warehouse_id) — 판매자 상품일 때만, 재고 분산 원장이 아니라 출고지 참조용';
CREATE INDEX IF NOT EXISTS idx_pd_prod_warehouse ON shopjoy_2604.pd_prod (warehouse_id);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                 WHERE table_schema='shopjoy_2604' AND table_name='pd_prod' AND constraint_name='fk_pd_prod_warehouse')
  THEN
    ALTER TABLE shopjoy_2604.pd_prod ADD CONSTRAINT fk_pd_prod_warehouse FOREIGN KEY (warehouse_id) REFERENCES shopjoy_2604.mb_seller_warehouse (warehouse_id);
  END IF;
END $$;

-- 신규 이메일 인증 토큰 테이블 (PASS 대체 공용 엔진 — CmEmailVerifyService 가 사용)
CREATE TABLE IF NOT EXISTS shopjoy_2604.mb_member_email_verify (
    verify_id      VARCHAR(21)  NOT NULL CONSTRAINT mb_member_email_verify_pk PRIMARY KEY,
    purpose_cd     VARCHAR(20)  NOT NULL,
    member_id      VARCHAR(21) ,
    email          VARCHAR(100) NOT NULL,
    token_hash     VARCHAR(200) NOT NULL,
    redirect_path  VARCHAR(200),
    expire_date    TIMESTAMP    NOT NULL,
    verified_yn    VARCHAR(1)   DEFAULT 'N',
    verified_date  TIMESTAMP,
    reg_by         VARCHAR(30) ,
    reg_date       TIMESTAMP    DEFAULT now(),
    upd_by         VARCHAR(30) ,
    upd_date       TIMESTAMP
);
COMMENT ON TABLE  shopjoy_2604.mb_member_email_verify IS '이메일 링크 인증 토큰 (PASS 대체 공용 엔진) — 가입/판매자신청/비회원결제/아이디찾기/비회원채팅/마이페이지 공용';
COMMENT ON COLUMN shopjoy_2604.mb_member_email_verify.purpose_cd IS '인증 목적 (JOIN/SELLER_APPLY/CHECKOUT_GUEST/FIND_ACCOUNT/CHAT_GUEST/MYPAGE)';
COMMENT ON COLUMN shopjoy_2604.mb_member_email_verify.member_id IS '회원ID (mb_member.member_id) — 비회원 흐름(CHECKOUT_GUEST/CHAT_GUEST)은 NULL';
COMMENT ON COLUMN shopjoy_2604.mb_member_email_verify.token_hash IS '해시된 토큰 (원본 32byte 랜덤 토큰은 URL에만, DB엔 해시만 저장 — mb_member_pw_reset과 동일 원칙)';
COMMENT ON COLUMN shopjoy_2604.mb_member_email_verify.redirect_path IS '인증 완료 후 자동이동 경로 — purpose_cd별로 서버가 고정 매핑(open redirect 방지, 클라이언트가 임의 지정 불가)';

CREATE INDEX IF NOT EXISTS idx_mb_member_email_verify_member ON shopjoy_2604.mb_member_email_verify (member_id);
CREATE INDEX IF NOT EXISTS idx_mb_member_email_verify_email  ON shopjoy_2604.mb_member_email_verify (email);

-- ═══════════════════════════════════════════════════════════
--  검증
-- ═══════════════════════════════════════════════════════════
-- SELECT column_name FROM information_schema.columns WHERE table_schema='shopjoy_2604' AND table_name='pm_voucher' AND column_name='seller_id';
-- SELECT column_name FROM information_schema.columns WHERE table_schema='shopjoy_2604' AND table_name='mb_member' AND column_name LIKE 'email_verified%';
-- SELECT column_name FROM information_schema.columns WHERE table_schema='shopjoy_2604' AND table_name='mb_seller' AND column_name LIKE 'email_verified%';
-- SELECT column_name FROM information_schema.columns WHERE table_schema='shopjoy_2604' AND table_name='pd_prod' AND column_name='warehouse_id';
-- SELECT * FROM shopjoy_2604.mb_member_email_verify LIMIT 1;
