-- ═══════════════════════════════════════════════════════════════════════════
--  모듈 = 공통코드 MODULE_CD, sy_site.tenant_module → module_cd  (2026-10-04)
--
--  사용자 요청: "멀티테넌트 모듈은 공통코드로 — sy_site 모듈은 module_cd, 값은 ec1, ec2 이대로"
--
--  ■ 1단계 (이 파일 전체 = 배포 "전", run_all_20261004.py 8-1)
--     1) sy_site.module_cd 컬럼 추가 + tenant_module 값 복사   ← 옛 컬럼은 남겨 둔다(지금 떠 있는 옛 백엔드가 계속 읽는다)
--     2) 공통코드 그룹 MODULE_CD + 코드 6개(ec1, ec2, danmoo1, homepg1, datavisual1, bbm1)
--     → 새 백엔드(ecBeBo c5e02de 이후)는 module_cd 만 읽는다. 1단계가 적용돼야 기동된다.
--  ■ 2단계 (배포 "뒤", run_all_20261004.py 8-2 가 직접 실행 — 이 파일 맨 아래 주석과 같은 문장)
--     옛 컬럼 tenant_module 삭제. 그 전에 module_cd 가 비어 있는 행은 tenant_module 값으로 채운다
--     (1단계 ~ 배포 사이에 옛 BO 가 사이트 모듈을 바꾼 경우 대비).
--
--  이름만 바꾸는(RENAME) 대신 "추가 → 복사 → 배포 → 옛 컬럼 삭제"로 나눈 이유: RENAME 은 실행하는 순간 옛 백엔드의
--  사이트 조회(모든 FO 요청의 사이트 확인)가 깨진다. 이 방식은 1단계와 배포 사이에 서비스가 끊기지 않는다.
--
--  재실행 안전(IF NOT EXISTS / NOT EXISTS). 되돌리기: 맨 아래 주석.
--  ※ mb_device_token.tenant_modules · ap_fcm_noti.tenant_modules(알림 대상 모듈 목록)는 다른 컬럼이다 — 이 파일은 건드리지 않는다.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) 컬럼 추가 + 값 복사
ALTER TABLE shopjoy_2604.sy_site ADD COLUMN IF NOT EXISTS module_cd VARCHAR(20);
COMMENT ON COLUMN shopjoy_2604.sy_site.module_cd IS 'FO 모듈 (코드: MODULE_CD — ec1/ec2/danmoo1/homepg1/datavisual1/bbm1). FO 사이트 파일 tenant/SI26/<사이트ID>-<모듈>.jsonc 의 모듈과 같아야 한다. NULL=미지정';

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'shopjoy_2604' AND table_name = 'sy_site' AND column_name = 'tenant_module') THEN
        EXECUTE 'UPDATE shopjoy_2604.sy_site SET module_cd = NULLIF(btrim(tenant_module), '''')
                  WHERE module_cd IS NULL AND tenant_module IS NOT NULL AND btrim(tenant_module) <> ''''';
        EXECUTE 'COMMENT ON COLUMN shopjoy_2604.sy_site.tenant_module IS ''(옛 이름 — module_cd 로 대체, 배포 뒤 삭제 예정 2026-10-04)''';
    END IF;
END $$;

-- 2) 공통코드 그룹 MODULE_CD
INSERT INTO shopjoy_2604.sy_code_grp (code_grp_id, code_grp, grp_nm, path_id, code_grp_desc, use_yn, reg_by, reg_date, reg_site_id)
SELECT 'CG261004100001', 'MODULE_CD', 'FO모듈', 'site.module',
       'FO 모듈(멀티테넌트) — sy_site.module_cd. 값은 FO 소스 폴더(app/pages/<모듈>)·사이트 파일(tenant/SI26/<사이트ID>-<모듈>.jsonc)·CDN 폴더(SI26/<사이트ID>_<모듈>)의 모듈 이름과 같다',
       'Y', 'MIGRATION_20261004', NOW(), 'SI260001'
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code_grp WHERE code_grp = 'MODULE_CD')
  AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code_grp WHERE code_grp_id = 'CG261004100001');

-- code_opt1 = 사이트 성격(EC:쇼핑몰 / C2C:개인간 거래 / HOMEPAGE / DATAVIS / BOARD) — 화면 분기용 참고값
INSERT INTO shopjoy_2604.sy_code (code_id, code_value, code_label, sort_ord, use_yn, code_remark, code_level, code_opt1, code_grp_id, reg_by, reg_date, reg_site_id)
SELECT v.code_id, v.code_value, v.code_label, v.sort_ord, 'Y', v.code_remark, 1, v.code_opt1, g.code_grp_id, 'MIGRATION_20261004', NOW(), g.reg_site_id
  FROM (VALUES
        ('CD261004100001', 'ec1',         '쇼핑몰 1 (ec1)',          1, '종합 쇼핑몰 — 기본 디자인. 사이트 SI260001',                 'EC'),
        ('CD261004100002', 'ec2',         '쇼핑몰 2 (ec2)',          2, '종합 쇼핑몰 — 두 번째 디자인. 사이트 SI260002',              'EC'),
        ('CD261004100003', 'danmoo1',     '당무마켓 (danmoo1)',      3, '개인간 거래(당근형) — config_json c2c. 사이트 SI260003',     'C2C'),
        ('CD261004100004', 'homepg1',     '홈페이지 (homepg1)',      4, '회사 홈페이지 — 문의·주문 접수. 사이트 SI260004',            'HOMEPAGE'),
        ('CD261004100005', 'datavisual1', '데이터 시각화 (datavisual1)', 5, '차트·대시보드. 사이트 SI260005',                         'DATAVIS'),
        ('CD261004100006', 'bbm1',        '통합게시판 (bbm1)',       6, '커뮤니티 포털 — cm_bbm 게시판·메뉴. 사이트 SI260006',        'BOARD')
       ) AS v(code_id, code_value, code_label, sort_ord, code_remark, code_opt1)
  JOIN shopjoy_2604.sy_code_grp g ON g.code_grp = 'MODULE_CD'
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code x WHERE x.code_grp_id = g.code_grp_id AND x.code_value = v.code_value)
   AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code y WHERE y.code_id = v.code_id);

-- 확인
-- SELECT site_id, site_nm, module_cd FROM shopjoy_2604.sy_site ORDER BY site_id;
-- SELECT c.code_value, c.code_label FROM shopjoy_2604.sy_code c JOIN shopjoy_2604.sy_code_grp g ON g.code_grp_id = c.code_grp_id WHERE g.code_grp = 'MODULE_CD' ORDER BY c.sort_ord;
-- 코드에 없는 모듈 값을 가진 사이트(0건이어야 함):
-- SELECT s.site_id, s.module_cd FROM shopjoy_2604.sy_site s WHERE s.module_cd IS NOT NULL
--    AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code c JOIN shopjoy_2604.sy_code_grp g ON g.code_grp_id = c.code_grp_id WHERE g.code_grp = 'MODULE_CD' AND c.code_value = s.module_cd);

-- ═══════════════════════════════════════════════════════════════════════════
--  2단계 (배포 뒤 — run_all_20261004.py post 의 8-2 가 실행한다. 손으로 할 때만 주석을 풀어 실행)
-- ═══════════════════════════════════════════════════════════════════════════
-- BEGIN;
-- SET LOCAL lock_timeout = '10s';
-- UPDATE shopjoy_2604.sy_site SET module_cd = NULLIF(btrim(tenant_module), '') WHERE module_cd IS NULL AND tenant_module IS NOT NULL AND btrim(tenant_module) <> '';
-- ALTER TABLE shopjoy_2604.sy_site DROP COLUMN IF EXISTS tenant_module;
-- COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
--  되돌리기
--   1단계만 적용한 상태: ALTER TABLE shopjoy_2604.sy_site DROP COLUMN IF EXISTS module_cd;
--                        DELETE FROM shopjoy_2604.sy_code WHERE code_id BETWEEN 'CD261004100001' AND 'CD261004100006';
--                        DELETE FROM shopjoy_2604.sy_code_grp WHERE code_grp_id = 'CG261004100001';
--   2단계까지 적용한 상태(옛 백엔드로 돌아가야 할 때):
--                        ALTER TABLE shopjoy_2604.sy_site ADD COLUMN IF NOT EXISTS tenant_module VARCHAR(20);
--                        UPDATE shopjoy_2604.sy_site SET tenant_module = module_cd;
-- ═══════════════════════════════════════════════════════════════════════════
