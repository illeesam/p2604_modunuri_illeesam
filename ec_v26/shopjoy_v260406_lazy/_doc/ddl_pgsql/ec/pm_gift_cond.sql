-- pm_gift_cond 테이블 DDL
-- 사은품 지급 조건

CREATE TABLE shopjoy_2604.pm_gift_cond (
    gift_cond_id   VARCHAR(21) NOT NULL CONSTRAINT pm_gift_cond_pk_gift_cond_id PRIMARY KEY,
    gift_id        VARCHAR(21) NOT NULL,
    reg_site_id        VARCHAR(21) NOT NULL,
    cond_type_cd   VARCHAR(20) NOT NULL,
    min_order_amt  BIGINT      DEFAULT 0,
    target_type_cd VARCHAR(20),
    target_id      VARCHAR(21),
    reg_by         VARCHAR(30),
    reg_date       TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    upd_by         VARCHAR(30),
    upd_date       TIMESTAMP  
);

COMMENT ON TABLE  shopjoy_2604.pm_gift_cond IS '사은품 지급 조건';
COMMENT ON COLUMN shopjoy_2604.pm_gift_cond.gift_cond_id IS '사은품조건ID';
COMMENT ON COLUMN shopjoy_2604.pm_gift_cond.gift_id IS '사은품ID (pm_gift.gift_id)';
COMMENT ON COLUMN shopjoy_2604.pm_gift_cond.reg_site_id IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.pm_gift_cond.cond_type_cd IS '조건유형 (코드: GIFT_COND_TYPE)';
COMMENT ON COLUMN shopjoy_2604.pm_gift_cond.min_order_amt IS '최소주문금액 (ORDER_AMT 조건)';
COMMENT ON COLUMN shopjoy_2604.pm_gift_cond.target_type_cd IS '대상유형 (PRODUCT/CATEGORY/MEMBER_GRADE)';
COMMENT ON COLUMN shopjoy_2604.pm_gift_cond.target_id IS '대상ID';
COMMENT ON COLUMN shopjoy_2604.pm_gift_cond.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.pm_gift_cond.reg_date IS '등록일';

CREATE INDEX pm_gift_cond_ix01_gift_id ON shopjoy_2604.pm_gift_cond USING btree (gift_id);
CREATE INDEX pm_gift_cond_ix02_target_id ON shopjoy_2604.pm_gift_cond USING btree (target_id);
