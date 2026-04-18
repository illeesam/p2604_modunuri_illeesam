-- 세트상품 구성 목록 (pd_prod.prod_type_cd = 'SET') — 표시용
CREATE TABLE pd_prod_set_item (
    set_item_id         VARCHAR(16)     NOT NULL,
    site_id             VARCHAR(16),                            -- sy_site.site_id
    set_prod_id         VARCHAR(16)     NOT NULL,               -- 세트상품ID (pd_prod.prod_id, prod_type_cd=SET)
    component_prod_id   VARCHAR(16),                            -- 구성품 상품ID (NULL=비상품 구성품)
    item_nm             VARCHAR(200)    NOT NULL,               -- 구성품 표시명
    item_qty            INTEGER         DEFAULT 1,              -- 구성 수량
    item_desc           VARCHAR(300),                           -- 구성품 설명
    sort_ord            INTEGER         DEFAULT 0,
    use_yn              CHAR(1)         DEFAULT 'Y',
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(16),
    upd_date            TIMESTAMP,
    PRIMARY KEY (set_item_id)
);

COMMENT ON TABLE  pd_prod_set_item                  IS '세트상품 구성 목록 (표시용)';
COMMENT ON COLUMN pd_prod_set_item.set_item_id      IS '세트구성ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pd_prod_set_item.site_id          IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pd_prod_set_item.set_prod_id      IS '세트상품ID (pd_prod.prod_id, prod_type_cd=SET)';
COMMENT ON COLUMN pd_prod_set_item.component_prod_id IS '구성품 상품ID (pd_prod.prod_id, NULL=비상품 구성품)';
COMMENT ON COLUMN pd_prod_set_item.item_nm          IS '구성품 표시명 (예: 머그컵, 접시)';
COMMENT ON COLUMN pd_prod_set_item.item_qty         IS '구성 수량';
COMMENT ON COLUMN pd_prod_set_item.item_desc        IS '구성품 설명';
COMMENT ON COLUMN pd_prod_set_item.sort_ord         IS '노출 순서';
COMMENT ON COLUMN pd_prod_set_item.use_yn           IS '사용여부 Y/N';
COMMENT ON COLUMN pd_prod_set_item.reg_by           IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN pd_prod_set_item.reg_date         IS '등록일';
COMMENT ON COLUMN pd_prod_set_item.upd_by           IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN pd_prod_set_item.upd_date         IS '수정일';

CREATE INDEX idx_pd_prod_set_item_set ON pd_prod_set_item (set_prod_id);
CREATE INDEX idx_pd_prod_set_item_comp ON pd_prod_set_item (component_prod_id) WHERE component_prod_id IS NOT NULL;
