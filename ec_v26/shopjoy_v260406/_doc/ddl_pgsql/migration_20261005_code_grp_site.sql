-- ═══════════════════════════════════════════════════════════
--  공통코드 "적용 사이트 매핑" 개편 — 1단계 (테이블 신설·이전·유일 조건·경로 정리·opt1 설명 컬럼)
--  작성일: 2026-10-05
--
--  배경:
--   지금까지 공통코드 그룹(sy_code_grp)이 "어느 사이트 것인가"는 module_cd 한 칸(모듈 1개)으로만 표시했다.
--   사이트:모듈이 1:1 이라 지금은 통하지만, 한 그룹을 여러 사이트가 같이 쓰는(공용) 경우를 담을 수 없다.
--   그래서 그룹 ↔ 사이트 매핑 테이블을 둔다.
--
--   ① sy_code_grp_site (신규) — 코드그룹 적용 사이트 매핑
--        매핑 행 없음 = 전체 공통 / 1개 = 그 사이트 전용 / 여러 개 = 여러 사이트 공용.
--        FO 로는 "전체 공통 + 그 사이트에 매핑된 그룹"의 코드만 내려간다. BO 공통코드관리에서 적용 사이트를 고르고 표시한다.
--        기존 sy_code_grp.module_cd 값은 sy_site.module_cd 로 조인해 매핑으로 옮긴다(danmoo1 → SI260003, homepg1 → SI260004).
--        module_cd 컬럼은 이번에는 남겨 둔다(옛 백엔드 호환) — 삭제는 2단계 파일.
--        reg_site_id 는 다른 테이블과 같은 감사 필드일 뿐이다(사이트 조건은 site_id 로만 — 정책 sy.57 §12).
--   ② 그룹명(code_grp)은 지금처럼 전체에서 유일 — 유일 인덱스 sy_code_grp_uk_code_grp 는 그대로 둔다(바꾸지 않는다).
--        코드 조회는 그룹 이름 그대로 한 번에 읽는다(사이트별 우선순위 없음).
--        이름 규칙(3단계, 사용자 확정 2026-10-05):
--          전체 공통        XX_STATUS_CD                      매핑 없음
--          모듈 전용        EC1_XX_STATUS_CD                  <모듈 대문자>_…_CD — 그 모듈을 쓰는 사이트 전부(지금은 1개씩)
--          사이트 전용      SI260001_EC1_XX_STATUS_CD         <사이트ID>_<모듈 대문자>_…_CD — 그 사이트 1개
--          (여러 사이트 공용: 접두어 없이 매핑만 여러 개)
--        모듈 접두어: EC1_ / EC2_ / DANMOO1_ / HOMEPG1_ / DATAVISUAL1_ / BBM1_ (sy_site.module_cd 대문자). 약어(DM_, HP_)는 더 쓰지 않는다.
--        사이트:모듈이 1:1 이라 사이트 전용으로 바꿀 기존 그룹은 없다. 기존 모듈 전용 27개는 ⑧ 에서 모듈 접두어 이름으로 바꾼다.
--   ③ 코드값 유일 조건 추가 — UNIQUE (code_grp_id, code_value). (2026-10-05 조회: 중복 0건)
--   ④ sy_code_grp.code_opt1_desc (신규 컬럼) — 그 그룹에서 코드의 추가값(code_opt1)이 무엇을 뜻하는지 설명.
--   ⑤ 표시경로(path_id) 정리 — 값만 고친다(그룹명은 바꾸지 않는다)
--        promotion.* 14개 → promo.* 로 통일. 이유: path_id 가 21자라 promotion. 접두어는 뒤가 잘린다(promotion.event.statu),
--        이미 promo.* 가 17개로 더 많고, 메뉴·다른 테이블(sy_prop: app/biz/spring)에는 이 낱말을 키로 쓰는 곳이 없다.
--        잘려 있던 꼬리(statu·targ·appl)도 같이 바로잡는다. 빈 값 33개는 그룹 성격에 맞는 경로로 채운다.
--   ⑧ 모듈 전용 그룹 27개 이름 변경 — 옛 → 새 (DM_/HP_ 약어를 떼고 모듈 접두어 + 끝에 _CD. 가장 긴 이름 29자, 컬럼 50자)
--        당무마켓(SI260003, danmoo1) 25개
--          DM_CAR_ACCIDENT        → DANMOO1_CAR_ACCIDENT_CD          DM_CAR_COLOR           → DANMOO1_CAR_COLOR_CD
--          DM_CAR_FUEL            → DANMOO1_CAR_FUEL_CD              DM_CAR_GEAR            → DANMOO1_CAR_GEAR_CD
--          DM_CAR_MAKER           → DANMOO1_CAR_MAKER_CD             DM_CONTACT_METHOD      → DANMOO1_CONTACT_METHOD_CD
--          DM_EXPERT_CATE_STATUS  → DANMOO1_EXPERT_CATE_STATUS_CD    DM_EXPERT_STATUS       → DANMOO1_EXPERT_STATUS_CD
--          DM_JOB_KIND            → DANMOO1_JOB_KIND_CD              DM_JOB_PERIOD          → DANMOO1_JOB_PERIOD_CD
--          DM_JOB_TASK            → DANMOO1_JOB_TASK_CD              DM_JOB_TYPE            → DANMOO1_JOB_TYPE_CD
--          DM_PAY_TYPE            → DANMOO1_PAY_TYPE_CD              DM_POST_KIND           → DANMOO1_POST_KIND_CD
--          DM_POST_STATUS         → DANMOO1_POST_STATUS_CD           DM_QUOTE_BID_STATUS    → DANMOO1_QUOTE_BID_STATUS_CD
--          DM_QUOTE_CATE          → DANMOO1_QUOTE_CATE_CD            DM_QUOTE_STATUS        → DANMOO1_QUOTE_STATUS_CD
--          DM_QUOTE_WHEN          → DANMOO1_QUOTE_WHEN_CD            DM_REALTY_DEAL         → DANMOO1_REALTY_DEAL_CD
--          DM_REALTY_KIND         → DANMOO1_REALTY_KIND_CD           DM_REALTY_OPTION       → DANMOO1_REALTY_OPTION_CD
--          DM_REALTY_TYPE         → DANMOO1_REALTY_TYPE_CD           DM_WEEKDAY             → DANMOO1_WEEKDAY_CD
--          TRADE_METHOD_CD        → DANMOO1_TRADE_METHOD_CD
--        홈페이지1(SI260004, homepg1) 2개
--          HP_CONTACT_CATEGORY    → HOMEPG1_CONTACT_CATEGORY_CD      HP_CONTACT_SERVICE     → HOMEPG1_CONTACT_SERVICE_CD
--        다른 테이블에 그룹명이 값으로 저장된 곳: 없음(2026-10-05 전 테이블 문자열 컬럼 3,299개 조회 — zd_meta_* 포함 0건).
--        컬럼 주석(pg_description) 17개가 옛 이름을 적고 있어 같이 바꾼다.
--        옛 이름을 쓰는 지금의 운영 코드 영향(DDL 실행 ~ 새 배포 사이): 백엔드는 이 이름을 동작에 쓰지 않음(주석만), FO 당무마켓·홈페이지1 과 BO 동네글/전문가/견적 3화면은
--        코드가 비면 화면 예비 상수로 보이도록 돼 있어 그대로 동작한다 → 옛 이름 호환 코드는 두지 않는다.
--   ⑥ 전이 코드값(child_code_values) → 부모 코드값(parent_code_value) 방식
--        쓰는 곳은 MEET_STATUS_CD 3건뿐. "이 상태에서 갈 수 있는 다음 상태" 목록을
--        "이 상태로 올 수 있는 이전 상태" 목록(^A^B^ 형식 — CLAIM_STATUS 가 쓰는 방식과 같다)으로 뒤집어 parent_code_value 에 넣는다.
--        child_code_values 컬럼 삭제는 2단계 파일.
--
--  사전 조회 결과(2026-10-05, 읽기 전용):
--     sy_code_grp 268개 / sy_code 1,470개 / module_cd 있는 그룹 27개(danmoo1 25, homepg1 2) → 매핑 27행 생성 예정
--     같은 그룹 안 코드값 중복 0건 / 그룹명 중복 0건 / sy_code_grp_site 테이블 없음 / 그룹 없는 코드 0건
--     path_id: promotion.* 14개, 빈 값 33개 → 47개 UPDATE 예정 (모두 21자 이내)
--     매핑 ID: COGS2610050000 + 4자리 순번 = 18자 (컬럼 21자)
--
--  ※ 2026-10-05 방안 변경: 처음 올린 판에는 "그룹명 전체 유일 제거 + 뷰 vw_sy_code 대표 그룹만" 이 들어 있었다. 그 두 가지는 하지 않기로 해서 뺐다.
--     처음 판을 이미 실행했다면 맨 아래 "처음 판을 실행한 경우" 주석의 SQL 로 유일 인덱스와 뷰를 원래대로 돌린다(같은 이름 그룹을 만들지 않았다면 그대로 실행된다).
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
--     ALTER TABLE shopjoy_2604.sy_code_grp DROP COLUMN IF EXISTS code_opt1_desc;
--     UPDATE shopjoy_2604.sy_code c SET parent_code_value = NULL FROM shopjoy_2604.sy_code_grp g
--      WHERE g.code_grp_id = c.code_grp_id AND g.code_grp = 'MEET_STATUS_CD' AND c.upd_by = 'MIGRATION_20261005';
--     path_id 는 upd_by = 'MIGRATION_20261005' 인 그룹이 대상이다(옛 값은 이 파일 5) 의 주석 참고).
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
-- 3) 그룹명(code_grp) — 전체 유일 그대로(인덱스 sy_code_grp_uk_code_grp 유지). 설명만 새 이름 규칙으로
-- ───────────────────────────────────────────────────────────
COMMENT ON COLUMN shopjoy_2604.sy_code_grp.code_grp IS '코드그룹코드 (전체에서 유일, 예: MEMBER_GRADE). 새 그룹 이름 규칙: 업무약어_이름_CD, 한 모듈 전용이면 앞에 모듈 접두어(EC1_/EC2_/HOMEPG1_/DATAVISUAL1_/BBM1_, 당무마켓은 DM_)';

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
-- 8) 모듈 전용 그룹 27개 이름 변경 (옛 이름일 때만 — 다시 실행해도 안전. 새 이름이 이미 다른 그룹에 있으면 유일 인덱스가 막는다)
-- ───────────────────────────────────────────────────────────
UPDATE shopjoy_2604.sy_code_grp g
   SET code_grp = v.new_nm, upd_by = 'MIGRATION_20261005', upd_date = NOW()
  FROM (VALUES
        ('DM_CAR_ACCIDENT',       'DANMOO1_CAR_ACCIDENT_CD'),
        ('DM_CAR_COLOR',          'DANMOO1_CAR_COLOR_CD'),
        ('DM_CAR_FUEL',           'DANMOO1_CAR_FUEL_CD'),
        ('DM_CAR_GEAR',           'DANMOO1_CAR_GEAR_CD'),
        ('DM_CAR_MAKER',          'DANMOO1_CAR_MAKER_CD'),
        ('DM_CONTACT_METHOD',     'DANMOO1_CONTACT_METHOD_CD'),
        ('DM_EXPERT_CATE_STATUS', 'DANMOO1_EXPERT_CATE_STATUS_CD'),
        ('DM_EXPERT_STATUS',      'DANMOO1_EXPERT_STATUS_CD'),
        ('DM_JOB_KIND',           'DANMOO1_JOB_KIND_CD'),
        ('DM_JOB_PERIOD',         'DANMOO1_JOB_PERIOD_CD'),
        ('DM_JOB_TASK',           'DANMOO1_JOB_TASK_CD'),
        ('DM_JOB_TYPE',           'DANMOO1_JOB_TYPE_CD'),
        ('DM_PAY_TYPE',           'DANMOO1_PAY_TYPE_CD'),
        ('DM_POST_KIND',          'DANMOO1_POST_KIND_CD'),
        ('DM_POST_STATUS',        'DANMOO1_POST_STATUS_CD'),
        ('DM_QUOTE_BID_STATUS',   'DANMOO1_QUOTE_BID_STATUS_CD'),
        ('DM_QUOTE_CATE',         'DANMOO1_QUOTE_CATE_CD'),
        ('DM_QUOTE_STATUS',       'DANMOO1_QUOTE_STATUS_CD'),
        ('DM_QUOTE_WHEN',         'DANMOO1_QUOTE_WHEN_CD'),
        ('DM_REALTY_DEAL',        'DANMOO1_REALTY_DEAL_CD'),
        ('DM_REALTY_KIND',        'DANMOO1_REALTY_KIND_CD'),
        ('DM_REALTY_OPTION',      'DANMOO1_REALTY_OPTION_CD'),
        ('DM_REALTY_TYPE',        'DANMOO1_REALTY_TYPE_CD'),
        ('DM_WEEKDAY',            'DANMOO1_WEEKDAY_CD'),
        ('TRADE_METHOD_CD',       'DANMOO1_TRADE_METHOD_CD'),
        ('HP_CONTACT_CATEGORY',   'HOMEPG1_CONTACT_CATEGORY_CD'),
        ('HP_CONTACT_SERVICE',    'HOMEPG1_CONTACT_SERVICE_CD')
       ) AS v(old_nm, new_nm)
 WHERE g.code_grp = v.old_nm;

-- 컬럼 주석에 적힌 옛 그룹명도 새 이름으로 (cm_local_post·cm_quote_req·cm_expert 등 17개)
DO $$
DECLARE
    r RECORD;
    v_desc TEXT;
    v_pair TEXT[];
    v_pairs TEXT[][] := ARRAY[
        ['DM_CAR_ACCIDENT','DANMOO1_CAR_ACCIDENT_CD'], ['DM_CAR_COLOR','DANMOO1_CAR_COLOR_CD'], ['DM_CAR_FUEL','DANMOO1_CAR_FUEL_CD'], ['DM_CAR_GEAR','DANMOO1_CAR_GEAR_CD'],
        ['DM_CAR_MAKER','DANMOO1_CAR_MAKER_CD'], ['DM_CONTACT_METHOD','DANMOO1_CONTACT_METHOD_CD'], ['DM_EXPERT_CATE_STATUS','DANMOO1_EXPERT_CATE_STATUS_CD'],
        ['DM_EXPERT_STATUS','DANMOO1_EXPERT_STATUS_CD'], ['DM_JOB_KIND','DANMOO1_JOB_KIND_CD'], ['DM_JOB_PERIOD','DANMOO1_JOB_PERIOD_CD'], ['DM_JOB_TASK','DANMOO1_JOB_TASK_CD'],
        ['DM_JOB_TYPE','DANMOO1_JOB_TYPE_CD'], ['DM_PAY_TYPE','DANMOO1_PAY_TYPE_CD'], ['DM_POST_KIND','DANMOO1_POST_KIND_CD'], ['DM_POST_STATUS','DANMOO1_POST_STATUS_CD'],
        ['DM_QUOTE_BID_STATUS','DANMOO1_QUOTE_BID_STATUS_CD'], ['DM_QUOTE_CATE','DANMOO1_QUOTE_CATE_CD'], ['DM_QUOTE_STATUS','DANMOO1_QUOTE_STATUS_CD'],
        ['DM_QUOTE_WHEN','DANMOO1_QUOTE_WHEN_CD'], ['DM_REALTY_DEAL','DANMOO1_REALTY_DEAL_CD'], ['DM_REALTY_KIND','DANMOO1_REALTY_KIND_CD'],
        ['DM_REALTY_OPTION','DANMOO1_REALTY_OPTION_CD'], ['DM_REALTY_TYPE','DANMOO1_REALTY_TYPE_CD'], ['DM_WEEKDAY','DANMOO1_WEEKDAY_CD'],
        ['TRADE_METHOD_CD','DANMOO1_TRADE_METHOD_CD'], ['HP_CONTACT_CATEGORY','HOMEPG1_CONTACT_CATEGORY_CD'], ['HP_CONTACT_SERVICE','HOMEPG1_CONTACT_SERVICE_CD']
    ];
    i INTEGER;
BEGIN
    FOR r IN
        SELECT c.relname, a.attname, d.description
          FROM pg_description d
          JOIN pg_class c ON c.oid = d.objoid
          JOIN pg_namespace n ON n.oid = c.relnamespace
          JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = d.objsubid
         WHERE n.nspname = 'shopjoy_2604' AND d.objsubid > 0
           AND d.description ~ '(^|[^A-Z0-9_])(DM_[A-Z_]+|TRADE_METHOD_CD|HP_CONTACT_[A-Z]+)($|[^A-Z0-9_])'
    LOOP
        v_desc := r.description;
        -- 긴 이름부터 바꾼다(DM_QUOTE_CATE 가 DM_QUOTE_CATE_… 안에 들어 있지 않게 단어 경계로)
        FOR i IN 1 .. array_length(v_pairs, 1) LOOP
            v_desc := regexp_replace(v_desc, '(^|[^A-Z0-9_])' || v_pairs[i][1] || '($|[^A-Z0-9_])', '\1' || v_pairs[i][2] || '\2', 'g');
        END LOOP;
        IF v_desc <> r.description THEN
            EXECUTE format('COMMENT ON COLUMN shopjoy_2604.%I.%I IS %L', r.relname, r.attname, v_desc);
        END IF;
    END LOOP;
END $$;

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
-- 옛 이름이 남은 그룹(예상 0행) / 새 이름 그룹 수(예상 27)
SELECT code_grp FROM shopjoy_2604.sy_code_grp WHERE code_grp ~ '^(DM_|HP_)' OR code_grp = 'TRADE_METHOD_CD';
SELECT COUNT(*) AS renamed FROM shopjoy_2604.sy_code_grp WHERE code_grp ~ '^(DANMOO1|HOMEPG1)_.*_CD$';
-- 그룹명 유일 인덱스가 그대로 있는지(예상 1행)
SELECT indexname FROM pg_indexes WHERE schemaname = 'shopjoy_2604' AND indexname = 'sy_code_grp_uk_code_grp';
-- 뷰 행 수 = 코드 행 수(예상 1,470)
SELECT (SELECT COUNT(*) FROM shopjoy_2604.vw_sy_code) AS vw_cnt, (SELECT COUNT(*) FROM shopjoy_2604.sy_code) AS code_cnt;

-- ───────────────────────────────────────────────────────────
-- (참고) 처음 판을 실행한 경우에만 — 그룹명 유일 인덱스와 뷰를 원래대로
-- ───────────────────────────────────────────────────────────
-- DROP INDEX IF EXISTS shopjoy_2604.sy_code_grp_ix01_code_grp;
-- ALTER TABLE shopjoy_2604.sy_code_grp ADD CONSTRAINT sy_code_grp_uk_code_grp UNIQUE (code_grp);
-- CREATE OR REPLACE VIEW shopjoy_2604.vw_sy_code AS
-- SELECT c.code_id, c.code_grp_id, g.code_grp, g.grp_nm, c.code_value, c.code_label, c.sort_ord, c.use_yn, c.parent_code_value, c.child_code_values,
--        c.code_remark, c.code_level, c.code_opt1, c.reg_by, c.reg_date, c.upd_by, c.upd_date
--   FROM shopjoy_2604.sy_code c
--   LEFT JOIN shopjoy_2604.sy_code_grp g ON g.code_grp_id::text = c.code_grp_id::text;
