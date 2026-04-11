-- ============================================================
-- ec_claim : 클레임 (취소/반품/교환)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE ec_claim (
    claim_id        VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    order_id        VARCHAR(16)     NOT NULL,
    member_id       VARCHAR(16),
    member_nm       VARCHAR(50),
    claim_type_cd   VARCHAR(20)     NOT NULL,               -- 코드: CLAIM_TYPE (CANCEL/RETURN/EXCHANGE)
    status_cd       VARCHAR(20)     DEFAULT 'REQUESTED',    -- 코드: CLAIM_STATUS
    reason_cd       VARCHAR(50),                            -- 코드: CLAIM_REASON
    reason_detail   TEXT,
    prod_nm         VARCHAR(200),
    refund_method_cd VARCHAR(20),                           -- 코드: REFUND_METHOD
    refund_amount   BIGINT          DEFAULT 0,
    request_date    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    proc_date       TIMESTAMP,
    proc_by         VARCHAR(16),
    memo            TEXT,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (claim_id)
);

COMMENT ON TABLE  ec_claim                IS '클레임 (취소/반품/교환)';
COMMENT ON COLUMN ec_claim.claim_id       IS '클레임ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN ec_claim.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN ec_claim.order_id       IS '주문ID';
COMMENT ON COLUMN ec_claim.member_id      IS '회원ID';
COMMENT ON COLUMN ec_claim.member_nm      IS '회원명';
COMMENT ON COLUMN ec_claim.claim_type_cd  IS '클레임유형 (코드: CLAIM_TYPE)';
COMMENT ON COLUMN ec_claim.status_cd      IS '처리상태 (코드: CLAIM_STATUS)';
COMMENT ON COLUMN ec_claim.reason_cd      IS '사유 (코드: CLAIM_REASON)';
COMMENT ON COLUMN ec_claim.reason_detail  IS '사유 상세';
COMMENT ON COLUMN ec_claim.prod_nm        IS '상품명';
COMMENT ON COLUMN ec_claim.refund_method_cd IS '환불수단 (코드: REFUND_METHOD)';
COMMENT ON COLUMN ec_claim.refund_amount  IS '환불금액';
COMMENT ON COLUMN ec_claim.request_date   IS '요청일시';
COMMENT ON COLUMN ec_claim.proc_date      IS '처리일시';
COMMENT ON COLUMN ec_claim.proc_by        IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN ec_claim.memo           IS '관리메모';
COMMENT ON COLUMN ec_claim.reg_by         IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN ec_claim.reg_date       IS '등록일';
COMMENT ON COLUMN ec_claim.upd_by         IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN ec_claim.upd_date       IS '수정일';

-- 클레임 항목 (클레임 대상 주문상품 명세)
CREATE TABLE ec_claim_item (
    claim_item_id   VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    claim_id        VARCHAR(16)     NOT NULL,
    order_item_id   VARCHAR(16)     NOT NULL,               -- 원 주문상품ID
    prod_id         VARCHAR(16),
    prod_nm         VARCHAR(200),                           -- 상품명 (주문시점 스냅샷)
    prod_option     VARCHAR(500),                           -- 옵션 (색상/사이즈 스냅샷)
    unit_price      BIGINT          DEFAULT 0,
    qty             INTEGER         DEFAULT 1,
    item_price      BIGINT          DEFAULT 0,              -- 소계 (unit_price * qty)
    refund_amount   BIGINT          DEFAULT 0,              -- 항목별 환불금액
    status_cd       VARCHAR(20)     DEFAULT 'REQUESTED',    -- 코드: CLAIM_STATUS
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (claim_item_id)
);

COMMENT ON TABLE  ec_claim_item               IS '클레임 항목 (클레임 대상 주문상품 명세)';
COMMENT ON COLUMN ec_claim_item.claim_item_id IS '클레임항목ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN ec_claim_item.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN ec_claim_item.claim_id      IS '클레임ID (ec_claim.claim_id)';
COMMENT ON COLUMN ec_claim_item.order_item_id IS '주문상품ID (ec_order_item.order_item_id)';
COMMENT ON COLUMN ec_claim_item.prod_id       IS '상품ID';
COMMENT ON COLUMN ec_claim_item.prod_nm       IS '상품명 (주문시점 스냅샷)';
COMMENT ON COLUMN ec_claim_item.prod_option   IS '옵션 (색상/사이즈 스냅샷)';
COMMENT ON COLUMN ec_claim_item.unit_price    IS '단가';
COMMENT ON COLUMN ec_claim_item.qty           IS '클레임 수량';
COMMENT ON COLUMN ec_claim_item.item_price    IS '소계 (단가 × 수량)';
COMMENT ON COLUMN ec_claim_item.refund_amount IS '항목별 환불금액';
COMMENT ON COLUMN ec_claim_item.status_cd     IS '항목상태 (코드: CLAIM_STATUS)';
COMMENT ON COLUMN ec_claim_item.reg_by        IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN ec_claim_item.reg_date      IS '등록일';
COMMENT ON COLUMN ec_claim_item.upd_by        IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN ec_claim_item.upd_date      IS '수정일';

-- 클레임 상태 이력
CREATE TABLE ec_claim_hist (
    claim_hist_id   VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    claim_id        VARCHAR(16)     NOT NULL,
    before_status   VARCHAR(20),
    after_status    VARCHAR(20),
    memo            VARCHAR(300),
    proc_by         VARCHAR(16),
    proc_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (claim_hist_id)
);

COMMENT ON TABLE  ec_claim_hist               IS '클레임 상태 이력';
COMMENT ON COLUMN ec_claim_hist.claim_hist_id IS '이력ID';
COMMENT ON COLUMN ec_claim_hist.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN ec_claim_hist.claim_id      IS '클레임ID';
COMMENT ON COLUMN ec_claim_hist.before_status IS '이전상태';
COMMENT ON COLUMN ec_claim_hist.after_status  IS '변경상태';
COMMENT ON COLUMN ec_claim_hist.memo          IS '처리메모';
COMMENT ON COLUMN ec_claim_hist.proc_by       IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN ec_claim_hist.proc_date     IS '처리일시';
COMMENT ON COLUMN ec_claim_hist.reg_by        IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN ec_claim_hist.reg_date      IS '등록일';
COMMENT ON COLUMN ec_claim_hist.upd_by        IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN ec_claim_hist.upd_date      IS '수정일';
