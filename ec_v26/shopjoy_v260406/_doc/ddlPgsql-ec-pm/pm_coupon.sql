-- ============================================================
-- pm_coupon : 쿠폰
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE pm_coupon (
    coupon_id           VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    coupon_cd           VARCHAR(50)     NOT NULL,               -- 쿠폰코드 (중복 방지)
    coupon_nm           VARCHAR(100)    NOT NULL,
    coupon_type_cd      VARCHAR(20)     NOT NULL,               -- 코드: COUPON_TYPE (RATE/FIXED)
    discount_rate       DECIMAL(5, 2)   DEFAULT 0,              -- 할인률 (%)
    discount_amt        BIGINT          DEFAULT 0,              -- 할인금액
    min_order_amt       BIGINT          DEFAULT 0,              -- 최소주문금액
    min_order_qty       INTEGER,                                -- 최소주문수량 (NULL=제한없음)
    max_discount_amt    BIGINT,                                 -- 최대할인한도 (NULL = 무제한)
    issue_limit         INTEGER,                                -- 총발급한도 (NULL = 무제한)
    issue_cnt           INTEGER         DEFAULT 0,              -- 발급수
    max_issue_per_mem   INTEGER,                                -- 회원당 최대발급수 (NULL=무제한)
    coupon_desc         TEXT,                                   -- 쿠폰설명
    valid_from          DATE,                                   -- 유효기간 시작
    valid_to            DATE,                                   -- 유효기간 종료
    coupon_status_cd    VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: COUPON_STATUS (ACTIVE/INACTIVE/EXPIRED)
    coupon_status_cd_before VARCHAR(20),                        -- 변경 전 쿠폰상태
    use_yn              CHAR(1)         DEFAULT 'Y',
    target_type_cd      VARCHAR(20),                            -- 코드: COUPON_TARGET (ALL/MEMBER/GRADE)
    target_value        VARCHAR(200),                           -- 적용대상값 (등급코드, 회원ID 등)
    mem_grade_cd        VARCHAR(20),                            -- 적용 회원등급 코드 (NULL=전체, 코드: MEMBER_GRADE)
    -- 부담금 설정
    self_cdiv_rate      DECIMAL(5,2)    DEFAULT 100,            -- 자사(사이트) 분담율 (%)
    seller_cdiv_rate    DECIMAL(5,2)    DEFAULT 0,              -- 판매자(업체) 분담율 (%)
    seller_cdiv_remark  VARCHAR(300),                           -- 판매자 분담 비고
    -- 채널별 적용 여부
    dvc_pc_yn           CHAR(1)         DEFAULT 'Y',            -- PC 채널 적용여부 Y/N
    dvc_mweb_yn         CHAR(1)         DEFAULT 'Y',            -- 모바일WEB 적용여부 Y/N
    dvc_mapp_yn         CHAR(1)         DEFAULT 'Y',            -- 모바일APP 적용여부 Y/N
    memo                TEXT,
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30),
    upd_date            TIMESTAMP,
    PRIMARY KEY (coupon_id),
    UNIQUE (coupon_cd)
);

COMMENT ON TABLE pm_coupon IS '쿠폰';
COMMENT ON COLUMN pm_coupon.coupon_id           IS '쿠폰ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pm_coupon.site_id             IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pm_coupon.coupon_cd           IS '쿠폰코드';
COMMENT ON COLUMN pm_coupon.coupon_nm           IS '쿠폰명';
COMMENT ON COLUMN pm_coupon.coupon_type_cd      IS '쿠폰유형 (코드: COUPON_TYPE)';
COMMENT ON COLUMN pm_coupon.discount_rate       IS '할인률 (%)';
COMMENT ON COLUMN pm_coupon.discount_amt        IS '할인금액';
COMMENT ON COLUMN pm_coupon.min_order_amt       IS '최소주문금액';
COMMENT ON COLUMN pm_coupon.min_order_qty       IS '최소주문수량 (NULL=제한없음)';
COMMENT ON COLUMN pm_coupon.max_discount_amt    IS '최대할인한도 (NULL=무제한)';
COMMENT ON COLUMN pm_coupon.issue_limit         IS '총발급한도 (NULL=무제한)';
COMMENT ON COLUMN pm_coupon.issue_cnt           IS '발급된 개수';
COMMENT ON COLUMN pm_coupon.max_issue_per_mem   IS '회원당 최대발급수 (NULL=무제한)';
COMMENT ON COLUMN pm_coupon.coupon_desc         IS '쿠폰설명';
COMMENT ON COLUMN pm_coupon.valid_from          IS '유효기간 시작';
COMMENT ON COLUMN pm_coupon.valid_to            IS '유효기간 종료';
COMMENT ON COLUMN pm_coupon.coupon_status_cd    IS '상태 (코드: COUPON_STATUS)';
COMMENT ON COLUMN pm_coupon.coupon_status_cd_before IS '변경 전 쿠폰상태 (코드: COUPON_STATUS)';
COMMENT ON COLUMN pm_coupon.use_yn              IS '사용여부 Y/N';
COMMENT ON COLUMN pm_coupon.target_type_cd      IS '적용대상 (코드: COUPON_TARGET)';
COMMENT ON COLUMN pm_coupon.target_value        IS '적용대상값';
COMMENT ON COLUMN pm_coupon.mem_grade_cd        IS '적용 회원등급 코드 (NULL=전체, 코드: MEMBER_GRADE)';
COMMENT ON COLUMN pm_coupon.self_cdiv_rate      IS '자사(사이트) 분담율 (%) — 기본 100%';
COMMENT ON COLUMN pm_coupon.seller_cdiv_rate    IS '판매자(업체) 분담율 (%) — 기본 0%';
COMMENT ON COLUMN pm_coupon.seller_cdiv_remark  IS '판매자 분담 비고';
COMMENT ON COLUMN pm_coupon.dvc_pc_yn           IS 'PC 채널 적용여부 Y/N';
COMMENT ON COLUMN pm_coupon.dvc_mweb_yn         IS '모바일WEB 적용여부 Y/N';
COMMENT ON COLUMN pm_coupon.dvc_mapp_yn         IS '모바일APP 적용여부 Y/N';
COMMENT ON COLUMN pm_coupon.memo                IS '메모';
COMMENT ON COLUMN pm_coupon.reg_by              IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pm_coupon.reg_date            IS '등록일';
COMMENT ON COLUMN pm_coupon.upd_by              IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pm_coupon.upd_date            IS '수정일';

CREATE INDEX idx_pm_coupon_code   ON pm_coupon (coupon_cd);
CREATE INDEX idx_pm_coupon_type   ON pm_coupon (coupon_type_cd);
CREATE INDEX idx_pm_coupon_status ON pm_coupon (coupon_status_cd);
CREATE INDEX idx_pm_coupon_grade  ON pm_coupon (mem_grade_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pm_coupon.coupon_type_cd (쿠폰유형) : 쿠폰유형 { RATE:정률 할인, FIXED:정액 할인 }
-- [CODES] pm_coupon.coupon_status_cd (상태) : 쿠폰상태 { ACTIVE:활성, INACTIVE:비활성, EXPIRED:만료 }
-- [CODES] pm_coupon.target_type_cd (적용대상) : PROMO_TARGET_TYPE { ALL:전체, PRODUCT:상품, CATEGORY:카테고리, VENDOR:업체, BRAND:브랜드, MEMBER_GRADE:회원등급 }
