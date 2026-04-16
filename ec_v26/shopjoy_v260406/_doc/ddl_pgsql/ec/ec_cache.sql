-- ============================================================
-- ec_cache : 적립금 (캐시)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE ec_cache (
    cache_id        VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    member_id       VARCHAR(16)     NOT NULL,
    member_nm       VARCHAR(50),
    cache_type_cd   VARCHAR(20)     NOT NULL,               -- 코드: CACHE_TYPE (EARN/USE/EXPIRE/ADMIN)
    cache_amt       BIGINT          DEFAULT 0,              -- 양수: 적립, 음수: 사용
    balance_amt     BIGINT          DEFAULT 0,              -- 처리 후 잔액
    ref_id          VARCHAR(16),                            -- 참조ID (order_id 등)
    cache_desc      VARCHAR(200),
    proc_user_id         VARCHAR(16),
    cache_date      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    expire_date     DATE,                                   -- 소멸예정일
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (cache_id)
);

COMMENT ON TABLE  ec_cache               IS '적립금 (캐시)';
COMMENT ON COLUMN ec_cache.cache_id      IS '적립금ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN ec_cache.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN ec_cache.member_id     IS '회원ID';
COMMENT ON COLUMN ec_cache.member_nm     IS '회원명';
COMMENT ON COLUMN ec_cache.cache_type_cd IS '유형 (코드: CACHE_TYPE)';
COMMENT ON COLUMN ec_cache.cache_amt     IS '금액 (양수:적립 / 음수:차감)';
COMMENT ON COLUMN ec_cache.balance_amt   IS '처리후 잔액';
COMMENT ON COLUMN ec_cache.ref_id        IS '참조ID (주문ID 등)';
COMMENT ON COLUMN ec_cache.cache_desc    IS '내역 설명';
COMMENT ON COLUMN ec_cache.proc_user_id       IS '처리자 (관리자 직접 부여시)';
COMMENT ON COLUMN ec_cache.cache_date    IS '처리일시';
COMMENT ON COLUMN ec_cache.expire_date   IS '소멸예정일';
COMMENT ON COLUMN ec_cache.reg_by        IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN ec_cache.reg_date      IS '등록일';
COMMENT ON COLUMN ec_cache.upd_by        IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN ec_cache.upd_date      IS '수정일';
