-- ═══════════════════════════════════════════════════════════
--  shopjoy_2604.mb_member_role 테이블 생성
--  작성일: 2026-05-04
--  목적  : Spring Boot 기동 시 "missing table [mb_member_role]" 에러 해결
-- ═══════════════════════════════════════════════════════════
--  사용법 (psql/DBeaver):
--    SET search_path TO shopjoy_2604;
--    아래 스크립트 실행
-- ═══════════════════════════════════════════════════════════

SET search_path TO shopjoy_2604;

-- 회원 역할 연결: mb_member ↔ sy_role
CREATE TABLE IF NOT EXISTS shopjoy_2604.mb_member_role (
    member_role_id        VARCHAR(21)  NOT NULL PRIMARY KEY,   -- PK (MBR + yyMMddHHmmss + rand4)
    member_id             VARCHAR(21)  NOT NULL,               -- FK: mb_member.member_id
    role_id               VARCHAR(21)  NOT NULL,               -- FK: sy_role.role_id
    grant_user_id         VARCHAR(21),                         -- 권한 부여한 관리자 user_id
    grant_date            TIMESTAMP,                           -- 권한 부여 일시
    valid_from            DATE,                                -- 유효 시작일 (NULL=제한없음)
    valid_to              DATE,                                -- 유효 종료일 (NULL=제한없음)
    member_role_remark    VARCHAR(500),                        -- 비고
    reg_by                VARCHAR(30),
    reg_date              TIMESTAMP    DEFAULT NOW(),
    upd_by                VARCHAR(30),
    upd_date              TIMESTAMP
);

-- ───── COMMENT ─────
COMMENT ON TABLE  shopjoy_2604.mb_member_role                   IS '회원 역할 연결';
COMMENT ON COLUMN shopjoy_2604.mb_member_role.member_role_id    IS 'PK';
COMMENT ON COLUMN shopjoy_2604.mb_member_role.member_id         IS '회원 ID (mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.mb_member_role.role_id           IS '역할 ID (sy_role.role_id)';
COMMENT ON COLUMN shopjoy_2604.mb_member_role.grant_user_id     IS '권한 부여 관리자 ID';
COMMENT ON COLUMN shopjoy_2604.mb_member_role.grant_date        IS '권한 부여 일시';
COMMENT ON COLUMN shopjoy_2604.mb_member_role.valid_from        IS '유효 시작일';
COMMENT ON COLUMN shopjoy_2604.mb_member_role.valid_to          IS '유효 종료일';
COMMENT ON COLUMN shopjoy_2604.mb_member_role.member_role_remark IS '비고';

-- ───── INDEX ─────
CREATE INDEX IF NOT EXISTS idx_mb_member_role_member ON shopjoy_2604.mb_member_role (member_id);
CREATE INDEX IF NOT EXISTS idx_mb_member_role_role   ON shopjoy_2604.mb_member_role (role_id);

-- ───── FOREIGN KEY (참조 테이블 존재 시에만 추가) ─────
-- mb_member 가 존재할 때만 FK 추가
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'shopjoy_2604' AND table_name = 'mb_member')
       AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                       WHERE table_schema = 'shopjoy_2604'
                         AND table_name = 'mb_member_role'
                         AND constraint_name = 'fk_mb_member_role_member')
    THEN
        ALTER TABLE shopjoy_2604.mb_member_role
            ADD CONSTRAINT fk_mb_member_role_member
            FOREIGN KEY (member_id) REFERENCES shopjoy_2604.mb_member (member_id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'shopjoy_2604' AND table_name = 'sy_role')
       AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                       WHERE table_schema = 'shopjoy_2604'
                         AND table_name = 'mb_member_role'
                         AND constraint_name = 'fk_mb_member_role_role')
    THEN
        ALTER TABLE shopjoy_2604.mb_member_role
            ADD CONSTRAINT fk_mb_member_role_role
            FOREIGN KEY (role_id) REFERENCES shopjoy_2604.sy_role (role_id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'shopjoy_2604' AND table_name = 'sy_user')
       AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                       WHERE table_schema = 'shopjoy_2604'
                         AND table_name = 'mb_member_role'
                         AND constraint_name = 'fk_mb_member_role_grant')
    THEN
        ALTER TABLE shopjoy_2604.mb_member_role
            ADD CONSTRAINT fk_mb_member_role_grant
            FOREIGN KEY (grant_user_id) REFERENCES shopjoy_2604.sy_user (user_id);
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════
--  검증
-- ═══════════════════════════════════════════════════════════
-- 테이블 존재 확인:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'shopjoy_2604' AND table_name = 'mb_member_role';
--
-- 컬럼 확인:
-- SELECT column_name, data_type, character_maximum_length, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'shopjoy_2604' AND table_name = 'mb_member_role'
-- ORDER BY ordinal_position;
