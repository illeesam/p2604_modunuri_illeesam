CREATE TABLE pd_prod_sku (
    sku_id          VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    prod_id         VARCHAR(21)     NOT NULL,
    opt_item_id_1   VARCHAR(21),                            -- 옵션1 값ID (예: 색상-블랙)
    opt_item_id_2   VARCHAR(21),                            -- 옵션2 값ID (예: 사이즈-M)
    sku_code        VARCHAR(50),                            -- 자체 SKU 코드
    add_price       BIGINT          DEFAULT 0,              -- 옵션 추가금액
    prod_opt_stock  INTEGER         DEFAULT 0,              -- 옵션 조합별 재고
    use_yn          CHAR(1)         DEFAULT 'Y',
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (sku_id)
);

COMMENT ON TABLE pd_prod_sku IS '상품 옵션 SKU (조합별 재고/가격)';
COMMENT ON COLUMN pd_prod_sku.sku_id         IS 'SKU ID';
COMMENT ON COLUMN pd_prod_sku.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pd_prod_sku.prod_id        IS '상품ID';
COMMENT ON COLUMN pd_prod_sku.opt_item_id_1  IS '옵션1 값ID (pd_prod_opt_item.opt_item_id)';
COMMENT ON COLUMN pd_prod_sku.opt_item_id_2  IS '옵션2 값ID (pd_prod_opt_item.opt_item_id)';
COMMENT ON COLUMN pd_prod_sku.sku_code       IS '자체 SKU 코드';
COMMENT ON COLUMN pd_prod_sku.add_price      IS '옵션 추가금액 (기본가 대비)';
COMMENT ON COLUMN pd_prod_sku.prod_opt_stock IS '해당 옵션 조합 재고수량';
COMMENT ON COLUMN pd_prod_sku.use_yn         IS '사용여부 Y/N';
COMMENT ON COLUMN pd_prod_sku.reg_by         IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_prod_sku.reg_date       IS '등록일';
COMMENT ON COLUMN pd_prod_sku.upd_by         IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_prod_sku.upd_date       IS '수정일';

-- 관련 이력 테이블:
-- pdh_prod_sku_price_hist : 가격 변경 이력 (add_price_before/after BIGINT)
-- pdh_prod_sku_stock_hist : 재고 변경 이력 (stock_before/after INT, chg_qty, chg_reason_cd)
-- pdh_prod_sku_chg_hist   : 상태 변경 이력 (use_yn 등)

-- ============================================================
-- 데이터 예제 (상품 P001 — 티셔츠, 색상 3 × 사이즈 3 = SKU 9개)
-- pd_prod_opt_item: ITEM001=블랙, ITEM002=화이트, ITEM003=딥네이비
--                   ITEM004=S,    ITEM005=M,       ITEM006=L
-- ============================================================
-- prod_id='P001'
--   ├─ opt_item_id_1='ITEM001' (블랙, add_price=0)
--   │   ├─ sku_id='SKU001', opt_item_id_2='ITEM004' (S), sku_code='TS-BLACK-S',  stock=20
--   │   ├─ sku_id='SKU002', opt_item_id_2='ITEM005' (M), sku_code='TS-BLACK-M',  stock=30
--   │   └─ sku_id='SKU003', opt_item_id_2='ITEM006' (L), sku_code='TS-BLACK-L',  stock=15
--   ├─ opt_item_id_1='ITEM002' (화이트, add_price=0)
--   │   ├─ sku_id='SKU004', opt_item_id_2='ITEM004' (S), sku_code='TS-WHITE-S',  stock=10
--   │   ├─ sku_id='SKU005', opt_item_id_2='ITEM005' (M), sku_code='TS-WHITE-M',  stock=25
--   │   └─ sku_id='SKU006', opt_item_id_2='ITEM006' (L), sku_code='TS-WHITE-L',  stock=8
--   └─ opt_item_id_1='ITEM003' (딥네이비, add_price=+2,000)
--       ├─ sku_id='SKU007', opt_item_id_2='ITEM004' (S), sku_code='TS-DNAVY-S',  stock=5
--       ├─ sku_id='SKU008', opt_item_id_2='ITEM005' (M), sku_code='TS-DNAVY-M',  stock=12
--       └─ sku_id='SKU009', opt_item_id_2='ITEM006' (L), sku_code='TS-DNAVY-L',  stock=7
