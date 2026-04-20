-- ============================================================
-- pm_voucher_issue : 상품권 발급 및 사용 이력
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE pm_voucher_issue (
    voucher_issue_id    VARCHAR(21)     NOT NULL,
    voucher_id          VARCHAR(21)     NOT NULL,               -- pm_voucher.voucher_id
    site_id             VARCHAR(21),
    member_id           VARCHAR(21),                            -- 발급 대상 회원 (NULL이면 미할당)
    voucher_code        VARCHAR(50)     NOT NULL,               -- 발급된 고유 코드
    issue_date          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    expire_date         TIMESTAMP,                              -- 만료일시
    use_date            TIMESTAMP,                              -- 사용일시
    order_id            VARCHAR(21),                            -- 사용된 주문 (od_order.order_id)
    use_amt             BIGINT,                                 -- 실제 사용 할인금액
    voucher_issue_status_cd VARCHAR(20) DEFAULT 'ISSUED',       -- 코드: VOUCHER_ISSUE_STATUS (ISSUED:발급/USED:사용/EXPIRED:만료/CANCELLED:취소)
    voucher_issue_status_cd_before VARCHAR(20),
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30),
    upd_date            TIMESTAMP,
    PRIMARY KEY (voucher_issue_id),
    UNIQUE (voucher_code)
);

COMMENT ON TABLE pm_voucher_issue IS '상품권 발급 및 사용 이력';
COMMENT ON COLUMN pm_voucher_issue.voucher_issue_id IS '상품권발급ID';
COMMENT ON COLUMN pm_voucher_issue.voucher_id       IS '상품권ID (pm_voucher.voucher_id)';
COMMENT ON COLUMN pm_voucher_issue.site_id          IS '사이트ID';
COMMENT ON COLUMN pm_voucher_issue.member_id        IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN pm_voucher_issue.voucher_code     IS '발급 고유코드';
COMMENT ON COLUMN pm_voucher_issue.issue_date       IS '발급일시';
COMMENT ON COLUMN pm_voucher_issue.expire_date      IS '만료일시';
COMMENT ON COLUMN pm_voucher_issue.use_date         IS '사용일시';
COMMENT ON COLUMN pm_voucher_issue.order_id         IS '사용된 주문ID (od_order.order_id)';
COMMENT ON COLUMN pm_voucher_issue.use_amt          IS '실제 사용 할인금액';
COMMENT ON COLUMN pm_voucher_issue.voucher_issue_status_cd IS '상태 (코드: VOUCHER_ISSUE_STATUS)';
COMMENT ON COLUMN pm_voucher_issue.voucher_issue_status_cd_before IS '변경 전 상태';
COMMENT ON COLUMN pm_voucher_issue.reg_by           IS '등록자';
COMMENT ON COLUMN pm_voucher_issue.reg_date         IS '등록일';
COMMENT ON COLUMN pm_voucher_issue.upd_by           IS '수정자';
COMMENT ON COLUMN pm_voucher_issue.upd_date         IS '수정일';

CREATE INDEX idx_pm_voucher_issue_voucher ON pm_voucher_issue (voucher_id);
CREATE INDEX idx_pm_voucher_issue_member  ON pm_voucher_issue (member_id);
CREATE INDEX idx_pm_voucher_issue_order   ON pm_voucher_issue (order_id);
CREATE INDEX idx_pm_voucher_issue_expire  ON pm_voucher_issue (expire_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pm_voucher_issue.voucher_issue_status_cd (상태) : SAVE_ISSUE_STATUS { SCHEDULED:예정, COMPLETED:완료, CANCELLED:취소, EXPIRED:만료 }
