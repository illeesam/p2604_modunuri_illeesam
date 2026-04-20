-- ============================================================
-- st_settle : 정산 마스터 (업체별 정산 집계)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE st_settle (
    settle_id           VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21)     NOT NULL,
    vendor_id           VARCHAR(21)     NOT NULL,               -- sy_vendor.vendor_id
    settle_ym           CHAR(6)         NOT NULL,               -- 정산년월 (YYYYMM)
    settle_start_date   TIMESTAMP       NOT NULL,               -- 정산 기준시작일
    settle_end_date     TIMESTAMP       NOT NULL,               -- 정산 기준종료일
    total_order_amt     BIGINT          DEFAULT 0,              -- 총 주문금액 (당월 신규 주문 귀속)
    total_return_amt    BIGINT          DEFAULT 0,              -- 총 환불금액 (당월 귀속 환불 — 타월 주문 환불 포함)
    total_claim_cnt     INTEGER         DEFAULT 0,              -- 환불 건수 (raw_type_cd=CLAIM 집계)
    total_discnt_amt    BIGINT          DEFAULT 0,              -- 총 할인금액
    commission_rate     NUMERIC(5,2)    DEFAULT 0,              -- 적용 수수료율
    commission_amt      BIGINT          DEFAULT 0,              -- 수수료금액
    settle_amt          BIGINT          DEFAULT 0,              -- 기본 정산금액 (total_order_amt - total_return_amt - total_discnt_amt - commission_amt)
    adj_amt             BIGINT          DEFAULT 0,              -- 정산조정 합계금액
    etc_adj_amt         BIGINT          DEFAULT 0,              -- 기타조정 합계금액
    final_settle_amt    BIGINT          DEFAULT 0,              -- 최종정산금액 (settle_amt + adj_amt + etc_adj_amt)
    settle_status_cd    VARCHAR(20)     DEFAULT 'DRAFT',        -- 코드: SETTLE_STATUS (DRAFT:작성중/CONFIRMED:확정/CLOSED:마감/PAID:지급완료)
    settle_status_cd_before VARCHAR(20),
    settle_memo         TEXT,                                   -- 정산 메모
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30),
    upd_date            TIMESTAMP,
    PRIMARY KEY (settle_id),
    UNIQUE (site_id, vendor_id, settle_ym)
);

COMMENT ON TABLE st_settle IS '정산 마스터 (업체별 월정산)';
COMMENT ON COLUMN st_settle.settle_id           IS '정산ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN st_settle.site_id             IS '사이트ID';
COMMENT ON COLUMN st_settle.vendor_id           IS '업체ID (sy_vendor.vendor_id)';
COMMENT ON COLUMN st_settle.settle_ym           IS '정산년월 (YYYYMM)';
COMMENT ON COLUMN st_settle.settle_start_date   IS '정산 기준 시작일';
COMMENT ON COLUMN st_settle.settle_end_date     IS '정산 기준 종료일';
COMMENT ON COLUMN st_settle.total_order_amt     IS '총 주문금액 (당월 신규 주문 귀속)';
COMMENT ON COLUMN st_settle.total_return_amt    IS '총 환불금액 (환불 확정월 귀속 — 타월 주문 환불 포함)';
COMMENT ON COLUMN st_settle.total_claim_cnt     IS '환불 건수 (st_settle_raw.raw_type_cd=CLAIM 집계)';
COMMENT ON COLUMN st_settle.total_discnt_amt    IS '총 할인금액';
COMMENT ON COLUMN st_settle.commission_rate     IS '적용 수수료율 (%)';
COMMENT ON COLUMN st_settle.commission_amt      IS '수수료금액';
COMMENT ON COLUMN st_settle.settle_amt          IS '기본 정산금액';
COMMENT ON COLUMN st_settle.adj_amt             IS '정산조정 합계';
COMMENT ON COLUMN st_settle.etc_adj_amt         IS '기타조정 합계';
COMMENT ON COLUMN st_settle.final_settle_amt    IS '최종 정산금액';
COMMENT ON COLUMN st_settle.settle_status_cd    IS '상태 (코드: SETTLE_STATUS — DRAFT/CONFIRMED/CLOSED/PAID)';
COMMENT ON COLUMN st_settle.settle_status_cd_before IS '변경 전 상태';
COMMENT ON COLUMN st_settle.settle_memo         IS '정산 메모';
COMMENT ON COLUMN st_settle.reg_by              IS '등록자';
COMMENT ON COLUMN st_settle.reg_date            IS '등록일';
COMMENT ON COLUMN st_settle.upd_by              IS '수정자';
COMMENT ON COLUMN st_settle.upd_date            IS '수정일';

CREATE INDEX idx_st_settle_vendor ON st_settle (site_id, vendor_id);
CREATE INDEX idx_st_settle_ym     ON st_settle (settle_ym);
CREATE INDEX idx_st_settle_status ON st_settle (settle_status_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] st_settle.settle_status_cd (상태) : SETTLE_STATUS { OPEN:진행중, CLOSED:마감, CANCELLED:취소 }
