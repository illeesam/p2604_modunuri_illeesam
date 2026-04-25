-- ============================================================
-- pd_prod_bundle_item : 묶음상품 구성품
-- 묶음상품(prod_type_cd = 'BUNDLE') 의 개별 상품 구성 목록
-- - 각 구성품은 독립 상품(pd_prod)으로 존재
-- - 구성품별 개별 재고 차감 / 부분 클레임(개별 취소·반품) 가능
-- - price_rate(안분율) 합계 = 100% 필수 (환불 금액 계산 기준)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE pd_prod_bundle_item (
    bundle_item_id      VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    bundle_prod_id      VARCHAR(21)     NOT NULL,               -- 묶음상품ID (pd_prod.prod_id, prod_type_cd=BUNDLE)
    item_prod_id        VARCHAR(21)     NOT NULL,               -- 구성품 상품ID (pd_prod.prod_id)
    item_sku_id         VARCHAR(21),                            -- 구성품 SKU ID (pd_prod_sku.sku_id, NULL=SKU미지정)
    item_qty            INTEGER         DEFAULT 1,              -- 구성 수량
    price_rate          DECIMAL(5,2)    NOT NULL,               -- 가격 안분율 (%) — 구성품 합계 100% 필수
    sort_ord            INTEGER         DEFAULT 0,              -- 노출 순서
    use_yn              CHAR(1)         DEFAULT 'Y',            -- 사용여부 Y/N
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30),
    upd_date            TIMESTAMP,
    PRIMARY KEY (bundle_item_id),
    UNIQUE (bundle_prod_id, item_prod_id)                       -- 동일 묶음에 동일 상품 중복 방지
);

COMMENT ON TABLE  pd_prod_bundle_item                    IS '묶음상품 구성품 (prod_type_cd=BUNDLE)';
COMMENT ON COLUMN pd_prod_bundle_item.bundle_item_id     IS '묶음구성ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pd_prod_bundle_item.site_id            IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pd_prod_bundle_item.bundle_prod_id     IS '묶음상품ID (pd_prod.prod_id, prod_type_cd=BUNDLE)';
COMMENT ON COLUMN pd_prod_bundle_item.item_prod_id       IS '구성품 상품ID (pd_prod.prod_id) — 독립 판매 상품';
COMMENT ON COLUMN pd_prod_bundle_item.item_sku_id        IS '구성품 SKU ID (pd_prod_sku.sku_id, NULL=SKU 미지정)';
COMMENT ON COLUMN pd_prod_bundle_item.item_qty           IS '구성 수량 (기본 1)';
COMMENT ON COLUMN pd_prod_bundle_item.price_rate         IS '가격 안분율 (%) — 구성품 합계 100% 필수, 부분클레임 환불 계산 기준';
COMMENT ON COLUMN pd_prod_bundle_item.sort_ord           IS '노출 정렬 순서';
COMMENT ON COLUMN pd_prod_bundle_item.use_yn             IS '사용여부 Y/N';
COMMENT ON COLUMN pd_prod_bundle_item.reg_by             IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN pd_prod_bundle_item.reg_date           IS '등록일';
COMMENT ON COLUMN pd_prod_bundle_item.upd_by             IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN pd_prod_bundle_item.upd_date           IS '수정일';

-- ============================================================
-- 제약사항 메모
-- ============================================================
-- price_rate 합계 = 100% 강제는 앱 레이어에서 검증
-- (PostgreSQL CHECK 제약으로는 행간 합계 검증 불가)

-- ============================================================
-- 인덱스
-- ============================================================
CREATE INDEX idx_pd_prod_bundle_item_bundle  ON pd_prod_bundle_item (bundle_prod_id, sort_ord);
CREATE INDEX idx_pd_prod_bundle_item_item    ON pd_prod_bundle_item (item_prod_id);
