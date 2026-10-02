-- ═══════════════════════════════════════════════════════════
--  멀티테넌트 — 사이트별 모듈 (sy_site.tenant_module)
--  작성일: 2026-10-02
--
--  배경:
--   FO 배포는 "사이트 + 모듈"로 고정된다(.env.[사이트].[모듈].[프로파일]). 지금까지 "이 사이트가 어느 모듈(ec1, ec2 …)로
--   운영되는지"는 배포 환경파일에만 있었다. 회원/사용자 목록(임시로그인 선택 화면 등)에서 사이트와 함께 모듈을 보여주고
--   모듈로 걸러 보려면 DB 가 이 매핑을 알아야 하므로 sy_site 에 컬럼으로 둔다.
--   회원(mb_member.site_id)·사용자(sy_user.reg_site_id)의 모듈은 이 값을 사이트로 따라간다(회원 테이블에 따로 두지 않는다).
--   값: 소문자 영숫자(ec1, ec2 …). NULL = 아직 모듈 미지정(FO 배포 없는 사이트).
--   FO 빌드(scripts/tenant.mjs)는 환경파일의 모듈이 이 값과 다르면 중단한다(잘못된 모듈로 배포 방지).
-- ═══════════════════════════════════════════════════════════
--  사용법 (psql/DBeaver): 아래 스크립트 실행 (재실행해도 안전)
-- ═══════════════════════════════════════════════════════════

SET search_path TO shopjoy_2604;

ALTER TABLE shopjoy_2604.sy_site ADD COLUMN IF NOT EXISTS tenant_module VARCHAR(20);
COMMENT ON COLUMN shopjoy_2604.sy_site.tenant_module IS '이 사이트가 운영되는 FO 모듈(ec1, ec2 …) — 배포 환경파일 .env.[사이트].[모듈].[프로파일] 의 [모듈]과 같아야 한다. NULL=미지정';

-- 현재 배포 매핑: site1(SHOPJOY)=ec1, site2=ec2
UPDATE shopjoy_2604.sy_site SET tenant_module = 'ec1' WHERE site_id = '2604010000000001' AND tenant_module IS NULL;
UPDATE shopjoy_2604.sy_site SET tenant_module = 'ec2' WHERE site_id = '2604010000000002' AND tenant_module IS NULL;

-- ═══════════════════════════════════════════════════════════
--  검증
-- ═══════════════════════════════════════════════════════════
-- SELECT site_id, site_code, site_nm, tenant_module FROM shopjoy_2604.sy_site ORDER BY site_id;
--   → 2604010000000001 SHOPJOY ec1 / 2604010000000002 site2 ec2 / 나머지 NULL
