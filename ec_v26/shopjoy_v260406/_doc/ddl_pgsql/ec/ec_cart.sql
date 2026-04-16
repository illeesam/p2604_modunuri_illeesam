-- ============================================================
-- ec_cart : 장바구니
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- 설계: 헤더 없이 행 단위로 관리. member_id + prod_id + 옵션 조합이 PK 역할.
-- ============================================================
CREATE TABLE ec_cart (
    cart_id         VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    member_id       VARCHAR(16),                           -- ec_member.member_id (비회원 NULL)
    session_key     VARCHAR(100),                          -- 비회원 세션키
    prod_id         VARCHAR(16)     NOT NULL,              -- ec_prod.prod_id
    sku_id          VARCHAR(16),                           -- ec_prod_opt_sku.sku_id
    opt_id_1        VARCHAR(16),                           -- 옵션1 값ID (예: 색상)
    opt_id_2        VARCHAR(16),                           -- 옵션2 값ID (예: 사이즈)
    opt_nm_1        VARCHAR(100),                          -- 옵션1명 스냅샷 (예: 블랙)
    opt_nm_2        VARCHAR(100),                          -- 옵션2명 스냅샷 (예: M)
    unit_price      BIGINT          DEFAULT 0,             -- 단가 (담을 시점)
    order_qty       INTEGER         DEFAULT 1,
    item_price      BIGINT          DEFAULT 0,             -- 소계 (unit_price × order_qty)
    is_checked      CHAR(1)         DEFAULT 'Y',           -- 주문 선택 여부 Y/N
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (cart_id)
);

COMMENT ON TABLE  ec_cart              IS '장바구니';
COMMENT ON COLUMN ec_cart.cart_id      IS '장바구니ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN ec_cart.site_id      IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN ec_cart.member_id    IS '회원ID (비회원 NULL)';
COMMENT ON COLUMN ec_cart.session_key  IS '비회원 세션키';
COMMENT ON COLUMN ec_cart.prod_id      IS '상품ID (ec_prod.prod_id)';
COMMENT ON COLUMN ec_cart.sku_id       IS 'SKU ID (ec_prod_opt_sku.sku_id)';
COMMENT ON COLUMN ec_cart.opt_id_1     IS '옵션1 값ID (ec_prod_opt.opt_id, 예: 색상)';
COMMENT ON COLUMN ec_cart.opt_id_2     IS '옵션2 값ID (ec_prod_opt.opt_id, 예: 사이즈)';
COMMENT ON COLUMN ec_cart.opt_nm_1     IS '옵션1명 스냅샷 (예: 블랙)';
COMMENT ON COLUMN ec_cart.opt_nm_2     IS '옵션2명 스냅샷 (예: M)';
COMMENT ON COLUMN ec_cart.unit_price   IS '단가 (담을 시점 가격)';
COMMENT ON COLUMN ec_cart.order_qty    IS '수량';
COMMENT ON COLUMN ec_cart.item_price   IS '소계 (단가 × 수량)';
COMMENT ON COLUMN ec_cart.is_checked   IS '주문선택여부 Y/N';
COMMENT ON COLUMN ec_cart.reg_by       IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN ec_cart.reg_date     IS '등록일';
COMMENT ON COLUMN ec_cart.upd_by       IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN ec_cart.upd_date     IS '수정일';

CREATE INDEX idx_ec_cart_member  ON ec_cart (member_id);
CREATE INDEX idx_ec_cart_session ON ec_cart (session_key);
CREATE INDEX idx_ec_cart_prod    ON ec_cart (prod_id);
