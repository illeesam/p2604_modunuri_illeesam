-- pm_coupon_issue 테이블 DDL
-- 쿠폰 발급

CREATE TABLE shopjoy_2604.pm_coupon_issue (
    issue_id   VARCHAR(21) NOT NULL PRIMARY KEY,
    site_id    VARCHAR(21) NOT NULL,
    coupon_id  VARCHAR(21) NOT NULL,
    member_id  VARCHAR(21) NOT NULL,
    issue_date TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    use_yn     VARCHAR(1)  DEFAULT 'N'::bpchar,
    use_date   TIMESTAMP  ,
    order_id   VARCHAR(21),
    reg_by     VARCHAR(30),
    reg_date   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    upd_by     VARCHAR(30),
    upd_date   TIMESTAMP  
);

COMMENT ON TABLE  shopjoy_2604.pm_coupon_issue IS '쿠폰 발급';
COMMENT ON COLUMN shopjoy_2604.pm_coupon_issue.issue_id IS '발급ID';
COMMENT ON COLUMN shopjoy_2604.pm_coupon_issue.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon_issue.coupon_id IS '쿠폰ID';
COMMENT ON COLUMN shopjoy_2604.pm_coupon_issue.member_id IS '회원ID';
COMMENT ON COLUMN shopjoy_2604.pm_coupon_issue.issue_date IS '발급일시';
COMMENT ON COLUMN shopjoy_2604.pm_coupon_issue.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.pm_coupon_issue.use_date IS '사용일시';
COMMENT ON COLUMN shopjoy_2604.pm_coupon_issue.order_id IS '사용주문ID';
COMMENT ON COLUMN shopjoy_2604.pm_coupon_issue.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon_issue.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.pm_coupon_issue.upd_by IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon_issue.upd_date IS '수정일';

CREATE INDEX idx_pm_coupon_issue_site ON shopjoy_2604.pm_coupon_issue USING btree (site_id);
