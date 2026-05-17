-- od_order_item 테이블 DDL
-- 주문상품

CREATE TABLE shopjoy_2604.od_order_item (
    order_item_id               VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id                     VARCHAR(21)  NOT NULL,
    order_id                    VARCHAR(21)  NOT NULL,
    prod_id                     VARCHAR(21)  NOT NULL,
    sku_id                      VARCHAR(21) ,
    opt_item_id_1               VARCHAR(21) ,
    opt_item_id_2               VARCHAR(21) ,
    prod_nm                     VARCHAR(200),
    brand_nm                    VARCHAR(100),
    dliv_tmplt_id               VARCHAR(21) ,
    normal_price                BIGINT       DEFAULT 0,
    unit_price                  BIGINT       DEFAULT 0,
    order_qty                   INTEGER      DEFAULT 1,
    item_order_amt              BIGINT       DEFAULT 0,
    cancel_qty                  INTEGER      DEFAULT 0,
    item_cancel_amt             BIGINT       DEFAULT 0,
    complet_qty                 INTEGER      DEFAULT 0,
    item_completed_amt          BIGINT       DEFAULT 0,
    org_unit_price              BIGINT      ,
    org_item_order_amt          BIGINT      ,
    org_discount_amt            BIGINT      ,
    org_shipping_fee            BIGINT      ,
    save_rate                   NUMERIC(5,2),
    save_use_amt                BIGINT       DEFAULT 0,
    save_schd_amt               BIGINT       DEFAULT 0,
    order_item_status_cd        VARCHAR(20)  DEFAULT 'ORDERED'::character varying,
    order_item_status_cd_before VARCHAR(20) ,
    claim_yn                    VARCHAR(1)   DEFAULT 'N'::bpchar,
    buy_confirm_yn              VARCHAR(1)   DEFAULT 'N'::bpchar,
    buy_confirm_schd_date       DATE        ,
    buy_confirm_date            TIMESTAMP   ,
    settle_yn                   VARCHAR(1)   DEFAULT 'N'::bpchar,
    settle_date                 TIMESTAMP   ,
    reserve_sale_yn             VARCHAR(1)   DEFAULT 'N'::bpchar,
    reserve_dliv_schd_date      TIMESTAMP   ,
    bundle_group_id             VARCHAR(36) ,
    bundle_price_rate           NUMERIC(5,2),
    gift_id                     VARCHAR(21) ,
    outbound_shipping_fee       BIGINT       DEFAULT 0,
    dliv_courier_cd             VARCHAR(30) ,
    dliv_tracking_no            VARCHAR(100),
    dliv_ship_date              TIMESTAMP   ,
    reg_by                      VARCHAR(30) ,
    reg_date                    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by                      VARCHAR(30) ,
    upd_date                    TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.od_order_item IS '주문상품';
COMMENT ON COLUMN shopjoy_2604.od_order_item.order_item_id IS '주문상품ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.od_order_item.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.od_order_item.order_id IS '주문ID (od_order.)';
COMMENT ON COLUMN shopjoy_2604.od_order_item.prod_id IS '상품ID (pd_prod.)';
COMMENT ON COLUMN shopjoy_2604.od_order_item.sku_id IS 'SKU ID (pd_prod_sku., 무옵션 시 NULL)';
COMMENT ON COLUMN shopjoy_2604.od_order_item.opt_item_id_1 IS '옵션1 값ID (pd_prod_opt_item.opt_item_id)';
COMMENT ON COLUMN shopjoy_2604.od_order_item.opt_item_id_2 IS '옵션2 값ID (pd_prod_opt_item.opt_item_id)';
COMMENT ON COLUMN shopjoy_2604.od_order_item.prod_nm IS '상품명 (주문 시점 스냅샷)';
COMMENT ON COLUMN shopjoy_2604.od_order_item.brand_nm IS '브랜드명 (주문 시점 스냅샷)';
COMMENT ON COLUMN shopjoy_2604.od_order_item.dliv_tmplt_id IS '배송비 템플릿ID 스냅샷';
COMMENT ON COLUMN shopjoy_2604.od_order_item.normal_price IS '정상가 (할인 전 1ea 가격)';
COMMENT ON COLUMN shopjoy_2604.od_order_item.unit_price IS '판매가 (단가, 옵션 추가금액 포함)';
COMMENT ON COLUMN shopjoy_2604.od_order_item.order_qty IS '주문수량';
COMMENT ON COLUMN shopjoy_2604.od_order_item.item_order_amt IS '주문금액 (unit_price × order_qty)';
COMMENT ON COLUMN shopjoy_2604.od_order_item.cancel_qty IS '취소수량';
COMMENT ON COLUMN shopjoy_2604.od_order_item.item_cancel_amt IS '취소금액 (클레임 누적 취소액)';
COMMENT ON COLUMN shopjoy_2604.od_order_item.complet_qty IS '판매완료수량';
COMMENT ON COLUMN shopjoy_2604.od_order_item.item_completed_amt IS '완료금액 (item_order_amt - item_cancel_amt)';
COMMENT ON COLUMN shopjoy_2604.od_order_item.org_unit_price IS '원 단가 (주문 확정 시점 스냅샷)';
COMMENT ON COLUMN shopjoy_2604.od_order_item.org_item_order_amt IS '원 주문금액 (주문 확정 시점 스냅샷)';
COMMENT ON COLUMN shopjoy_2604.od_order_item.org_discount_amt IS '원 할인금액 (주문 확정 시점 스냅샷)';
COMMENT ON COLUMN shopjoy_2604.od_order_item.org_shipping_fee IS '원 배송료 (주문 확정 시점 스냅샷)';
COMMENT ON COLUMN shopjoy_2604.od_order_item.save_rate IS '주문 시점 적립율 (%)';
COMMENT ON COLUMN shopjoy_2604.od_order_item.save_use_amt IS '사용 적립금 (주문상품별 안분금액)';
COMMENT ON COLUMN shopjoy_2604.od_order_item.save_schd_amt IS '적립 예정금액 (구매확정 전=예상, 확정 후=실적립)';
COMMENT ON COLUMN shopjoy_2604.od_order_item.order_item_status_cd IS '품목 주문 상태 (코드: ORDER_ITEM_STATUS — ORDERED/PAID/PREPARING/SHIPPING/DELIVERED/CONFIRMED/CANCELLED)';
COMMENT ON COLUMN shopjoy_2604.od_order_item.order_item_status_cd_before IS '변경 전 품목상태 (코드: ORDER_ITEM_STATUS)';
COMMENT ON COLUMN shopjoy_2604.od_order_item.claim_yn IS '클레임 진행 중 여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.od_order_item.buy_confirm_yn IS '구매확정여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.od_order_item.buy_confirm_schd_date IS '구매확정 예정일 (배송완료 + N일 자동 설정)';
COMMENT ON COLUMN shopjoy_2604.od_order_item.buy_confirm_date IS '구매확정일시';
COMMENT ON COLUMN shopjoy_2604.od_order_item.settle_yn IS '정산처리여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.od_order_item.settle_date IS '정산처리일시';
COMMENT ON COLUMN shopjoy_2604.od_order_item.reserve_sale_yn IS '예약판매여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.od_order_item.reserve_dliv_schd_date IS '예약판매 발송 예정일시';
COMMENT ON COLUMN shopjoy_2604.od_order_item.bundle_group_id IS '묶음 그룹키 (동일 묶음 구성품 식별, UUID, 일반상품=NULL)';
COMMENT ON COLUMN shopjoy_2604.od_order_item.bundle_price_rate IS '묶음 가격 안분율 (%) — 부분클레임 환불 계산 기준';
COMMENT ON COLUMN shopjoy_2604.od_order_item.gift_id IS '발급 사은품ID (pm_gift.gift_id)';
COMMENT ON COLUMN shopjoy_2604.od_order_item.outbound_shipping_fee IS '해당 항목의 배송료 (부분배송 시)';
COMMENT ON COLUMN shopjoy_2604.od_order_item.dliv_courier_cd IS '해당 항목의 배송 택배사 (코드: COURIER)';
COMMENT ON COLUMN shopjoy_2604.od_order_item.dliv_tracking_no IS '해당 항목의 배송 송장번호';
COMMENT ON COLUMN shopjoy_2604.od_order_item.dliv_ship_date IS '해당 항목의 출고일시';
COMMENT ON COLUMN shopjoy_2604.od_order_item.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.od_order_item.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.od_order_item.upd_by IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.od_order_item.upd_date IS '수정일';

CREATE INDEX idx_od_order_item_bundle ON shopjoy_2604.od_order_item USING btree (bundle_group_id) WHERE (bundle_group_id IS NOT NULL);
CREATE INDEX idx_od_order_item_confirm ON shopjoy_2604.od_order_item USING btree (buy_confirm_yn, buy_confirm_schd_date);
CREATE INDEX idx_od_order_item_order ON shopjoy_2604.od_order_item USING btree (order_id);
CREATE INDEX idx_od_order_item_prod ON shopjoy_2604.od_order_item USING btree (prod_id);
CREATE INDEX idx_od_order_item_settle ON shopjoy_2604.od_order_item USING btree (settle_yn);
CREATE INDEX idx_od_order_item_site ON shopjoy_2604.od_order_item USING btree (site_id);
CREATE INDEX idx_od_order_item_status ON shopjoy_2604.od_order_item USING btree (order_item_status_cd);
