-- ============================================================
-- pm_plan : 기획전
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE pm_plan (
    plan_id             VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),
    plan_nm             VARCHAR(100)    NOT NULL,               -- 기획전명
    plan_title          VARCHAR(200)    NOT NULL,               -- 기획전 타이틀 (노출용)
    plan_type_cd        VARCHAR(20)     DEFAULT 'THEME',        -- 코드: PLAN_TYPE (SEASON:시즌/BRAND:브랜드/THEME:테마/COLLAB:협업)
    plan_desc           TEXT,                                   -- 기획전 설명
    thumbnail_url       VARCHAR(500),                           -- 썸네일 이미지 URL
    banner_url          VARCHAR(500),                           -- 배너 이미지 URL
    start_date          TIMESTAMP,
    end_date            TIMESTAMP,
    plan_status_cd      VARCHAR(20)     DEFAULT 'DRAFT',        -- 코드: PLAN_STATUS (DRAFT:임시/ACTIVE:진행중/ENDED:종료)
    plan_status_cd_before VARCHAR(20),
    sort_ord            INTEGER         DEFAULT 0,
    use_yn              CHAR(1)         DEFAULT 'Y',
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30),
    upd_date            TIMESTAMP,
    PRIMARY KEY (plan_id)
);

COMMENT ON TABLE pm_plan IS '기획전';
COMMENT ON COLUMN pm_plan.plan_id           IS '기획전ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pm_plan.site_id           IS '사이트ID';
COMMENT ON COLUMN pm_plan.plan_nm           IS '기획전명 (내부용)';
COMMENT ON COLUMN pm_plan.plan_title        IS '기획전 타이틀 (노출용)';
COMMENT ON COLUMN pm_plan.plan_type_cd      IS '유형 (코드: PLAN_TYPE — SEASON/BRAND/THEME/COLLAB)';
COMMENT ON COLUMN pm_plan.plan_desc         IS '기획전 설명';
COMMENT ON COLUMN pm_plan.thumbnail_url     IS '썸네일 이미지 URL';
COMMENT ON COLUMN pm_plan.banner_url        IS '배너 이미지 URL';
COMMENT ON COLUMN pm_plan.start_date        IS '시작일시';
COMMENT ON COLUMN pm_plan.end_date          IS '종료일시';
COMMENT ON COLUMN pm_plan.plan_status_cd    IS '상태 (코드: PLAN_STATUS — DRAFT/ACTIVE/ENDED)';
COMMENT ON COLUMN pm_plan.plan_status_cd_before IS '변경 전 상태';
COMMENT ON COLUMN pm_plan.sort_ord          IS '정렬순서';
COMMENT ON COLUMN pm_plan.use_yn            IS '사용여부 Y/N';
COMMENT ON COLUMN pm_plan.reg_by            IS '등록자';
COMMENT ON COLUMN pm_plan.reg_date          IS '등록일';
COMMENT ON COLUMN pm_plan.upd_by            IS '수정자';
COMMENT ON COLUMN pm_plan.upd_date          IS '수정일';

CREATE INDEX idx_pm_plan_site   ON pm_plan (site_id);
CREATE INDEX idx_pm_plan_status ON pm_plan (plan_status_cd);
CREATE INDEX idx_pm_plan_date   ON pm_plan (start_date, end_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pm_plan.plan_type_cd (유형) : PLAN_TYPE { GENERAL:일반, BRAND:브랜드기획, SEASON:시즌, SALE:세일 }
-- [CODES] pm_plan.plan_status_cd (상태) : PLAN_STATUS { DRAFT:초안, ACTIVE:활성, ENDED:종료, INACTIVE:비활성 }
