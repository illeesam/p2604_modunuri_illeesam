-- st_settle_etc_adj 테이블 DDL
-- 정산 기타조정

CREATE TABLE shopjoy_2604.st_settle_etc_adj (
    settle_etc_adj_id   VARCHAR(21)  NOT NULL PRIMARY KEY,
    settle_id           VARCHAR(21)  NOT NULL,
    site_id             VARCHAR(21)  NOT NULL,
    etc_adj_type_cd     VARCHAR(20)  NOT NULL,
    etc_adj_dir_cd      VARCHAR(10)  NOT NULL,
    etc_adj_amt         BIGINT       NOT NULL,
    etc_adj_reason      VARCHAR(200) NOT NULL,
    settle_etc_adj_memo TEXT        ,
    reg_by              VARCHAR(30) ,
    reg_date            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30) ,
    upd_date            TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.st_settle_etc_adj IS '정산 기타조정';
COMMENT ON COLUMN shopjoy_2604.st_settle_etc_adj.settle_etc_adj_id IS '기타조정ID';
COMMENT ON COLUMN shopjoy_2604.st_settle_etc_adj.settle_id IS '정산ID (st_settle.settle_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_etc_adj.site_id IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.st_settle_etc_adj.etc_adj_type_cd IS '기타조정유형 (코드: SETTLE_ETC_ADJ_TYPE — SHIP/RETURN_SHIP/PENALTY/OTHER)';
COMMENT ON COLUMN shopjoy_2604.st_settle_etc_adj.etc_adj_dir_cd IS '가산/차감 (코드: ADJ_DIR — ADD/DEDUCT)';
COMMENT ON COLUMN shopjoy_2604.st_settle_etc_adj.etc_adj_amt IS '기타조정 금액';
COMMENT ON COLUMN shopjoy_2604.st_settle_etc_adj.etc_adj_reason IS '사유';
COMMENT ON COLUMN shopjoy_2604.st_settle_etc_adj.settle_etc_adj_memo IS '메모';
COMMENT ON COLUMN shopjoy_2604.st_settle_etc_adj.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.st_settle_etc_adj.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.st_settle_etc_adj.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.st_settle_etc_adj.upd_date IS '수정일';

CREATE INDEX idx_st_settle_etc_adj_settle ON shopjoy_2604.st_settle_etc_adj USING btree (settle_id);
CREATE INDEX idx_st_settle_etc_adj_site ON shopjoy_2604.st_settle_etc_adj USING btree (site_id);
