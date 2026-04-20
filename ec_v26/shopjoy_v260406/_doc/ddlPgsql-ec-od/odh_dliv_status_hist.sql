-- 배송 상태 이력
CREATE TABLE odh_dliv_status_hist (
    dliv_status_hist_id    VARCHAR(21)     NOT NULL,
    site_id                VARCHAR(21),                            -- sy_site.site_id
    dliv_id                VARCHAR(21)     NOT NULL,               -- od_dliv.dliv_id
    order_id               VARCHAR(21),                            -- od_order.order_id (조회 편의)
    dliv_status_cd_before  VARCHAR(20),                            -- 변경 전 배송상태 (코드: DLIV_STATUS)
    dliv_status_cd         VARCHAR(20),                            -- 변경 후 배송상태 (코드: DLIV_STATUS)
    status_reason          VARCHAR(300),                           -- 상태 변경 사유
    chg_user_id            VARCHAR(21),                            -- 변경 담당자 (sy_user.user_id, mb_member.member_id)
    chg_date               TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    memo                   VARCHAR(300),
    reg_by                 VARCHAR(30),
    reg_date               TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by                 VARCHAR(30),
    upd_date               TIMESTAMP,
    PRIMARY KEY (dliv_status_hist_id),
    CONSTRAINT fk_odh_dliv_status_hist_dliv FOREIGN KEY (dliv_id) REFERENCES od_dliv (dliv_id)
);

COMMENT ON TABLE odh_dliv_status_hist IS '배송 상태 이력';
COMMENT ON COLUMN odh_dliv_status_hist.dliv_status_hist_id  IS '배송상태이력ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN odh_dliv_status_hist.site_id              IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN odh_dliv_status_hist.dliv_id              IS '배송ID (od_dliv.dliv_id)';
COMMENT ON COLUMN odh_dliv_status_hist.order_id             IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN odh_dliv_status_hist.dliv_status_cd_before IS '변경 전 배송상태 (코드: DLIV_STATUS)';
COMMENT ON COLUMN odh_dliv_status_hist.dliv_status_cd       IS '변경 후 배송상태 (코드: DLIV_STATUS)';
COMMENT ON COLUMN odh_dliv_status_hist.status_reason        IS '상태 변경 사유';
COMMENT ON COLUMN odh_dliv_status_hist.chg_user_id          IS '변경 담당자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_dliv_status_hist.chg_date             IS '변경 일시';
COMMENT ON COLUMN odh_dliv_status_hist.memo                 IS '메모';
COMMENT ON COLUMN odh_dliv_status_hist.reg_by               IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_dliv_status_hist.reg_date             IS '등록일';
COMMENT ON COLUMN odh_dliv_status_hist.upd_by               IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_dliv_status_hist.upd_date             IS '수정일';

CREATE INDEX idx_odh_dliv_status_hist_dliv  ON odh_dliv_status_hist (dliv_id);
CREATE INDEX idx_odh_dliv_status_hist_order ON odh_dliv_status_hist (order_id);
CREATE INDEX idx_odh_dliv_status_hist_date  ON odh_dliv_status_hist (chg_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] odh_dliv_status_hist.dliv_status_cd (변경 후 배송상태) : 배송상태 { READY:준비중, SHIPPED:출고완료, IN_TRANSIT:배송중, DELIVERED:배송완료, FAILED:배송실패 }
