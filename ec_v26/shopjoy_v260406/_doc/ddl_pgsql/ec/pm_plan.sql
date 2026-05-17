-- pm_plan 테이블 DDL
-- 기획전

CREATE TABLE shopjoy_2604.pm_plan (
    plan_id               VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id               VARCHAR(21)  NOT NULL,
    plan_nm               VARCHAR(100) NOT NULL,
    plan_title            VARCHAR(200) NOT NULL,
    plan_type_cd          VARCHAR(20)  DEFAULT 'THEME'::character varying,
    plan_desc             TEXT        ,
    thumbnail_url         VARCHAR(500),
    banner_url            VARCHAR(500),
    start_date            TIMESTAMP   ,
    end_date              TIMESTAMP   ,
    plan_status_cd        VARCHAR(20)  DEFAULT 'DRAFT'::character varying,
    plan_status_cd_before VARCHAR(20) ,
    sort_ord              INTEGER      DEFAULT 0,
    use_yn                VARCHAR(1)   DEFAULT 'Y'::bpchar,
    reg_by                VARCHAR(30) ,
    reg_date              TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by                VARCHAR(30) ,
    upd_date              TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.pm_plan IS '기획전';
COMMENT ON COLUMN shopjoy_2604.pm_plan.plan_id IS '기획전ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.pm_plan.site_id IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.pm_plan.plan_nm IS '기획전명 (내부용)';
COMMENT ON COLUMN shopjoy_2604.pm_plan.plan_title IS '기획전 타이틀 (노출용)';
COMMENT ON COLUMN shopjoy_2604.pm_plan.plan_type_cd IS '유형 (코드: PLAN_TYPE — SEASON/BRAND/THEME/COLLAB)';
COMMENT ON COLUMN shopjoy_2604.pm_plan.plan_desc IS '기획전 설명';
COMMENT ON COLUMN shopjoy_2604.pm_plan.thumbnail_url IS '썸네일 이미지 URL';
COMMENT ON COLUMN shopjoy_2604.pm_plan.banner_url IS '배너 이미지 URL';
COMMENT ON COLUMN shopjoy_2604.pm_plan.start_date IS '시작일시';
COMMENT ON COLUMN shopjoy_2604.pm_plan.end_date IS '종료일시';
COMMENT ON COLUMN shopjoy_2604.pm_plan.plan_status_cd IS '상태 (코드: PLAN_STATUS — DRAFT/ACTIVE/ENDED)';
COMMENT ON COLUMN shopjoy_2604.pm_plan.plan_status_cd_before IS '변경 전 상태';
COMMENT ON COLUMN shopjoy_2604.pm_plan.sort_ord IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.pm_plan.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.pm_plan.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.pm_plan.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.pm_plan.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.pm_plan.upd_date IS '수정일';

CREATE INDEX idx_pm_plan_date ON shopjoy_2604.pm_plan USING btree (start_date, end_date);
CREATE INDEX idx_pm_plan_site ON shopjoy_2604.pm_plan USING btree (site_id);
CREATE INDEX idx_pm_plan_status ON shopjoy_2604.pm_plan USING btree (plan_status_cd);
