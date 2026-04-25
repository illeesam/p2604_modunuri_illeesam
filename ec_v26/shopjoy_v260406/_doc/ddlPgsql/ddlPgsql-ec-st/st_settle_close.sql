-- ============================================================
-- st_settle_close : 정산마감 이력
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE st_settle_close (
    settle_close_id     VARCHAR(21)     NOT NULL,
    settle_id           VARCHAR(21)     NOT NULL,               -- st_settle.settle_id
    site_id             VARCHAR(21),
    close_status_cd     VARCHAR(20)     NOT NULL,               -- 코드: SETTLE_CLOSE_STATUS (CLOSED:마감/REOPENED:재오픈)
    close_reason        VARCHAR(200),                           -- 마감/재오픈 사유
    final_settle_amt    BIGINT          DEFAULT 0,              -- 마감 시점 최종정산금액 스냅샷
    close_by            VARCHAR(21)     NOT NULL,               -- 처리자 (sy_user.user_id)
    close_date          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (settle_close_id)
);

COMMENT ON TABLE st_settle_close IS '정산마감 이력';
COMMENT ON COLUMN st_settle_close.settle_close_id  IS '마감이력ID';
COMMENT ON COLUMN st_settle_close.settle_id        IS '정산ID (st_settle.settle_id)';
COMMENT ON COLUMN st_settle_close.site_id          IS '사이트ID';
COMMENT ON COLUMN st_settle_close.close_status_cd  IS '마감상태 (코드: SETTLE_CLOSE_STATUS — CLOSED/REOPENED)';
COMMENT ON COLUMN st_settle_close.close_reason     IS '마감/재오픈 사유';
COMMENT ON COLUMN st_settle_close.final_settle_amt IS '마감 시점 최종정산금액 스냅샷';
COMMENT ON COLUMN st_settle_close.close_by         IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN st_settle_close.close_date       IS '처리일시';
COMMENT ON COLUMN st_settle_close.reg_by           IS '등록자';
COMMENT ON COLUMN st_settle_close.reg_date         IS '등록일';
COMMENT ON COLUMN st_settle_close.upd_by   IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN st_settle_close.upd_date IS '수정일';

CREATE INDEX idx_st_settle_close_settle ON st_settle_close (settle_id);
CREATE INDEX idx_st_settle_close_date   ON st_settle_close (close_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] st_settle_close.close_status_cd (마감상태) : SETTLE_CLOSE_STATUS { DRAFT:초안, CONFIRMED:확정, PAID:지급완료 }
