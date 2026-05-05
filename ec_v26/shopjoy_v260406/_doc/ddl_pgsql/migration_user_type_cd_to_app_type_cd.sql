-- ============================================================
-- migration: user_type_cd → app_type_cd 전면 변경
--
-- 사유: HTTP 헤더(X-App-Type-Cd) ↔ JWT claims(appTypeCd) ↔ DB 컬럼(app_type_cd) 일관성 확보.
--       BO/FO/EXT 분류는 "사용자 종류"가 아닌 "앱(클라이언트) 종류"의 의미가 더 정확.
-- 적용일: 2026-05-05
--
-- 영향 테이블: sy_user, syh_access_log, syh_access_error_log
-- 공통코드: USER_TYPE → APP_TYPE 그룹명 변경 (sy_code_grp / sy_code 에 미등록 상태 — 별도 작업 불필요)
--
-- ⚠️ 주의: 이 마이그레이션 적용 후 백엔드 재기동 시 기존 발급 JWT 토큰은 모두 무효화됨.
--          전체 사용자 강제 로그아웃 발생 → 재로그인 필요.
-- ============================================================

BEGIN;

-- ── sy_user ─────────────────────────────────────────────────
ALTER TABLE shopjoy_2604.sy_user
    RENAME COLUMN user_type_cd TO app_type_cd;

COMMENT ON COLUMN shopjoy_2604.sy_user.app_type_cd
    IS '앱 유형 (코드: APP_TYPE — FO:사용자앱, BO:관리자앱, SO:판매자앱, DO:배달기사앱, CO:고객사앱)';

-- ── syh_access_log ──────────────────────────────────────────
ALTER TABLE shopjoy_2604.syh_access_log
    RENAME COLUMN user_type_cd TO app_type_cd;

COMMENT ON COLUMN shopjoy_2604.syh_access_log.app_type_cd
    IS '호출 앱 유형 (코드: APP_TYPE — FO/BO/SO/DO/CO/-)';

-- ── syh_access_error_log ────────────────────────────────────
ALTER TABLE shopjoy_2604.syh_access_error_log
    RENAME COLUMN user_type_cd TO app_type_cd;

COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.app_type_cd
    IS '호출 앱 유형 (코드: APP_TYPE — FO/BO/SO/DO/CO/-)';

-- ── 공통코드 그룹 (sy_code_grp / sy_code) ─────────────────
-- 점검 결과: USER_TYPE 그룹은 sample_insert 에 없음. 운영 DB 에 등록되어 있다면 다음을 실행:
--
-- UPDATE shopjoy_2604.sy_code_grp
--    SET code_grp = 'APP_TYPE',
--        grp_nm   = '앱유형',
--        disp_path = REPLACE(disp_path, 'user.type', 'app.type'),
--        code_grp_desc = '앱(클라이언트) 유형'
--  WHERE code_grp = 'USER_TYPE';
--
-- UPDATE shopjoy_2604.sy_code
--    SET code_grp = 'APP_TYPE'
--  WHERE code_grp = 'USER_TYPE';
--
-- 위 두 문을 운영 DB 상태에 맞춰 수동으로 결정 후 실행하세요.
-- 등록된 적이 없다면 무시.

COMMIT;

-- ── 적용 후 검증 쿼리 (참고용) ───────────────────────────────
-- SELECT table_name, column_name FROM information_schema.columns
--  WHERE table_schema='shopjoy_2604' AND column_name IN ('user_type_cd','app_type_cd')
--  ORDER BY table_name, column_name;
-- 기대 결과: app_type_cd 가 3개 테이블에 존재, user_type_cd 는 0건.
