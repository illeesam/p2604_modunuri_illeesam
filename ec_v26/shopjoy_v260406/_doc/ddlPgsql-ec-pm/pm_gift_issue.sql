-- ============================================================
-- pm_gift_issue : 사은품 발급
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE pm_gift_issue (
    gift_issue_id       VARCHAR(21)     NOT NULL,
    gift_id             VARCHAR(21)     NOT NULL,               -- pm_gift.gift_id
    site_id             VARCHAR(21),
    member_id           VARCHAR(21)     NOT NULL,               -- mb_member.member_id
    order_id            VARCHAR(21),                            -- 발급 기준 주문 (od_order.order_id)
    issue_date          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    gift_issue_status_cd VARCHAR(20)    DEFAULT 'ISSUED',       -- 코드: GIFT_ISSUE_STATUS (ISSUED:발급/DELIVERED:배송완료/CANCELLED:취소)
    gift_issue_status_cd_before VARCHAR(20),
    gift_issue_memo     TEXT,
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30),
    upd_date            TIMESTAMP,
    PRIMARY KEY (gift_issue_id)
);

COMMENT ON TABLE pm_gift_issue IS '사은품 발급';
COMMENT ON COLUMN pm_gift_issue.gift_issue_id       IS '사은품발급ID';
COMMENT ON COLUMN pm_gift_issue.gift_id             IS '사은품ID (pm_gift.gift_id)';
COMMENT ON COLUMN pm_gift_issue.site_id             IS '사이트ID';
COMMENT ON COLUMN pm_gift_issue.member_id           IS '회원ID';
COMMENT ON COLUMN pm_gift_issue.order_id            IS '기준주문ID (od_order.order_id)';
COMMENT ON COLUMN pm_gift_issue.issue_date          IS '발급일시';
COMMENT ON COLUMN pm_gift_issue.gift_issue_status_cd IS '상태 (코드: GIFT_ISSUE_STATUS)';
COMMENT ON COLUMN pm_gift_issue.gift_issue_status_cd_before IS '변경 전 상태';
COMMENT ON COLUMN pm_gift_issue.gift_issue_memo     IS '메모';
COMMENT ON COLUMN pm_gift_issue.reg_by              IS '등록자';
COMMENT ON COLUMN pm_gift_issue.reg_date            IS '등록일';
COMMENT ON COLUMN pm_gift_issue.upd_by              IS '수정자';
COMMENT ON COLUMN pm_gift_issue.upd_date            IS '수정일';

CREATE INDEX idx_pm_gift_issue_gift   ON pm_gift_issue (gift_id);
CREATE INDEX idx_pm_gift_issue_member ON pm_gift_issue (member_id);
CREATE INDEX idx_pm_gift_issue_order  ON pm_gift_issue (order_id);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pm_gift_issue.gift_issue_status_cd (상태) : GIFT_ISSUE_STATUS { ISSUED:발급, DELIVERED:지급완료, CANCELLED:취소 }
