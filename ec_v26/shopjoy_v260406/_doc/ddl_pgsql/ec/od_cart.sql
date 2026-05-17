-- od_cart 테이블 DDL
-- 장바구니

CREATE TABLE shopjoy_2604.od_cart (
    cart_id       VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id       VARCHAR(21)  NOT NULL,
    member_id     VARCHAR(21) ,
    session_key   VARCHAR(100),
    prod_id       VARCHAR(21)  NOT NULL,
    sku_id        VARCHAR(21) ,
    opt_item_id_1 VARCHAR(21) ,
    opt_item_id_2 VARCHAR(21) ,
    unit_price    BIGINT       DEFAULT 0,
    order_qty     INTEGER      DEFAULT 1,
    item_price    BIGINT       DEFAULT 0,
    is_checked    VARCHAR(1)   DEFAULT 'Y'::bpchar,
    reg_by        VARCHAR(30) ,
    reg_date      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by        VARCHAR(30) ,
    upd_date      TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.od_cart IS '장바구니';
COMMENT ON COLUMN shopjoy_2604.od_cart.cart_id IS '장바구니ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.od_cart.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.od_cart.member_id IS '회원ID (비회원 NULL)';
COMMENT ON COLUMN shopjoy_2604.od_cart.session_key IS '비회원 세션키';
COMMENT ON COLUMN shopjoy_2604.od_cart.prod_id IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN shopjoy_2604.od_cart.sku_id IS 'SKU ID (pd_prod_sku.sku_id)';
COMMENT ON COLUMN shopjoy_2604.od_cart.opt_item_id_1 IS '옵션1 값ID (pd_prod_opt_item.opt_item_id, 예: 색상)';
COMMENT ON COLUMN shopjoy_2604.od_cart.opt_item_id_2 IS '옵션2 값ID (pd_prod_opt_item.opt_item_id, 예: 사이즈)';
COMMENT ON COLUMN shopjoy_2604.od_cart.unit_price IS '단가 (담을 시점 가격)';
COMMENT ON COLUMN shopjoy_2604.od_cart.order_qty IS '수량';
COMMENT ON COLUMN shopjoy_2604.od_cart.item_price IS '소계 (단가 × 수량)';
COMMENT ON COLUMN shopjoy_2604.od_cart.is_checked IS '주문선택여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.od_cart.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.od_cart.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.od_cart.upd_by IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.od_cart.upd_date IS '수정일';

CREATE INDEX idx_od_cart_member ON shopjoy_2604.od_cart USING btree (member_id);
CREATE INDEX idx_od_cart_prod ON shopjoy_2604.od_cart USING btree (prod_id);
CREATE INDEX idx_od_cart_session ON shopjoy_2604.od_cart USING btree (session_key);
CREATE INDEX idx_od_cart_site ON shopjoy_2604.od_cart USING btree (site_id);
