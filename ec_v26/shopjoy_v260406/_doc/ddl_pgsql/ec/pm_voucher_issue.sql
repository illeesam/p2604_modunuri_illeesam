-- pm_voucher_issue 테이블 DDL
-- 상품권 발급 및 사용 이력

CREATE TABLE shopjoy_2604.pm_voucher_issue (
    voucher_issue_id               VARCHAR(21) NOT NULL PRIMARY KEY,
    voucher_id                     VARCHAR(21) NOT NULL,
    site_id                        VARCHAR(21),
    member_id                      VARCHAR(21),
    voucher_code                   VARCHAR(50) NOT NULL,
    issue_date                     TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    expire_date                    TIMESTAMP  ,
    use_date                       TIMESTAMP  ,
    order_id                       VARCHAR(21),
    use_amt                        BIGINT     ,
    voucher_issue_status_cd        VARCHAR(20) DEFAULT 'ISSUED',
    voucher_issue_status_cd_before VARCHAR(20),
    reg_by                         VARCHAR(30),
    reg_date                       TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    upd_by                         VARCHAR(30),
    upd_date                       TIMESTAMP  
);

COMMENT ON TABLE  shopjoy_2604.pm_voucher_issue IS '상품권 발급 및 사용 이력';
COMMENT ON COLUMN shopjoy_2604.pm_voucher_issue.voucher_issue_id IS '상품권발급ID';
COMMENT ON COLUMN shopjoy_2604.pm_voucher_issue.voucher_id IS '상품권ID (pm_voucher.voucher_id)';
COMMENT ON COLUMN shopjoy_2604.pm_voucher_issue.site_id IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.pm_voucher_issue.member_id IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.pm_voucher_issue.voucher_code IS '발급 고유코드';
COMMENT ON COLUMN shopjoy_2604.pm_voucher_issue.issue_date IS '발급일시';
COMMENT ON COLUMN shopjoy_2604.pm_voucher_issue.expire_date IS '만료일시';
COMMENT ON COLUMN shopjoy_2604.pm_voucher_issue.use_date IS '사용일시';
COMMENT ON COLUMN shopjoy_2604.pm_voucher_issue.order_id IS '사용된 주문ID (od_order.order_id)';
COMMENT ON COLUMN shopjoy_2604.pm_voucher_issue.use_amt IS '실제 사용 할인금액';
COMMENT ON COLUMN shopjoy_2604.pm_voucher_issue.voucher_issue_status_cd IS '상태 (코드: VOUCHER_ISSUE_STATUS)';
COMMENT ON COLUMN shopjoy_2604.pm_voucher_issue.voucher_issue_status_cd_before IS '변경 전 상태';
COMMENT ON COLUMN shopjoy_2604.pm_voucher_issue.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.pm_voucher_issue.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.pm_voucher_issue.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.pm_voucher_issue.upd_date IS '수정일';

CREATE INDEX idx_pm_voucher_issue_expire ON shopjoy_2604.pm_voucher_issue USING btree (expire_date);
CREATE INDEX idx_pm_voucher_issue_member ON shopjoy_2604.pm_voucher_issue USING btree (member_id);
CREATE INDEX idx_pm_voucher_issue_order ON shopjoy_2604.pm_voucher_issue USING btree (order_id);
CREATE INDEX idx_pm_voucher_issue_voucher ON shopjoy_2604.pm_voucher_issue USING btree (voucher_id);
CREATE UNIQUE INDEX pm_voucher_issue_voucher_code_key ON shopjoy_2604.pm_voucher_issue USING btree (voucher_code);
