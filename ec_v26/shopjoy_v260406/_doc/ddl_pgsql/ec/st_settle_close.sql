-- st_settle_close 테이블 DDL
-- 정산마감 이력

CREATE TABLE shopjoy_2604.st_settle_close (
    settle_close_id  VARCHAR(21)  NOT NULL PRIMARY KEY,
    settle_id        VARCHAR(21)  NOT NULL,
    site_id          VARCHAR(21) ,
    close_status_cd  VARCHAR(20)  NOT NULL,
    close_reason     VARCHAR(200),
    final_settle_amt BIGINT       DEFAULT 0,
    close_by         VARCHAR(20)  NOT NULL,
    close_date       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    reg_by           VARCHAR(30) ,
    reg_date         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by           VARCHAR(30) ,
    upd_date         TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.st_settle_close IS '정산마감 이력';
COMMENT ON COLUMN shopjoy_2604.st_settle_close.settle_close_id IS '마감이력ID';
COMMENT ON COLUMN shopjoy_2604.st_settle_close.settle_id IS '정산ID (st_settle.settle_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_close.site_id IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.st_settle_close.close_status_cd IS '마감상태 (코드: SETTLE_CLOSE_STATUS — CLOSED/REOPENED)';
COMMENT ON COLUMN shopjoy_2604.st_settle_close.close_reason IS '마감/재오픈 사유';
COMMENT ON COLUMN shopjoy_2604.st_settle_close.final_settle_amt IS '마감 시점 최종정산금액 스냅샷';
COMMENT ON COLUMN shopjoy_2604.st_settle_close.close_by IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_close.close_date IS '처리일시';
COMMENT ON COLUMN shopjoy_2604.st_settle_close.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.st_settle_close.reg_date IS '등록일';

CREATE INDEX idx_st_settle_close_date ON shopjoy_2604.st_settle_close USING btree (close_date);
CREATE INDEX idx_st_settle_close_settle ON shopjoy_2604.st_settle_close USING btree (settle_id);
