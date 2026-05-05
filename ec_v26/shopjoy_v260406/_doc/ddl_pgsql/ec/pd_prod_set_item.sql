-- pd_prod_set_item 테이블 DDL
-- 세트상품 구성 목록 (prod_type_cd=SET, 표시·배송 단위 정의)

CREATE TABLE shopjoy_2604.pd_prod_set_item (
    set_item_id  VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id      VARCHAR(21) ,
    set_prod_id  VARCHAR(21)  NOT NULL,
    item_prod_id VARCHAR(21) ,
    item_sku_id  VARCHAR(21) ,
    item_nm      VARCHAR(200) NOT NULL,
    item_qty     INTEGER      DEFAULT 1,
    item_desc    VARCHAR(300),
    sort_ord     INTEGER      DEFAULT 0,
    use_yn       VARCHAR(1)   DEFAULT 'Y',
    reg_by       VARCHAR(30) ,
    reg_date     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by       VARCHAR(30) ,
    upd_date     TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.pd_prod_set_item IS '세트상품 구성 목록 (prod_type_cd=SET, 표시·배송 단위 정의)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_set_item.set_item_id IS '세트구성ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_set_item.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_set_item.set_prod_id IS '세트상품ID (pd_prod.prod_id, prod_type_cd=SET)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_set_item.item_prod_id IS '구성품 상품ID (pd_prod.prod_id, NULL=비상품 구성품)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_set_item.item_sku_id IS '구성품 SKU ID (pd_prod_sku.sku_id, NULL=SKU 미지정)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_set_item.item_nm IS '구성품 표시명 (예: 머그컵, 접시 2p)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_set_item.item_qty IS '구성 수량';
COMMENT ON COLUMN shopjoy_2604.pd_prod_set_item.item_desc IS '구성품 부가 설명 (소재·용량·색상 등)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_set_item.sort_ord IS '노출 정렬 순서';
COMMENT ON COLUMN shopjoy_2604.pd_prod_set_item.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.pd_prod_set_item.reg_by IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_set_item.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.pd_prod_set_item.upd_by IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_set_item.upd_date IS '수정일';
