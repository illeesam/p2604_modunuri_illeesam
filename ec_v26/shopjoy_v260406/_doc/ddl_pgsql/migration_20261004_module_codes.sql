-- ═══════════════════════════════════════════════════════════
--  멀티테넌트 데이터 정비 — 모듈별 코드 정리 (공통코드 그룹에 "모듈 한정" 표시 + 모듈 전용 코드 등록)
--  작성일: 2026-10-04
--
--  배경:
--   FO 모듈(ec1/ec2/danmoo1/homepg1/datavisual1/bbm1)마다 화면에 박혀 있던 선택지(거래방법·알바/부동산 분류·문의 종류 등)를
--   공통코드(sy_code_grp / sy_code)로 옮긴다. 공통코드는 지금까지 전 사이트 공용(226개 그룹, 전부 reg_site_id = SI260001)이라
--   "이 그룹은 어느 모듈 전용인가"를 알 길이 없었다.
--
--   ① sy_code_grp.module_cd (새 컬럼, NULL 허용)
--        NULL  = 공통(전 모듈이 같이 쓴다) — 기존 226개 그룹은 전부 NULL 그대로.
--        값    = 그 모듈 전용(공통코드 그룹 MODULE_CD 의 코드값 = sy_site 의 모듈 값과 같다: danmoo1, homepg1 …).
--        분류·관리용 표시다 — 코드 조회 API(/api/co/sy/code/groups?codeGrps=…)는 그룹 이름으로 읽으므로 이 컬럼이 없어도/있어도 동작이 같다.
--        (reg_site_id 는 등록자 같은 감사 필드라 "어느 사이트/모듈 것인지" 조건으로 쓰지 않는다 — 정책 sy.57 §12)
--   ② 모듈 전용 코드 그룹 5개 + 코드 23개 (값이 분명한 것만)
--        danmoo1 : TRADE_METHOD_CD(거래방법 — pd_prod.trade_method_cds 에 콤마로 저장되는 값), DM_JOB_TYPE(알바 분류), DM_REALTY_TYPE(부동산 매물 유형)
--        homepg1 : HP_CONTACT_SERVICE(고객센터 "관심 서비스"), HP_CONTACT_CATEGORY(문의 종류 — sy_contact.category_cd 에 라벨로 저장되는 값)
--        이름 규칙: DB 컬럼과 짝인 코드는 컬럼 이름 그대로(TRADE_METHOD_CD), 화면 전용 분류는 모듈 약어 접두어(DM_ = danmoo1, HP_ = homepg1).
--        code_grp 는 전체에서 유일(UNIQUE)이므로 모듈이 달라도 같은 이름을 다시 쓸 수 없다.
--
--  ID 대역: 코드그룹 CG261004200001~05, 코드 CD261004200001~23
--           (2026-10-04 조회: DB 에 CG261004%·CD261004% 없음. 같은 날 대기 중인 chatt_trade 는 …000010~, cm_meet 는 …07xxxx 대역이라 겹치지 않는다)
-- ═══════════════════════════════════════════════════════════
--  사용법 (psql/DBeaver): 아래 스크립트 실행.
--   재실행해도 안전 — 컬럼은 IF NOT EXISTS, 그룹은 code_grp 가 이미 있으면 건너뛰고(있는 그룹을 그대로 재사용),
--   코드는 그 그룹에 같은 code_value 가 있거나 code_id 가 이미 쓰였으면 건너뛴다. 기존 행의 라벨·순서는 고치지 않는다.
--  순서: 이 스크립트(DDL) → 백엔드(SyCodeGrp 엔티티에 moduleCd 추가) 배포. 반대로 하면 엔티티가 없는 컬럼을 읽어 코드그룹 조회가 실패한다.
--        (엔티티를 고치지 않은 지금 백엔드는 이 컬럼이 생겨도 영향 없음)
-- ═══════════════════════════════════════════════════════════

SET search_path TO shopjoy_2604;

-- ───────────────────────────────────────────────────────────
-- 1) sy_code_grp.module_cd — 모듈 한정 표시 (NULL = 공통)
-- ───────────────────────────────────────────────────────────
ALTER TABLE shopjoy_2604.sy_code_grp ADD COLUMN IF NOT EXISTS module_cd VARCHAR(20);
COMMENT ON COLUMN shopjoy_2604.sy_code_grp.module_cd IS '이 코드그룹을 쓰는 FO 모듈 (코드: MODULE_CD — ec1/ec2/danmoo1/homepg1/datavisual1/bbm1). NULL=공통(전 모듈 공용)';

-- ───────────────────────────────────────────────────────────
-- 2) 코드 그룹 5개 (같은 code_grp 가 이미 있으면 건너뜀 — 그 그룹을 재사용)
-- ───────────────────────────────────────────────────────────
INSERT INTO shopjoy_2604.sy_code_grp (code_grp_id, code_grp, grp_nm, path_id, code_grp_desc, use_yn, reg_by, reg_date, reg_site_id)
SELECT v.code_grp_id, v.code_grp, v.grp_nm, v.path_id, v.code_grp_desc, 'Y', 'MIGRATION_20261004', NOW(), 'SI260001'
  FROM (VALUES
        ('CG261004200001', 'TRADE_METHOD_CD',     '거래방법',           'danmoo1.trade',        '개인간 거래 방법 — pd_prod.trade_method_cds 에 콤마로 저장 (DIRECT/DOOR/PARCEL). danmoo1 전용'),
        ('CG261004200002', 'DM_JOB_TYPE',         '알바분류',           'danmoo1.job',          '알바 화면 분류 칩. danmoo1 전용 (알바 데이터는 아직 화면 예시 값)'),
        ('CG261004200003', 'DM_REALTY_TYPE',      '부동산매물유형',     'danmoo1.realty',       '부동산 매물 유형. danmoo1 전용 (매물 데이터는 아직 화면 예시 값)'),
        ('CG261004200004', 'HP_CONTACT_SERVICE',  '관심서비스',         'homepg1.contact.svc',  '고객센터 문의 양식의 관심 서비스. homepg1 전용 (선택한 라벨이 문의 내용에 들어간다)'),
        ('CG261004200005', 'HP_CONTACT_CATEGORY', '문의종류(홈페이지)', 'homepg1.contact.cate', '홈페이지 문의·주문 접수 종류 — sy_contact.category_cd 에 라벨로 저장. homepg1 전용')
       ) AS v(code_grp_id, code_grp, grp_nm, path_id, code_grp_desc)
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code_grp x WHERE x.code_grp = v.code_grp)
   AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code_grp y WHERE y.code_grp_id = v.code_grp_id);

-- 모듈 표시 — 이미 값이 있으면 건드리지 않는다
UPDATE shopjoy_2604.sy_code_grp
   SET module_cd = 'danmoo1', upd_by = 'MIGRATION_20261004', upd_date = NOW()
 WHERE code_grp IN ('TRADE_METHOD_CD', 'DM_JOB_TYPE', 'DM_REALTY_TYPE') AND module_cd IS NULL;

UPDATE shopjoy_2604.sy_code_grp
   SET module_cd = 'homepg1', upd_by = 'MIGRATION_20261004', upd_date = NOW()
 WHERE code_grp IN ('HP_CONTACT_SERVICE', 'HP_CONTACT_CATEGORY') AND module_cd IS NULL;

-- ───────────────────────────────────────────────────────────
-- 3) 코드 23개 (그 그룹에 같은 code_value 가 있거나 code_id 가 이미 쓰였으면 건너뜀)
--    FO 원본: C:\_pjt_github\illeesam-shopjoy\ecFeFoNuxt4\app\conts\tenant\danmoo1.ts · homepg1.ts
-- ───────────────────────────────────────────────────────────
INSERT INTO shopjoy_2604.sy_code (code_id, code_value, code_label, sort_ord, use_yn, code_remark, code_level, code_grp_id, reg_by, reg_date, reg_site_id)
SELECT v.code_id, v.code_value, v.code_label, v.sort_ord, 'Y', v.code_remark, 1, g.code_grp_id, 'MIGRATION_20261004', NOW(), g.reg_site_id
  FROM (VALUES
        -- danmoo1 거래방법 (서버 FoPdProdWriteService.TRADE_METHODS 와 같은 값·순서)
        ('CD261004200001', 'TRADE_METHOD_CD',     'DIRECT',           '직거래',          1, '만나서 주고받아요'),
        ('CD261004200002', 'TRADE_METHOD_CD',     'DOOR',             '문고리거래',      2, '문 앞에 두고 비대면으로 주고받아요'),
        ('CD261004200003', 'TRADE_METHOD_CD',     'PARCEL',           '택배거래',        3, '택배로 보내요'),
        -- danmoo1 알바 분류 (DM_JOB_SHORTCUTS)
        ('CD261004200004', 'DM_JOB_TYPE',         'NEIGHBOR',         '이웃알바',        1, NULL),
        ('CD261004200005', 'DM_JOB_TYPE',         'WALK_10MIN',       '걸어서 10분',     2, NULL),
        ('CD261004200006', 'DM_JOB_TYPE',         'SHORT_TERM',       '단기알바',        3, NULL),
        ('CD261004200007', 'DM_JOB_TYPE',         'FOOD_CAFE',        '식당/카페',       4, NULL),
        ('CD261004200008', 'DM_JOB_TYPE',         'LOGISTICS',        '물류/현장',       5, NULL),
        ('CD261004200009', 'DM_JOB_TYPE',         'LESSON',           '레슨/과외',       6, NULL),
        -- danmoo1 부동산 매물 유형 (DM_REALTY_TYPES 중 매물 유형만 — 관심·살아본후기·실거래가·청약·전체 는 화면 메뉴라 코드가 아니다)
        ('CD261004200010', 'DM_REALTY_TYPE',      'APT',              '아파트',          1, NULL),
        ('CD261004200011', 'DM_REALTY_TYPE',      'ONE_ROOM',         '원룸',            2, NULL),
        ('CD261004200012', 'DM_REALTY_TYPE',      'TWO_ROOM_PLUS',    '투룸+',           3, NULL),
        ('CD261004200013', 'DM_REALTY_TYPE',      'OFFICETEL',        '오피스텔',        4, NULL),
        ('CD261004200014', 'DM_REALTY_TYPE',      'STORE',            '상가',            5, NULL),
        -- homepg1 관심 서비스 (HP_CONTACT_SERVICES)
        ('CD261004200015', 'HP_CONTACT_SERVICE',  'AI_VIBE',          'AI 바이브',       1, NULL),
        ('CD261004200016', 'HP_CONTACT_SERVICE',  'HOMEPAGE_CMS',     '홈페이지 & CMS',  2, NULL),
        ('CD261004200017', 'HP_CONTACT_SERVICE',  'ECOMMERCE',        '이커머스 플랫폼', 3, NULL),
        ('CD261004200018', 'HP_CONTACT_SERVICE',  'MOBILE_APP',       '모바일 앱 개발',  4, NULL),
        ('CD261004200019', 'HP_CONTACT_SERVICE',  'SECURITY',         '보안 솔루션',     5, NULL),
        ('CD261004200020', 'HP_CONTACT_SERVICE',  'CLOUD',            '클라우드 인프라', 6, NULL),
        ('CD261004200021', 'HP_CONTACT_SERVICE',  'ETC',              '기타·복합 문의',  7, NULL),
        -- homepg1 문의 종류 (HP_INQUIRY_CONSULT / HP_INQUIRY_ORDER — sy_contact.category_cd 에는 지금 라벨이 저장된다)
        ('CD261004200022', 'HP_CONTACT_CATEGORY', 'SOLUTION_CONSULT', '솔루션 상담',     1, '고객센터 문의 접수'),
        ('CD261004200023', 'HP_CONTACT_CATEGORY', 'SOLUTION_ORDER',   '솔루션 주문',     2, '주문하기 접수')
       ) AS v(code_id, code_grp, code_value, code_label, sort_ord, code_remark)
  JOIN shopjoy_2604.sy_code_grp g ON g.code_grp = v.code_grp
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code x WHERE x.code_grp_id = g.code_grp_id AND x.code_value = v.code_value)
   AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code y WHERE y.code_id = v.code_id);

-- ═══════════════════════════════════════════════════════════
--  검증
-- ═══════════════════════════════════════════════════════════
-- SELECT column_name, data_type, character_maximum_length FROM information_schema.columns
--  WHERE table_schema = 'shopjoy_2604' AND table_name = 'sy_code_grp' AND column_name = 'module_cd';          → varchar 20
-- SELECT g.module_cd, g.code_grp, g.grp_nm, count(c.code_id) AS codes
--   FROM shopjoy_2604.sy_code_grp g LEFT JOIN shopjoy_2604.sy_code c ON c.code_grp_id = g.code_grp_id
--  WHERE g.module_cd IS NOT NULL GROUP BY 1, 2, 3 ORDER BY 1, 2;
--   → danmoo1 DM_JOB_TYPE 6 / danmoo1 DM_REALTY_TYPE 5 / danmoo1 TRADE_METHOD_CD 3 / homepg1 HP_CONTACT_CATEGORY 2 / homepg1 HP_CONTACT_SERVICE 7
-- SELECT count(*) FROM shopjoy_2604.sy_code_grp WHERE module_cd IS NULL;                                       → 기존 그룹 수(226 + 같은 날 다른 마이그레이션이 더한 그룹)
--
--  백엔드 코드 캐시: 코드는 Redis(sy:code:*)에 최대 1시간 남는다 — 바로 보이게 하려면 BO 캐시 새로고침(또는 재기동).
--
--  되돌리기(필요할 때만):
--   DELETE FROM shopjoy_2604.sy_code     WHERE code_id     BETWEEN 'CD261004200001' AND 'CD261004200023' AND reg_by = 'MIGRATION_20261004';
--   DELETE FROM shopjoy_2604.sy_code_grp WHERE code_grp_id BETWEEN 'CG261004200001' AND 'CG261004200005' AND reg_by = 'MIGRATION_20261004';
--   ALTER TABLE shopjoy_2604.sy_code_grp DROP COLUMN IF EXISTS module_cd;   -- 백엔드 엔티티에서 moduleCd 를 먼저 뺀 뒤에
