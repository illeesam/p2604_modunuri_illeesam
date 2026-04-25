-- 주문 상태 이력
CREATE TABLE odh_order_status_hist (
    order_status_hist_id    VARCHAR(21)     NOT NULL,
    site_id                 VARCHAR(21),                            -- sy_site.site_id
    order_id                VARCHAR(21)     NOT NULL,               -- od_order.order_id
    order_status_cd_before  VARCHAR(20),                            -- 변경 전 주문상태 (코드: ORDER_STATUS)
    order_status_cd         VARCHAR(20),                            -- 변경 후 주문상태 (코드: ORDER_STATUS)
    status_reason           VARCHAR(300),                           -- 상태 변경 사유
    chg_user_id             VARCHAR(21),                            -- 변경 담당자 (sy_user.user_id, mb_member.member_id)
    chg_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    memo                    VARCHAR(300),
    reg_by                  VARCHAR(30),
    reg_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by                  VARCHAR(30),
    upd_date                TIMESTAMP,
    PRIMARY KEY (order_status_hist_id),
    CONSTRAINT fk_odh_order_status_hist_order FOREIGN KEY (order_id) REFERENCES od_order (order_id)
);

COMMENT ON TABLE odh_order_status_hist IS '주문 상태 이력';
COMMENT ON COLUMN odh_order_status_hist.order_status_hist_id   IS '주문상태이력ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN odh_order_status_hist.site_id                IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN odh_order_status_hist.order_id               IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN odh_order_status_hist.order_status_cd_before IS '변경 전 주문상태 (코드: ORDER_STATUS)';
COMMENT ON COLUMN odh_order_status_hist.order_status_cd        IS '변경 후 주문상태 (코드: ORDER_STATUS)';
COMMENT ON COLUMN odh_order_status_hist.status_reason          IS '상태 변경 사유';
COMMENT ON COLUMN odh_order_status_hist.chg_user_id            IS '변경 담당자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_order_status_hist.chg_date               IS '변경 일시';
COMMENT ON COLUMN odh_order_status_hist.memo                   IS '메모';
COMMENT ON COLUMN odh_order_status_hist.reg_by                 IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_order_status_hist.reg_date               IS '등록일';
COMMENT ON COLUMN odh_order_status_hist.upd_by                 IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_order_status_hist.upd_date               IS '수정일';

CREATE INDEX idx_odh_order_status_hist_order ON odh_order_status_hist (order_id);
CREATE INDEX idx_odh_order_status_hist_date  ON odh_order_status_hist (chg_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] odh_order_status_hist.order_status_cd (변경 후 주문상태) : 주문상태 { PENDING:입금대기, PAID:결제완료, PREPARING:상품준비중, SHIPPED:배송중, DELIVERED:배송완료, COMPLT:구매확정, CANCELLED:취소, AUTO_CANCELLED:자동취소 }
