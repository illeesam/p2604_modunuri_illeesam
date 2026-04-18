-- 묶음상품 구성품 (pd_prod.prod_type_cd = 'GROUP')
CREATE TABLE pd_prod_bundle (
    bundle_item_id      VARCHAR(16)     NOT NULL,
    site_id             VARCHAR(16),                            -- sy_site.site_id
    bundle_prod_id      VARCHAR(16)     NOT NULL,               -- 묶음상품ID (pd_prod.prod_id, prod_type_cd=GROUP)
    component_prod_id   VARCHAR(16)     NOT NULL,               -- 구성품 상품ID (pd_prod.prod_id)
    component_qty       INTEGER         DEFAULT 1,              -- 구성 수량
    price_rate          DECIMAL(5,2)    NOT NULL,               -- 가격 안분율 (%) — 합계 100% 필수
    sort_ord            INTEGER         DEFAULT 0,
    use_yn              CHAR(1)         DEFAULT 'Y',
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(16),
    upd_date            TIMESTAMP,
    PRIMARY KEY (bundle_item_id),
    UNIQUE (bundle_prod_id, component_prod_id)
);

COMMENT ON TABLE  pd_prod_bundle                    IS '묶음상품 구성품';
COMMENT ON COLUMN pd_prod_bundle.bundle_item_id     IS '묶음구성ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pd_prod_bundle.site_id            IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pd_prod_bundle.bundle_prod_id     IS '묶음상품ID (pd_prod.prod_id, prod_type_cd=GROUP)';
COMMENT ON COLUMN pd_prod_bundle.component_prod_id  IS '구성품 상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN pd_prod_bundle.component_qty      IS '구성 수량 (기본 1)';
COMMENT ON COLUMN pd_prod_bundle.price_rate         IS '가격 안분율 (%) — 구성품 합계 100% 필수, 부분클레임 환불 계산 기준';
COMMENT ON COLUMN pd_prod_bundle.sort_ord           IS '노출 순서';
COMMENT ON COLUMN pd_prod_bundle.use_yn             IS '사용여부 Y/N';
COMMENT ON COLUMN pd_prod_bundle.reg_by             IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN pd_prod_bundle.reg_date           IS '등록일';
COMMENT ON COLUMN pd_prod_bundle.upd_by             IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN pd_prod_bundle.upd_date           IS '수정일';

CREATE INDEX idx_pd_prod_bundle_bundle    ON pd_prod_bundle (bundle_prod_id);
CREATE INDEX idx_pd_prod_bundle_component ON pd_prod_bundle (component_prod_id);
