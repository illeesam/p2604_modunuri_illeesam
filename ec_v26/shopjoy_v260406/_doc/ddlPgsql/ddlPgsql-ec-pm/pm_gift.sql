-- ============================================================
-- pm_gift : 사은품
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE pm_gift (
    gift_id             VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),
    gift_nm             VARCHAR(100)    NOT NULL,               -- 사은품명
    gift_type_cd        VARCHAR(20)     DEFAULT 'PRODUCT',      -- 코드: GIFT_TYPE (PRODUCT:상품/SAMPLE:샘플/ETC:기타)
    prod_id             VARCHAR(21),                            -- 연결 상품 (pd_prod.prod_id, 비상품이면 NULL)
    gift_stock          INTEGER         DEFAULT 0,              -- 사은품 재고
    gift_desc           TEXT,                                   -- 사은품 설명
    start_date          TIMESTAMP,
    end_date            TIMESTAMP,
    gift_status_cd      VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: GIFT_STATUS (ACTIVE/INACTIVE)
    gift_status_cd_before VARCHAR(20),
    mem_grade_cd        VARCHAR(20),                            -- 적용 회원등급 코드 (NULL=전체, 코드: MEMBER_GRADE)
    min_order_amt       BIGINT          DEFAULT 0,              -- 최소주문금액 (사은품 지급 조건)
    min_order_qty       INTEGER,                                -- 최소주문수량 (NULL=제한없음)
    -- 부담금 설정
    self_cdiv_rate      DECIMAL(5,2)    DEFAULT 100,            -- 자사(사이트) 분담율 (%)
    seller_cdiv_rate    DECIMAL(5,2)    DEFAULT 0,              -- 판매자(업체) 분담율 (%)
    use_yn              CHAR(1)         DEFAULT 'Y',
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30),
    upd_date            TIMESTAMP,
    PRIMARY KEY (gift_id)
);

COMMENT ON TABLE pm_gift IS '사은품';
COMMENT ON COLUMN pm_gift.gift_id           IS '사은품ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pm_gift.site_id           IS '사이트ID';
COMMENT ON COLUMN pm_gift.gift_nm           IS '사은품명';
COMMENT ON COLUMN pm_gift.gift_type_cd      IS '사은품유형 (코드: GIFT_TYPE — PRODUCT/SAMPLE/ETC)';
COMMENT ON COLUMN pm_gift.prod_id           IS '연결 상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN pm_gift.gift_stock        IS '사은품 재고';
COMMENT ON COLUMN pm_gift.gift_desc         IS '사은품 설명';
COMMENT ON COLUMN pm_gift.start_date        IS '시작일시';
COMMENT ON COLUMN pm_gift.end_date          IS '종료일시';
COMMENT ON COLUMN pm_gift.gift_status_cd    IS '상태 (코드: GIFT_STATUS)';
COMMENT ON COLUMN pm_gift.gift_status_cd_before IS '변경 전 상태';
COMMENT ON COLUMN pm_gift.mem_grade_cd      IS '적용 회원등급 코드 (NULL=전체, 코드: MEMBER_GRADE)';
COMMENT ON COLUMN pm_gift.min_order_amt     IS '최소주문금액 — 사은품 지급 기준 금액';
COMMENT ON COLUMN pm_gift.min_order_qty     IS '최소주문수량 (NULL=제한없음)';
COMMENT ON COLUMN pm_gift.self_cdiv_rate    IS '자사(사이트) 분담율 (%) — 기본 100%';
COMMENT ON COLUMN pm_gift.seller_cdiv_rate  IS '판매자(업체) 분담율 (%) — 기본 0%';
COMMENT ON COLUMN pm_gift.use_yn            IS '사용여부 Y/N';
COMMENT ON COLUMN pm_gift.reg_by            IS '등록자';
COMMENT ON COLUMN pm_gift.reg_date          IS '등록일';
COMMENT ON COLUMN pm_gift.upd_by            IS '수정자';
COMMENT ON COLUMN pm_gift.upd_date          IS '수정일';

CREATE INDEX idx_pm_gift_site   ON pm_gift (site_id);
CREATE INDEX idx_pm_gift_status ON pm_gift (gift_status_cd);
CREATE INDEX idx_pm_gift_grade  ON pm_gift (mem_grade_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pm_gift.gift_type_cd (사은품유형) : GIFT_TYPE { PRODUCT:상품형, SAMPLE:샘플형, ETC:기타 }
-- [CODES] pm_gift.gift_status_cd (상태) : GIFT_STATUS { ACTIVE:활성, INACTIVE:비활성 }
