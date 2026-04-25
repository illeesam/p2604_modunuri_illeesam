-- 쿠폰 발급 (회원별 보유)
CREATE TABLE pm_coupon_issue (
    issue_id        VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    coupon_id       VARCHAR(21)     NOT NULL,
    member_id       VARCHAR(21)     NOT NULL,
    issue_date      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    use_yn          CHAR(1)         DEFAULT 'N',
    use_date        TIMESTAMP,
    order_id        VARCHAR(21),
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (issue_id)
);

COMMENT ON TABLE pm_coupon_issue IS '쿠폰 발급';
COMMENT ON COLUMN pm_coupon_issue.issue_id   IS '발급ID';
COMMENT ON COLUMN pm_coupon_issue.site_id    IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pm_coupon_issue.coupon_id  IS '쿠폰ID';
COMMENT ON COLUMN pm_coupon_issue.member_id  IS '회원ID';
COMMENT ON COLUMN pm_coupon_issue.issue_date IS '발급일시';
COMMENT ON COLUMN pm_coupon_issue.use_yn     IS '사용여부 Y/N';
COMMENT ON COLUMN pm_coupon_issue.use_date   IS '사용일시';
COMMENT ON COLUMN pm_coupon_issue.order_id   IS '사용주문ID';
COMMENT ON COLUMN pm_coupon_issue.reg_by     IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pm_coupon_issue.reg_date   IS '등록일';
COMMENT ON COLUMN pm_coupon_issue.upd_by     IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pm_coupon_issue.upd_date   IS '수정일';

-- 쿠폰 사용 이력
