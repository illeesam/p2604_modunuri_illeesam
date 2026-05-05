-- st_settle_raw 테이블 DDL
-- 정산 수집원장 (od_order_item / od_claim_item 기반 정산 원천 데이터, 통계·분석 기반 테이블)

CREATE TABLE shopjoy_2604.st_settle_raw (
    settle_raw_id        VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id              VARCHAR(21)  NOT NULL,
    raw_type_cd          VARCHAR(20)  NOT NULL,
    raw_status_cd        VARCHAR(20)  DEFAULT 'PENDING',
    raw_status_cd_before VARCHAR(20) ,
    order_id             VARCHAR(21)  NOT NULL,
    order_no             VARCHAR(30) ,
    order_item_id        VARCHAR(21)  NOT NULL,
    order_date           TIMESTAMP   ,
    order_item_status_cd VARCHAR(20) ,
    member_id            VARCHAR(21) ,
    claim_id             VARCHAR(21) ,
    claim_item_id        VARCHAR(21) ,
    vendor_id            VARCHAR(21) ,
    vendor_type_cd       VARCHAR(20) ,
    prod_id              VARCHAR(21) ,
    prod_nm              VARCHAR(200),
    brand_id             VARCHAR(21) ,
    brand_nm             VARCHAR(100),
    category_id_1        VARCHAR(21) ,
    category_id_2        VARCHAR(21) ,
    category_id_3        VARCHAR(21) ,
    category_id_4        VARCHAR(21) ,
    category_id_5        VARCHAR(21) ,
    sku_id               VARCHAR(21) ,
    opt_item_id_1        VARCHAR(21) ,
    opt_item_id_2        VARCHAR(21) ,
    md_user_id           VARCHAR(21) ,
    normal_price         BIGINT       DEFAULT 0,
    unit_price           BIGINT       DEFAULT 0,
    order_qty            INTEGER      DEFAULT 0,
    item_price           BIGINT       DEFAULT 0,
    discnt_amt           BIGINT       DEFAULT 0,
    coupon_discnt_amt    BIGINT       DEFAULT 0,
    promo_discnt_amt     BIGINT       DEFAULT 0,
    promo_id             VARCHAR(21) ,
    coupon_id            VARCHAR(21) ,
    coupon_issue_id      VARCHAR(21) ,
    discnt_id            VARCHAR(21) ,
    voucher_id           VARCHAR(21) ,
    voucher_issue_id     VARCHAR(21) ,
    voucher_use_amt      BIGINT       DEFAULT 0,
    cache_use_amt        BIGINT       DEFAULT 0,
    mileage_use_amt      BIGINT       DEFAULT 0,
    save_schd_amt        BIGINT       DEFAULT 0,
    gift_id              VARCHAR(21) ,
    gift_amt             BIGINT       DEFAULT 0,
    pay_method_cd        VARCHAR(20) ,
    buy_confirm_yn       VARCHAR(1)   DEFAULT 'N',
    buy_confirm_date     TIMESTAMP   ,
    bundle_price_rate    NUMERIC(5,2),
    settle_target_amt    BIGINT       DEFAULT 0,
    settle_fee_rate      NUMERIC(5,2) DEFAULT 0,
    settle_fee_amt       BIGINT       DEFAULT 0,
    settle_amt           BIGINT       DEFAULT 0,
    settle_period        VARCHAR(7)  ,
    settle_id            VARCHAR(21) ,
    close_yn             VARCHAR(1)   DEFAULT 'N',
    close_date           TIMESTAMP   ,
    settle_close_id      VARCHAR(21) ,
    erp_voucher_id       VARCHAR(21) ,
    erp_voucher_line_no  INTEGER     ,
    erp_send_yn          VARCHAR(1)   DEFAULT 'N',
    erp_send_date        TIMESTAMP   ,
    reg_by               VARCHAR(30) ,
    reg_date             TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by               VARCHAR(30) ,
    upd_date             TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.st_settle_raw IS '정산 수집원장 (od_order_item / od_claim_item 기반 정산 원천 데이터, 통계·분석 기반 테이블)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.settle_raw_id IS '수집원장ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.site_id IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.raw_type_cd IS '수집유형 (코드: RAW_TYPE — ORDER/CLAIM)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.raw_status_cd IS '수집상태 (코드: RAW_STATUS)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.raw_status_cd_before IS '변경 전 수집상태';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.order_id IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.order_no IS '주문번호 스냅샷';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.order_item_id IS '주문상품ID (od_order_item.order_item_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.order_date IS '주문일시 스냅샷';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.order_item_status_cd IS '수집 시점 주문상태 스냅샷 (코드: ORDER_ITEM_STATUS)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.member_id IS '주문 회원ID 스냅샷 (mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.claim_id IS '클레임ID (클레임 수집 시)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.claim_item_id IS '클레임상품ID (클레임 수집 시)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.vendor_id IS '업체ID';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.vendor_type_cd IS '업체구분 (코드: VENDOR_TYPE — SALE/DLIV/EXTERNAL)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.prod_id IS '상품ID';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.prod_nm IS '상품명 스냅샷';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.brand_id IS '브랜드ID 스냅샷 (sy_brand.brand_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.brand_nm IS '브랜드명 스냅샷';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.category_id_1 IS '카테고리 1단계(대분류) ID 스냅샷 (pd_category.category_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.category_id_2 IS '카테고리 2단계(중분류) ID 스냅샷 (pd_category.category_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.category_id_3 IS '카테고리 3단계(소분류) ID 스냅샷 (pd_category.category_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.category_id_4 IS '카테고리 4단계 ID 스냅샷 (pd_category.category_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.category_id_5 IS '카테고리 5단계 ID 스냅샷 (pd_category.category_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.sku_id IS 'SKU ID 스냅샷 (pd_prod_sku.sku_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.opt_item_id_1 IS '옵션1 값ID 스냅샷 (pd_prod_opt_item.opt_item_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.opt_item_id_2 IS '옵션2 값ID 스냅샷 (pd_prod_opt_item.opt_item_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.md_user_id IS '담당MD (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.normal_price IS '정상가 스냅샷 (할인 전 1ea 가격)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.unit_price IS '단가 (옵션 추가금액 포함)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.order_qty IS '주문수량';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.item_price IS '소계 (unit_price × order_qty)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.discnt_amt IS '직접할인금액';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.coupon_discnt_amt IS '쿠폰할인금액';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.promo_discnt_amt IS '프로모션할인금액';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.promo_id IS '프로모션ID (pm_event.event_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.coupon_id IS '쿠폰ID (pm_coupon.coupon_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.coupon_issue_id IS '쿠폰발급ID (pm_coupon_issue.coupon_issue_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.discnt_id IS '할인ID (pm_discnt.discnt_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.voucher_id IS '상품권ID (pm_voucher.voucher_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.voucher_issue_id IS '상품권발급ID (pm_voucher_issue.voucher_issue_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.voucher_use_amt IS '상품권 사용금액';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.cache_use_amt IS '캐쉬(적립금) 사용금액';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.mileage_use_amt IS '마일리지 사용금액';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.save_schd_amt IS '적립 예정금액 (구매확정 전=예상, 확정 후=실적립)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.gift_id IS '사은품ID (pm_gift.gift_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.gift_amt IS '사은품 원가금액 (정산 차감 대상)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.pay_method_cd IS '결제수단 (코드: PAY_METHOD_CD)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.buy_confirm_yn IS '구매확정여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.buy_confirm_date IS '구매확정일시';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.bundle_price_rate IS '묶음 안분율 (%) — 부분 정산 계산 기준';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.settle_target_amt IS '정산대상금액 (item_price - 모든 할인)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.settle_fee_rate IS '수수료율 (%)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.settle_fee_amt IS '수수료금액';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.settle_amt IS '정산금액 (settle_target_amt - settle_fee_amt)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.settle_period IS '정산기간 (YYYY-MM)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.settle_id IS '정산집계ID (st_settle.settle_id, 집계 후 연결)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.close_yn IS '정산마감 완료 여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.close_date IS '마감일시';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.settle_close_id IS '정산마감ID (st_settle_close.settle_close_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.erp_voucher_id IS 'ERP 전표ID (st_erp_voucher.erp_voucher_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.erp_voucher_line_no IS 'ERP 전표 라인번호 (st_erp_voucher_line.line_no)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.erp_send_yn IS 'ERP 전송 여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.erp_send_date IS 'ERP 전송일시';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.upd_date IS '수정일';

CREATE INDEX idx_st_settle_raw_brand ON shopjoy_2604.st_settle_raw USING btree (brand_id);
CREATE INDEX idx_st_settle_raw_brand_nm ON shopjoy_2604.st_settle_raw USING btree (brand_nm);
CREATE INDEX idx_st_settle_raw_cate1 ON shopjoy_2604.st_settle_raw USING btree (category_id_1);
CREATE INDEX idx_st_settle_raw_cate2 ON shopjoy_2604.st_settle_raw USING btree (category_id_2);
CREATE INDEX idx_st_settle_raw_cate3 ON shopjoy_2604.st_settle_raw USING btree (category_id_3);
CREATE INDEX idx_st_settle_raw_claim ON shopjoy_2604.st_settle_raw USING btree (claim_id);
CREATE INDEX idx_st_settle_raw_close ON shopjoy_2604.st_settle_raw USING btree (close_yn, settle_period);
CREATE INDEX idx_st_settle_raw_close_id ON shopjoy_2604.st_settle_raw USING btree (settle_close_id);
CREATE INDEX idx_st_settle_raw_confirm ON shopjoy_2604.st_settle_raw USING btree (buy_confirm_yn, buy_confirm_date);
CREATE INDEX idx_st_settle_raw_coupon ON shopjoy_2604.st_settle_raw USING btree (coupon_id);
CREATE INDEX idx_st_settle_raw_erp ON shopjoy_2604.st_settle_raw USING btree (erp_voucher_id) WHERE (erp_voucher_id IS NOT NULL);
CREATE INDEX idx_st_settle_raw_erp_send ON shopjoy_2604.st_settle_raw USING btree (erp_send_yn);
CREATE INDEX idx_st_settle_raw_item ON shopjoy_2604.st_settle_raw USING btree (order_item_id);
CREATE INDEX idx_st_settle_raw_md ON shopjoy_2604.st_settle_raw USING btree (md_user_id);
CREATE INDEX idx_st_settle_raw_member ON shopjoy_2604.st_settle_raw USING btree (member_id);
CREATE INDEX idx_st_settle_raw_order ON shopjoy_2604.st_settle_raw USING btree (order_id);
CREATE INDEX idx_st_settle_raw_order_date ON shopjoy_2604.st_settle_raw USING btree (order_date);
CREATE INDEX idx_st_settle_raw_pay ON shopjoy_2604.st_settle_raw USING btree (pay_method_cd);
CREATE INDEX idx_st_settle_raw_period ON shopjoy_2604.st_settle_raw USING btree (settle_period, vendor_id);
CREATE INDEX idx_st_settle_raw_prod ON shopjoy_2604.st_settle_raw USING btree (prod_id);
CREATE INDEX idx_st_settle_raw_promo ON shopjoy_2604.st_settle_raw USING btree (promo_id);
CREATE INDEX idx_st_settle_raw_settle ON shopjoy_2604.st_settle_raw USING btree (settle_id);
CREATE INDEX idx_st_settle_raw_sku ON shopjoy_2604.st_settle_raw USING btree (sku_id);
CREATE INDEX idx_st_settle_raw_status ON shopjoy_2604.st_settle_raw USING btree (raw_status_cd);
CREATE INDEX idx_st_settle_raw_vendor ON shopjoy_2604.st_settle_raw USING btree (site_id, vendor_id);
