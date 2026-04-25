-- 배송 항목 (이 배송에 포함된 주문상품 명세)
-- 1 ec_dliv → N ec_dliv_item → 1 ec_order_item (1:1 참조)
-- 부분출고 시 qty < order_item.qty 가능
CREATE TABLE od_dliv_item (
    dliv_item_id    VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    dliv_id         VARCHAR(21)     NOT NULL,
    order_item_id   VARCHAR(21)     NOT NULL,               -- 원 주문상품ID
    prod_id         VARCHAR(21),
    opt_item_id_1   VARCHAR(21),                            -- 옵션1 값ID (pd_prod_opt_item.opt_item_id)
    opt_item_id_2   VARCHAR(21),                            -- 옵션2 값ID (pd_prod_opt_item.opt_item_id)
    dliv_type_cd    VARCHAR(20)     DEFAULT 'OUT',           -- 입출고구분: OUT 출고 / IN 입고(반품)
    unit_price      BIGINT          DEFAULT 0,
    dliv_qty        INTEGER         DEFAULT 1,              -- 이 배송의 출고수량 (부분출고 시 < 주문수량)
    dliv_item_status_cd VARCHAR(20)     DEFAULT 'READY',        -- 코드: DLIV_STATUS (항목별 추적)
    dliv_item_status_cd_before VARCHAR(20),                  -- 변경 전 배송상태
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (dliv_item_id),
    UNIQUE (dliv_id, order_item_id)                        -- 동일 배송 내 중복 방지
);

COMMENT ON TABLE od_dliv_item IS '배송 항목 (배송에 포함된 주문상품 명세)';
COMMENT ON COLUMN od_dliv_item.dliv_item_id  IS '배송항목ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN od_dliv_item.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN od_dliv_item.dliv_id       IS '배송ID (od_dliv.)';
COMMENT ON COLUMN od_dliv_item.order_item_id IS '주문상품ID (od_order_item.)';
COMMENT ON COLUMN od_dliv_item.prod_id       IS '상품ID';
COMMENT ON COLUMN od_dliv_item.opt_item_id_1 IS '옵션1 값ID (pd_prod_opt_item.opt_item_id)';
COMMENT ON COLUMN od_dliv_item.opt_item_id_2 IS '옵션2 값ID (pd_prod_opt_item.opt_item_id)';
COMMENT ON COLUMN od_dliv_item.dliv_type_cd  IS '입출고구분 (OUT:출고 / IN:입고반품)';
COMMENT ON COLUMN od_dliv_item.unit_price    IS '단가 (주문시점 스냅샷)';
COMMENT ON COLUMN od_dliv_item.dliv_qty      IS '출고수량 (부분출고 시 주문수량보다 적을 수 있음)';
COMMENT ON COLUMN od_dliv_item.dliv_item_status_cd IS '항목 배송상태 (코드: DLIV_STATUS)';
COMMENT ON COLUMN od_dliv_item.dliv_item_status_cd_before IS '변경 전 배송상태 (코드: DLIV_STATUS)';
COMMENT ON COLUMN od_dliv_item.reg_by        IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN od_dliv_item.reg_date      IS '등록일';
COMMENT ON COLUMN od_dliv_item.upd_by        IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN od_dliv_item.upd_date      IS '수정일';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] od_dliv_item.dliv_item_status_cd (항목 배송상태) : 배송상태 { READY:준비중, SHIPPED:출고완료, IN_TRANSIT:배송중, DELIVERED:배송완료, FAILED:배송실패 }
