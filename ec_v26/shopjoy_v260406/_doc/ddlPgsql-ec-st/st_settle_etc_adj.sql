-- ============================================================
-- st_settle_etc_adj : 정산 기타조정 (배송비/반품비/위약금 등)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE st_settle_etc_adj (
    settle_etc_adj_id   VARCHAR(21)     NOT NULL,
    settle_id           VARCHAR(21)     NOT NULL,               -- st_settle.settle_id
    site_id             VARCHAR(21),
    etc_adj_type_cd     VARCHAR(20)     NOT NULL,               -- 코드: SETTLE_ETC_ADJ_TYPE (SHIP:배송비/RETURN_SHIP:반품배송비/PENALTY:위약금/OTHER:기타)
    etc_adj_dir_cd      VARCHAR(10)     NOT NULL,               -- 코드: ADJ_DIR (ADD:가산/DEDUCT:차감)
    etc_adj_amt         BIGINT          NOT NULL,               -- 기타조정 금액
    etc_adj_reason      VARCHAR(200)    NOT NULL,               -- 사유
    settle_etc_adj_memo TEXT,
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30),
    upd_date            TIMESTAMP,
    PRIMARY KEY (settle_etc_adj_id)
);

COMMENT ON TABLE st_settle_etc_adj IS '정산 기타조정';
COMMENT ON COLUMN st_settle_etc_adj.settle_etc_adj_id IS '기타조정ID';
COMMENT ON COLUMN st_settle_etc_adj.settle_id         IS '정산ID (st_settle.settle_id)';
COMMENT ON COLUMN st_settle_etc_adj.site_id           IS '사이트ID';
COMMENT ON COLUMN st_settle_etc_adj.etc_adj_type_cd   IS '기타조정유형 (코드: SETTLE_ETC_ADJ_TYPE — SHIP/RETURN_SHIP/PENALTY/OTHER)';
COMMENT ON COLUMN st_settle_etc_adj.etc_adj_dir_cd    IS '가산/차감 (코드: ADJ_DIR — ADD/DEDUCT)';
COMMENT ON COLUMN st_settle_etc_adj.etc_adj_amt       IS '기타조정 금액';
COMMENT ON COLUMN st_settle_etc_adj.etc_adj_reason    IS '사유';
COMMENT ON COLUMN st_settle_etc_adj.settle_etc_adj_memo IS '메모';
COMMENT ON COLUMN st_settle_etc_adj.reg_by            IS '등록자';
COMMENT ON COLUMN st_settle_etc_adj.reg_date          IS '등록일';
COMMENT ON COLUMN st_settle_etc_adj.upd_by            IS '수정자';
COMMENT ON COLUMN st_settle_etc_adj.upd_date          IS '수정일';

CREATE INDEX idx_st_settle_etc_adj_settle ON st_settle_etc_adj (settle_id);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] st_settle_etc_adj.etc_adj_type_cd (기타조정유형) : SETTLE_ADJ_TYPE { PENALTY:패널티, BONUS:보너스, ERROR_FIX:오류수정, OTHER:기타 }
-- [CODES] st_settle_etc_adj.etc_adj_dir_cd (가산/차감) : ADJ_DIR { ADD:가산, SUB:차감 }
