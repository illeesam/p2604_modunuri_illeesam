-- ═══════════════════════════════════════════════════════════
--  BO API 권한 확인(HTTP 메서드 + URL) — sy_api 신설 · 공통코드 2그룹 · 설정 3키 · 메뉴 "API 권한관리"
--  작성일: 2026-10-05
--
--  배경:
--   메뉴 권한(sy_role_menu)은 BO 화면에서 메뉴를 숨길 뿐이라, 주소를 직접 부르면 권한 없는 기능도 실행됐다.
--   그래서 BO API 마다 "누가 쓸 수 있는가"를 sy_api 한 테이블에 적고 서버(ecBeBo common/perm ApiPermInterceptor)가 요청마다 판정한다.
--   3단계: ① 인증(JwtAuthFilter) → ② API 권한(이 테이블) → ③ 데이터 범위(SiteScope·BoSiteAccess).
--
--  ER: 테이블 1개 추가, 관계 1개(sy_api.menu_id → sy_menu). API ↔ 메뉴 다대다 매핑 테이블은 두지 않는다(사용자 원칙: ER 단순).
--      여러 화면이 같이 쓰는 조회 API 는 메뉴에 묶지 않고 권한 유형 LOGIN 으로, 쓰기 API 는 그 기능의 주인 메뉴 하나에 연결한다.
--
--  ① sy_api — API 권한 규칙(서버가 기동할 때 스프링 매핑에서 자동으로 모아 채운다. 이 파일은 빈 테이블만 만든다)
--        perm_type_cd  MENU(메뉴 권한 필요) / LOGIN(BO 로그인만) / ADMIN(플랫폼 관리자만) / PUBLIC(확인 안 함)   — 코드 API_PERM_TYPE_CD
--        need_perm_cd  READ / WRITE — 비우면 메서드로(GET·HEAD = READ, 나머지 = WRITE). 코드 그룹 없이 CHECK 제약
--        check_mode_cd INHERIT(전역 따름) / MONITOR / BLOCK / OFF — API 별 덮어쓰기                              — 코드 API_CHECK_MODE_CD
--        menu_id       MENU 일 때 연결 메뉴(없으면 "미분류")
--        처음 수집 분류(서버 ApiPermConst.initialPermType 과 같은 규칙):
--          /api/sch/jenkins/** = PUBLIC(Jenkins 토큰 호출)
--          /api/md/**(모듈 코바늘·소스젠 — BO 토큰 요청만 판정, FO 회원 화면은 대상 아님) · /api/sch/**(전역 배치 실행·등록·해제)
--          · /api/cache/** · /api/autoRest/** · /api/bo/zd/**(운영지원·시뮬레이션) · /api/bo/sy/api-perm/**
--          · /api/bo/sy/batch/** 의 쓰기(전역 배치 설정·실행 — 사이트 한정 사용자 불가) = ADMIN
--          · /api/base/**(내부 공통 레이어) 중 BO 화면이 부르지 않는 것 = ADMIN
--            BO 화면이 직접 부르는 /api/base 는 ADMIN 으로 두지 않는다(차단 모드에서 그 화면이 비관리자에게 막히지 않게) — 2026-10-05 ecFeBo 소스 전수: 1곳
--              POST /api/base/ec/od/order-item/save/{cmd} ← 주문 칸반(OdOrderKanban.js, 화면 odOrderKanban) — 연결 추정이 칸반 메뉴에 붙인다
--            (서버 ApiPermConst.SCREEN_BASE_APIS 와 같은 표. 화면이 /api/base 를 새로 부르면 둘 다 고친다)
--          나머지 = MENU·메뉴 연결 없음(미분류) → BO 화면 [연결 추정]으로 미리보고 골라 적용
--  ② 공통코드(전체 공통) API_PERM_TYPE_CD(4) · API_CHECK_MODE_CD(4)
--  ③ 설정(sy_prop, path app.bo) — app.bo.api-perm.mode = MONITOR(첫 배포: 통과시키고 막혔을 요청만 기록)
--                                 app.bo.api-perm.unmapped = ALLOW(차단 모드에서 미분류 API 통과)
--                                 app.bo.api-perm.admin-roles = SUPER_ADMIN,SYS_ADMIN,RL000001(플랫폼 관리자 역할 코드·ID)
--  ④ 메뉴 시스템 > 메뉴 > API 권한관리(#page=syApiPermMng) + 관리자 역할(SUPER_ADMIN 2·SYS_ADMIN 2·RL000001 3) 메뉴 권한
--  ⑤ 감시 기록 보존 — 새 테이블 없이 기존 syh_api_log(외부 API 로그, 지금 견본 15행뿐)에 api_type_cd = 'BO_API_PERM' 으로 5분 묶음 저장(서버가 쓴다, 이 파일은 손대지 않음)
--     나머지 BO 메뉴(정산·판매자·기획전 등 sy_menu 에 없는 화면)는 BO 화면 [메뉴 동기화](미리보기 → 적용)로 맞춘다 — 이 파일에서 넣지 않는다
--
--  sy_role_menu.perm_level 뜻(BO 역할관리 화면 SyRoleMng 기준, 2026-10-05 조회: 1=179행, 2=420행, 3=123행, 비어 있음=65행):
--     0 없음 / 1 읽기 → READ / 2 쓰기 → WRITE / 3 관리 → WRITE / 4 차단(어느 역할이든 차단이면 그 메뉴 권한 없음) / 비어 있음 → 읽기
--
--  사전 조회(2026-10-05, 읽기 전용): sy_api 없음 · sy_menu 65행(최대 MN000114) · 코드그룹 API_PERM_TYPE_CD·API_CHECK_MODE_CD 없음 ·
--     sy_prop app.bo.api-perm.* 없음 · sy_path app.bo 없음
--
--  사용법 (psql/DBeaver): 이 파일 전체를 실행한다. 다시 실행해도 안전하다
--     (테이블·인덱스 IF NOT EXISTS, 코드·설정·메뉴·역할 권한은 같은 것이 있으면 건너뜀, 분류 보정은 아직 손대지 않은 수집 행만).
--  순서: 상관없다. 새 백엔드는 테이블이 없으면 기능을 끈 채로 돌고, 이 파일 실행 뒤 5분 안에(또는 재기동 때) API 를 수집한다.
--        BO 시스템 > API 권한관리에서 [다시 수집]을 누르면 바로 수집한다. 첫 모드는 MONITOR 라 기존 화면은 막히지 않는다.
--
--  되돌리기(필요할 때만):
--     DELETE FROM shopjoy_2604.sy_role_menu WHERE reg_by = 'MIGRATION_20261005_APIPERM';
--     DELETE FROM shopjoy_2604.sy_menu      WHERE menu_code = 'SY_API_PERM' AND reg_by = 'MIGRATION_20261005_APIPERM';
--     DELETE FROM shopjoy_2604.sy_prop      WHERE prop_key LIKE 'app.bo.api-perm.%';
--     DELETE FROM shopjoy_2604.sy_path      WHERE path_id = 'app.bo' AND reg_by = 'MIGRATION_20261005_APIPERM';
--     DELETE FROM shopjoy_2604.sy_code      WHERE reg_by = 'MIGRATION_20261005_APIPERM';
--     DELETE FROM shopjoy_2604.sy_code_grp  WHERE reg_by = 'MIGRATION_20261005_APIPERM';
--     DROP TABLE IF EXISTS shopjoy_2604.sy_api;      -- 백엔드는 테이블이 없어지면 기능을 끈 채로 돈다(5분 안)
-- ═══════════════════════════════════════════════════════════

SET search_path TO shopjoy_2604;

-- ───────────────────────────────────────────────────────────
-- 1) sy_api — API 권한 규칙
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopjoy_2604.sy_api (
    api_id           VARCHAR(21)   NOT NULL,
    http_method      VARCHAR(10)   NOT NULL,
    url_pattern      VARCHAR(300)  NOT NULL,
    api_nm           VARCHAR(200),
    handler_nm       VARCHAR(300),
    api_grp          VARCHAR(100),
    perm_type_cd     VARCHAR(20)   NOT NULL DEFAULT 'MENU',
    need_perm_cd     VARCHAR(10),
    check_mode_cd    VARCHAR(20)   NOT NULL DEFAULT 'INHERIT',
    menu_id          VARCHAR(21),
    use_yn           VARCHAR(1)    NOT NULL DEFAULT 'Y',
    first_seen_date  TIMESTAMP,
    last_seen_date   TIMESTAMP,
    api_remark       VARCHAR(500),
    reg_by           VARCHAR(30),
    reg_date         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    reg_site_id      VARCHAR(21),
    upd_by           VARCHAR(30),
    upd_date         TIMESTAMP,
    CONSTRAINT sy_api_pk_api_id PRIMARY KEY (api_id),
    CONSTRAINT sy_api_uk_http_method_url_pattern UNIQUE (http_method, url_pattern),
    CONSTRAINT sy_api_ck_need_perm_cd CHECK (need_perm_cd IS NULL OR need_perm_cd IN ('READ', 'WRITE')),
    CONSTRAINT sy_api_fk_menu_id FOREIGN KEY (menu_id)
        REFERENCES shopjoy_2604.sy_menu (menu_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS sy_api_ix01_menu_id ON shopjoy_2604.sy_api (menu_id);
CREATE INDEX IF NOT EXISTS sy_api_ix02_api_grp ON shopjoy_2604.sy_api (api_grp);

COMMENT ON TABLE  shopjoy_2604.sy_api IS 'BO API 권한 규칙 — HTTP 메서드 + URL 패턴별로 누가 쓸 수 있는가(서버 기동 시 스프링 매핑에서 자동 수집). 관계는 menu_id → sy_menu 하나';
COMMENT ON COLUMN shopjoy_2604.sy_api.api_id          IS 'API ID (AP+YYMMDDhhmmss+순번5)';
COMMENT ON COLUMN shopjoy_2604.sy_api.http_method     IS 'HTTP 메서드 (GET/POST/PUT/PATCH/DELETE, 메서드 조건 없는 매핑은 ALL)';
COMMENT ON COLUMN shopjoy_2604.sy_api.url_pattern     IS 'URL 패턴 — 스프링 매핑 패턴 그대로 (예: /api/bo/ec/pd/prod/{prodId})';
COMMENT ON COLUMN shopjoy_2604.sy_api.api_nm          IS 'API 이름 (처음 수집 때 경로·동작으로 만들고, 관리 화면에서 고친 값은 다시 수집해도 그대로)';
COMMENT ON COLUMN shopjoy_2604.sy_api.handler_nm      IS '담당 핸들러 (컨트롤러#메서드, 수집 때 갱신)';
COMMENT ON COLUMN shopjoy_2604.sy_api.api_grp         IS '업무 묶음 — 경로 앞부분 (예: bo/ec/pd, bo/sy, base/ec/od, autoRest). 코드 아님';
COMMENT ON COLUMN shopjoy_2604.sy_api.perm_type_cd    IS '권한 유형 (코드: API_PERM_TYPE_CD — MENU 메뉴 권한 필요 / LOGIN BO 로그인만 / ADMIN 플랫폼 관리자만 / PUBLIC 확인 안 함)';
COMMENT ON COLUMN shopjoy_2604.sy_api.need_perm_cd    IS '필요 권한 READ/WRITE (CHECK — 코드 그룹 없음). 비면 메서드로: GET·HEAD = READ, 나머지 = WRITE';
COMMENT ON COLUMN shopjoy_2604.sy_api.check_mode_cd   IS '확인 모드 (코드: API_CHECK_MODE_CD — INHERIT 전역 설정 따름 / MONITOR 감시 / BLOCK 차단 / OFF 끔). 전역 OFF 면 전부 꺼짐';
COMMENT ON COLUMN shopjoy_2604.sy_api.menu_id         IS '연결 메뉴 (sy_menu.menu_id) — MENU 유형에서 이 메뉴의 READ/WRITE 권한 필요. 비면 미분류';
COMMENT ON COLUMN shopjoy_2604.sy_api.use_yn          IS '사용여부 — N 이면 판정에 쓰지 않음(미분류로 취급). 코드에서 사라진 API 도 지우지 않고 그대로 둔다';
COMMENT ON COLUMN shopjoy_2604.sy_api.first_seen_date IS '처음 수집된 일시';
COMMENT ON COLUMN shopjoy_2604.sy_api.last_seen_date  IS '마지막으로 수집된 일시 (서버 기동 때마다 갱신 — 오래됐으면 코드에서 사라진 API)';
COMMENT ON COLUMN shopjoy_2604.sy_api.api_remark      IS '비고';
COMMENT ON COLUMN shopjoy_2604.sy_api.reg_by          IS '등록자 (자동 수집 = SYSTEM_COLLECT)';
COMMENT ON COLUMN shopjoy_2604.sy_api.reg_date        IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.sy_api.reg_site_id     IS '등록 사이트ID (감사 필드 — API 권한은 사이트와 무관)';
COMMENT ON COLUMN shopjoy_2604.sy_api.upd_by          IS '수정자 (수집만 된 행 = SYSTEM_COLLECT, 관리자가 고치면 그 사용자)';
COMMENT ON COLUMN shopjoy_2604.sy_api.upd_date        IS '수정일시';

-- ───────────────────────────────────────────────────────────
-- 1-1) 처음 분류 보정 — 이 파일을 수집 뒤에 다시 실행한 경우(관리자가 아직 손대지 않은 수집 행만). 처음 실행 때는 0행
-- ───────────────────────────────────────────────────────────
UPDATE shopjoy_2604.sy_api SET perm_type_cd = 'PUBLIC', upd_date = CURRENT_TIMESTAMP
 WHERE upd_by = 'SYSTEM_COLLECT' AND perm_type_cd = 'MENU' AND menu_id IS NULL
   AND url_pattern LIKE '/api/sch/jenkins/%';
UPDATE shopjoy_2604.sy_api SET perm_type_cd = 'ADMIN', upd_date = CURRENT_TIMESTAMP
 WHERE upd_by = 'SYSTEM_COLLECT' AND perm_type_cd = 'MENU' AND menu_id IS NULL
   AND (   url_pattern LIKE '/api/md/%'
        OR (url_pattern LIKE '/api/sch/%' AND url_pattern NOT LIKE '/api/sch/jenkins/%')
        OR url_pattern LIKE '/api/cache/%'
        OR url_pattern LIKE '/api/autoRest/%'
        OR (url_pattern LIKE '/api/base/%'
            AND (http_method, url_pattern) NOT IN (('POST', '/api/base/ec/od/order-item/save/{cmd}')))   -- 화면이 부르는 /api/base 제외
        OR url_pattern LIKE '/api/bo/zd/%'
        OR url_pattern LIKE '/api/bo/sy/api-perm%'
        OR (url_pattern LIKE '/api/bo/sy/batch%' AND http_method NOT IN ('GET', 'HEAD')));
-- 예전 판(화면이 부르는 /api/base 까지 ADMIN)으로 이미 보정된 행을 되돌린다 — 관리자가 손대지 않은 수집 행만
UPDATE shopjoy_2604.sy_api SET perm_type_cd = 'MENU', upd_date = CURRENT_TIMESTAMP
 WHERE upd_by = 'SYSTEM_COLLECT' AND perm_type_cd = 'ADMIN' AND menu_id IS NULL
   AND (http_method, url_pattern) IN (('POST', '/api/base/ec/od/order-item/save/{cmd}'));

-- ───────────────────────────────────────────────────────────
-- 2) 공통코드 (전체 공통 — 적용 사이트 매핑 없음)
-- ───────────────────────────────────────────────────────────
INSERT INTO shopjoy_2604.sy_code_grp (code_grp_id, code_grp, grp_nm, path_id, code_grp_desc, use_yn, reg_by, reg_date, reg_site_id)
SELECT v.code_grp_id, v.code_grp, v.grp_nm, 'sy.api.perm', v.code_grp_desc, 'Y', 'MIGRATION_20261005_APIPERM', CURRENT_TIMESTAMP, 'SI260001'
  FROM (VALUES
         ('CG261005AP01', 'API_PERM_TYPE_CD',  'API 권한 유형', 'sy_api.perm_type_cd — 이 API 를 누가 쓸 수 있는가'),
         ('CG261005AP02', 'API_CHECK_MODE_CD', 'API 확인 모드', 'sy_api.check_mode_cd — 전역 설정(app.bo.api-perm.mode)을 따를지 API 별로 덮어쓸지')
       ) AS v(code_grp_id, code_grp, grp_nm, code_grp_desc)
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code_grp g WHERE g.code_grp = v.code_grp OR g.code_grp_id = v.code_grp_id);

INSERT INTO shopjoy_2604.sy_code (code_id, code_grp_id, code_value, code_label, sort_ord, use_yn, code_remark, code_level, reg_by, reg_date, reg_site_id)
SELECT 'CD261005AP' || v.sfx, g.code_grp_id, v.code_value, v.code_label, v.sort_ord, 'Y', v.code_remark, 1, 'MIGRATION_20261005_APIPERM', CURRENT_TIMESTAMP, 'SI260001'
  FROM (VALUES
         ('API_PERM_TYPE_CD',  '0101', 'MENU',    '메뉴 권한',       1, '연결 메뉴(sy_api.menu_id)의 READ/WRITE 권한이 있어야 한다. 메뉴 연결이 없으면 미분류'),
         ('API_PERM_TYPE_CD',  '0102', 'LOGIN',   '로그인만',        2, 'BO 로그인만 확인 — 여러 화면이 같이 쓰는 조회·선택 팝업·내 설정 등. 데이터 범위는 사이트 범위가 거른다'),
         ('API_PERM_TYPE_CD',  '0103', 'ADMIN',   '플랫폼 관리자',   3, '플랫폼 관리자 역할(app.bo.api-perm.admin-roles)만. 사이트 한정 사용자는 불가'),
         ('API_PERM_TYPE_CD',  '0104', 'PUBLIC',  '확인 안 함',      4, '권한 확인 없이 통과(예: Jenkins 토큰 호출)'),
         ('API_CHECK_MODE_CD', '0201', 'INHERIT', '전역 따름',       1, '전역 설정 app.bo.api-perm.mode 를 따른다'),
         ('API_CHECK_MODE_CD', '0202', 'MONITOR', '감시',            2, '통과시키고 막혔을 요청을 기록한다'),
         ('API_CHECK_MODE_CD', '0203', 'BLOCK',   '차단',            3, '권한이 없으면 403 + 한글 안내'),
         ('API_CHECK_MODE_CD', '0204', 'OFF',     '끔',              4, '이 API 는 확인하지 않는다')
       ) AS v(grp, sfx, code_value, code_label, sort_ord, code_remark)
  JOIN shopjoy_2604.sy_code_grp g ON g.code_grp = v.grp
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code c WHERE c.code_grp_id = g.code_grp_id AND c.code_value = v.code_value)
   AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code c WHERE c.code_id = 'CD261005AP' || v.sfx);

-- ───────────────────────────────────────────────────────────
-- 3) 설정 — 표시경로 app.bo + sy_prop 3키 (모든 프로파일 공통, 이미 있으면 그대로)
-- ───────────────────────────────────────────────────────────
INSERT INTO shopjoy_2604.sy_path (path_id, biz_cd, parent_path_id, path_label, sort_ord, use_yn, path_remark, reg_by, reg_date, reg_site_id)
SELECT 'app.bo', 'sy_prop', 'app', 'bo', 20, 'Y', 'BO 설정(API 권한 등)', 'MIGRATION_20261005_APIPERM', CURRENT_TIMESTAMP, 'SI260001'
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_path p WHERE p.path_id = 'app.bo');

INSERT INTO shopjoy_2604.sy_prop (prop_id, path_id, prop_key, prop_value, prop_label, prop_type_cd, sort_ord, use_yn, prop_remark, prop_profile, reg_by, reg_date, reg_site_id)
SELECT v.prop_id, 'app.bo', v.prop_key, v.prop_value, v.prop_label, 'STRING', v.sort_ord, 'Y', v.prop_remark, NULL, 'MIGRATION_20261005_APIPERM', CURRENT_TIMESTAMP, 'SI260001'
  FROM (VALUES
         ('PR261005AP01', 'app.bo.api-perm.mode',        'MONITOR',                       'BO API 권한 확인 모드',          1,
          'MONITOR=감시(통과+기록) / BLOCK=차단(403) / OFF=끔(비상 스위치, API 별 설정도 무시) — 첫 배포는 MONITOR. BO 시스템 > API 권한관리에서 바꾼다'),
         ('PR261005AP02', 'app.bo.api-perm.unmapped',    'ALLOW',                         'BO API 권한 미분류 처리',        2,
          '차단 모드에서 등록 안 됨·메뉴 연결 없는 API: ALLOW=통과(기록만) / DENY=거부'),
         ('PR261005AP03', 'app.bo.api-perm.admin-roles', 'SUPER_ADMIN,SYS_ADMIN,RL000001', 'BO API 권한 플랫폼 관리자 역할', 3,
          '역할 코드 또는 역할 ID(쉼표) — 이 역할 사용자(사이트 한정 아님)는 모든 BO API 통과, API 권한관리 화면 사용. RL000001 은 sy_role 행 없이 쓰이는 슈퍼관리자 묶음 ID')
       ) AS v(prop_id, prop_key, prop_value, prop_label, sort_ord, prop_remark)
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_prop p WHERE p.prop_key = v.prop_key)
   AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_prop p WHERE p.prop_id = v.prop_id);

-- ───────────────────────────────────────────────────────────
-- 4) 메뉴 — 시스템 > 메뉴(MN000091) > API 권한관리. 형식은 기존 행과 같다(menu_type_cd FOLDER, menu_url #page=<화면ID>)
--    ※ BO 의 실제 좌측 메뉴는 ecFeBo lib/app/boAppMenuData.js — sy_menu 는 메뉴관리·역할관리·API 권한의 기준 데이터.
--    메뉴ID 는 MN000115, 이미 다른 메뉴가 쓰고 있으면 가장 큰 번호 + 1.
--    BO 화면 [메뉴 동기화]를 먼저 적용했으면 같은 화면(#page=syApiPermMng)의 행이 이미 있으므로 만들지 않는다(동기화도 코드 SY_API_PERM 을 쓴다).
-- ───────────────────────────────────────────────────────────
INSERT INTO shopjoy_2604.sy_menu (menu_id, menu_code, menu_nm, parent_menu_id, menu_url, menu_type_cd, icon_class, sort_ord, use_yn, menu_remark, reg_by, reg_date, reg_site_id)
SELECT CASE WHEN EXISTS (SELECT 1 FROM shopjoy_2604.sy_menu WHERE menu_id = 'MN000115')
            THEN 'MN' || lpad(((SELECT max(substr(menu_id, 3)::int) FROM shopjoy_2604.sy_menu WHERE menu_id ~ '^MN[0-9]{6}$') + 1)::text, 6, '0')
            ELSE 'MN000115' END,
       'SY_API_PERM', 'API 권한관리', 'MN000091', '#page=syApiPermMng', 'FOLDER', NULL, 3, 'Y',
       'BO API(HTTP 메서드+URL) 권한 — 플랫폼 관리자 전용', 'MIGRATION_20261005_APIPERM', CURRENT_TIMESTAMP, 'SI260001'
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_menu m WHERE m.menu_code = 'SY_API_PERM' OR m.menu_url = '#page=syApiPermMng');

INSERT INTO shopjoy_2604.sy_role_menu (role_menu_id, role_id, menu_id, perm_level, reg_by, reg_date, reg_site_id)
SELECT 'ROM261005AP' || v.sfx, v.role_id, m.menu_id, v.perm_level, 'MIGRATION_20261005_APIPERM', CURRENT_TIMESTAMP, 'SI260001'
  FROM (VALUES ('01', 'ROLE000000000001', 2), ('02', 'RL000002', 2), ('03', 'RL000001', 3)) AS v(sfx, role_id, perm_level)
  JOIN shopjoy_2604.sy_menu m ON m.menu_id = (SELECT min(x.menu_id) FROM shopjoy_2604.sy_menu x WHERE x.menu_code = 'SY_API_PERM' OR x.menu_url = '#page=syApiPermMng')
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_role_menu x WHERE x.role_id = v.role_id AND x.menu_id = m.menu_id)
   AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_role_menu x WHERE x.role_menu_id = 'ROM261005AP' || v.sfx);

-- ═══════════════════════════════════════════════════════════
--  검증
-- ═══════════════════════════════════════════════════════════
-- SELECT to_regclass('shopjoy_2604.sy_api');                                                        → sy_api
-- SELECT g.code_grp, count(c.code_id) FROM shopjoy_2604.sy_code_grp g LEFT JOIN shopjoy_2604.sy_code c ON c.code_grp_id = g.code_grp_id
--  WHERE g.code_grp IN ('API_PERM_TYPE_CD', 'API_CHECK_MODE_CD') GROUP BY 1 ORDER BY 1;                → 각 4
-- SELECT prop_key, prop_value FROM shopjoy_2604.sy_prop WHERE prop_key LIKE 'app.bo.api-perm.%' ORDER BY 1;  → 3행 (mode = MONITOR)
-- SELECT menu_id, menu_nm, menu_url FROM shopjoy_2604.sy_menu WHERE menu_code = 'SY_API_PERM';         → 1행
-- (백엔드 수집 뒤) SELECT perm_type_cd, count(*), count(*) FILTER (WHERE menu_id IS NULL AND perm_type_cd = 'MENU') AS unmapped
--                  FROM shopjoy_2604.sy_api GROUP BY 1 ORDER BY 1;
