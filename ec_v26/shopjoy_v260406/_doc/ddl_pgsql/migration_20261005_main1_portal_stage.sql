-- ═══════════════════════════════════════════════════════════════════════════
--  main1(종합서비스관리 포털, 사이트 SI260009) 분류 — 공통코드 SERVICE_STAGE_CD + 포털 사이트 config_json.portal  (2026-10-05)
--
--  사용자 요청: "ecFeMain 내용 참고하여 ecFeFoNuxt4\app\pages\main1 도 만들어줘, sy_site SI260009 main1 로 추가했어"
--  ecFeMain 의 상단 분류(회사제품·준비중·작업중·서비스중·종료)를 DB 로 옮긴다. 새 테이블 없음(사용자 원칙: ER 관계를 복잡하게 만들지 말 것).
--
--   1) 공통코드 그룹 SERVICE_STAGE_CD (전체 공통 — 사이트 매핑 없음) + 코드 6개(회사제품·준비중·작업중·서비스중·종료 + 관리자)
--        code_value = 분류 코드, code_label = 이름, sort_ord = 순서, code_opt1 = 배지 색(hex)
--   2) 포털 사이트 SI260009 의 sy_site.config_json 에 {"portal":{"stages":{앱 키 → 분류 코드}}}
--        앱 키 = 사이트ID(SI2600xx) 또는 정적 앱 키(ecFeMain 폴더 이름 home_v260329 등)
--        공개 사이트 API(/api/co/sy/site)는 다른 사이트의 config_json 을 비워 주고 요청한 사이트 자신 것만 준다 →
--        각 사이트가 아니라 포털 사이트 한 곳에 둔다. 값은 BO 사이트관리(SI260009) 확장설정에서 고친다.
--        그 밖의 키: "hidden":[앱 키…] 목록에서 빼기, "order":[앱 키…] 앞에 둘 순서.
--
--  이 파일을 실행하기 전에도 FO(main1)는 같은 기본값(app/conts/tenant/main1.ts)으로 동작한다 — 실행하면 포털 홈의
--  "분류 기본값 · 앱별 분류 기본값" 표시가 "공통코드 SERVICE_STAGE_CD · 사이트 SI260009 설정" 으로 바뀐다.
--
--  재실행 안전(NOT EXISTS / portal 키가 이미 있으면 config_json 은 건드리지 않음 — BO 에서 고친 값 보존).
--  되돌리기: 맨 아래 주석.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) 공통코드 그룹 SERVICE_STAGE_CD
INSERT INTO shopjoy_2604.sy_code_grp (code_grp_id, code_grp, grp_nm, path_id, code_grp_desc, use_yn, reg_by, reg_date, reg_site_id)
SELECT 'CG261005950001', 'SERVICE_STAGE_CD', '서비스단계', 'site.stage',
       '서비스(사이트 모듈·정적 사이트)의 진행 단계 — main1 종합서비스관리 포털의 분류(ecFeMain 상단 셀렉트). 앱별 값은 sy_site(SI260009).config_json.portal.stages. code_opt1 = 배지 색',
       'Y', 'MIGRATION_20261005', NOW(), 'SI260009'
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code_grp WHERE code_grp = 'SERVICE_STAGE_CD')
  AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code_grp WHERE code_grp_id = 'CG261005950001');

INSERT INTO shopjoy_2604.sy_code (code_id, code_value, code_label, sort_ord, use_yn, code_remark, code_level, code_opt1, code_grp_id, reg_by, reg_date, reg_site_id)
SELECT v.code_id, v.code_value, v.code_label, v.sort_ord, 'Y', v.code_remark, 1, v.code_opt1, g.code_grp_id, 'MIGRATION_20261005', NOW(), g.reg_site_id
  FROM (VALUES
        ('CD261005950001', 'COMPANY', '회사제품', 1, '회사 자체 제품·소개 사이트',          '#2563eb'),
        ('CD261005950002', 'PREP',    '준비중',   2, '기획·준비 단계',                     '#d97706'),
        ('CD261005950003', 'WORK',    '작업중',   3, '개발·제작 진행 중 (기본값)',           '#7c3aed'),
        ('CD261005950004', 'SERVICE', '서비스중', 4, '운영 중인 서비스',                    '#059669'),
        ('CD261005950005', 'END',     '종료',     5, '서비스 종료',                         '#64748b'),
        ('CD261005950006', 'ADMIN',   '관리자',   6, '관리자용(ADMIN) 사이트 — BO 앱(bo1·bom1). 사이트 유형이 ADMIN 이면 FO 가 자동으로 이 분류', '#0f766e')
       ) AS v(code_id, code_value, code_label, sort_ord, code_remark, code_opt1)
  JOIN shopjoy_2604.sy_code_grp g ON g.code_grp = 'SERVICE_STAGE_CD'
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code x WHERE x.code_grp_id = g.code_grp_id AND x.code_value = v.code_value)
   AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code y WHERE y.code_id = v.code_id);

-- 2) 포털 사이트(SI260009) config_json.portal — ecFeMain mainFrameData.js 의 분류 그대로
--    (회사제품 docs·home / 준비중 anynuri·datavisual(=datavisual1 SI260005) / 작업중 나머지 — modunuri=homepg1 SI260004, shopjoy=ec1 SI260001, 이후 생긴 ec2·danmoo1·bbm1. 관리자용 bo1·bom1 은 사이트 유형 ADMIN 으로 자동 '관리자')
UPDATE shopjoy_2604.sy_site
   SET config_json = (COALESCE(NULLIF(btrim(config_json), ''), '{}')::jsonb
                      || jsonb_build_object('portal', jsonb_build_object('stages', jsonb_build_object(
                           'home_v260329', 'COMPANY',
                           'docs_v260329', 'COMPANY',
                           'anynuri_v260329', 'PREP',
                           'SI260005', 'PREP',
                           'dangoeul_v260330', 'WORK',
                           'partyroom_v260329', 'WORK',
                           'artLeaseSale_v260330', 'WORK',
                           'careMate_v260330', 'WORK',
                           'SI260001', 'WORK',
                           'SI260002', 'WORK',
                           'SI260003', 'WORK',
                           'SI260004', 'WORK',
                           'SI260006', 'WORK'))))::text,
       upd_date = CURRENT_TIMESTAMP
 WHERE site_id = 'SI260009'
   AND NOT (COALESCE(NULLIF(btrim(config_json), ''), '{}')::jsonb ? 'portal');

-- 확인
-- SELECT c.code_value, c.code_label, c.sort_ord, c.code_opt1 FROM shopjoy_2604.sy_code c JOIN shopjoy_2604.sy_code_grp g ON g.code_grp_id = c.code_grp_id WHERE g.code_grp = 'SERVICE_STAGE_CD' ORDER BY c.sort_ord;
-- SELECT site_id, config_json FROM shopjoy_2604.sy_site WHERE site_id = 'SI260009';
-- FO 확인: curl -H "X-Site-Id: SI260009" "https://22300.illeesam.synology.me/api/co/sy/code/groups?codeGrps=SERVICE_STAGE_CD"
--          → 포털 홈(main1) "분류 공통코드 SERVICE_STAGE_CD · 앱별 분류 사이트 SI260009 설정" (공통코드는 백엔드 캐시가 있으면 BO 공통코드관리 [캐시 새로고침] 뒤)

-- ═══════════════════════════════════════════════════════════════════════════
--  되돌리기
--   DELETE FROM shopjoy_2604.sy_code WHERE code_id BETWEEN 'CD261005950001' AND 'CD261005950006';
--   DELETE FROM shopjoy_2604.sy_code_grp WHERE code_grp_id = 'CG261005950001';
--   UPDATE shopjoy_2604.sy_site SET config_json = NULLIF((config_json::jsonb - 'portal')::text, '{}') WHERE site_id = 'SI260009';
-- ═══════════════════════════════════════════════════════════════════════════
