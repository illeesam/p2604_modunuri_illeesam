-- ═══════════════════════════════════════════════════════════════════════════
--  migration_20261005_feat5_data.sql — 기능 5건 데이터 (2026-10-05, 스키마 변경 없음)
-- ═══════════════════════════════════════════════════════════════════════════
--  ① 공통코드 OD_REMOTE_ZIP_CD — 제주·도서산간 우편번호 구간(정책서 od.02 §2-4, 이름 규칙 sy.08 — 전체 공통 = 사이트 매핑 없음)
--       1단계: JEJU(제주) / ISLAND(도서산간)        2단계: code_value = 시작 우편번호, code_opt1 = 끝 우편번호, parent_code_value = 지역
--       출처: 2015-08-01 새 우편번호(5자리) 기준으로 택배사·쇼핑몰 솔루션(카페24·스마트스토어 등)이 기본 제공하는
--             "제주·도서산간 추가배송비 우편번호" 표(제주 63000~63644 + 섬 지역 구간). 택배 계약서의 구간이 다르면 BO 공통코드관리에서 고친다.
--  ② 배치 PM_SAVE_EXPIRE — 적립금 만료 소멸 + 소멸 7일 전 안내(사이트별), 매일 00:40 (정책서 pm.04 §9)
--       Jenkins 잡은 ecBeBatchJenkins casc(jenkins.yaml) 에 같은 코드로 추가됨 — 운영(oper)은 Jenkins 가 /api/sch/jenkins/PM_SAVE_EXPIRE 를 부른다.
--  ③ BO 메뉴 — 고객센터 > 동네생활 > 지역(동네) 관리(#page=cmRegionMng) + 역할 권한(동네 글 관리와 같게)
--       ※ BO 좌측 메뉴는 ecFeBo lib/app/boAppMenuData.js 가 그린다 — sy_menu 는 메뉴관리·역할관리 화면의 기준 데이터.
--
--  실행: psql/DBeaver, 스키마 소유자 postgres. 한 트랜잭션. 다시 실행해도 안전(이미 있으면 건너뜀).
--  순서: migration_20261005_cm_region.sql → migration_20261005_feat5_money.sql → 이 파일 (셋 다 백엔드 배포 전·후 어느 쪽이든 된다).
--  반영: 백엔드 공통코드 캐시(Redis sy:code:*)·우편번호 판정 캐시(1분) — 배치는 BO 배치스케줄관리 [재적재] 또는 POST /api/sch/reload.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── ① 공통코드 그룹 OD_REMOTE_ZIP_CD ───────────────────────────────────────
INSERT INTO shopjoy_2604.sy_code_grp (code_grp_id, code_grp, grp_nm, path_id, code_grp_desc, use_yn, code_opt1_desc, reg_by, reg_date, reg_site_id)
SELECT 'COG2610051900000001', 'OD_REMOTE_ZIP_CD', '제주·도서산간 우편번호', 'dliv.remote',
       '추가배송비 지역 판정 — 1단계 지역(JEJU/ISLAND), 2단계 우편번호 구간(code_value=시작, code_opt1=끝, parent_code_value=지역). 금액은 배송비 템플릿(pd_dliv_tmplt.jeju_extra_cost / island_extra_cost)',
       'Y', '구간 끝 우편번호(5자리, 비면 시작과 같음)', 'MIGRATION_20261005', CURRENT_TIMESTAMP, 'SI260001'
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code_grp WHERE code_grp = 'OD_REMOTE_ZIP_CD');

INSERT INTO shopjoy_2604.sy_code (code_id, code_grp_id, code_value, code_label, sort_ord, use_yn, parent_code_value, code_remark, code_level, code_opt1, reg_by, reg_date, reg_site_id)
SELECT v.code_id, g.code_grp_id, v.code_value, v.code_label, v.sort_ord, 'Y', v.parent_cd, v.remark, v.lvl, v.opt1, 'MIGRATION_20261005', CURRENT_TIMESTAMP, 'SI260001'
  FROM (VALUES
         -- 1단계 지역
         ('SC26100519000001', 'JEJU',   '제주',     1, NULL, '제주특별자치도 — 템플릿 jeju_extra_cost(기본 3,000원)', 1, NULL),
         ('SC26100519000002', 'ISLAND', '도서산간', 2, NULL, '제주 외 섬 지역 — 템플릿 island_extra_cost(기본 5,000원)', 1, NULL),
         -- 2단계 구간: 제주
         ('SC26100519000011', '63000', '제주특별자치도 전체',      11, 'JEJU',   NULL, 2, '63644'),
         -- 2단계 구간: 도서산간(제주 외)
         ('SC26100519000021', '22386', '인천 중구 섬 지역',        21, 'ISLAND', NULL, 2, '22388'),
         ('SC26100519000022', '23004', '인천 강화군 섬 지역',      22, 'ISLAND', NULL, 2, '23010'),
         ('SC26100519000023', '23100', '인천 옹진군',              23, 'ISLAND', NULL, 2, '23116'),
         ('SC26100519000024', '23124', '인천 옹진군',              24, 'ISLAND', NULL, 2, '23136'),
         ('SC26100519000025', '31708', '충남 당진시 섬 지역',      25, 'ISLAND', NULL, 2, '31708'),
         ('SC26100519000026', '32133', '충남 태안군 섬 지역',      26, 'ISLAND', NULL, 2, '32133'),
         ('SC26100519000027', '33411', '충남 보령시 섬 지역',      27, 'ISLAND', NULL, 2, '33411'),
         ('SC26100519000028', '40200', '경북 울릉군',              28, 'ISLAND', NULL, 2, '40240'),
         ('SC26100519000029', '46768', '부산 강서구 섬 지역',      29, 'ISLAND', NULL, 2, '46771'),
         ('SC26100519000030', '52570', '경남 사천시 섬 지역',      30, 'ISLAND', NULL, 2, '52571'),
         ('SC26100519000031', '53031', '경남 통영시 섬 지역',      31, 'ISLAND', NULL, 2, '53033'),
         ('SC26100519000032', '53089', '경남 통영시 섬 지역',      32, 'ISLAND', NULL, 2, '53104'),
         ('SC26100519000033', '54000', '전북 군산시 섬 지역',      33, 'ISLAND', NULL, 2, '54000'),
         ('SC26100519000034', '56347', '전북 부안군 섬 지역',      34, 'ISLAND', NULL, 2, '56349'),
         ('SC26100519000035', '57068', '전남 영광군 섬 지역',      35, 'ISLAND', NULL, 2, '57069'),
         ('SC26100519000036', '58760', '전남 목포시 섬 지역',      36, 'ISLAND', NULL, 2, '58762'),
         ('SC26100519000037', '58800', '전남 신안군',              37, 'ISLAND', NULL, 2, '58810'),
         ('SC26100519000038', '58816', '전남 신안군',              38, 'ISLAND', NULL, 2, '58818'),
         ('SC26100519000039', '58826', '전남 신안군',              39, 'ISLAND', NULL, 2, '58826'),
         ('SC26100519000040', '58828', '전남 신안군',              40, 'ISLAND', NULL, 2, '58866'),
         ('SC26100519000041', '58953', '전남 신안군',              41, 'ISLAND', NULL, 2, '58958'),
         ('SC26100519000042', '59102', '전남 완도군 섬 지역',      42, 'ISLAND', NULL, 2, '59103'),
         ('SC26100519000043', '59106', '전남 완도군 섬 지역',      43, 'ISLAND', NULL, 2, '59106'),
         ('SC26100519000044', '59127', '전남 완도군 섬 지역',      44, 'ISLAND', NULL, 2, '59127'),
         ('SC26100519000045', '59129', '전남 완도군 섬 지역',      45, 'ISLAND', NULL, 2, '59129'),
         ('SC26100519000046', '59137', '전남 완도군 섬 지역',      46, 'ISLAND', NULL, 2, '59166'),
         ('SC26100519000047', '59650', '전남 여수시 섬 지역',      47, 'ISLAND', NULL, 2, '59650'),
         ('SC26100519000048', '59766', '전남 여수시 섬 지역',      48, 'ISLAND', NULL, 2, '59766'),
         ('SC26100519000049', '59781', '전남 여수시 섬 지역',      49, 'ISLAND', NULL, 2, '59790')
       ) AS v(code_id, code_value, code_label, sort_ord, parent_cd, remark, lvl, opt1)
  JOIN shopjoy_2604.sy_code_grp g ON g.code_grp = 'OD_REMOTE_ZIP_CD'
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code c WHERE c.code_id = v.code_id OR (c.code_grp_id = g.code_grp_id AND c.code_value = v.code_value));

-- ── ② 배치 PM_SAVE_EXPIRE ─────────────────────────────────────────────────
INSERT INTO shopjoy_2604.sy_batch (batch_id, batch_code, batch_nm, batch_desc, cron_expr, batch_run_count, batch_status_cd, batch_timeout_sec, batch_memo, reg_by, reg_date, reg_site_id)
SELECT 'BT' || lpad((coalesce(max(nullif(regexp_replace(batch_id, '[^0-9]', '', 'g'), '')::bigint), 0) + 1)::text, 6, '0'),
       'PM_SAVE_EXPIRE', '[프로모션] 적립금 만료 소멸',
       '[프로모션] 유효기간이 지난 적립금을 만료가 빠른 것부터 사용한 기준(선입선출)으로 남은 금액만 소멸(원장 EXPIRE) + 만료 7일 전 회원 알림함(앱 푸시) 안내 — 사이트별 처리',
       '40 0 * * *', 0, 'ACTIVE', 600, '정책서 pm.04 §9 — 소멸 예정 안내 일수 sy_prop app.save.expire-notice-days(기본 7), 안내 문구 sy_template PM_SAVE_EXPIRE_NOTICE[_사이트ID]',
       'MIGRATION_20261005', CURRENT_TIMESTAMP, 'SI260001'
  FROM shopjoy_2604.sy_batch
HAVING NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_batch WHERE batch_code = 'PM_SAVE_EXPIRE');

-- ── ③ BO 메뉴: 고객센터 > 동네생활(MN000111) > 지역(동네) 관리 ─────────────────
INSERT INTO shopjoy_2604.sy_menu (menu_id, menu_code, menu_nm, parent_menu_id, menu_url, menu_type_cd, icon_class, sort_ord, use_yn, menu_remark, reg_by, reg_date, reg_site_id)
SELECT 'MN' || lpad((coalesce(max(nullif(regexp_replace(menu_id, '[^0-9]', '', 'g'), '')::bigint), 0) + 1)::text, 6, '0'),
       'CM_REGION', '지역(동네) 관리', 'MN000111', '#page=cmRegionMng', 'FOLDER', NULL, 4, 'Y', '사이트별 동네 목록·좌표(cm_region)', 'MIGRATION_20261005', CURRENT_TIMESTAMP, 'SI260001'
  FROM shopjoy_2604.sy_menu
HAVING NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_menu WHERE menu_code = 'CM_REGION')
   AND EXISTS (SELECT 1 FROM shopjoy_2604.sy_menu WHERE menu_id = 'MN000111');

INSERT INTO shopjoy_2604.sy_role_menu (role_menu_id, role_id, menu_id, perm_level, reg_by, reg_date, reg_site_id)
SELECT 'ROM261005' || lpad(((('x' || substr(md5(src.role_id || ':' || m.menu_id), 1, 8))::bit(32)::bigint) % 10000000000)::text, 10, '0'),
       src.role_id, m.menu_id, src.perm_level, 'MIGRATION_20261005', CURRENT_TIMESTAMP, 'SI260001'
  FROM shopjoy_2604.sy_role_menu src
  JOIN shopjoy_2604.sy_menu m ON m.menu_code = 'CM_REGION'
 WHERE src.menu_id = 'MN000112'   -- 동네 글 관리를 가진 역할에 같은 권한
   AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_role_menu x WHERE x.role_id = src.role_id AND x.menu_id = m.menu_id);

COMMIT;

-- ═══════════════════════════════════════════════════════════
--  (선택) 사이트별 적립금 소멸 안내 문구 — 없으면 기본 문구 "[사이트명] 적립금 소멸 예정 안내"
--   자리: {siteNm} {memberNm} {amt} {expireDate} {balanceAfter}
-- ═══════════════════════════════════════════════════════════
-- INSERT INTO shopjoy_2604.sy_template (template_id, template_type_cd, template_code, template_nm, template_subject, template_content, use_yn, reg_by, reg_date, reg_site_id)
-- VALUES ('TP2610051900000001', 'PUSH', 'PM_SAVE_EXPIRE_NOTICE_SI260003', '당무마켓1 적립금 소멸 안내', '[당무마켓] 동네 머니가 곧 사라져요',
--         '{memberNm}님, 당무 머니 {amt}원이 {expireDate}에 사라져요. 이웃 물건을 살 때 써 보세요!', 'Y', 'MIGRATION_20261005', CURRENT_TIMESTAMP, 'SI260003');

-- ═══════════════════════════════════════════════════════════
--  검증
-- ═══════════════════════════════════════════════════════════
-- SELECT c.code_level, count(*) FROM shopjoy_2604.sy_code c JOIN shopjoy_2604.sy_code_grp g ON g.code_grp_id = c.code_grp_id
--  WHERE g.code_grp = 'OD_REMOTE_ZIP_CD' GROUP BY 1 ORDER BY 1;                                   → 1단계 2, 2단계 30
-- SELECT batch_id, batch_code, cron_expr, batch_status_cd FROM shopjoy_2604.sy_batch WHERE batch_code = 'PM_SAVE_EXPIRE';   → 1행
-- SELECT menu_id, menu_nm, menu_url FROM shopjoy_2604.sy_menu WHERE menu_code = 'CM_REGION';                                 → 1행
--
-- ═══════════════════════════════════════════════════════════
--  롤백 (주석 해제 후 실행)
-- ═══════════════════════════════════════════════════════════
-- DELETE FROM shopjoy_2604.sy_role_menu WHERE reg_by = 'MIGRATION_20261005' AND menu_id IN (SELECT menu_id FROM shopjoy_2604.sy_menu WHERE menu_code = 'CM_REGION');
-- DELETE FROM shopjoy_2604.sy_menu      WHERE menu_code = 'CM_REGION' AND reg_by = 'MIGRATION_20261005';
-- DELETE FROM shopjoy_2604.sy_batch     WHERE batch_code = 'PM_SAVE_EXPIRE' AND reg_by = 'MIGRATION_20261005';
-- DELETE FROM shopjoy_2604.sy_code      WHERE code_id LIKE 'SC261005190000%' AND reg_by = 'MIGRATION_20261005';
-- DELETE FROM shopjoy_2604.sy_code_grp  WHERE code_grp_id = 'COG2610051900000001' AND reg_by = 'MIGRATION_20261005';
