-- pm_gift_issue 테이블 DDL
-- 사은품 발급

CREATE TABLE shopjoy_2604.pm_gift_issue (
    gift_issue_id               VARCHAR(21) NOT NULL PRIMARY KEY,
    gift_id                     VARCHAR(21) NOT NULL,
    site_id                     VARCHAR(21),
    member_id                   VARCHAR(21) NOT NULL,
    order_id                    VARCHAR(21),
    issue_date                  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    gift_issue_status_cd        VARCHAR(20) DEFAULT 'ISSUED',
    gift_issue_status_cd_before VARCHAR(20),
    gift_issue_memo             TEXT       ,
    reg_by                      VARCHAR(30),
    reg_date                    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    upd_by                      VARCHAR(30),
    upd_date                    TIMESTAMP  
);

COMMENT ON TABLE  shopjoy_2604.pm_gift_issue IS '사은품 발급';
COMMENT ON COLUMN shopjoy_2604.pm_gift_issue.gift_issue_id IS '사은품발급ID';
COMMENT ON COLUMN shopjoy_2604.pm_gift_issue.gift_id IS '사은품ID (pm_gift.gift_id)';
COMMENT ON COLUMN shopjoy_2604.pm_gift_issue.site_id IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.pm_gift_issue.member_id IS '회원ID';
COMMENT ON COLUMN shopjoy_2604.pm_gift_issue.order_id IS '기준주문ID (od_order.order_id)';
COMMENT ON COLUMN shopjoy_2604.pm_gift_issue.issue_date IS '발급일시';
COMMENT ON COLUMN shopjoy_2604.pm_gift_issue.gift_issue_status_cd IS '상태 (코드: GIFT_ISSUE_STATUS)';
COMMENT ON COLUMN shopjoy_2604.pm_gift_issue.gift_issue_status_cd_before IS '변경 전 상태';
COMMENT ON COLUMN shopjoy_2604.pm_gift_issue.gift_issue_memo IS '메모';
COMMENT ON COLUMN shopjoy_2604.pm_gift_issue.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.pm_gift_issue.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.pm_gift_issue.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.pm_gift_issue.upd_date IS '수정일';

CREATE INDEX idx_pm_gift_issue_gift ON shopjoy_2604.pm_gift_issue USING btree (gift_id);
CREATE INDEX idx_pm_gift_issue_member ON shopjoy_2604.pm_gift_issue USING btree (member_id);
CREATE INDEX idx_pm_gift_issue_order ON shopjoy_2604.pm_gift_issue USING btree (order_id);
