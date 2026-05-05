-- st_settle 테이블 DDL
-- 정산 마스터 (업체별 월정산)

CREATE TABLE shopjoy_2604.st_settle (
    settle_id               VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id                 VARCHAR(21)  NOT NULL,
    vendor_id               VARCHAR(21)  NOT NULL,
    settle_ym               VARCHAR(6)   NOT NULL,
    settle_start_date       TIMESTAMP    NOT NULL,
    settle_end_date         TIMESTAMP    NOT NULL,
    total_order_amt         BIGINT       DEFAULT 0,
    total_return_amt        BIGINT       DEFAULT 0,
    total_claim_cnt         INTEGER      DEFAULT 0,
    total_discnt_amt        BIGINT       DEFAULT 0,
    commission_rate         NUMERIC(5,2) DEFAULT 0,
    commission_amt          BIGINT       DEFAULT 0,
    settle_amt              BIGINT       DEFAULT 0,
    adj_amt                 BIGINT       DEFAULT 0,
    etc_adj_amt             BIGINT       DEFAULT 0,
    final_settle_amt        BIGINT       DEFAULT 0,
    settle_status_cd        VARCHAR(20)  DEFAULT 'DRAFT',
    settle_status_cd_before VARCHAR(20) ,
    settle_memo             TEXT        ,
    reg_by                  VARCHAR(30) ,
    reg_date                TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by                  VARCHAR(30) ,
    upd_date                TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.st_settle IS '정산 마스터 (업체별 월정산)';
COMMENT ON COLUMN shopjoy_2604.st_settle.settle_id IS '정산ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.st_settle.site_id IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.st_settle.vendor_id IS '업체ID (sy_vendor.vendor_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle.settle_ym IS '정산년월 (YYYYMM)';
COMMENT ON COLUMN shopjoy_2604.st_settle.settle_start_date IS '정산 기준 시작일';
COMMENT ON COLUMN shopjoy_2604.st_settle.settle_end_date IS '정산 기준 종료일';
COMMENT ON COLUMN shopjoy_2604.st_settle.total_order_amt IS '총 주문금액 (당월 신규 주문 귀속)';
COMMENT ON COLUMN shopjoy_2604.st_settle.total_return_amt IS '총 환불금액 (환불 확정월 귀속 — 타월 주문 환불 포함)';
COMMENT ON COLUMN shopjoy_2604.st_settle.total_claim_cnt IS '환불 건수 (st_settle_raw.raw_type_cd=CLAIM 집계)';
COMMENT ON COLUMN shopjoy_2604.st_settle.total_discnt_amt IS '총 할인금액';
COMMENT ON COLUMN shopjoy_2604.st_settle.commission_rate IS '적용 수수료율 (%)';
COMMENT ON COLUMN shopjoy_2604.st_settle.commission_amt IS '수수료금액';
COMMENT ON COLUMN shopjoy_2604.st_settle.settle_amt IS '기본 정산금액';
COMMENT ON COLUMN shopjoy_2604.st_settle.adj_amt IS '정산조정 합계';
COMMENT ON COLUMN shopjoy_2604.st_settle.etc_adj_amt IS '기타조정 합계';
COMMENT ON COLUMN shopjoy_2604.st_settle.final_settle_amt IS '최종 정산금액';
COMMENT ON COLUMN shopjoy_2604.st_settle.settle_status_cd IS '상태 (코드: SETTLE_STATUS — DRAFT/CONFIRMED/CLOSED/PAID)';
COMMENT ON COLUMN shopjoy_2604.st_settle.settle_status_cd_before IS '변경 전 상태';
COMMENT ON COLUMN shopjoy_2604.st_settle.settle_memo IS '정산 메모';
COMMENT ON COLUMN shopjoy_2604.st_settle.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.st_settle.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.st_settle.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.st_settle.upd_date IS '수정일';

CREATE INDEX idx_st_settle_status ON shopjoy_2604.st_settle USING btree (settle_status_cd);
CREATE INDEX idx_st_settle_vendor ON shopjoy_2604.st_settle USING btree (site_id, vendor_id);
CREATE INDEX idx_st_settle_ym ON shopjoy_2604.st_settle USING btree (settle_ym);
CREATE UNIQUE INDEX st_settle_site_id_vendor_id_settle_ym_key ON shopjoy_2604.st_settle USING btree (site_id, vendor_id, settle_ym);
