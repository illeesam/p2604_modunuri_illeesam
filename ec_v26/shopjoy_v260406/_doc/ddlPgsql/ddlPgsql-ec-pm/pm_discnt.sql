-- ============================================================
-- pm_discnt : 할인정책
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE pm_discnt (
    discnt_id           VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    discnt_nm           VARCHAR(100)    NOT NULL,               -- 할인명
    discnt_type_cd      VARCHAR(20)     NOT NULL,               -- 코드: DISCNT_TYPE (RATE:정률/FIXED:정액/FREE_SHIP:무료배송)
    discnt_target_cd    VARCHAR(20)     DEFAULT 'ALL',          -- 코드: DISCNT_TARGET (ALL:전체/CATEGORY:카테고리/PRODUCT:상품/MEMBER_GRADE:등급)
    discnt_value        NUMERIC(10,2)   DEFAULT 0,              -- 할인값 (율이면 %, 금액이면 원)
    min_order_amt       BIGINT          DEFAULT 0,              -- 최소주문금액
    min_order_qty       INTEGER,                                -- 최소주문수량 (NULL=제한없음)
    max_discnt_amt      BIGINT,                                 -- 최대할인한도 (NULL이면 무제한)
    start_date          TIMESTAMP,                              -- 할인 시작일시
    end_date            TIMESTAMP,                              -- 할인 종료일시
    discnt_status_cd    VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: DISCNT_STATUS (ACTIVE/INACTIVE/EXPIRED)
    discnt_status_cd_before VARCHAR(20),                        -- 변경 전 상태
    discnt_desc         TEXT,                                   -- 할인 설명
    mem_grade_cd        VARCHAR(20),                            -- 적용 회원등급 코드 (NULL=전체, 코드: MEMBER_GRADE)
    -- 부담금 설정
    self_cdiv_rate      DECIMAL(5,2)    DEFAULT 100,            -- 자사(사이트) 분담율 (%)
    seller_cdiv_rate    DECIMAL(5,2)    DEFAULT 0,              -- 판매자(업체) 분담율 (%)
    -- 채널별 적용 여부
    dvc_pc_yn           CHAR(1)         DEFAULT 'Y',            -- PC 채널 적용여부 Y/N
    dvc_mweb_yn         CHAR(1)         DEFAULT 'Y',            -- 모바일WEB 적용여부 Y/N
    dvc_mapp_yn         CHAR(1)         DEFAULT 'Y',            -- 모바일APP 적용여부 Y/N
    use_yn              CHAR(1)         DEFAULT 'Y',
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30),
    upd_date            TIMESTAMP,
    PRIMARY KEY (discnt_id)
);

COMMENT ON TABLE pm_discnt IS '할인정책';
COMMENT ON COLUMN pm_discnt.discnt_id           IS '할인ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pm_discnt.site_id             IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pm_discnt.discnt_nm           IS '할인명';
COMMENT ON COLUMN pm_discnt.discnt_type_cd      IS '할인유형 (코드: DISCNT_TYPE — RATE/FIXED/FREE_SHIP)';
COMMENT ON COLUMN pm_discnt.discnt_target_cd    IS '할인대상 (코드: DISCNT_TARGET — ALL/CATEGORY/PRODUCT/MEMBER_GRADE)';
COMMENT ON COLUMN pm_discnt.discnt_value        IS '할인값 (정률이면 %, 정액이면 원)';
COMMENT ON COLUMN pm_discnt.min_order_amt       IS '최소주문금액';
COMMENT ON COLUMN pm_discnt.min_order_qty       IS '최소주문수량 (NULL=제한없음)';
COMMENT ON COLUMN pm_discnt.max_discnt_amt      IS '최대할인한도 (NULL=무제한)';
COMMENT ON COLUMN pm_discnt.start_date          IS '할인 시작일시';
COMMENT ON COLUMN pm_discnt.end_date            IS '할인 종료일시';
COMMENT ON COLUMN pm_discnt.discnt_status_cd    IS '상태 (코드: DISCNT_STATUS)';
COMMENT ON COLUMN pm_discnt.discnt_status_cd_before IS '변경 전 상태';
COMMENT ON COLUMN pm_discnt.discnt_desc         IS '할인 설명';
COMMENT ON COLUMN pm_discnt.mem_grade_cd        IS '적용 회원등급 코드 (NULL=전체, 코드: MEMBER_GRADE)';
COMMENT ON COLUMN pm_discnt.self_cdiv_rate      IS '자사(사이트) 분담율 (%) — 기본 100%';
COMMENT ON COLUMN pm_discnt.seller_cdiv_rate    IS '판매자(업체) 분담율 (%) — 기본 0%';
COMMENT ON COLUMN pm_discnt.dvc_pc_yn           IS 'PC 채널 적용여부 Y/N';
COMMENT ON COLUMN pm_discnt.dvc_mweb_yn         IS '모바일WEB 적용여부 Y/N';
COMMENT ON COLUMN pm_discnt.dvc_mapp_yn         IS '모바일APP 적용여부 Y/N';
COMMENT ON COLUMN pm_discnt.use_yn              IS '사용여부 Y/N';
COMMENT ON COLUMN pm_discnt.reg_by              IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN pm_discnt.reg_date            IS '등록일';
COMMENT ON COLUMN pm_discnt.upd_by              IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN pm_discnt.upd_date            IS '수정일';

CREATE INDEX idx_pm_discnt_site   ON pm_discnt (site_id);
CREATE INDEX idx_pm_discnt_status ON pm_discnt (discnt_status_cd);
CREATE INDEX idx_pm_discnt_date   ON pm_discnt (start_date, end_date);
CREATE INDEX idx_pm_discnt_grade  ON pm_discnt (mem_grade_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pm_discnt.discnt_type_cd (할인유형) : DISCNT_TYPE { RATE:정률할인, FIXED:정액할인, FREE_SHIP:무료배송 }
-- [CODES] pm_discnt.discnt_target_cd (할인대상) : DISCNT_TARGET { ALL:전체, CATEGORY:카테고리, PRODUCT:상품, MEMBER_GRADE:회원등급 }
-- [CODES] pm_discnt.discnt_status_cd (상태) : DISCNT_STATUS { ACTIVE:활성, INACTIVE:비활성, EXPIRED:만료 }
