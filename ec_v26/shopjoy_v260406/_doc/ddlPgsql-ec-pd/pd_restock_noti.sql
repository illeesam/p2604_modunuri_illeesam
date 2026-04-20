-- ============================================================
CREATE TABLE pd_restock_noti (
    restock_noti_id VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    prod_id         VARCHAR(21)     NOT NULL,               -- pd_prod.prod_id
    sku_id          VARCHAR(21),                            -- pd_prod_sku.sku_id
    member_id       VARCHAR(21)     NOT NULL,               -- mb_member.member_id
    noti_yn         VARCHAR(1)      DEFAULT 'N',            -- 알림 발송 여부
    noti_date       TIMESTAMP,                              -- 알림 발송 일시
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (restock_noti_id),
    UNIQUE (prod_id, sku_id, member_id)
);

COMMENT ON TABLE pd_restock_noti IS '재입고알림 신청';
COMMENT ON COLUMN pd_restock_noti.restock_noti_id IS '재입고알림ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pd_restock_noti.site_id         IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pd_restock_noti.prod_id         IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN pd_restock_noti.sku_id          IS 'SKUID (pd_prod_sku.sku_id)';
COMMENT ON COLUMN pd_restock_noti.member_id       IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN pd_restock_noti.noti_yn         IS '알림발송여부 Y/N';
COMMENT ON COLUMN pd_restock_noti.noti_date       IS '알림발송일시';
COMMENT ON COLUMN pd_restock_noti.reg_by          IS '등록자ID';
COMMENT ON COLUMN pd_restock_noti.reg_date        IS '등록일시';
COMMENT ON COLUMN pd_restock_noti.upd_by          IS '수정자ID';
COMMENT ON COLUMN pd_restock_noti.upd_date        IS '수정일시';

CREATE INDEX idx_pd_restock_noti_prod   ON pd_restock_noti (prod_id);
CREATE INDEX idx_pd_restock_noti_member ON pd_restock_noti (member_id);
CREATE INDEX idx_pd_restock_noti_noti   ON pd_restock_noti (noti_yn);
