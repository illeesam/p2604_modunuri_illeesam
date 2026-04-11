-- ============================================================
-- ec_cache : 적립금 (캐시)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE ec_cache (
    cache_id        VARCHAR(16)     NOT NULL,
    member_id       VARCHAR(16)     NOT NULL,
    member_name     VARCHAR(50),
    cache_type_cd   VARCHAR(20)     NOT NULL,               -- 코드: CACHE_TYPE (EARN/USE/EXPIRE/ADMIN)
    amount          BIGINT          DEFAULT 0,              -- 양수: 적립, 음수: 사용
    balance         BIGINT          DEFAULT 0,              -- 처리 후 잔액
    ref_id          VARCHAR(16),                            -- 참조ID (order_id 등)
    description     VARCHAR(200),
    proc_by         VARCHAR(16),
    cache_date      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    expire_date     DATE,                                   -- 소멸예정일
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (cache_id)
);

COMMENT ON TABLE  ec_cache               IS '적립금 (캐시)';
COMMENT ON COLUMN ec_cache.cache_id      IS '적립금ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN ec_cache.member_id     IS '회원ID';
COMMENT ON COLUMN ec_cache.member_name   IS '회원명';
COMMENT ON COLUMN ec_cache.cache_type_cd IS '유형 (코드: CACHE_TYPE)';
COMMENT ON COLUMN ec_cache.amount        IS '금액 (양수:적립 / 음수:차감)';
COMMENT ON COLUMN ec_cache.balance       IS '처리후 잔액';
COMMENT ON COLUMN ec_cache.ref_id        IS '참조ID (주문ID 등)';
COMMENT ON COLUMN ec_cache.description   IS '내역 설명';
COMMENT ON COLUMN ec_cache.proc_by       IS '처리자 (관리자 직접 부여시)';
COMMENT ON COLUMN ec_cache.cache_date    IS '처리일시';
COMMENT ON COLUMN ec_cache.expire_date   IS '소멸예정일';
COMMENT ON COLUMN ec_cache.reg_date      IS '등록일';
