-- cm_expert 테이블 DDL
-- 전문가 (견적요청 대상 사업자, 사이트당 회원 1행) — 2026-10-04 신규 (migration_20261004_dm_local.sql)
-- 상태: PENDING → APPROVED/REJECTED, APPROVED ↔ SUSPENDED

CREATE TABLE shopjoy_2604.cm_expert (
    expert_id                VARCHAR(21)   NOT NULL CONSTRAINT cm_expert_pk_expert_id PRIMARY KEY,
    site_id                  VARCHAR(21)   NOT NULL,
    member_id                VARCHAR(21)   NOT NULL,
    member_nm                VARCHAR(100),
    expert_nm                VARCHAR(100)  NOT NULL,
    biz_no                   VARCHAR(20),
    intro                    TEXT,
    area_towns               VARCHAR(500),
    contact_phone            VARCHAR(20),
    expert_status_cd         VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    expert_status_cd_before  VARCHAR(20),
    review_by                VARCHAR(30),
    review_date              TIMESTAMP,
    review_reason            VARCHAR(300),
    reg_by                   VARCHAR(30),
    reg_date                 TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    upd_by                   VARCHAR(30),
    upd_date                 TIMESTAMP,
    reg_site_id              VARCHAR(21)   NOT NULL,
    CONSTRAINT cm_expert_uk01_site_member UNIQUE (site_id, member_id)
);

COMMENT ON TABLE  shopjoy_2604.cm_expert IS '전문가 (견적요청 대상 사업자)';
COMMENT ON COLUMN shopjoy_2604.cm_expert.expert_id IS '전문가ID (EX+YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.cm_expert.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.cm_expert.member_id IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.cm_expert.member_nm IS '회원명 (비정규화 캐시)';
COMMENT ON COLUMN shopjoy_2604.cm_expert.expert_nm IS '상호·활동명';
COMMENT ON COLUMN shopjoy_2604.cm_expert.biz_no IS '사업자등록번호';
COMMENT ON COLUMN shopjoy_2604.cm_expert.intro IS '소개';
COMMENT ON COLUMN shopjoy_2604.cm_expert.area_towns IS '활동 지역 (동네, 콤마 구분)';
COMMENT ON COLUMN shopjoy_2604.cm_expert.contact_phone IS '연락처';
COMMENT ON COLUMN shopjoy_2604.cm_expert.expert_status_cd IS '상태 (코드: DM_EXPERT_STATUS — PENDING 승인 대기/APPROVED 승인/REJECTED 반려/SUSPENDED 정지)';
COMMENT ON COLUMN shopjoy_2604.cm_expert.expert_status_cd_before IS '변경 전 상태';
COMMENT ON COLUMN shopjoy_2604.cm_expert.review_by IS '심사자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.cm_expert.review_date IS '심사 일시';
COMMENT ON COLUMN shopjoy_2604.cm_expert.review_reason IS '반려·정지 사유';
COMMENT ON COLUMN shopjoy_2604.cm_expert.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.cm_expert.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.cm_expert.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.cm_expert.upd_date IS '수정일시';
COMMENT ON COLUMN shopjoy_2604.cm_expert.reg_site_id IS '등록 사이트ID (감사 필드)';

CREATE INDEX cm_expert_ix01_site_status ON shopjoy_2604.cm_expert USING btree (site_id, expert_status_cd);
