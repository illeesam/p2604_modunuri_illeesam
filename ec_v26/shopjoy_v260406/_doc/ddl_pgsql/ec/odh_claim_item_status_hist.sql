-- odh_claim_item_status_hist 테이블 DDL
-- 클레임상품 상태 이력

CREATE TABLE shopjoy_2604.odh_claim_item_status_hist (
    claim_item_status_hist_id   VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id                     VARCHAR(21)  NOT NULL,
    claim_item_id               VARCHAR(21)  NOT NULL,
    claim_id                    VARCHAR(21) ,
    order_item_id               VARCHAR(21) ,
    claim_item_status_cd_before VARCHAR(20) ,
    claim_item_status_cd        VARCHAR(20) ,
    status_reason               VARCHAR(300),
    chg_user_id                 VARCHAR(21) ,
    chg_date                    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    memo                        VARCHAR(300),
    reg_by                      VARCHAR(30) ,
    reg_date                    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by                      VARCHAR(30) ,
    upd_date                    TIMESTAMP   ,
    CONSTRAINT fk_odh_claim_item_status_hist_item FOREIGN KEY (claim_item_id) REFERENCES shopjoy_2604.od_claim_item (claim_item_id)
);

COMMENT ON TABLE  shopjoy_2604.odh_claim_item_status_hist IS '클레임상품 상태 이력';
COMMENT ON COLUMN shopjoy_2604.odh_claim_item_status_hist.claim_item_status_hist_id IS '클레임상품상태이력ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.odh_claim_item_status_hist.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.odh_claim_item_status_hist.claim_item_id IS '클레임상품ID (od_claim_item.claim_item_id)';
COMMENT ON COLUMN shopjoy_2604.odh_claim_item_status_hist.claim_id IS '클레임ID (od_claim.claim_id)';
COMMENT ON COLUMN shopjoy_2604.odh_claim_item_status_hist.order_item_id IS '주문상품ID (od_order_item.order_item_id)';
COMMENT ON COLUMN shopjoy_2604.odh_claim_item_status_hist.claim_item_status_cd_before IS '변경 전 클레임상품상태 (코드: CLAIM_ITEM_STATUS)';
COMMENT ON COLUMN shopjoy_2604.odh_claim_item_status_hist.claim_item_status_cd IS '변경 후 클레임상품상태 (코드: CLAIM_ITEM_STATUS)';
COMMENT ON COLUMN shopjoy_2604.odh_claim_item_status_hist.status_reason IS '상태 변경 사유';
COMMENT ON COLUMN shopjoy_2604.odh_claim_item_status_hist.chg_user_id IS '변경 담당자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.odh_claim_item_status_hist.chg_date IS '변경 일시';
COMMENT ON COLUMN shopjoy_2604.odh_claim_item_status_hist.memo IS '메모';
COMMENT ON COLUMN shopjoy_2604.odh_claim_item_status_hist.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.odh_claim_item_status_hist.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.odh_claim_item_status_hist.upd_by IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.odh_claim_item_status_hist.upd_date IS '수정일';

CREATE INDEX idx_od_ci_status_hist_claim ON shopjoy_2604.odh_claim_item_status_hist USING btree (claim_id);
CREATE INDEX idx_od_ci_status_hist_date ON shopjoy_2604.odh_claim_item_status_hist USING btree (chg_date);
CREATE INDEX idx_od_ci_status_hist_item ON shopjoy_2604.odh_claim_item_status_hist USING btree (claim_item_id);
CREATE INDEX idx_od_ci_status_hist_oi ON shopjoy_2604.odh_claim_item_status_hist USING btree (order_item_id);
CREATE INDEX idx_odh_claim_item_status_hist_site ON shopjoy_2604.odh_claim_item_status_hist USING btree (site_id);
