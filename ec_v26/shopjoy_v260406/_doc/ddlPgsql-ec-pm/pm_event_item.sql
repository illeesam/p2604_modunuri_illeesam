-- ============================================================
-- pm_event_item : 이벤트 적용 대상 항목
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- 이벤트에 포함되는 상품/카테고리/판매자/브랜드를 지정
-- sort_no: 이벤트 내 노출 순서
-- 항목이 없으면 전체 적용 (pm_event.target_type_cd 기준)
-- ============================================================
CREATE TABLE pm_event_item (
    event_item_id       VARCHAR(21)     NOT NULL,
    event_id            VARCHAR(21)     NOT NULL,               -- pm_event.event_id
    site_id             VARCHAR(21),                            -- sy_site.site_id
    target_type_cd      VARCHAR(20)     NOT NULL,               -- 코드: EVENT_ITEM_TARGET (PRODUCT/CATEGORY/VENDOR/BRAND)
    target_id           VARCHAR(21)     NOT NULL,               -- prod_id / category_id / vendor_id / brand_id
    sort_no             INTEGER         DEFAULT 0,              -- 이벤트 내 노출 순서
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,

    PRIMARY KEY (event_item_id),
    UNIQUE (event_id, target_type_cd, target_id)
);

COMMENT ON TABLE  pm_event_item IS '이벤트 적용 대상 항목 (상품/카테고리/판매자/브랜드)';
COMMENT ON COLUMN pm_event_item.event_item_id   IS '이벤트항목ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pm_event_item.event_id        IS '이벤트ID (pm_event.event_id)';
COMMENT ON COLUMN pm_event_item.site_id         IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pm_event_item.target_type_cd  IS '대상유형 (코드: EVENT_ITEM_TARGET — PRODUCT/CATEGORY/VENDOR/BRAND)';
COMMENT ON COLUMN pm_event_item.target_id       IS '대상ID (prod_id / category_id / vendor_id / brand_id)';
COMMENT ON COLUMN pm_event_item.sort_no         IS '이벤트 내 노출 순서';
COMMENT ON COLUMN pm_event_item.reg_by          IS '등록자';
COMMENT ON COLUMN pm_event_item.reg_date        IS '등록일';
COMMENT ON COLUMN pm_event_item.upd_by   IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pm_event_item.upd_date IS '수정일';

CREATE INDEX idx_pm_event_item_event  ON pm_event_item (event_id);
CREATE INDEX idx_pm_event_item_target ON pm_event_item (target_type_cd, target_id);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pm_event_item.target_type_cd (대상유형) : PROMO_TARGET_TYPE { ALL:전체, PRODUCT:상품, CATEGORY:카테고리, VENDOR:업체, BRAND:브랜드, MEMBER_GRADE:회원등급 }
