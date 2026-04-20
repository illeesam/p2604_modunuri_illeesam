-- ============================================================
-- st_settle_adj : 정산조정 (수동 가감 조정)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE st_settle_adj (
    settle_adj_id       VARCHAR(21)     NOT NULL,
    settle_id           VARCHAR(21)     NOT NULL,               -- st_settle.settle_id
    site_id             VARCHAR(21),
    adj_type_cd         VARCHAR(20)     NOT NULL,               -- 코드: SETTLE_ADJ_TYPE (ADD:가산/DEDUCT:차감)
    adj_amt             BIGINT          NOT NULL,               -- 조정금액 (양수)
    adj_reason          VARCHAR(200)    NOT NULL,               -- 조정 사유
    settle_adj_memo     TEXT,
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30),
    upd_date            TIMESTAMP,
    PRIMARY KEY (settle_adj_id)
);

COMMENT ON TABLE st_settle_adj IS '정산조정';
COMMENT ON COLUMN st_settle_adj.settle_adj_id  IS '정산조정ID';
COMMENT ON COLUMN st_settle_adj.settle_id      IS '정산ID (st_settle.settle_id)';
COMMENT ON COLUMN st_settle_adj.site_id        IS '사이트ID';
COMMENT ON COLUMN st_settle_adj.adj_type_cd    IS '조정유형 (코드: SETTLE_ADJ_TYPE — ADD/DEDUCT)';
COMMENT ON COLUMN st_settle_adj.adj_amt        IS '조정금액 (양수, 유형에 따라 가산/차감)';
COMMENT ON COLUMN st_settle_adj.adj_reason     IS '조정 사유';
COMMENT ON COLUMN st_settle_adj.settle_adj_memo IS '메모';
COMMENT ON COLUMN st_settle_adj.reg_by         IS '등록자';
COMMENT ON COLUMN st_settle_adj.reg_date       IS '등록일';
COMMENT ON COLUMN st_settle_adj.upd_by         IS '수정자';
COMMENT ON COLUMN st_settle_adj.upd_date       IS '수정일';

CREATE INDEX idx_st_settle_adj_settle ON st_settle_adj (settle_id);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] st_settle_adj.adj_type_cd (조정유형) : SETTLE_ADJ_TYPE { PENALTY:패널티, BONUS:보너스, ERROR_FIX:오류수정, OTHER:기타 }
