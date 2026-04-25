-- ============================================================
-- pm_gift_cond : 사은품 지급 조건
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE pm_gift_cond (
    gift_cond_id        VARCHAR(21)     NOT NULL,
    gift_id             VARCHAR(21)     NOT NULL,               -- pm_gift.gift_id
    site_id             VARCHAR(21),
    cond_type_cd        VARCHAR(20)     NOT NULL,               -- 코드: GIFT_COND_TYPE (ORDER_AMT:주문금액/PRODUCT:상품구매/MEMBER_GRADE:회원등급)
    min_order_amt       BIGINT          DEFAULT 0,              -- ORDER_AMT 조건: 최소주문금액
    target_type_cd      VARCHAR(20),                            -- PRODUCT/CATEGORY/MEMBER_GRADE
    target_id           VARCHAR(21),                            -- prod_id / category_id / grade_cd
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (gift_cond_id)
);

COMMENT ON TABLE pm_gift_cond IS '사은품 지급 조건';
COMMENT ON COLUMN pm_gift_cond.gift_cond_id   IS '사은품조건ID';
COMMENT ON COLUMN pm_gift_cond.gift_id        IS '사은품ID (pm_gift.gift_id)';
COMMENT ON COLUMN pm_gift_cond.site_id        IS '사이트ID';
COMMENT ON COLUMN pm_gift_cond.cond_type_cd   IS '조건유형 (코드: GIFT_COND_TYPE)';
COMMENT ON COLUMN pm_gift_cond.min_order_amt  IS '최소주문금액 (ORDER_AMT 조건)';
COMMENT ON COLUMN pm_gift_cond.target_type_cd IS '대상유형 (PRODUCT/CATEGORY/MEMBER_GRADE)';
COMMENT ON COLUMN pm_gift_cond.target_id      IS '대상ID';
COMMENT ON COLUMN pm_gift_cond.reg_by         IS '등록자';
COMMENT ON COLUMN pm_gift_cond.reg_date       IS '등록일';
COMMENT ON COLUMN pm_gift_cond.upd_by   IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pm_gift_cond.upd_date IS '수정일';

CREATE INDEX idx_pm_gift_cond_gift ON pm_gift_cond (gift_id);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pm_gift_cond.cond_type_cd (조건유형) : GIFT_COND_TYPE { ORDER_AMT:주문금액, PRODUCT:상품, MEMBER_GRADE:회원등급 }
