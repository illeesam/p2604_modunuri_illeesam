![1776594249558](image/pd_prod_set_item/1776594249558.png)![1776594254261](image/pd_prod_set_item/1776594254261.png)![1776594255090](image/pd_prod_set_item/1776594255090.png)![1776594257722](image/pd_prod_set_item/1776594257722.png)![1776594264913](image/pd_prod_set_item/1776594264913.png)![1776594270735](image/pd_prod_set_item/1776594270735.png)![1776594516644](image/pd_prod_set_item/1776594516644.png)![1776594518949](image/pd_prod_set_item/1776594518949.png)![1776595118364](image/pd_prod_set_item/1776595118364.png)-- ============================================================
-- pd_prod_set_item : 세트상품 구성 목록
-- 세트상품(prod_type_cd = 'SET') 의 구성 항목 표시 목록
-- - 세트 자체 재고 일괄 관리 (구성품 개별 재고 차감 없음)
-- - 가격은 세트 단가로 별도 책정 (price_rate 없음)
-- - 클레임은 세트 전체 단위로만 처리 (부분 취소/반품 불가)
-- - component_prod_id = NULL 허용 (상품 미등록 구성품 — 예: 증정 엽서)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE pd_prod_set_item (
    set_item_id         VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    set_prod_id         VARCHAR(21)     NOT NULL,               -- 세트상품ID (pd_prod.prod_id, prod_type_cd=SET)
    item_prod_id        VARCHAR(21),                            -- 구성품 상품ID (pd_prod.prod_id, NULL=비상품 구성품)
    item_sku_id         VARCHAR(21),                            -- 구성품 SKU ID (pd_prod_sku.sku_id, NULL=SKU미지정)
    item_nm             VARCHAR(200)    NOT NULL,               -- 구성품 표시명 (예: 머그컵 1개)
    item_qty            INTEGER         DEFAULT 1,              -- 구성 수량
    item_desc           VARCHAR(300),                           -- 구성품 설명 (소재·용량 등 부가 안내)
    sort_ord            INTEGER         DEFAULT 0,              -- 노출 순서
    use_yn              CHAR(1)         DEFAULT 'Y',            -- 사용여부 Y/N
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30),
    upd_date            TIMESTAMP,
    PRIMARY KEY (set_item_id)
);

COMMENT ON TABLE  pd_prod_set_item                   IS '세트상품 구성 목록 (prod_type_cd=SET, 표시·배송 단위 정의)';
COMMENT ON COLUMN pd_prod_set_item.set_item_id       IS '세트구성ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pd_prod_set_item.site_id           IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pd_prod_set_item.set_prod_id       IS '세트상품ID (pd_prod.prod_id, prod_type_cd=SET)';
COMMENT ON COLUMN pd_prod_set_item.item_prod_id      IS '구성품 상품ID (pd_prod.prod_id, NULL=비상품 구성품)';
COMMENT ON COLUMN pd_prod_set_item.item_sku_id       IS '구성품 SKU ID (pd_prod_sku.sku_id, NULL=SKU 미지정)';
COMMENT ON COLUMN pd_prod_set_item.item_nm           IS '구성품 표시명 (예: 머그컵, 접시 2p)';
COMMENT ON COLUMN pd_prod_set_item.item_qty          IS '구성 수량';
COMMENT ON COLUMN pd_prod_set_item.item_desc         IS '구성품 부가 설명 (소재·용량·색상 등)';
COMMENT ON COLUMN pd_prod_set_item.sort_ord          IS '노출 정렬 순서';
COMMENT ON COLUMN pd_prod_set_item.use_yn            IS '사용여부 Y/N';
COMMENT ON COLUMN pd_prod_set_item.reg_by            IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN pd_prod_set_item.reg_date          IS '등록일';
COMMENT ON COLUMN pd_prod_set_item.upd_by            IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN pd_prod_set_item.upd_date          IS '수정일';

-- ============================================================
-- 인덱스
-- ============================================================
CREATE INDEX idx_pd_prod_set_item_set  ON pd_prod_set_item (set_prod_id, sort_ord);
CREATE INDEX idx_pd_prod_set_item_item ON pd_prod_set_item (item_prod_id) WHERE item_prod_id IS NOT NULL;
