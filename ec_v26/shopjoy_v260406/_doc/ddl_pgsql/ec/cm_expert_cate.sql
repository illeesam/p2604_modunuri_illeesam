-- cm_expert_cate 테이블 DDL
-- 전문가 서비스 분류 신청 (심사: PENDING → APPROVED/REJECTED) — 2026-10-04 신규 (migration_20261004_dm_local.sql)
-- 전문가 APPROVED + 분류 APPROVED 인 분류의 견적요청 알림을 받는다

CREATE TABLE shopjoy_2604.cm_expert_cate (
    expert_cate_id   VARCHAR(21)   NOT NULL CONSTRAINT cm_expert_cate_pk_expert_cate_id PRIMARY KEY,
    site_id          VARCHAR(21)   NOT NULL,
    expert_id        VARCHAR(21)   NOT NULL,
    category_cd      VARCHAR(30)   NOT NULL,
    sub_category_cd  VARCHAR(30),
    proof_memo       TEXT,
    cate_status_cd   VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    review_by        VARCHAR(30),
    review_date      TIMESTAMP,
    review_reason    VARCHAR(300),
    reg_by           VARCHAR(30),
    reg_date         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    upd_by           VARCHAR(30),
    upd_date         TIMESTAMP,
    reg_site_id      VARCHAR(21)   NOT NULL
);

COMMENT ON TABLE  shopjoy_2604.cm_expert_cate IS '전문가 서비스 분류 신청';
COMMENT ON COLUMN shopjoy_2604.cm_expert_cate.expert_cate_id IS '전문가분류ID (EXC+YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.cm_expert_cate.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.cm_expert_cate.expert_id IS '전문가ID (cm_expert.expert_id)';
COMMENT ON COLUMN shopjoy_2604.cm_expert_cate.category_cd IS '서비스 대분류 (코드: DM_QUOTE_CATE 1단계)';
COMMENT ON COLUMN shopjoy_2604.cm_expert_cate.sub_category_cd IS '서비스 세부 분류 (코드: DM_QUOTE_CATE 2단계, NULL=대분류 전체)';
COMMENT ON COLUMN shopjoy_2604.cm_expert_cate.proof_memo IS '증빙 메모 (경력·자격 등)';
COMMENT ON COLUMN shopjoy_2604.cm_expert_cate.cate_status_cd IS '심사 상태 (코드: DM_EXPERT_CATE_STATUS — PENDING 심사중/APPROVED 승인/REJECTED 반려)';
COMMENT ON COLUMN shopjoy_2604.cm_expert_cate.review_by IS '심사자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.cm_expert_cate.review_date IS '심사 일시';
COMMENT ON COLUMN shopjoy_2604.cm_expert_cate.review_reason IS '반려 사유';
COMMENT ON COLUMN shopjoy_2604.cm_expert_cate.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.cm_expert_cate.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.cm_expert_cate.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.cm_expert_cate.upd_date IS '수정일시';
COMMENT ON COLUMN shopjoy_2604.cm_expert_cate.reg_site_id IS '등록 사이트ID (감사 필드)';

CREATE INDEX cm_expert_cate_ix01_expert ON shopjoy_2604.cm_expert_cate USING btree (expert_id);
CREATE INDEX cm_expert_cate_ix02_match ON shopjoy_2604.cm_expert_cate USING btree (site_id, category_cd, cate_status_cd);
