-- st_settle_adj 테이블 DDL
-- 정산조정

CREATE TABLE shopjoy_2604.st_settle_adj (
    settle_adj_id   VARCHAR(21)  NOT NULL PRIMARY KEY,
    settle_id       VARCHAR(21)  NOT NULL,
    site_id         VARCHAR(21) ,
    adj_type_cd     VARCHAR(20)  NOT NULL,
    adj_amt         BIGINT       NOT NULL,
    adj_reason      VARCHAR(200) NOT NULL,
    settle_adj_memo TEXT        ,
    reg_by          VARCHAR(30) ,
    reg_date        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30) ,
    upd_date        TIMESTAMP   ,
    aprv_status_cd  VARCHAR(20) 
);

COMMENT ON TABLE  shopjoy_2604.st_settle_adj IS '정산조정';
COMMENT ON COLUMN shopjoy_2604.st_settle_adj.settle_adj_id IS '정산조정ID';
COMMENT ON COLUMN shopjoy_2604.st_settle_adj.settle_id IS '정산ID (st_settle.settle_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_adj.site_id IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.st_settle_adj.adj_type_cd IS '조정유형 (코드: SETTLE_ADJ_TYPE — ADD/DEDUCT)';
COMMENT ON COLUMN shopjoy_2604.st_settle_adj.adj_amt IS '조정금액 (양수, 유형에 따라 가산/차감)';
COMMENT ON COLUMN shopjoy_2604.st_settle_adj.adj_reason IS '조정 사유';
COMMENT ON COLUMN shopjoy_2604.st_settle_adj.settle_adj_memo IS '메모';
COMMENT ON COLUMN shopjoy_2604.st_settle_adj.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.st_settle_adj.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.st_settle_adj.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.st_settle_adj.upd_date IS '수정일';
COMMENT ON COLUMN shopjoy_2604.st_settle_adj.aprv_status_cd IS '승인상태 (코드: SETTLE_ADJ_STATUS — 대기/승인/반려)';

CREATE INDEX idx_st_settle_adj_settle ON shopjoy_2604.st_settle_adj USING btree (settle_id);
