CREATE TABLE ec_claim_hist (
    claim_hist_id   VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    claim_id        VARCHAR(16)     NOT NULL,
    before_status   VARCHAR(20),
    after_status    VARCHAR(20),
    memo            VARCHAR(300),
    proc_by         VARCHAR(16),
    proc_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (claim_hist_id)
);

COMMENT ON TABLE  ec_claim_hist               IS '클레임 상태 이력';
COMMENT ON COLUMN ec_claim_hist.claim_hist_id IS '이력ID';
COMMENT ON COLUMN ec_claim_hist.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN ec_claim_hist.claim_id      IS '클레임ID';
COMMENT ON COLUMN ec_claim_hist.before_status IS '이전상태';
COMMENT ON COLUMN ec_claim_hist.after_status  IS '변경상태';
COMMENT ON COLUMN ec_claim_hist.memo          IS '처리메모';
COMMENT ON COLUMN ec_claim_hist.proc_by       IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN ec_claim_hist.proc_date     IS '처리일시';
COMMENT ON COLUMN ec_claim_hist.reg_by        IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN ec_claim_hist.reg_date      IS '등록일';
COMMENT ON COLUMN ec_claim_hist.upd_by        IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN ec_claim_hist.upd_date      IS '수정일';
