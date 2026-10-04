-- ═══════════════════════════════════════════════════════════
--  공통코드 "적용 사이트 매핑" 개편 — 1단계 (테이블 신설·이전·유일 조건·경로 정리·opt1 설명 컬럼)
--  작성일: 2026-10-05
--
--  배경:
--   지금까지 공통코드 그룹(sy_code_grp)이 "어느 사이트 것인가"는 module_cd 한 칸(모듈 1개)으로만 표시했다.
--   사이트:모듈이 1:1 이라 지금은 통하지만, 한 그룹을 여러 사이트가 같이 쓰거나(공용) 사이트마다 같은 이름의 그룹을
--   따로 두는(사이트 전용 값) 경우를 담을 수 없다. 그래서 그룹 ↔ 사이트 매핑 테이블을 둔다.
--
--   ① sy_code_grp_site (신규) — 코드그룹 적용 사이트 매핑
--        매핑 행 없음 = 전체 공통 / 1개 = 그 사이트 전용 / 여러 개 = 여러 사이트 공용.
--        기존 sy_code_grp.module_cd 값은 sy_site.module_cd 로 조인해 매핑으로 옮긴다(danmoo1 → SI260003, homepg1 → SI260004).
--        module_cd 컬럼은 이번에는 남겨 둔다(옛 백엔드 호환) — 삭제는 2단계 파일.
--        reg_site_id 는 다른 테이블과 같은 감사 필드일 뿐이다(사이트 조건은 site_id 로만 — 정책 sy.57 §12).
--   ② 그룹명(code_grp) 유일 조건 변경
--        전체 유일(UNIQUE) 인덱스를 없애고 조회용 일반 인덱스로 바꾼다. 규칙은 서버(SyCodeGrpService)가 검증한다:
--          (가) 전체 공통 그룹끼리 같은 이름 금지  (나) 한 사이트에 같은 이름의 그룹이 둘 이상 매핑되는 것 금지.
--        → 사이트 전용 그룹은 전체 공통과 같은 이름을 쓸 수 있다(그 사이트에서는 전용 그룹이 먼저 읽힌다).
--   ③ 코드값 유일 조건 추가 — UNIQUE (code_grp_id, code_value). (2026-10-05 조회: 중복 0건)
--   ④ sy_code_grp.code_opt1_desc (신규 컬럼) — 그 그룹에서 코드의 추가값(code_opt1)이 무엇을 뜻하는지 설명.
--   ⑤ 표시경로(path_id) 정리 — 값만 고친다(그룹명은 바꾸지 않는다)
--        promotion.* 14개 → promo.* 로 통일. 이유: path_id 가 21자라 promotion. 접두어는 뒤가 잘린다(promotion.event.statu),
--        이미 promo.* 가 17개로 더 많고, 메뉴·다른 테이블(sy_prop: app/biz/spring)에는 이 낱말을 키로 쓰는 곳이 없다.
--        잘려 있던 꼬리(statu·targ·appl)도 같이 바로잡는다. 빈 값 33개는 그룹 성격에 맞는 경로로 채운다.
--   ⑥ 전이 코드값(child_code_values) → 부모 코드값(parent_code_value) 방식
--        쓰는 곳은 MEET_STATUS_CD 3건뿐. "이 상태에서 갈 수 있는 다음 상태" 목록을
--        "이 상태로 올 수 있는 이전 상태" 목록(^A^B^ 형식 — CLAIM_STATUS 가 쓰는 방식과 같다)으로 뒤집어 parent_code_value 에 넣는다.
--        child_code_values 컬럼 삭제는 2단계 파일.
--   ⑦ 뷰 vw_sy_code — 같은 이름의 그룹이 여럿이면 대표 그룹 하나만 보이게
--        목록 쿼리 60여 곳이 이 뷰를 (code_grp, code_value) 로 조인해 코드 라벨을 붙인다. 이름이 같은 그룹이 둘이면 행이 두 배가 되므로
--        이름마다 그룹 하나만 남긴다: 전체 공통 그룹 우선, 없으면 code_grp_id 가 가장 작은 그룹.
--        (목록의 코드 라벨은 사이트를 가리지 않는 대표 값이다 — 사이트별 값은 코드 조회 API 가 내려준다)
--
--  사전 조회 결과(2026-10-05, 읽기 전용):
--     sy_code_grp 268개 / sy_code 1,470개 / module_cd 있는 그룹 27개(danmoo1 25, homepg1 2) → 매핑 27행 생성 예정
--     같은 그룹 안 코드값 중복 0건 / 그룹명 중복 0건 / sy_code_grp_site 테이블 없음 / 그룹 없는 코드 0건
--     path_id: promotion.* 14개, 빈 값 33개 → 47개 UPDATE 예정 (모두 21자 이내)
--     매핑 ID: COGS2610050000 + 4자리 순번 = 18자 (컬럼 21자)
--
--  사용법 (psql/DBeaver): 이 파일 전체를 실행한다. 다시 실행해도 안전하다
--     (테이블·컬럼·인덱스는 IF NOT EXISTS, 매핑은 같은 (그룹, 사이트) 가 있으면 건너뜀, 값 UPDATE 는 옛 값일 때만).
--  순서: 이 스크립트(1단계) → 백엔드·BO·FO 배포 → 당무마켓 코드 시드 → (안정 확인 뒤) 2단계 파일.
--        새 백엔드는 sy_code_grp_site 를 읽으므로 이 스크립트보다 먼저 배포하면 코드 조회가 실패한다.
--        지금 돌고 있는 옛 백엔드는 이 스크립트를 실행해도 영향이 없다(없던 테이블·컬럼, 값 정리뿐. module_cd 그대로).
--
--  되돌리기(필요할 때만, 새 백엔드를 옛 버전으로 내린 뒤):
--     DROP TABLE IF EXISTS shopjoy_2604.sy_code_grp_site;
--     ALTER TABLE shopjoy_2604.sy_code DROP CONSTRAINT IF EXISTS sy_code_uk_code_grp_id_code_value;
--     DROP INDEX IF EXISTS shopjoy_2604.sy_code_grp_ix01_code_grp;
--     ALTER TABLE shopjoy_2604.sy_code_grp ADD CONSTRAINT sy_code_grp_uk_code_grp UNIQUE (code_grp);   -- 같은 이름 그룹을 만들었다면 먼저 정리
--     ALTER TABLE shopjoy_2604.sy_code_grp DROP COLUMN IF EXISTS code_opt1_desc;
--     UPDATE shopjoy_2604.sy_code c SET parent_code_value = NULL FROM shopjoy_2604.sy_code_grp g
--      WHERE g.code_grp_id = c.code_grp_id AND g.code_grp = 'MEET_STATUS_CD' AND c.upd_by = 'MIGRATION_20261005';
--     path_id 는 upd_by = 'MIGRATION_20261005' 인 그룹이 대상이다(옛 값은 이 파일 5) 의 주석 참고). 뷰는 맨 아래 "옛 뷰" 주석대로.
-- ═══════════════════════════════════════════════════════════

SET search_path TO shopjoy_2604;

-- ───────────────────────────────────────────────────────────
-- 0) 사전 확인 — 조건이 깨져 있으면 아무것도 바꾸지 않고 멈춘다
-- ───────────────────────────────────────────────────────────
DO $$
DECLARE
    v_dup INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_dup
      FROM (SELECT code_grp_id, code_value FROM shopjoy_2604.sy_code GROUP BY code_grp_id, code_value HAVING COUNT(*) > 1) d;
    IF v_dup > 0 THEN
        RAISE EXCEPTION '같은 그룹 안에 코드값이 겹치는 것이 %건 있습니다. 먼저 정리한 뒤 다시 실행하세요.', v_dup;
    END IF;
END $$;

-- ───────────────────────────────────────────────────────────
-- 1) sy_code_grp_site — 코드그룹 적용 사이트 매핑
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopjoy_2604.sy_code_grp_site (
    code_grp_site_id  VARCHAR(21)  NOT NULL,
    code_grp_id       VARCHAR(21)  NOT NULL,
    site_id           VARCHAR(21)  NOT NULL,
    reg_by            VARCHAR(30),
    reg_date          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    reg_site_id       VARCHAR(21),
    upd_by            VARCHAR(30),
    upd_date          TIMESTAMP,
    CONSTRAINT sy_code_grp_site_pk_code_grp_site_id PRIMARY KEY (code_grp_site_id),
    CONSTRAINT sy_code_grp_site_uk_code_grp_id_site_id UNIQUE (code_grp_id, site_id),
    CONSTRAINT sy_code_grp_site_fk_code_grp_id FOREIGN KEY (code_grp_id)
        REFERENCES shopjoy_2604.sy_code_grp (code_grp_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS sy_code_grp_site_ix01_site_id ON shopjoy_2604.sy_code_grp_site (site_id);

COMMENT ON TABLE  shopjoy_2604.sy_code_grp_site IS '공통코드 그룹 적용 사이트 매핑 — 행 없음=전체 공통, 1개=그 사이트 전용, 여러 개=여러 사이트 공용';
COMMENT ON COLUMN shopjoy_2604.sy_code_grp_site.code_grp_site_id IS '코드그룹 사이트 매핑ID (COGS+YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.sy_code_grp_site.code_grp_id      IS '코드그룹ID (sy_code_grp.code_grp_id)';
COMMENT ON COLUMN shopjoy_2604.sy_code_grp_site.site_id          IS '적용 사이트ID (sy_site.site_id) — 이 그룹을 쓰는 사이트';
COMMENT ON COLUMN shopjoy_2604.sy_code_grp_site.reg_by           IS '등록자';
COMMENT ON COLUMN shopjoy_2604.sy_code_grp_site.reg_date         IS '등록일';
COMMENT ON COLUMN shopjoy_2604.sy_code_grp_site.reg_site_id      IS '등록 사이트ID (감사 필드 — 적용 사이트는 site_id)';
COMMENT ON COLUMN shopjoy_2604.sy_code_grp_site.upd_by           IS '수정자';
COMMENT ON COLUMN shopjoy_2604.sy_code_grp_site.upd_date         IS '수정일';

-- ───────────────────────────────────────────────────────────
-- 2) module_cd → 매핑 이전 (sy_site.module_cd 로 조인. 예상 27행: danmoo1 25 → SI260003, homepg1 2 → SI260004)
--    같은 (그룹, 사이트) 매핑이 이미 있으면 건너뛴다. module_cd 값은 그대로 둔다.
-- ───────────────────────────────────────────────────────────
INSERT INTO shopjoy_2604.sy_code_grp_site (code_grp_site_id, code_grp_id, site_id, reg_by, reg_date, reg_site_id)
SELECT 'COGS2610050000'
       || LPAD(((SELECT COUNT(*) FROM shopjoy_2604.sy_code_grp_site)
                + ROW_NUMBER() OVER (ORDER BY g.code_grp_id, s.site_id))::TEXT, 4, '0'),
       g.code_grp_id, s.site_id, 'MIGRATION_20261005', NOW(), g.reg_site_id
  FROM shopjoy_2604.sy_code_grp g
  JOIN shopjoy_2604.sy_site s ON s.module_cd = g.module_cd
 WHERE COALESCE(g.module_cd, '') <> ''
   AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code_grp_site m
                    WHERE m.code_grp_id = g.code_grp_id AND m.site_id = s.site_id);

-- ───────────────────────────────────────────────────────────
-- 3) 그룹명 유일 조건 변경 — 전체 유일 제거, 조회용 인덱스로
-- ───────────────────────────────────────────────────────────
ALTER TABLE shopjoy_2604.sy_code_grp DROP CONSTRAINT IF EXISTS sy_code_grp_uk_code_grp;
DROP INDEX IF EXISTS shopjoy_2604.sy_code_grp_uk_code_grp;
CREATE INDEX IF NOT EXISTS sy_code_grp_ix01_code_grp ON shopjoy_2604.sy_code_grp (code_grp);
COMMENT ON COLUMN shopjoy_2604.sy_code_grp.code_grp IS '코드그룹코드 (예: MEMBER_GRADE). 전체 공통 그룹끼리, 그리고 한 사이트에 매핑된 그룹끼리 유일(서버 검증) — 사이트 전용 그룹은 전체 공통과 같은 이름 가능';

-- ───────────────────────────────────────────────────────────
-- 4) 코드값 유일 조건 — 같은 그룹 안에서 code_value 유일
-- ───────────────────────────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint
                    WHERE conname = 'sy_code_uk_code_grp_id_code_value'
                      AND conrelid = 'shopjoy_2604.sy_code'::regclass) THEN
        ALTER TABLE shopjoy_2604.sy_code
            ADD CONSTRAINT sy_code_uk_code_grp_id_code_value UNIQUE (code_grp_id, code_value);
    END IF;
END $$;

-- ───────────────────────────────────────────────────────────
-- 5) sy_code_grp.code_opt1_desc — 추가값(code_opt1)의 뜻
-- ───────────────────────────────────────────────────────────
ALTER TABLE shopjoy_2604.sy_code_grp ADD COLUMN IF NOT EXISTS code_opt1_desc VARCHAR(200);
COMMENT ON COLUMN shopjoy_2604.sy_code_grp.code_opt1_desc IS '이 그룹에서 코드의 추가값(sy_code.code_opt1)이 뜻하는 것 (예: 배지 색, 아이콘 이름, 최소~최대 금액)';
COMMENT ON COLUMN shopjoy_2604.sy_code_grp.module_cd IS '(삭제 예정 — 2단계) 옛 모듈 한정 표시. 적용 사이트는 sy_code_grp_site 로 옮겼다';
COMMENT ON COLUMN shopjoy_2604.sy_code.child_code_values IS '(삭제 예정 — 2단계) 옛 전이 코드값 목록. parent_code_value 방식으로 옮겼다';
COMMENT ON COLUMN shopjoy_2604.sy_code.parent_code_value IS '부모 코드값 — 트리 구조의 상위 code_value, 또는 ^A^B^ 형식의 "이 코드가 속하는 상위 값/이전 상태" 목록. null 이면 루트';

-- ───────────────────────────────────────────────────────────
-- 6) 표시경로(path_id) 정리 — 옛 값(promotion.* 또는 빈 값)일 때만 바꾼다
--    옛 값: promotion.cache.trans / promotion.cache.type / promotion.coupon.stat(3) / promotion.coupon.type /
--           promotion.discnt.appl / promotion.discnt.stat / promotion.discnt.targ / promotion.discnt.type /
--           promotion.event.statu(2) / promotion.event.type / promotion.promo.statu, 나머지 33개는 빈 값
-- ───────────────────────────────────────────────────────────
UPDATE shopjoy_2604.sy_code_grp g
   SET path_id = v.path_id, upd_by = 'MIGRATION_20261005', upd_date = NOW()
  FROM (VALUES
        -- promotion.* → promo.* (14개)
        ('CACHE_TRANS_TYPE',       'promo.cache.trans'),
        ('CACHE_TYPE_CD',          'promo.cache.type'),
        ('COUPON_STATUS_CD',       'promo.coupon.status'),
        ('COUPON_STATUS_DTL',      'promo.coupon.status'),
        ('COUPON_STATUS_KR',       'promo.coupon.status'),
        ('COUPON_TYPE_CD',         'promo.coupon.type'),
        ('DISCNT_APPLY_TARGET',    'promo.discnt.apply'),
        ('DISCNT_STATUS_CD',       'promo.discnt.status'),
        ('DISCNT_TARGET_CD',       'promo.discnt.target'),
        ('DISCNT_TYPE',            'promo.discnt.type'),
        ('EVENT_STATUS_CD',        'promo.event.status'),
        ('EVENT_STATUS_KR',        'promo.event.status'),
        ('EVENT_TYPE_CD',          'promo.event.type'),
        ('PROMO_STATUS',           'promo.promo.status'),
        -- 빈 값 33개 — 그룹 성격에 맞는 경로
        ('ALLOW_YN',               'common.allow_yn'),
        ('BOOL_YN',                'common.bool_yn'),
        ('OPEN_YN',                'common.open_yn'),
        ('NOTICE_YN',              'cs.notice.yn'),
        ('BLOG_TYPE',              'cs.blog.type'),
        ('CB_PATTERN_STATUS_CD',   'md.cb.pattern.status'),
        ('CB_YARN_WEIGHT_CD',      'md.cb.yarn.weight'),
        ('SG_DB_TYPE_CD',          'md.sg.db.type'),
        ('SG_PROJECT_STATUS_CD',   'md.sg.project.status'),
        ('CHG_REASON_CD',          'product.sku.reason'),
        ('SKU_CHG_TYPE',           'product.sku.chg.type'),
        ('CONTRACT_CD',            'vendor.brand.contract'),
        ('COUPON_APPLY',           'promo.coupon.apply'),
        ('COUPON_APPLY_SCOPE_CD',  'promo.coupon.scope'),
        ('COUPON_DISC_TYPE',       'promo.coupon.disc'),
        ('COUPON_ISSUE_DISP',      'promo.coupon.issue'),
        ('COUPON_TARGET',          'promo.coupon.target'),
        ('COUPON_USE_LIMIT',       'promo.coupon.limit'),
        ('DISCNT_VAL_TYPE_CD',     'promo.discnt.val.type'),
        ('DISCOUNT_TYPE',          'promo.discount.type'),
        ('EVENT_TARGET',           'promo.event.target'),
        ('PLAN_CATEGORY',          'promo.plan.category'),
        ('PLAN_DISP_STATUS',       'promo.plan.disp'),
        ('LAYOUT_TYPE',            'disp.layout.type'),
        ('WIDGET_TYPE_CD',         'disp.widget.type.cd'),
        ('ORDER_ITEM_DATE_TYPE',   'od.item.date.type'),
        ('ORDER_ITEM_DISCNT_TYPE', 'order.item.discnt'),
        ('PROD_OPT_CATEGORY',      'product.opt.category'),
        ('PROD_QNA_TYPE_CD',       'product.qna.type.cd'),
        ('PROD_STATUS_CD',         'product.status.cd'),
        ('REVIEW_RATING',          'product.review.rating'),
        ('WRITER_TYPE_CD',         'product.review.writer'),
        ('STOCK_FILTER',           'product.stock.filter')
       ) AS v(code_grp, path_id)
 WHERE g.code_grp = v.code_grp
   AND (COALESCE(g.path_id, '') = '' OR g.path_id LIKE 'promotion.%');

-- ───────────────────────────────────────────────────────────
-- 7) MEET_STATUS_CD — 전이 목록(child_code_values)을 "올 수 있는 이전 상태"(parent_code_value)로
--    SCHEDULED → OPEN·LIVE·CANCELED / OPEN → LIVE·ENDED·CANCELED / LIVE → ENDED  (서버 CmMeetRule.TRANSITIONS 와 같다)
--    parent_code_value 가 비어 있을 때만 채운다. child_code_values 값은 2단계에서 컬럼째 없앤다.
-- ───────────────────────────────────────────────────────────
UPDATE shopjoy_2604.sy_code c
   SET parent_code_value = v.parent_code_value, upd_by = 'MIGRATION_20261005', upd_date = NOW()
  FROM shopjoy_2604.sy_code_grp g,
       (VALUES
        ('OPEN',     '^SCHEDULED^'),
        ('LIVE',     '^SCHEDULED^OPEN^'),
        ('ENDED',    '^OPEN^LIVE^'),
        ('CANCELED', '^SCHEDULED^OPEN^')
       ) AS v(code_value, parent_code_value)
 WHERE g.code_grp_id = c.code_grp_id
   AND g.code_grp = 'MEET_STATUS_CD'
   AND c.code_value = v.code_value
   AND COALESCE(c.parent_code_value, '') = '';

-- 그룹 설명도 새 방식으로 (옛 설명: '화상 세션 상태 (child_code_values = 허용 전이)')
UPDATE shopjoy_2604.sy_code_grp
   SET code_grp_desc = '화상 세션 상태 (parent_code_value = 이 상태로 올 수 있는 이전 상태 ^A^B^)',
       upd_by = 'MIGRATION_20261005', upd_date = NOW()
 WHERE code_grp = 'MEET_STATUS_CD'
   AND COALESCE(code_grp_desc, '') LIKE '%child_code_values%';

-- ───────────────────────────────────────────────────────────
-- 8) 뷰 vw_sy_code — 이름이 같은 그룹이 여럿이면 대표 그룹 하나만 (전체 공통 우선, 없으면 code_grp_id 가 가장 작은 그룹)
--    컬럼 목록·순서는 옛 뷰와 같다(CREATE OR REPLACE 조건). child_code_values 는 2단계에서 뷰를 다시 만들며 뺀다.
--    옛 뷰: SELECT (같은 컬럼) FROM sy_code c LEFT JOIN sy_code_grp g ON g.code_grp_id = c.code_grp_id;
-- ───────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW shopjoy_2604.vw_sy_code AS
SELECT c.code_id,
       c.code_grp_id,
       g.code_grp,
       g.grp_nm,
       c.code_value,
       c.code_label,
       c.sort_ord,
       c.use_yn,
       c.parent_code_value,
       c.child_code_values,
       c.code_remark,
       c.code_level,
       c.code_opt1,
       c.reg_by,
       c.reg_date,
       c.upd_by,
       c.upd_date
  FROM shopjoy_2604.sy_code c
  LEFT JOIN shopjoy_2604.sy_code_grp g ON g.code_grp_id::text = c.code_grp_id::text
 WHERE g.code_grp_id IS NULL
    OR NOT EXISTS (
        SELECT 1
          FROM shopjoy_2604.sy_code_grp g2
         WHERE g2.code_grp = g.code_grp
           AND g2.code_grp_id <> g.code_grp_id
           AND (
                -- g2 가 전체 공통이고 g 는 사이트 매핑 그룹 → g2 가 대표
                (NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code_grp_site m2 WHERE m2.code_grp_id = g2.code_grp_id)
                 AND EXISTS (SELECT 1 FROM shopjoy_2604.sy_code_grp_site m1 WHERE m1.code_grp_id = g.code_grp_id))
                -- 둘 다 같은 범위(둘 다 공통이거나 둘 다 매핑) → code_grp_id 가 작은 쪽이 대표
             OR ((EXISTS (SELECT 1 FROM shopjoy_2604.sy_code_grp_site m2 WHERE m2.code_grp_id = g2.code_grp_id)
                  = EXISTS (SELECT 1 FROM shopjoy_2604.sy_code_grp_site m1 WHERE m1.code_grp_id = g.code_grp_id))
                 AND g2.code_grp_id < g.code_grp_id)
           )
       );
COMMENT ON VIEW shopjoy_2604.vw_sy_code IS '공통코드 + 그룹명 (목록의 코드 라벨 조인용). 이름이 같은 그룹이 여럿이면 대표 그룹(전체 공통 우선)만 보인다';

-- ───────────────────────────────────────────────────────────
-- 9) 확인용 조회 (실행 뒤 눈으로 확인)
-- ───────────────────────────────────────────────────────────
-- 매핑 건수(예상: SI260003 25, SI260004 2)
SELECT m.site_id, s.site_nm, COUNT(*) AS grp_cnt
  FROM shopjoy_2604.sy_code_grp_site m
  LEFT JOIN shopjoy_2604.sy_site s ON s.site_id = m.site_id
 GROUP BY m.site_id, s.site_nm
 ORDER BY m.site_id;
-- module_cd 가 있는데 매핑이 안 된 그룹(예상 0행 — 나오면 sy_site 에 그 모듈의 사이트가 없는 것)
SELECT g.code_grp_id, g.code_grp, g.module_cd
  FROM shopjoy_2604.sy_code_grp g
 WHERE COALESCE(g.module_cd, '') <> ''
   AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code_grp_site m WHERE m.code_grp_id = g.code_grp_id);
-- 경로가 아직 비었거나 promotion.* 인 그룹(예상 0행)
SELECT code_grp_id, code_grp, path_id
  FROM shopjoy_2604.sy_code_grp
 WHERE COALESCE(path_id, '') = '' OR path_id LIKE 'promotion.%';
-- 뷰 행 수 = 코드 행 수(이름이 같은 그룹이 아직 없으므로 같아야 한다. 예상 1,470)
SELECT (SELECT COUNT(*) FROM shopjoy_2604.vw_sy_code) AS vw_cnt, (SELECT COUNT(*) FROM shopjoy_2604.sy_code) AS code_cnt;
