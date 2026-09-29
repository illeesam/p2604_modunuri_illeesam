-- ═══════════════════════════════════════════════════════════
--  셀러(seller_id) 컨셉 Phase 1 — 기반 구조
--  작성일: 2026-09-29
--  목적  : 상품평/Q&A를 MD·판매회사 관계자가 FO에서 답변·강제숨김할 수 있게 하기 위한
--          최소 기반(mb_seller/mb_seller_member/pd_prod.seller_id/mb_member.md_yn) 구축.
--          Claude Code 세션에서 사용자와 합의한 설계(이메일 2건 참고)의 1단계.
--
--  포함 범위: mb_seller, mb_seller_member 신규 테이블 / mb_member.md_yn 컬럼 /
--             pd_prod.seller_id 컬럼 + sy_vendor 기반 백필 / SELLER_TYPE_CD·SELLER_STATUS_CD 코드.
--  범위 제외: 주문/배송/정산/프로모션/전시 확장(다음 라운드).
-- ═══════════════════════════════════════════════════════════
--  사용법 (psql/DBeaver):
--    SET search_path TO shopjoy_2604;
--    아래 스크립트 실행
-- ═══════════════════════════════════════════════════════════

SET search_path TO shopjoy_2604;

-- ───────────────────────────────────────────────────────────
-- 1) mb_seller — 판매자 정체성 (개인/업체 공통)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopjoy_2604.mb_seller (
    seller_id            VARCHAR(21)  NOT NULL PRIMARY KEY,        -- PK (YYMMDDhhmmss+rand4)
    seller_nm            VARCHAR(100) NOT NULL,                    -- 노출용 판매자명
    seller_type_cd       VARCHAR(20),                               -- 코드: SELLER_TYPE_CD (INDIVIDUAL/COMPANY)
    seller_status_cd     VARCHAR(20),                               -- 코드: SELLER_STATUS_CD (PENDING/ACTIVE/SUSPENDED)
    vendor_id            VARCHAR(21),                               -- FK: sy_vendor.vendor_id (업체일 때만, 개인은 NULL)
    settle_bank_nm       VARCHAR(50),                               -- 정산 은행명 (개인/업체 공통)
    settle_bank_account  VARCHAR(50),                               -- 정산 계좌번호
    settle_bank_holder   VARCHAR(50),                               -- 정산 예금주명
    reg_by               VARCHAR(30),
    reg_date             TIMESTAMP    DEFAULT NOW(),
    reg_site_id          VARCHAR(21),
    upd_by               VARCHAR(30),
    upd_date             TIMESTAMP
);

COMMENT ON TABLE  shopjoy_2604.mb_seller                  IS '판매자 (개인/업체 공통 — 셀러 정체성 허브)';
COMMENT ON COLUMN shopjoy_2604.mb_seller.seller_id            IS 'PK';
COMMENT ON COLUMN shopjoy_2604.mb_seller.seller_nm             IS '노출용 판매자명';
COMMENT ON COLUMN shopjoy_2604.mb_seller.seller_type_cd        IS '판매자 유형 (코드: SELLER_TYPE_CD — INDIVIDUAL/COMPANY)';
COMMENT ON COLUMN shopjoy_2604.mb_seller.seller_status_cd      IS '판매자 상태 (코드: SELLER_STATUS_CD — PENDING/ACTIVE/SUSPENDED)';
COMMENT ON COLUMN shopjoy_2604.mb_seller.vendor_id              IS '업체 상세정보 (sy_vendor.vendor_id) — 업체일 때만, 개인은 NULL';
COMMENT ON COLUMN shopjoy_2604.mb_seller.settle_bank_nm         IS '정산 은행명';
COMMENT ON COLUMN shopjoy_2604.mb_seller.settle_bank_account    IS '정산 계좌번호';
COMMENT ON COLUMN shopjoy_2604.mb_seller.settle_bank_holder     IS '정산 예금주명';

CREATE INDEX IF NOT EXISTS idx_mb_seller_vendor ON shopjoy_2604.mb_seller (vendor_id);

-- ───────────────────────────────────────────────────────────
-- 2) mb_seller_member — mb_member/sy_user ↔ mb_seller N:M 브릿지 (통합 단일 테이블)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopjoy_2604.mb_seller_member (
    seller_member_id     VARCHAR(21)  NOT NULL PRIMARY KEY,        -- PK
    seller_id            VARCHAR(21)  NOT NULL,                    -- FK: mb_seller.seller_id
    member_id            VARCHAR(21),                               -- FK: mb_member.member_id (nullable)
    user_id              VARCHAR(21),                               -- FK: sy_user.user_id (nullable)
    role_cd               VARCHAR(20),                               -- OWNER(대표) / STAFF(실무자)
    is_main                CHAR(1),                                   -- 그 셀러의 대표 담당자 여부(셀러당 1명 권장)
    is_default             CHAR(1),                                   -- 로그인 계정 기준 "지금 활성 셀러" (계정당 1개만 Y)
    status_cd              VARCHAR(20),                               -- ACTIVE / REMOVED (탈퇴·제외 이력 보존)
    reg_by               VARCHAR(30),
    reg_date              TIMESTAMP    DEFAULT NOW(),
    reg_site_id           VARCHAR(21),
    upd_by                VARCHAR(30),
    upd_date              TIMESTAMP,
    CONSTRAINT chk_mb_seller_member_actor CHECK ((member_id IS NOT NULL) <> (user_id IS NOT NULL)),
    CONSTRAINT uq_mb_seller_member_member UNIQUE (member_id, seller_id),
    CONSTRAINT uq_mb_seller_member_user   UNIQUE (user_id, seller_id)
);

COMMENT ON TABLE  shopjoy_2604.mb_seller_member                    IS '판매자 소속 계정 (mb_member/sy_user 어느 쪽이든 연결되는 통합 브릿지)';
COMMENT ON COLUMN shopjoy_2604.mb_seller_member.seller_member_id       IS 'PK';
COMMENT ON COLUMN shopjoy_2604.mb_seller_member.seller_id               IS '판매자ID (mb_seller.seller_id)';
COMMENT ON COLUMN shopjoy_2604.mb_seller_member.member_id               IS 'FO 회원ID (mb_member.member_id) — user_id와 정확히 하나만 채움';
COMMENT ON COLUMN shopjoy_2604.mb_seller_member.user_id                 IS 'BO 직원ID (sy_user.user_id) — member_id와 정확히 하나만 채움';
COMMENT ON COLUMN shopjoy_2604.mb_seller_member.role_cd                  IS '역할 (OWNER=대표 / STAFF=실무자)';
COMMENT ON COLUMN shopjoy_2604.mb_seller_member.is_main                   IS '그 셀러의 대표 담당자 여부 Y/N (셀러당 1명 권장)';
COMMENT ON COLUMN shopjoy_2604.mb_seller_member.is_default                IS '로그인 계정 기준 기본(활성) 셀러 여부 Y/N (계정당 1개만 Y)';
COMMENT ON COLUMN shopjoy_2604.mb_seller_member.status_cd                 IS '연결 상태 (ACTIVE/REMOVED)';

CREATE INDEX IF NOT EXISTS idx_mb_seller_member_seller ON shopjoy_2604.mb_seller_member (seller_id);
CREATE INDEX IF NOT EXISTS idx_mb_seller_member_member ON shopjoy_2604.mb_seller_member (member_id);
CREATE INDEX IF NOT EXISTS idx_mb_seller_member_user   ON shopjoy_2604.mb_seller_member (user_id);
-- 계정(member_id 또는 user_id)당 기본(is_default='Y') 셀러는 하나뿐이어야 함
CREATE UNIQUE INDEX IF NOT EXISTS uq_default_per_member ON shopjoy_2604.mb_seller_member(member_id)
    WHERE is_default = 'Y' AND member_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_default_per_user ON shopjoy_2604.mb_seller_member(user_id)
    WHERE is_default = 'Y' AND user_id IS NOT NULL;

-- ───────────────────────────────────────────────────────────
-- 3) mb_member.md_yn — MD 블랭킷 권한 (셀러 아님, mb_seller와 무관한 별도 플래그)
-- ───────────────────────────────────────────────────────────
ALTER TABLE shopjoy_2604.mb_member ADD COLUMN IF NOT EXISTS md_yn CHAR(1);
COMMENT ON COLUMN shopjoy_2604.mb_member.md_yn IS 'MD(운영담당자) 여부 Y/N — 전 상품 상품평/Q&A 답변·숨김 블랭킷 권한. 판매자(seller)와 무관';

-- ───────────────────────────────────────────────────────────
-- 4) pd_prod.seller_id — 상품 소유권 단일 기준
-- ───────────────────────────────────────────────────────────
ALTER TABLE shopjoy_2604.pd_prod ADD COLUMN IF NOT EXISTS seller_id VARCHAR(21);
COMMENT ON COLUMN shopjoy_2604.pd_prod.seller_id IS '판매자ID (mb_seller.seller_id) — 상품 소유권 단일 기준. 기존 vendor_id는 유지(호환), 신규 로직은 이 컬럼 우선 참조';
CREATE INDEX IF NOT EXISTS idx_pd_prod_seller ON shopjoy_2604.pd_prod (seller_id);

-- 백필 1: 기존 sy_vendor 각 행 → mb_seller 1건씩 생성 (아직 없는 vendor만)
INSERT INTO shopjoy_2604.mb_seller (seller_id, seller_nm, seller_type_cd, seller_status_cd, vendor_id, reg_by, reg_date, reg_site_id)
SELECT
    'SEL' || TO_CHAR(NOW(), 'YYMMDDHH24MISS') || LPAD((ROW_NUMBER() OVER (ORDER BY v.vendor_id))::text, 4, '0'),
    v.vendor_nm,
    'COMPANY',
    CASE WHEN v.vendor_status_cd = 'ACTIVE' THEN 'ACTIVE' ELSE 'SUSPENDED' END,
    v.vendor_id,
    'MIGRATION_20260929',
    NOW(),
    v.reg_site_id
FROM shopjoy_2604.sy_vendor v
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.mb_seller s WHERE s.vendor_id = v.vendor_id);

-- 백필 2: pd_prod.vendor_id가 채워진 행 → 대응 mb_seller.seller_id로 seller_id 채움
UPDATE shopjoy_2604.pd_prod p
SET seller_id = s.seller_id
FROM shopjoy_2604.mb_seller s
WHERE s.vendor_id = p.vendor_id AND p.vendor_id IS NOT NULL AND p.seller_id IS NULL;

-- ───────────────────────────────────────────────────────────
-- 5) FOREIGN KEY (참조 테이블 존재 시에만 추가, 이미 있으면 스킵)
-- ───────────────────────────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE table_schema = 'shopjoy_2604' AND table_name = 'mb_seller'
                     AND constraint_name = 'fk_mb_seller_vendor')
    THEN
        ALTER TABLE shopjoy_2604.mb_seller
            ADD CONSTRAINT fk_mb_seller_vendor FOREIGN KEY (vendor_id) REFERENCES shopjoy_2604.sy_vendor (vendor_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE table_schema = 'shopjoy_2604' AND table_name = 'mb_seller_member'
                     AND constraint_name = 'fk_mb_seller_member_seller')
    THEN
        ALTER TABLE shopjoy_2604.mb_seller_member
            ADD CONSTRAINT fk_mb_seller_member_seller FOREIGN KEY (seller_id) REFERENCES shopjoy_2604.mb_seller (seller_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE table_schema = 'shopjoy_2604' AND table_name = 'mb_seller_member'
                     AND constraint_name = 'fk_mb_seller_member_member')
    THEN
        ALTER TABLE shopjoy_2604.mb_seller_member
            ADD CONSTRAINT fk_mb_seller_member_member FOREIGN KEY (member_id) REFERENCES shopjoy_2604.mb_member (member_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE table_schema = 'shopjoy_2604' AND table_name = 'mb_seller_member'
                     AND constraint_name = 'fk_mb_seller_member_user')
    THEN
        ALTER TABLE shopjoy_2604.mb_seller_member
            ADD CONSTRAINT fk_mb_seller_member_user FOREIGN KEY (user_id) REFERENCES shopjoy_2604.sy_user (user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE table_schema = 'shopjoy_2604' AND table_name = 'pd_prod'
                     AND constraint_name = 'fk_pd_prod_seller')
    THEN
        ALTER TABLE shopjoy_2604.pd_prod
            ADD CONSTRAINT fk_pd_prod_seller FOREIGN KEY (seller_id) REFERENCES shopjoy_2604.mb_seller (seller_id);
    END IF;
END $$;

-- ───────────────────────────────────────────────────────────
-- 6) 공통코드 — SELLER_TYPE_CD / SELLER_STATUS_CD (없을 때만 추가)
-- ───────────────────────────────────────────────────────────
INSERT INTO shopjoy_2604.sy_code_grp (code_grp_id, code_grp, grp_nm, path_id, code_grp_desc, use_yn, reg_by, reg_date, reg_site_id)
SELECT 'CG260929000001', 'SELLER_TYPE_CD', '판매자유형', 'seller.type', '판매자 유형(개인/업체)', 'Y', 'MIGRATION_20260929', NOW(), '2604010000000001'
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code_grp WHERE code_grp = 'SELLER_TYPE_CD');

INSERT INTO shopjoy_2604.sy_code_grp (code_grp_id, code_grp, grp_nm, path_id, code_grp_desc, use_yn, reg_by, reg_date, reg_site_id)
SELECT 'CG260929000002', 'SELLER_STATUS_CD', '판매자상태', 'seller.status', '판매자 상태(신청중/승인/정지)', 'Y', 'MIGRATION_20260929', NOW(), '2604010000000001'
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code_grp WHERE code_grp = 'SELLER_STATUS_CD');

INSERT INTO shopjoy_2604.sy_code (code_id, code_value, code_label, sort_ord, use_yn, code_grp_id, reg_by, reg_date, reg_site_id)
SELECT v.code_id, v.code_value, v.code_label, v.sort_ord, 'Y', g.code_grp_id, 'MIGRATION_20260929', NOW(), '2604010000000001'
FROM (VALUES
    ('CD260929000001', 'INDIVIDUAL', '개인', 1),
    ('CD260929000002', 'COMPANY',    '업체', 2)
) AS v(code_id, code_value, code_label, sort_ord)
JOIN shopjoy_2604.sy_code_grp g ON g.code_grp = 'SELLER_TYPE_CD'
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code WHERE code_grp_id = g.code_grp_id AND code_value = v.code_value);

INSERT INTO shopjoy_2604.sy_code (code_id, code_value, code_label, sort_ord, use_yn, code_grp_id, reg_by, reg_date, reg_site_id)
SELECT v.code_id, v.code_value, v.code_label, v.sort_ord, 'Y', g.code_grp_id, 'MIGRATION_20260929', NOW(), '2604010000000001'
FROM (VALUES
    ('CD260929000003', 'PENDING',   '신청중', 1),
    ('CD260929000004', 'ACTIVE',    '승인',   2),
    ('CD260929000005', 'SUSPENDED', '정지',   3)
) AS v(code_id, code_value, code_label, sort_ord)
JOIN shopjoy_2604.sy_code_grp g ON g.code_grp = 'SELLER_STATUS_CD'
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code WHERE code_grp_id = g.code_grp_id AND code_value = v.code_value);

-- ═══════════════════════════════════════════════════════════
--  검증
-- ═══════════════════════════════════════════════════════════
-- 테이블/컬럼 확인:
-- SELECT table_name FROM information_schema.tables WHERE table_schema='shopjoy_2604' AND table_name IN ('mb_seller','mb_seller_member');
-- SELECT column_name FROM information_schema.columns WHERE table_schema='shopjoy_2604' AND table_name='mb_member' AND column_name='md_yn';
-- SELECT column_name FROM information_schema.columns WHERE table_schema='shopjoy_2604' AND table_name='pd_prod' AND column_name='seller_id';
--
-- 백필 결과 확인:
-- SELECT count(*) FROM shopjoy_2604.mb_seller;
-- SELECT count(*) FROM shopjoy_2604.pd_prod WHERE vendor_id IS NOT NULL AND seller_id IS NULL;  -- 0이어야 정상(백필 누락 없음)
--
-- 코드 확인:
-- SELECT * FROM shopjoy_2604.sy_code WHERE code_grp_id IN (SELECT code_grp_id FROM shopjoy_2604.sy_code_grp WHERE code_grp IN ('SELLER_TYPE_CD','SELLER_STATUS_CD'));
