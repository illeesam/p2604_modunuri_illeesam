-- cm_quote_req 테이블 DDL
-- 전문가 견적요청 (숨고형, OPEN → CLOSED/CANCELED) — 2026-10-04 신규 (migration_20261004_dm_local.sql)
-- 사진은 cm_local_attach(ref_type_cd=QUOTE_REQ)

CREATE TABLE shopjoy_2604.cm_quote_req (
    quote_req_id            VARCHAR(21)   NOT NULL CONSTRAINT cm_quote_req_pk_quote_req_id PRIMARY KEY,
    site_id                 VARCHAR(21)   NOT NULL,
    member_id               VARCHAR(21)   NOT NULL,
    member_nm               VARCHAR(100),
    category_cd             VARCHAR(30)   NOT NULL,
    sub_category_cd         VARCHAR(30),
    when_cd                 VARCHAR(20),
    want_date               DATE,
    town                    VARCHAR(50),
    addr                    VARCHAR(200),
    content                 TEXT,
    budget_amt              BIGINT,
    contact_cds             VARCHAR(50),
    quote_status_cd         VARCHAR(20)   NOT NULL DEFAULT 'OPEN',
    quote_status_cd_before  VARCHAR(20),
    noti_expert_cnt         INTEGER       DEFAULT 0,
    close_date              TIMESTAMP,
    close_reason            VARCHAR(200),
    reg_by                  VARCHAR(30),
    reg_date                TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    upd_by                  VARCHAR(30),
    upd_date                TIMESTAMP,
    reg_site_id             VARCHAR(21)   NOT NULL
);

COMMENT ON TABLE  shopjoy_2604.cm_quote_req IS '전문가 견적요청';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.quote_req_id IS '견적요청ID (QUR+YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.member_id IS '요청 회원ID (mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.member_nm IS '요청 회원명 (비정규화 캐시)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.category_cd IS '서비스 대분류 (코드: DM_QUOTE_CATE 1단계)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.sub_category_cd IS '서비스 세부 분류 (코드: DM_QUOTE_CATE 2단계)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.when_cd IS '희망 시기 (코드: DM_QUOTE_WHEN — ASAP/WEEK/MONTH/DATE/DISCUSS)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.want_date IS '희망 날짜 (when_cd=DATE)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.town IS '동네';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.addr IS '상세 주소 (요청자·수락된 전문가·관리자만 본다)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.content IS '요청 내용';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.budget_amt IS '예산';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.contact_cds IS '연락 방법 (코드: DM_CONTACT_METHOD, 콤마 구분)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.quote_status_cd IS '상태 (코드: DM_QUOTE_STATUS — OPEN 견적 받는 중/CLOSED 마감/CANCELED 취소)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.quote_status_cd_before IS '변경 전 상태';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.noti_expert_cnt IS '알림을 보낸 전문가 수';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.close_date IS '마감·취소 일시';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.close_reason IS '마감·취소 사유';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.upd_date IS '수정일시';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.reg_site_id IS '등록 사이트ID (감사 필드)';

CREATE INDEX cm_quote_req_ix01_site_cate_status ON shopjoy_2604.cm_quote_req USING btree (site_id, category_cd, quote_status_cd, reg_date DESC);
CREATE INDEX cm_quote_req_ix02_member ON shopjoy_2604.cm_quote_req USING btree (member_id, reg_date DESC);
